import axios from 'axios';

const api = axios.create({
  baseURL: '', // Handled by Vite proxy in development
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
