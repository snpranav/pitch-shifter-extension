import { SoundTouchNode } from './soundTouchNode';

/**
 * Wraps a single YouTube <video> element in a SoundTouchJS pitch-shifting graph:
 *
 *   video → MediaElementSource → [AudioWorklet | ScriptProcessor] → speakers
 *
 * SoundTouchJS (WSOLA) transposes pitch WITHOUT changing playback speed, so the
 * video keeps playing at its normal rate while the audio is shifted.
 *
 * Primary path is an AudioWorkletNode (runs on the audio thread: low latency, no
 * UI jank). If a page's CSP blocks loading the worklet module, we fall back to a
 * ScriptProcessorNode. Neither path uses blob:/data: workers, so both stay within
 * YouTube's Content Security Policy.
 */

let audioCtx: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let scriptNode: SoundTouchNode | null = null;
let currentPitch = 0;

// A MediaElementSource can only be created once per <video> per AudioContext.
// If the same element is passed again we reuse the existing graph.
let boundVideo: HTMLVideoElement | null = null;

export function isReady(): boolean {
  return workletNode !== null || scriptNode !== null;
}

export function getPitch(): number {
  return currentPitch;
}

/**
 * Lazily build the audio graph. MUST be called from a user gesture (e.g. a
 * slider drag or button click) so the browser allows the AudioContext to start.
 */
export async function ensureEngine(): Promise<void> {
  const video = document.querySelector<HTMLVideoElement>('video');
  if (!video) {
    throw new Error('No <video> element found on this page yet.');
  }

  // Already wired up to this exact element — nothing to do.
  if ((workletNode || scriptNode) && boundVideo === video) return;

  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const source = audioCtx.createMediaElementSource(video);
  const outNode = await buildShifterNode(audioCtx);

  source.connect(outNode);
  outNode.connect(audioCtx.destination);
  boundVideo = video;
}

/** Prefer AudioWorklet; fall back to ScriptProcessor if the module won't load. */
async function buildShifterNode(ctx: AudioContext): Promise<AudioNode> {
  try {
    await ctx.audioWorklet.addModule(chrome.runtime.getURL('pitch-processor.js'));
    const node = new AudioWorkletNode(ctx, 'pitch-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    node.port.postMessage({ pitchSemitones: currentPitch });
    workletNode = node;
    console.log('%c[PitchShifter] engine: AudioWorklet (audio thread)', 'color:#8b5cf6;font-weight:bold');
    return node;
  } catch (err) {
    const fallback = new SoundTouchNode(ctx);
    fallback.pitchSemitones = currentPitch;
    scriptNode = fallback;
    console.warn('[PitchShifter] AudioWorklet unavailable — using ScriptProcessor fallback.', err);
    return fallback.node;
  }
}

/** Set the transposition in semitones. Range is clamped by the UI (-12..+12). */
export function setPitch(semitones: number): void {
  currentPitch = semitones;
  if (workletNode) {
    workletNode.port.postMessage({ pitchSemitones: semitones });
  } else if (scriptNode) {
    scriptNode.pitchSemitones = semitones;
  }
}
