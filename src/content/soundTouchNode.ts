import { SoundTouch } from 'soundtouchjs';

/**
 * Real-time pitch shifting for a LIVE audio stream using SoundTouchJS.
 *
 * SoundTouchJS ships a `getWebAudioNode` helper, but it only *pulls* from a fixed
 * decoded AudioBuffer — no good for a streaming <video>. So we drive the core
 * `SoundTouch` engine directly through a ScriptProcessorNode: each callback pushes
 * the live input block into SoundTouch's input FIFO, processes it (WSOLA
 * time/pitch scaling), and pulls the shifted output back out.
 *
 * ScriptProcessorNode is deprecated but runs on the main thread with no worker,
 * worklet, or blob: URL — so unlike Tone.js it never trips YouTube's CSP.
 */
export class SoundTouchNode {
  readonly node: ScriptProcessorNode;

  private readonly soundTouch: SoundTouch;
  private readonly bufferSize: number;
  private readonly inScratch: Float32Array;
  private readonly outScratch: Float32Array;

  constructor(context: AudioContext, bufferSize = 4096) {
    this.bufferSize = bufferSize;
    this.soundTouch = new SoundTouch();
    this.soundTouch.pitchSemitones = 0;

    // Interleaved stereo scratch buffers (2 samples per frame).
    this.inScratch = new Float32Array(bufferSize * 2);
    this.outScratch = new Float32Array(bufferSize * 2);

    this.node = context.createScriptProcessor(bufferSize, 2, 2);
    this.node.onaudioprocess = (e) => this.process(e);
  }

  set pitchSemitones(semitones: number) {
    this.soundTouch.pitchSemitones = semitones;
  }

  private process(e: AudioProcessingEvent): void {
    const input = e.inputBuffer;
    const output = e.outputBuffer;
    const frames = input.length;

    const inL = input.getChannelData(0);
    const inR = input.numberOfChannels > 1 ? input.getChannelData(1) : inL;

    // Interleave the live input block and feed SoundTouch.
    const inter = this.inScratch;
    for (let i = 0; i < frames; i++) {
      inter[i * 2] = inL[i];
      inter[i * 2 + 1] = inR[i];
    }
    this.soundTouch.inputBuffer.putSamples(inter, 0, frames);
    this.soundTouch.process();

    const outL = output.getChannelData(0);
    const outR = output.getChannelData(1);

    // Pull as many shifted frames as SoundTouch has ready (it primes over the
    // first couple of blocks, so early callbacks may emit brief silence).
    const available = this.soundTouch.outputBuffer.frameCount;
    const toRead = Math.min(available, frames);
    if (toRead > 0) {
      this.soundTouch.outputBuffer.receiveSamples(this.outScratch, toRead);
      for (let i = 0; i < toRead; i++) {
        outL[i] = this.outScratch[i * 2];
        outR[i] = this.outScratch[i * 2 + 1];
      }
    }
    for (let i = toRead; i < frames; i++) {
      outL[i] = 0;
      outR[i] = 0;
    }

    // Safety valve: if output ever backs up (keeps latency from creeping),
    // drop the excess so we don't accumulate unbounded delay.
    const maxBacklog = this.bufferSize * 4;
    const backlog = this.soundTouch.outputBuffer.frameCount;
    if (backlog > maxBacklog) {
      this.soundTouch.outputBuffer.receive(backlog - maxBacklog);
    }
  }
}
