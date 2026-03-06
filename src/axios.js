import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://procto-ai-backend.onrender.com', // NO /api
  withCredentials: true,
});

export default axiosInstance;
