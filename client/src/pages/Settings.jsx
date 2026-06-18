import { useEffect, useState } from 'react';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import { fontClass, modeClass, sizeClass } from '../utils/accessibility';
import { getAccessibilitySettings, setAccessibilitySettings } from '../utils/localStorage';

const defaultSettings = {
  font: 'Inter',
  fontSize: 'medium',
  playbackSpeed: 1,
  readingMode: 'normal',
  listenMode: false,
  theme: 'dark',
};

const THEME_LABELS = {
  dark: '🌑 Dark',
  ocean: '🌊 Ocean',
  sunset: '🌅 Sunset',
  forest: '🌿 Forest',
  rose: '🌸 Rose',
  midnight: '🌙 Midnight',
  amber: '🔥 Amber',
  light: '☀️ Light',
};

function Settings() {
  const [settings, setSettings] = useState(() => getAccessibilitySettings() ?? defaultSettings);

  useEffect(() => {
    setAccessibilitySettings(settings);
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.font = settings.font;
  }, [settings]);

  const updateSettings = (update) => {
    setSettings((current) => ({ ...current, ...update }));
  };

  return (
    <section className={`space-y-6 ${fontClass(settings.font)} ${sizeClass(settings.fontSize)} ${modeClass(settings.readingMode)}`}>

      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Personalization</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Settings</h1>
            <p className="mt-2 text-slate-300">
              Customize your theme, fonts, reading mode, and accessibility controls. Changes apply instantly and are saved locally.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--gradient-start,108 99 255)), rgb(var(--gradient-end,34 211 238)))',
              }}
            >
              {THEME_LABELS[settings.theme] ?? settings.theme}
            </div>
            <p className="text-xs text-slate-500">Active theme</p>
          </div>
        </div>
      </div>

      {/* Toolbar with theme swatches + accessibility */}
      <AccessibilityToolbar settings={settings} onChange={updateSettings} />

      {/* Preview card */}
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Live preview</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">How your content will look</h2>
        <div className="mt-5 space-y-4">
          <p className="text-slate-300 leading-8">
            This is a sample paragraph showing how text appears with your current font, size, and theme. Adjust the controls above to see changes in real time.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
              style={{ background: 'rgba(var(--accent),1)', boxShadow: '0 4px 14px var(--accent-glow)' }}>
              Accent color
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300">
              Ghost pill
            </span>
            <span className="rounded-full bg-gradient-to-r from-[rgb(var(--gradient-start,108_99_255))] to-[rgb(var(--gradient-end,34_211_238))] px-4 py-1.5 text-sm font-medium text-white">
              Gradient pill
            </span>
          </div>
        </div>
      </div>

    </section>
  );
}

export default Settings;
