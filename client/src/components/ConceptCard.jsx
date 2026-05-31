import TOPIC_DESCRIPTIONS from '../data/topicDescriptions';

function ConceptCard({ item, onView, onDelete }) {
  let timestamp = null;
  if (item.searchedAt?.toDate) {
    timestamp = item.searchedAt.toDate();
  } else if (item.searchedAt) {
    const parsed = Date.parse(item.searchedAt);
    timestamp = Number.isNaN(parsed) ? null : new Date(parsed);
  }

  const when = timestamp ? timestamp.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Saved recently';

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft transition hover:shadow-md hover:border-accent/70 hover:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 truncate">{item.category}</p>
            <p className="text-xs text-slate-400">{when}</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white truncate">{item.concept}</h3>
        </div>
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.concept}`}
            className="rounded-full border border-rose-400/20 bg-rose-500/6 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Description: use a mapped topic description when available, otherwise fall back to item.scenario */}
      <p className="mt-4 text-sm leading-7 text-slate-300">
        {(() => {
          const key = item.concept ? String(item.concept).toLowerCase().trim() : '';
          const desc = TOPIC_DESCRIPTIONS[key];
          if (desc) return desc;
          if (item.scenario) return `${item.scenario.substring(0, 300)}${item.scenario.length > 300 ? '...' : ''}`;
          return 'View the result again for the full explanation.';
        })()}
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="rounded-full bg-white/5 px-3 py-1">{item.category}</span>
        <span className="rounded-full bg-white/5 px-3 py-1">{when}</span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onView(item)}
          className="rounded-3xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#594be3]"
        >
          View again
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

export default ConceptCard;
