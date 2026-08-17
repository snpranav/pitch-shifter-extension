# Privacy Policy

**YouTube Pitch Shifter** — browser extension
Last updated: August 16, 2026

## Summary

YouTube Pitch Shifter does **not** collect, store, transmit, or sell any personal
or browsing data. Everything the extension does happens locally in your browser.
There are no analytics, no trackers, no external servers, and no accounts.

## What the extension does

The extension reads the audio of the `<video>` element on YouTube pages and routes
it through a Web Audio pitch-shifting graph so you can change the pitch (musical key)
of a video in real time. All audio processing runs on your device, inside your
browser. No audio, video, or page content ever leaves your computer.

## Data we store

The only data the extension saves is your **last-used pitch setting** (a number of
semitones). It is stored locally on your device using the browser's `chrome.storage`
API so your preference persists between sessions. This value:

- never leaves your device,
- is not associated with any identity or account,
- can be cleared at any time by removing the extension.

## Permissions and why they are used

- **`storage`** — to remember your last-used pitch setting locally (described above).
- **Host access to `*://*.youtube.com/*`** — so the extension's content script can
  access the YouTube `<video>` element, process its audio, and show the pitch-control
  panel. Access is limited to YouTube because that is the only site the extension
  supports.

## Remote code

The extension does not download or execute any remote code. All code, including the
audio-processing worklet, ships inside the extension package.

## Third-party services

None. The extension does not send data to any third party. It is open source and
built on the OSS library [SoundTouchJS](https://github.com/cutterbl/SoundTouchJS),
which runs entirely locally.

## Children's privacy

The extension does not collect any data from anyone, including children.

## Changes to this policy

If this policy changes, the updated version will be published in this repository with
a new "Last updated" date.

## Contact

Questions about this policy? Please
[open an issue](https://github.com/snpranav/pitch-shifter-extension/issues) on the
GitHub repository to reach the creator.
