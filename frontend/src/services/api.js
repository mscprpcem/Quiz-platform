import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Handled by Vite proxy in development or custom env URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to append authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('msc_quiz_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
