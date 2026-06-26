import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchSavedSearches } from '../services/firestore';
import { auth } from '../firebase';
import { updateProfile, reload } from 'firebase/auth';
import Button from '../components/ui/Button';

// ─── Timestamp helpers ──────────────────────────────────────────────────────
// Handles:
//   • Firestore Timestamp object (client SDK) — has .toDate()
//   • Serialized Firestore Timestamp from REST/Admin (has ._seconds)
//   • ISO string / any Date-parseable string
function parseTimestamp(searchedAt) {
  if (!searchedAt) return null;
  // Firestore client SDK Timestamp
  if (typeof searchedAt.toDate === 'function') {
    return searchedAt.toDate().getTime();
  }
  // Serialized Admin Timestamp: { _seconds, _nanoseconds }
  if (searchedAt._seconds != null) {
    return searchedAt._seconds * 1000;
  }
  // ISO string or similar
  const parsed = Date.parse(searchedAt);
  return Number.isNaN(parsed) ? null : parsed;
}

function getMidnightKey(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function buildDailyCounts(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    const timestamp = parseTimestamp(entry.searchedAt);
    if (!timestamp) return;
    const key = getMidnightKey(new Date(timestamp));
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

function calculateDayStreak(dayCounts) {
  if (dayCounts.size === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 365; offset += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = getMidnightKey(day);
    if (dayCounts.has(key) && dayCounts.get(key) > 0) {
      streak += 1;
    } else if (offset === 0) {
      // Today empty — still check yesterday before breaking
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function buildWeeklyProgress(dayCounts) {
  const values = [];
  let maxCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = getMidnightKey(day);
    const count = dayCounts.get(key) || 0;
    values.push({ label: weekdays[day.getDay()], count });
    maxCount = Math.max(maxCount, count);
  }

  if (maxCount === 0) {
    return values.map((v) => ({ ...v, height: 0 }));
  }

  return values.map((v) => ({
    ...v,
    height: v.count === 0 ? 0 : Math.max(14, Math.round((v.count / maxCount) * 100)),
  }));
}

// ─── Deduplicate: keep only the most-recent entry per concept+category ───────
function deduplicateSearches(entries) {
  const seen = new Map();
  // entries are already sorted desc by server — first occurrence = most recent
  for (const entry of entries) {
    const key = `${(entry.concept || '').toLowerCase().trim()}||${(entry.category || 'general').toLowerCase().trim()}`;
    if (!seen.has(key)) seen.set(key, entry);
  }
  return Array.from(seen.values());
}

function Profile() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [allSearches, setAllSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sessionTime, setSessionTime] = useState('00:00');

  // ── Live Session Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }
    const startTime = parseInt(sessionStorage.getItem('sessionStartTime'), 10);

    const updateTimer = () => {
      const now = Date.now();
      const diffSeconds = Math.floor((now - startTime) / 1000);
      const m = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
      const s = (diffSeconds % 60).toString().padStart(2, '0');
      setSessionTime(`${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Load live Firestore history ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        const raw = await fetchSavedSearches();
        if (mounted) {
          const deduped = deduplicateSearches(raw);
          setAllSearches(deduped.filter((e) => parseTimestamp(e.searchedAt) !== null));
        }
      } catch (err) {
        console.error('Profile: failed to load history', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  // ── Sync display name from Firebase Auth ───────────────────────────────────
  useEffect(() => {
    const deriveName = (u) => {
      if (!u) return '';
      if (u.displayName?.trim()) return u.displayName;
      if (u.email) return u.email.split('@')[0];
      return '';
    };
    setDisplayName(deriveName(user));
    setEditingName(deriveName(user));
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Signed out successfully.', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Unable to sign out. Please try again.', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
          <h2 className="text-2xl font-semibold text-white">Profile</h2>
          <p className="mt-3 text-slate-300">Please sign in to view your profile.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 rounded-3xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#594be3]"
          >
            Sign In
          </button>
        </div>
      </section>
    );
  }

  // ── Derive all stats from live Firestore data only ─────────────────────────
  const totalConcepts  = allSearches.length;
  const currentXP      = totalConcepts * 60;
  const level          = Math.max(1, Math.ceil(totalConcepts / 4));
  const nextLevelXP    = Math.max(500, level * 500);
  const xpProgress     = Math.min(100, (currentXP / nextLevelXP) * 100);

  const dayCounts      = buildDailyCounts(allSearches);
  const dayStreak      = calculateDayStreak(dayCounts);
  const weeklyProgress = buildWeeklyProgress(dayCounts);

  return (
    <section className="space-y-6">

      {/* ── Top row: profile card + weekly chart ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Profile card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-white">Profile</h2>
          <p className="mt-1 text-sm text-slate-400">
            Stats are calculated from your live Firestore search history.
          </p>
          {isLoading && (
            <p className="mt-2 text-sm text-slate-500 animate-pulse">Loading your data…</p>
          )}

          {/* Avatar + name */}
          <div className="mt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-white select-none">
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                {!isEditingName ? (
                  <>
                    <h3 className="text-xl font-semibold text-white">{displayName}</h3>
                    <Button variant="ghost" className="px-2 py-1 text-sm" onClick={() => setIsEditingName(true)}>Edit</Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Edit display name"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="rounded-md px-3 py-2 bg-white/5 text-white outline-none"
                    />
                    <Button
                      variant="primary"
                      className="px-3 py-2"
                      onClick={async () => {
                        const newName = editingName?.trim();
                        if (!newName) { showToast('Name cannot be empty.', 'error'); return; }
                        try {
                          await updateProfile(auth.currentUser, { displayName: newName });
                          await reload(auth.currentUser);
                          setDisplayName(newName);
                          setIsEditingName(false);
                          showToast('Display name updated.', 'success');
                        } catch (err) {
                          console.error('Update profile error:', err);
                          showToast('Unable to update name. Try again.', 'error');
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-2"
                      onClick={() => { setIsEditingName(false); setEditingName(displayName); }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-slate-300">{user.email}</p>
            </div>
          </div>

          {/* XP / Level */}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-accent">
                Level {level}
              </span>
              <span className="text-sm text-slate-400">{currentXP} XP / {nextLevelXP} XP</span>
            </div>
            <div className="mt-4 flex justify-between text-sm text-slate-300 mb-2">
              <span>Progress to Level {level + 1}</span>
              <span>{Math.max(0, nextLevelXP - currentXP)} XP left</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weekly activity chart */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <h4 className="text-lg font-semibold text-white mb-4">Weekly Activity</h4>
          <div className="flex items-end gap-2 h-32">
            {weeklyProgress.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-[10px] font-semibold text-slate-300 mb-2">
                  {item.count > 0 ? item.count : ''}
                </div>
                <div className="relative h-20 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 w-full rounded-t bg-accent/60 transition-all duration-300"
                    style={{ height: `${item.height}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 mt-2">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-white">{isLoading ? '…' : dayStreak}</div>
          <div className="text-sm text-slate-300">Day Streak</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-white">{isLoading ? '…' : totalConcepts}</div>
          <div className="text-sm text-slate-300">Concepts Reviewed</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-white">{isLoading ? '…' : totalConcepts}</div>
          <div className="text-sm text-slate-300">Lessons Saved</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-2xl font-bold text-white tabular-nums">{sessionTime}</div>
          <div className="text-sm text-slate-300">Live Session Time</div>
        </div>
      </div>

      {/* ── Sign Out ── */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-3xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>

    </section>
  );
}

export default Profile;
