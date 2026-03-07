import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://procto-ai-backend.onrender.com/api",
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    let token = null;

    try {
      // 1️⃣ Try Redux state first
      const state = getState();
      token = state?.auth?.userInfo?.token;

      // 2️⃣ Fallback: localStorage token
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("token");
      }

      // 3️⃣ Fallback: token inside userInfo
      if (!token && typeof window !== "undefined") {
        const userInfoStr = localStorage.getItem("userInfo");

        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          token = userInfo?.token;
        }
      }
    } catch (error) {
      console.error("Token retrieval error:", error);
    }

    // 4️⃣ Attach token if available
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Exam", "Question", "CheatingLog"],
  endpoints: () => ({}),
});