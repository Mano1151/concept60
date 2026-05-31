function FocusReader({ sections, mode, activeSection, onSelectSection }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {sections.map((section) => {
        const selected = activeSection === section.key;
        const isFocus = mode === 'focus';
        const cardOpacity = isFocus ? (selected ? 'opacity-100' : 'opacity-40') : 'opacity-100';

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onSelectSection(section.key)}
            className={`rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-soft transition ${cardOpacity} hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent/40`}
            aria-pressed={selected}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{section.title}</p>
            <div className="mt-4 space-y-3">
              {section.sentences.map((sentence, index) => (
                <p key={index} className={`text-base leading-7 ${selected ? 'text-white' : 'text-slate-200'}`}>
                  {sentence}
                </p>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default FocusReader;
