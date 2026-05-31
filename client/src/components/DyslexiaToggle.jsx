function DyslexiaToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30 ${
        enabled ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
      }`}
      aria-pressed={enabled}
    >
      {enabled ? 'Dyslexia-friendly ON' : 'Dyslexia-friendly OFF'}
    </button>
  );
}

export default DyslexiaToggle;
