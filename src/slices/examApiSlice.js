import { apiSlice } from "./apiSlice";

export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query({
      query: () => "/exams",
      providesTags: ["Exam"],
    }),

    createExam: builder.mutation({
      query: (data) => ({
        url: "/exams",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Exam"],
    }),

    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `/exams/${examId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exam"],
    }),

    createQuestion: builder.mutation({
      query: (data) => ({
        url: "/questions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Question"],
    }),

    getQuestions: builder.query({
      query: (examId) => `/questions/${examId}`,
      providesTags: ["Question"],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useCreateExamMutation,
  useDeleteExamMutation,
  useCreateQuestionMutation,
  useGetQuestionsQuery,
} = examApiSlice;