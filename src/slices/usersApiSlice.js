
import { apiSlice } from './apiSlice';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    register: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
    }),

    
    login: builder.mutation({
      query: (data) => ({
        url: '/users/auth',
        method: 'POST',
        body: data,
      }),
    }),

    
    logout: builder.mutation({
      query: () => ({
        url: '/users/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation } = userApiSlice;
