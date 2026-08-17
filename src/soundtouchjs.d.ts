// Minimal typings for the parts of SoundTouchJS we use (the package ships none).
declare module 'soundtouchjs' {
  interface FifoSampleBuffer {
    readonly frameCount: number;
    putSamples(samples: Float32Array, position: number, numFrames: number): void;
    receiveSamples(output: Float32Array, numFrames: number): void;
    receive(numFrames: number): void;
    clear(): void;
  }

  export class SoundTouch {
    tempo: number;
    rate: number;
    pitch: number;
    pitchOctaves: number;
    pitchSemitones: number;
    readonly inputBuffer: FifoSampleBuffer;
    readonly outputBuffer: FifoSampleBuffer;
    process(): void;
    clear(): void;
  }
}
