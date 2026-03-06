import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://procto-ai-backend.onrender.com/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    // 1. Try to get the token directly from Redux state first
    let token = getState().auth?.userInfo?.token;

    // 2. Fallback 1: Check localStorage for a standalone 'token' key
    if (!token) {
      token = localStorage.getItem("token");
    }

    // 3. Fallback 2: Check localStorage inside the 'userInfo' JSON object
    if (!token) {
      const userInfoStr = localStorage.getItem("userInfo");
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          token = userInfo.token;
        } catch (e) {
          console.error("Failed to parse userInfo in apiSlice", e);
        }
      }
    }

    // 4. If we successfully found a token, attach it to the headers
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Exam", "Question", "CheatingLog"],
  endpoints: () => ({}),
});