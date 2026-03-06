import { apiSlice } from './apiSlice';

export const resumeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    parseResume: builder.mutation({
      query: (data) => ({
        url: '/resume/parse',
        method: 'POST',
        body: data,
      }),
    }),
    parseJD: builder.mutation({
      query: (data) => ({
        url: '/resume/parse-jd',
        method: 'POST',
        body: data,
      }),
    }),
    generateExamFromProfile: builder.mutation({
      query: (data) => ({
        url: '/resume/generate-exam',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useParseResumeMutation, useParseJDMutation, useGenerateExamFromProfileMutation } =
  resumeApiSlice;
