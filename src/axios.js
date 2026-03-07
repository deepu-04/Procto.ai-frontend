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
        } catch (e) {
          console.error("Failed to parse userInfo in axios interceptor", e);
        }
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


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
   
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Clearing local storage.");
      
     
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
     
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;