import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api'
    ? import.meta.env.VITE_API_URL
    : 'https://pmis-platform.onrender.com/api';

const api = axios.create({
  baseURL,
  timeout: 12000 // 12 seconds timeout to prevent browser ERR_CONNECTION_TIMED_OUT
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmis_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pmis_token');
      localStorage.removeItem('pmis_user');

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;