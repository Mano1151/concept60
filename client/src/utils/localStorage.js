const RECENT_SEARCHES_KEY = 'concept60_recent_searches';
const ACCESSIBILITY_SETTINGS_KEY = 'concept60_accessibility_settings';
const LEARNING_PROGRESS_KEY = 'concept60_learning_progress';

const defaultAccessibilitySettings = {
  font: 'Inter',
  fontSize: 'medium',
  playbackSpeed: 1,
  readingMode: 'normal',
  listenMode: false,
  theme: 'dark',
};

const defaultLearningProgress = {
  conceptsReviewed: 0,
  quizzesCompleted: 0,
  lessonsSaved: 0,
  pdfQuestionsAnswered: 0,
};

export const getLocalSetting = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const setLocalSetting = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to persist local storage setting', error);
  }
};

export const getRecentSearches = () => {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
};

export const addRecentSearch = (entry) => {
  if (!entry?.concept) {
    return;
  }

  try {
    const searches = getRecentSearches();
    const searchedAt = entry.searchedAt || new Date().toISOString();
    const normalized = {
      id: `${entry.concept.toLowerCase().trim()}-${(entry.category || 'General').toLowerCase().trim()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      concept: entry.concept,
      category: entry.category || 'General',
      oneLiner: entry.oneLiner || '',
      scenario: entry.scenario || '',
      searchedAt,
    };

    const next = [normalized, ...searches];
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next.slice(0, 6)));
  } catch (error) {
    console.warn('Unable to update recent searches', error);
  }
};

export const removeRecentSearch = (entryId) => {
  try {
    const searches = getRecentSearches();
    const next = searches.filter((item) => item.id !== entryId);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Unable to remove recent search', error);
  }
};

export const getLearningProgress = () => {
  const saved = getLocalSetting(LEARNING_PROGRESS_KEY, null);
  return saved ? { ...defaultLearningProgress, ...saved } : defaultLearningProgress;
};

export const updateLearningProgress = (delta) => {
  const current = getLearningProgress();
  const next = { ...current };

  Object.entries(delta).forEach(([key, value]) => {
    if (typeof value !== 'number') {
      return;
    }
    next[key] = Math.max(0, (next[key] || 0) + value);
  });

  setLocalSetting(LEARNING_PROGRESS_KEY, next);
  return next;
};

export const getAccessibilitySettings = () => {
  const saved = getLocalSetting(ACCESSIBILITY_SETTINGS_KEY, null);
  return saved ? { ...defaultAccessibilitySettings, ...saved } : defaultAccessibilitySettings;
};

export const setAccessibilitySettings = (settings) =>
  setLocalSetting(ACCESSIBILITY_SETTINGS_KEY, settings);
