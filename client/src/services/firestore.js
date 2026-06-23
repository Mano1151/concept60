import apiClient from './api';
import { db } from '../firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function fetchSavedSearches() {
  const response = await apiClient.get('/api/history');
  return response.data || [];
}

export async function deleteSavedSearch(entryId) {
  await apiClient.delete(`/api/history/${encodeURIComponent(entryId)}`);
}

export async function saveUserInfo(user) {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName || '',
    lastLoginAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveSearchToFirestore(userId, entry) {
  if (!userId || !entry) return;
  const historyRef = collection(db, 'users', userId, 'searchHistory');
  const searchedAt = entry.searchedAt ? new Date(entry.searchedAt) : new Date();
  await addDoc(historyRef, {
    concept: entry.concept,
    category: entry.category || 'General',
    oneLiner: entry.oneLiner || '',
    scenario: entry.scenario || '',
    exampleScenarios: entry.exampleScenarios || [],
    keywords: entry.keywords || [],
    searchedAt: searchedAt,
  });
}
