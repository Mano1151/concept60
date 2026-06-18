import ReadingSettings from './ReadingSettings';

const fonts = ['Inter', 'Poppins', 'Lexend', 'OpenDyslexic', 'JetBrains Mono'];
const modes = ['normal', 'focus', 'simplified', 'listen'];

const THEMES = [
  {
    id: 'dark',
    label: 'Dark',
    swatch: 'linear-gradient(135deg, #6c63ff, #22d3ee)',
    dot: '#6c63ff',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    swatch: 'linear-gradient(135deg, #00bcd4, #2196f3)',
    dot: '#00bcd4',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    swatch: 'linear-gradient(135deg, #f97316, #ec4899)',
    dot: '#f97316',
  },
  {
    id: 'forest',
    label: 'Forest',
    swatch: 'linear-gradient(135deg, #34d399, #06b6d4)',
    dot: '#34d399',
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: 'linear-gradient(135deg, #f43f5e, #d946ef)',
    dot: '#f43f5e',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    swatch: 'linear-gradient(135deg, #9333ea, #4f46e5)',
    dot: '#9333ea',
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    dot: '#f59e0b',
  },
  {
    id: 'light',
    label: 'Light',
    swatch: 'linear-gradient(135deg, #6366f1, #22d3ee)',
    dot: '#f7f8ff',
  },
];

function AccessibilityToolbar({ settings, onChange }) {
  return (
    <div className="space-y-6">

      {/* ── Color Themes ───────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Color theme</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Choose your palette</h3>
        <div className="mt-5 grid grid-cols-4 gap-4 sm:grid-cols-8">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.label}
              onClick={() => onChange({ theme: theme.id })}
              className={`group flex flex-col items-center gap-2 rounded-2xl p-2 transition-all ${
                settings.theme === theme.id
                  ? 'bg-white/10 ring-2 ring-white/30'
                  : 'hover:bg-white/5'
              }`}
              aria-pressed={settings.theme === theme.id}
            >
              <span
                className={`theme-swatch ${settings.theme === theme.id ? 'active' : ''}`}
                style={{ background: theme.swatch }}
              />
              <span className="text-[10px] font-medium tracking-wide text-slate-400 group-hover:text-white transition">
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Reading & Accessibility ────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reading toolbar</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Accessibility controls</h3>
          </div>
          <button
            type="button"
            onClick={() => onChange({ listenMode: !settings.listenMode })}
            className={`rounded-3xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20 ${
              settings.listenMode
                ? 'border-transparent bg-gradient-to-r from-[rgb(var(--gradient-start,108_99_255))] to-[rgb(var(--gradient-end,34_211_238))] text-white shadow-lg'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
            aria-pressed={settings.listenMode}
          >
            {settings.listenMode ? '🔊 Listen Mode ON' : '🔇 Listen Mode OFF'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="space-y-2 text-sm text-slate-300">
            Font family
            <select
              value={settings.font}
              onChange={(e) => onChange({ font: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {fonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            Reading mode
            <select
              value={settings.readingMode}
              onChange={(e) => onChange({ readingMode: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {modes.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            Font size
            <select
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {['small', 'medium', 'large'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <ReadingSettings settings={settings} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

export default AccessibilityToolbar;
