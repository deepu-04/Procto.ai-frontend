import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://procto-ai-backend.onrender.com/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      const token =
        localStorage.getItem("token") ||
        JSON.parse(localStorage.getItem("userInfo") || "{}")?.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Exam", "Question", "CheatingLog"],
  endpoints: () => ({}),
});