import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5555/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login or clear local storage)
      localStorage.removeItem('userInfo');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
