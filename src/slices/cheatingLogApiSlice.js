import { apiSlice } from './apiSlice';

export const cheatingLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    saveCheatingLog: builder.mutation({
      query: (data) => ({
        url: '/cheatinglogs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CheatingLog'],
    }),

    getCheatingLogs: builder.query({
      query: () => '/cheatinglogs',
      providesTags: ['CheatingLog'],
    }),
  }),
});

export const { useSaveCheatingLogMutation, useGetCheatingLogsQuery } = cheatingLogApiSlice;
