import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchSavedSearches } from '../services/firestore';
import { getLearningProgress, getRecentSearches } from '../utils/localStorage';
import { auth } from '../firebase';
import { updateProfile, reload } from 'firebase/auth';
import Button from '../components/ui/Button';

function parseTimestamp(searchedAt) {
  if (!searchedAt) return null;
  if (typeof searchedAt.toDate === 'function') {
    return searchedAt.toDate().getTime();
  }
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

  for (let offset = 0; offset < 30; offset += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);
    const key = day.toISOString();
    if (dayCounts.has(key) && dayCounts.get(key) > 0) {
      streak += 1;
      continue;
    }
    if (offset === 0) {
      continue; // allow today to be empty and still count streak from yesterday
    }
    break;
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
    values.push({
      label: weekdays[day.getDay()],
      count,
    });
    maxCount = Math.max(maxCount, count);
  }

  if (maxCount === 0) {
    return values.map((value) => ({ ...value, height: 0 }));
  }

  return values.map((value) => ({
    ...value,
    height: value.count === 0 ? 0 : Math.max(14, Math.round((value.count / maxCount) * 100)),
  }));
}

function Profile() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoadingSavedHistory, setIsLoadingSavedHistory] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadSavedSearches = async () => {
      if (!user) {
        setIsLoadingSavedHistory(false);
        return;
      }

      try {
        const saved = await fetchSavedSearches();
        if (mounted) {
          setSavedSearches(saved);
        }
      } catch (error) {
        console.error('Unable to load saved searches for profile:', error);
      } finally {
        if (mounted) {
          setIsLoadingSavedHistory(false);
        }
      }
    };

    loadSavedSearches();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    const deriveName = (u) => {
      if (!u) return '';
      if (u.displayName && u.displayName.trim()) return u.displayName;
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

  const learningProgress = getLearningProgress();
  const localSearches = getRecentSearches();
  const allSearches = user
    ? [...savedSearches, ...localSearches].filter((entry) => parseTimestamp(entry.searchedAt) !== null)
    : localSearches.filter((entry) => parseTimestamp(entry.searchedAt) !== null);
  const lessonsSaved = user ? savedSearches.length + localSearches.length : localSearches.length;
  const learnedConcepts = Math.max(learningProgress.conceptsReviewed, allSearches.length);
  const level = Math.max(1, Math.ceil(learnedConcepts / 4));
  const currentXP =
    learningProgress.conceptsReviewed * 60 +
    learningProgress.quizzesCompleted * 25 +
    learningProgress.pdfQuestionsAnswered * 20 +
    lessonsSaved * 15;
  const nextLevelXP = Math.max(500, level * 500);
  const dayCounts = buildDailyCounts(allSearches);
  const dayStreak = calculateDayStreak(dayCounts);
  const weeklyProgress = buildWeeklyProgress(dayCounts);
  const learningTime = Math.max(Math.round(learningProgress.conceptsReviewed * 6), 10);

  const profileData = {
    name: displayName,
    email: user.email,
    level,
    currentXP,
    nextLevelXP,
    dayStreak,
    learnedConcepts,
    lessonsSaved,
    learningTime,
    quizzesCompleted: learningProgress.quizzesCompleted,
    pdfQuestionsAnswered: learningProgress.pdfQuestionsAnswered,
    weeklyProgress,
  };

  const xpProgress = Math.min(100, (profileData.currentXP / profileData.nextLevelXP) * 100);

  const achievementData = [
    {
      icon: '🏆',
      title: 'First Concept',
      subtitle: 'Learned your first concept',
    },
    {
      icon: '🔥',
      title: `${profileData.dayStreak}-Day Streak`,
      subtitle: `Learned for ${profileData.dayStreak} consecutive days`,
    },
    {
      icon: '📈',
      title: `Level ${profileData.level}`,
      subtitle: `Reached Level ${profileData.level}`,
    },
    {
      icon: '🎯',
      title: `${profileData.quizzesCompleted} Quizzes`,
      subtitle: `Completed ${profileData.quizzesCompleted} quizzes`,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Profile</h2>
              <p className="mt-2 text-slate-300">Track your learning progress and achievements.</p>
              {isLoadingSavedHistory && (
                <p className="mt-2 text-sm text-slate-400">Loading your saved history in the background…</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-white">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : ''}
            </div>
            <div>
              <div className="flex items-center gap-3">
                {!isEditingName ? (
                  <>
                    <h3 className="text-xl font-semibold text-white">{profileData.name}</h3>
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
                        if (!newName) {
                          showToast('Name cannot be empty.', 'error');
                          return;
                        }
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
                    <Button variant="ghost" className="px-3 py-2" onClick={() => { setIsEditingName(false); setEditingName(displayName); }}>Cancel</Button>
                  </div>
                )}
              </div>
              <p className="text-slate-300">{profileData.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-accent">
                Level {profileData.level}
              </span>
              <span className="text-sm text-slate-400">
                {profileData.currentXP} XP / {profileData.nextLevelXP} XP
              </span>
            </div>
            <div className="mt-4 flex justify-between text-sm text-slate-300 mb-2">
              <span>Progress to Level {profileData.level + 1}</span>
              <span>{profileData.nextLevelXP - profileData.currentXP} XP left</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <h4 className="text-lg font-semibold text-white mb-4">Weekly Progress</h4>
          <div className="space-y-3">
            <div className="flex items-end gap-2 h-32">
              {profileData.weeklyProgress.map((item, index) => (
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
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-white">{profileData.dayStreak}</div>
          <div className="text-sm text-slate-300">Day Streak</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-white">{profileData.learnedConcepts}</div>
          <div className="text-sm text-slate-300">Concepts Reviewed</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-white">{profileData.lessonsSaved}</div>
          <div className="text-sm text-slate-300">Lessons Saved</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">🧠</div>
          <div className="text-2xl font-bold text-white">{profileData.quizzesCompleted}</div>
          <div className="text-sm text-slate-300">Quizzes Completed</div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">📄</div>
          <div className="text-2xl font-bold text-white">{profileData.pdfQuestionsAnswered}</div>
          <div className="text-sm text-slate-300">PDF Questions Answered</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft text-center">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-2xl font-bold text-white">{profileData.learningTime}</div>
          <div className="text-sm text-slate-300">Minutes Learned</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <h4 className="text-lg font-semibold text-white mb-4">Achievements</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {achievementData.map((achievement) => (
            <div key={achievement.title} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xl">{achievement.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-white">{achievement.title}</p>
                <p className="text-sm text-slate-300">{achievement.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-3xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </section>
  );
}

export default Profile;
