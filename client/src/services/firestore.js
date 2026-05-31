import apiClient from './api';

export async function fetchSavedSearches() {
  const response = await apiClient.get('/api/history');
  return response.data || [];
}

export async function deleteSavedSearch(entryId) {
  await apiClient.delete(`/api/history/${encodeURIComponent(entryId)}`);
}
