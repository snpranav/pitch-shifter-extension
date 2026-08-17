/**
 * Injects a native-looking "Change Pitch" button into YouTube's action row,
 * immediately to the left of the Like button. Clicking it toggles the panel via
 * a window CustomEvent (both this injector and the React app live in the same
 * content-script world, so the event is received in-process).
 */

export const PITCH_TOGGLE_EVENT = 'yt-pitch-shifter:toggle';

const BTN_ID = 'yt-pitch-shifter-btn';
const STYLE_ID = 'yt-pitch-shifter-btn-style';

// Mini version of the toolbar logo: a rounded gradient square with a waveform.
const LOGO_SVG = `
<svg width="20" height="20" viewBox="0 0 128 128" aria-hidden="true">
  <defs>
    <linearGradient id="ytps-btn-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="30" fill="url(#ytps-btn-grad)"/>
  <g stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none">
    <path d="M28 64 h0"/><path d="M46 44 v40"/><path d="M64 30 v68"/>
    <path d="M82 48 v32"/><path d="M100 64 h0"/>
  </g>
</svg>`;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${BTN_ID} {
      display: inline-flex; align-items: center; gap: 7px;
      height: 36px; padding: 0 15px 0 11px; margin-right: 8px;
      border: none; border-radius: 18px; cursor: pointer; white-space: nowrap;
      font-family: "Roboto","Arial",sans-serif; font-size: 14px; font-weight: 500;
      /* Light mode (default): black text on a dark-tinted pill, like the Like button. */
      color: #0f0f0f;
      background: rgba(0,0,0,0.05);
    }
    #${BTN_ID}:hover { background: rgba(0,0,0,0.10); }

    /* Dark mode: YouTube sets the [dark] attribute on <html>. White text on a
       light-tinted pill, matching the Like button. */
    html[dark] #${BTN_ID} {
      color: #fff;
      background: rgba(255,255,255,0.10);
    }
    html[dark] #${BTN_ID}:hover { background: rgba(255,255,255,0.20); }

    #${BTN_ID} svg { flex: 0 0 auto; }
  `;
  (document.head ?? document.documentElement).appendChild(style);
}

function buildButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.title = 'Change the pitch of this video';
  btn.innerHTML = `${LOGO_SVG}<span>Change Pitch</span>`;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent(PITCH_TOGGLE_EVENT));
  });
  return btn;
}

function findLikeButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    'ytd-watch-metadata segmented-like-dislike-button-view-model, ' +
      'ytd-watch-metadata ytd-segmented-like-dislike-button-renderer, ' +
      '#top-level-buttons-computed segmented-like-dislike-button-view-model, ' +
      '#top-level-buttons-computed ytd-segmented-like-dislike-button-renderer',
  );
}

function tryInject(): void {
  if (document.getElementById(BTN_ID)) return;
  const like = findLikeButton();
  const parent = like?.parentElement;
  if (!like || !parent) return;

  injectStyles();
  parent.insertBefore(buildButton(), like);
}

export function startButtonInjector(): void {
  tryInject();

  // Re-inject if YouTube tears down / re-renders the actions row. The observer
  // only does a cheap presence check, coalesced to one call per animation frame.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      tryInject();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // YouTube's SPA navigation event — the metadata row mounts a moment later.
  window.addEventListener('yt-navigate-finish', () => setTimeout(tryInject, 400));
}
