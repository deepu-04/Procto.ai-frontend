import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://procto-ai-backend.onrender.com",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});


// ================= REQUEST INTERCEPTOR =================
axiosInstance.interceptors.request.use(
  (config) => {

    let token = localStorage.getItem("token");

    // fallback: token inside userInfo
    if (!token) {

      const userInfo = localStorage.getItem("userInfo");

      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          token = parsed?.token || null;
        } catch (err) {
          console.error("userInfo parse error:", err);
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

    const status = error?.response?.status;

    if (status === 401) {

      console.warn("Token expired or unauthorized");

      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      // optional redirect
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

    }

    if (status === 404) {
      console.error("API route not found:", error?.config?.url);
    }

    if (status >= 500) {
      console.error("Server error:", error?.response?.data);
    }

    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;