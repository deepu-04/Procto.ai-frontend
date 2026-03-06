import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000', // NO /api
  withCredentials: true,
});

export default axiosInstance;
