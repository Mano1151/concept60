function ReadingSettings({ settings, onChange }) {
  const handleFontSizeChange = (event) => onChange({ fontSize: event.target.value });
  const handlePlaybackSpeedChange = (event) => onChange({ playbackSpeed: Number(event.target.value) });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm text-slate-300">
        Font size
        <select
          value={settings.fontSize}
          onChange={handleFontSizeChange}
          className="toolbar-select"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>

      <label className="space-y-2 text-sm text-slate-300">
        Playback speed
        <select
          value={settings.playbackSpeed}
          onChange={(event) => onChange({ playbackSpeed: Number(event.target.value) })}
          className="toolbar-select"
        >
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
        </select>
      </label>
    </div>
  );
}

export default ReadingSettings;
