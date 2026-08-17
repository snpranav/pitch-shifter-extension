import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startButtonInjector } from './injectButton';
import styleText from './style.css?inline';

const HOST_ID = 'yt-pitch-shifter-host';

function mount() {
  // Guard against double injection on YouTube's SPA navigations / HMR.
  if (document.getElementById(HOST_ID)) return;

  // Inject the "Change Pitch" button next to the Like button.
  startButtonInjector();

  const host = document.createElement('div');
  host.id = HOST_ID;
  // Keep the host itself out of the layout; the panel is position:fixed.
  host.style.cssText = 'all: initial;';
  document.body.appendChild(host);

  // Shadow DOM fully isolates Tailwind from YouTube's global styles (and vice versa).
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = styleText;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  createRoot(mountPoint).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (document.body) {
  mount();
} else {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
}
