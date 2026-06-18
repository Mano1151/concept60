import axios from 'axios';
import { auth } from '../firebase';
import { getIdToken } from 'firebase/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser && config.headers) {
    try {
      const token = await getIdToken(currentUser);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn('Skipping auth token due to invalid/expired token:', error?.message || error);
      delete config.headers.Authorization;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const freshToken = await getIdToken(currentUser, true);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return apiClient(originalRequest);
        } catch (tokenErr) {
          console.warn('Failed to refresh token after 401:', tokenErr?.message || tokenErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
