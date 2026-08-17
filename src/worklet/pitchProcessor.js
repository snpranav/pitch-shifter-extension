import { SoundTouch } from 'soundtouchjs';

/**
 * SoundTouch pitch shifter running on the audio render thread.
 *
 * This file is bundled (SoundTouch inlined) into `public/pitch-processor.js` by
 * esbuild, then loaded with `audioWorklet.addModule()`. Runs off the main thread,
 * so no UI jank and far lower latency than the ScriptProcessor fallback.
 *
 * The render quantum is 128 frames; SoundTouch buffers internally and primes over
 * the first few quanta, so the very first blocks may emit brief silence.
 */
class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.soundTouch = new SoundTouch();
    this.soundTouch.pitchSemitones = 0;

    // Interleaved stereo scratch buffers (generous headroom over one quantum).
    this.inScratch = new Float32Array(256 * 2);
    this.outScratch = new Float32Array(256 * 2);

    this.port.onmessage = (e) => {
      if (e.data && typeof e.data.pitchSemitones === 'number') {
        this.soundTouch.pitchSemitones = e.data.pitchSemitones;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const frames = output[0].length;
    const inL = input && input[0] ? input[0] : null;
    const inR = input && input[1] ? input[1] : inL;

    if (inL) {
      const inter = this.inScratch;
      for (let i = 0; i < frames; i++) {
        inter[i * 2] = inL[i];
        inter[i * 2 + 1] = inR ? inR[i] : inL[i];
      }
      this.soundTouch.inputBuffer.putSamples(inter, 0, frames);
      this.soundTouch.process();
    }

    const outL = output[0];
    const outR = output.length > 1 ? output[1] : null;

    const available = this.soundTouch.outputBuffer.frameCount;
    const toRead = Math.min(available, frames);
    if (toRead > 0) {
      this.soundTouch.outputBuffer.receiveSamples(this.outScratch, toRead);
      for (let i = 0; i < toRead; i++) {
        outL[i] = this.outScratch[i * 2];
        if (outR) outR[i] = this.outScratch[i * 2 + 1];
      }
    }
    for (let i = toRead; i < frames; i++) {
      outL[i] = 0;
      if (outR) outR[i] = 0;
    }

    // Safety valve: never let output latency creep upward.
    const maxBacklog = frames * 32;
    const backlog = this.soundTouch.outputBuffer.frameCount;
    if (backlog > maxBacklog) {
      this.soundTouch.outputBuffer.receive(backlog - maxBacklog);
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
