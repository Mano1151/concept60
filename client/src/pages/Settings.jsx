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
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Accessibility settings</h2>
            <p className="mt-3 text-slate-300">
              Use these controls to customize text, playback, reading mode, and theme across the app. Your preferences are stored locally.
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-300">
            Settings saved locally
          </div>
        </div>
      </div>

      <AccessibilityToolbar settings={settings} onChange={updateSettings} />
    </section>
  );
}

export default Settings;
