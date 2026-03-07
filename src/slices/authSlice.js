import { createSlice } from "@reduxjs/toolkit";

const getUserInfo = () => {
  try {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("userInfo");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  } catch (error) {
    console.error("Failed to load userInfo:", error);
    return null;
  }
};

const initialState = {
  userInfo: getUserInfo(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
        localStorage.setItem("token", action.payload.token);
      }
    },

    logout: (state) => {
      state.userInfo = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;