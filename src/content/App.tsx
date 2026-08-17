import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureEngine, getPitch, setPitch } from './audioEngine';
import { PITCH_TOGGLE_EVENT } from './injectButton';

const MIN = -12;
const MAX = 12;
const STORAGE_KEY = 'yt-pitch-shifter:pitch';

function label(value: number): string {
  if (value === 0) return '0';
  return `${value > 0 ? '+' : ''}${value}`;
}

export default function App() {
  const [pitch, setPitchState] = useState(0);
  // Hidden by default — opened via the "Change Pitch" button or the toolbar icon.
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engineStarted = useRef(false);

  // Restore the last-used pitch (slider only — the engine starts on first gesture).
  useEffect(() => {
    chrome.storage?.local.get(STORAGE_KEY).then((res) => {
      const stored = res?.[STORAGE_KEY];
      if (typeof stored === 'number') {
        setPitchState(stored);
        setPitch(stored);
      }
    });
  }, []);

  // Toggle from the in-page "Change Pitch" button (window event) and the toolbar
  // icon (background → runtime message).
  useEffect(() => {
    const onToggle = () => setVisible((v) => !v);
    const onMessage = (msg: { type?: string }) => {
      if (msg?.type === 'TOGGLE_PANEL') setVisible((v) => !v);
    };
    window.addEventListener(PITCH_TOGGLE_EVENT, onToggle);
    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      window.removeEventListener(PITCH_TOGGLE_EVENT, onToggle);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  const apply = useCallback(async (value: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, value));
    setPitchState(clamped);
    setError(null);

    try {
      if (!engineStarted.current) {
        await ensureEngine();
        engineStarted.current = true;
        // Sync any pre-restored value once the graph exists.
        setPitch(getPitch());
      }
      setPitch(clamped);
      chrome.storage?.local.set({ [STORAGE_KEY]: clamped });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start audio.');
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] font-sans">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2.5 rounded-full bg-neutral-900/90 px-5 py-3 text-base font-semibold text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-neutral-800/90"
        >
          <Logo size={22} />
          <span className="tabular-nums">{label(pitch)} st</span>
        </button>
      ) : (
        <div className="w-96 overflow-hidden rounded-3xl bg-neutral-900/85 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <Logo size={30} />
              <div className="leading-tight">
                <div className="text-base font-semibold tracking-tight">Pitch Shifter</div>
                <div className="text-xs text-white/45">Transpose without changing tempo</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <MinusIcon />
              </button>
              <button
                onClick={() => setVisible(false)}
                title="Close (reopen with the Change Pitch button)"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pb-5 pt-4">
            {/* Big value readout */}
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="text-6xl font-bold leading-none tabular-nums tracking-tight">
                  {label(pitch)}
                </div>
                <div className="mt-1.5 text-sm text-white/50">semitones</div>
              </div>
              <div className="flex items-center gap-2">
                <StepButton onClick={() => apply(pitch - 1)} disabled={pitch <= MIN}>
                  <MinusIcon />
                </StepButton>
                <StepButton onClick={() => apply(pitch + 1)} disabled={pitch >= MAX}>
                  <PlusIcon />
                </StepButton>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={1}
              value={pitch}
              onChange={(e) => apply(Number(e.target.value))}
              className="ps-range"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
              <span>−12</span>
              <span>−6</span>
              <span>0</span>
              <span>+6</span>
              <span>+12</span>
            </div>

            {pitch !== 0 && (
              <button
                onClick={() => apply(0)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Reset to original pitch
              </button>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* --- The Pitch Shifter logo: rounded gradient square with a waveform mark --- */

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <linearGradient id="ps-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill="url(#ps-logo-grad)" />
      <g stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M28 64 h0" />
        <path d="M46 44 v40" />
        <path d="M64 30 v68" />
        <path d="M82 48 v32" />
        <path d="M100 64 h0" />
      </g>
    </svg>
  );
}

/* --- Inline UI icons --- */

function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
