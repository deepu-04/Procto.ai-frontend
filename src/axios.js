// frontend/src/utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://procto-ai-backend.onrender.com', 
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');
    if (!token) {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          token = userInfo.token;
        } catch (e) {}
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;