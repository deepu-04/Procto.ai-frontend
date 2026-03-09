import React, { useState, useEffect } from "react";
import { Grid, Card, Typography } from "@mui/material";
import PageContainer from "src/components/container/PageContainer";
import ExamForm from "./components/ExamForm";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import { useCreateExamMutation } from "../../slices/examApiSlice";
import axiosInstance from "../../axios";

/* ================= VALIDATION ================= */

const examValidationSchema = yup.object({
  examName: yup.string().required("Exam Name is required"),
  totalQuestions: yup.number()
    .min(1, "Total questions must be at least 1")
    .required("Total questions is required"),
  duration: yup.number()
    .min(1, "Duration must be at least 1 minute")
    .required("Duration is required"),
  liveDate: yup.date().required("Live Date is required"),
  deadDate: yup.date()
    .min(yup.ref('liveDate'), "Dead Date must be strictly after the Live Date")
    .required("Dead Date is required"),
  bannerImage: yup.string()
    .url("Invalid image URL")
    .nullable()
    .transform((value) => (value === "" ? null : value)),

  // STRICTLY CODING VALIDATION
  codingQuestion: yup.object({
    question: yup.string().required("Coding question title is required"),
    description: yup.string().required("Problem description is required"),
    image: yup.string()
      .url("Invalid image URL")
      .nullable()
      .transform((value) => (value === "" ? null : value)),
    testCases: yup.array().of(
      yup.object({
        input: yup.string().required("Input is required"),
        output: yup.string().required("Output is required"),
      })
    ).min(1, "At least one test case is required"),
  }),
});

/* ================= COMPONENT ================= */

const CreateExamPage = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const [createExam, { isLoading: isCreatingExam }] = useCreateExamMutation();

  const formik = useFormik({
    initialValues: {
      examName: "",
      totalQuestions: 1, // Defaulting to 1 since this is a single coding question form
      duration: "",
      liveDate: "",
      deadDate: "",
      bannerImage: "",
      codingQuestion: {
        question: "",
        description: "",
        image: "",
        testCases: [{ input: "", output: "", isHidden: false }],
      },
    },
    validationSchema: examValidationSchema,
    onSubmit: async (values) => {
      try {
        const now = new Date();
        let liveDateObj = new Date(values.liveDate);
        const deadDateObj = new Date(values.deadDate);

        if (liveDateObj <= now) {
          liveDateObj = now;
        }

        /* 1. CREATE EXAM PAYLOAD */
        const examPayload = {
          examName: values.examName,
          totalQuestions: Number(values.totalQuestions),
          duration: Number(values.duration),
          liveDate: liveDateObj.toISOString(),
          deadDate: deadDateObj.toISOString(),
          bannerImage: values.bannerImage || "",
        };

        const examResponse = await createExam(examPayload).unwrap();
        const examId = examResponse?.examId || examResponse?.data?.examId || examResponse?.exam?._id;

        if (!examId) throw new Error("Exam ID not returned from server");

        /* 2. CREATE CODING QUESTION PAYLOAD */
        // Explicitly tagging this as "coding" prevents it from showing up in MCQs!
        await axiosInstance.post("/api/coding/question", {
          ...values.codingQuestion,
          examId: examId,
          type: "coding",     // Forces frontend to recognize this as code
          section: "coding"   // Forces frontend to recognize this as code
        });

        toast.success("Exam & Coding Question created successfully!");
        formik.resetForm();

      } catch (err) {
        console.error("Exam creation error:", err);
        toast.error(err?.response?.data?.message || err?.data?.message || err?.message || "Exam creation failed");
      }
    },
  });

  return (
    <PageContainer title="Create Exam" description="Create a new coding examination">
      <Grid container justifyContent="center">
        <Grid item xs={12} md={10} lg={8}>
          <Card
            sx={{
              p: { xs: 3, md: 5 },
              transition: "all 0.3s ease",
              backgroundColor: isDark ? "rgba(28, 28, 30, 0.8)" : "#FFFFFF",
              backdropFilter: isDark ? "blur(16px)" : "none",
              color: isDark ? "#FFFFFF" : "#0F172A",
              border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0",
              boxShadow: isDark ? "0px 20px 50px rgba(0,0,0,0.4)" : "0px 10px 40px rgba(0,0,0,0.04)",
              borderRadius: "24px",
            }}
          >
            <Typography variant="h3" textAlign="center" mb={4} fontWeight="800" sx={{ color: isDark ? "#F8FAFC" : "inherit" }}>
              Create Coding Exam
            </Typography>

            <ExamForm formik={formik} isDark={isDark} isLoading={isCreatingExam || formik.isSubmitting} />
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default CreateExamPage;