import { defineManifest } from '@crxjs/vite-plugin';
import { version } from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'YouTube Pitch Shifter',
  // Single source of truth: bump `version` in package.json only.
  version,
  description: 'Change the pitch of any YouTube video with a sleek slider — without changing playback speed.',
  icons: {
    16: 'src/assets/icon-16.png',
    48: 'src/assets/icon-48.png',
    128: 'src/assets/icon-128.png',
  },
  action: {
    default_title: 'Toggle Pitch Shifter panel',
    default_icon: {
      16: 'src/assets/icon-16.png',
      48: 'src/assets/icon-48.png',
      128: 'src/assets/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage'],
  host_permissions: ['*://*.youtube.com/*'],
  content_scripts: [
    {
      matches: ['*://*.youtube.com/*'],
      js: ['src/content/main.tsx'],
      run_at: 'document_idle',
    },
  ],
  // The AudioWorklet module is loaded via chrome.runtime.getURL(), so it must be
  // web-accessible.
  web_accessible_resources: [
    {
      resources: ['pitch-processor.js'],
      matches: ['*://*.youtube.com/*'],
    },
  ],
});
