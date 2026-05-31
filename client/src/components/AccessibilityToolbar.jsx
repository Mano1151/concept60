import ReadingSettings from './ReadingSettings';

const fonts = ['Inter', 'Lexend', 'OpenDyslexic', 'JetBrains Mono'];
const modes = ['normal', 'focus', 'simplified', 'listen'];
const themes = ['dark', 'light'];

function AccessibilityToolbar({ settings, onChange }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Reading toolbar</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Accessibility controls</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onChange({ listenMode: !settings.listenMode })}
            className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30 ${
              settings.listenMode ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
            aria-pressed={settings.listenMode}
          >
            {settings.listenMode ? 'Listen Mode ON' : 'Listen Mode OFF'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-300">
          Font family
          <select
            value={settings.font}
            onChange={(event) => onChange({ font: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          Reading mode
          <select
            value={settings.readingMode}
            onChange={(event) => onChange({ readingMode: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          Color theme
          <select
            value={settings.theme}
            onChange={(event) => onChange({ theme: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-bg/70 px-4 py-3 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <ReadingSettings settings={settings} onChange={onChange} />
      </div>
    </div>
  );
}

export default AccessibilityToolbar;
