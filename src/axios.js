import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://procto-ai-backend.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST INTERCEPTOR =================
axiosInstance.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");

    // fallback if token stored inside userInfo
    if (!token) {
      const userInfoStr = localStorage.getItem("userInfo");

      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          token = userInfo?.token;
        } catch (error) {
          console.error("Error parsing userInfo from localStorage", error);
        }
      }
    }

    // attach token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Token expired or unauthorized
      if (error.response.status === 401) {
        console.warn("Unauthorized. Token expired or invalid.");

        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");

        // optional redirect
        window.location.href = "/login";
      }

      // Backend not found
      if (error.response.status === 404) {
        console.error("API route not found:", error.config?.url);
      }

      // Server error
      if (error.response.status >= 500) {
        console.error("Server error:", error.response.data);
      }
    } else {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;