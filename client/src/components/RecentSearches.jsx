import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentSearches } from '../utils/localStorage';

function RecentSearches() {
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Use the current user's uid so only their own searches are shown
    setRecent(getRecentSearches(user?.uid ?? null));
  }, [user]);

  if (recent.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-panel/80 p-6 shadow-soft">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Recent searches</h2>
        <p className="text-sm text-slate-400">Tap any search to revisit the concept.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => navigate('/result', { state: entry })}
            className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-accent/70 hover:bg-white/10"
          >
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{entry.category}</p>
            <p className="mt-2 text-base font-semibold text-white">{entry.concept}</p>
            {entry.searchedAt && (
              <p className="mt-1 text-xs text-slate-500">
                {(() => {
                  const ts = Date.parse(entry.searchedAt);
                  return Number.isNaN(ts)
                    ? ''
                    : new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                })()}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default RecentSearches;
