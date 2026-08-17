# YouTube Pitch Shifter

A sleek Chrome extension for **musicians** that transposes the pitch of any YouTube video
in real time — without changing the playback speed. Shift up or down across a ±12 semitone
range to play or sing along in your key.

## How it works

```
YouTube <video> → MediaElementSource → AudioWorkletNode (SoundTouchJS) → speakers
```

- **[SoundTouchJS](https://github.com/cutterbl/SoundTouchJS)** (WSOLA) transposes the audio
  while the video keeps playing at its normal rate — clean pitch shifting, no warble.
- Processing runs on an **AudioWorkletNode** (the audio render thread) for low latency and
  no UI jank, with a `ScriptProcessorNode` fallback if a page's CSP blocks the worklet.
- A **content script** taps into the page's `<video>` element and builds the audio graph.
- The UI is a **React + Tailwind** panel mounted inside a **Shadow DOM**, so Tailwind's
  styles are fully isolated from YouTube (nothing leaks in either direction).

## Tech stack

| Piece            | Choice                              |
| ---------------- | ----------------------------------- |
| Bundler          | Vite + [@crxjs/vite-plugin](https://crxjs.dev/) (MV3) |
| UI               | React 18 + TypeScript               |
| Styling          | Tailwind CSS (no hand-rolled CSS)   |
| Audio            | SoundTouchJS on an AudioWorkletNode |

## Develop

```bash
npm install
npm run dev
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select the `dist/` folder
4. Open any YouTube video — the panel appears bottom-right

`npm run dev` gives you hot-reload while editing the UI.

## Build for production

```bash
npm run build
```

Produces an unpacked extension in `dist/` ready to load or zip for the Chrome Web Store.

## Usage

- **Change Pitch button** — injected into the video's action row, left of the Like button.
  Click it to open the pitch panel (the toolbar icon toggles it too).
- **Slider / ± buttons** — adjust pitch in semitones (−12 to +12).
- **Reset** — return to the video's original pitch.
- The last-used pitch is remembered via `chrome.storage`.

> The audio engine starts on your first interaction with the panel (a browser
> requirement — an `AudioContext` can only start from a user gesture). Until then the
> video plays untouched.

## Notes & limitations

- Pitch shifting adds a small amount of granular artifacting at extreme settings — that's
  inherent to real-time pitch shifting, not a bug.
- Works on standard YouTube watch pages. YouTube is a single-page app, so the extension
  binds to the shared `<video>` element and persists across in-app navigation.
