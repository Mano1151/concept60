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
    const token = await getIdToken(currentUser);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
