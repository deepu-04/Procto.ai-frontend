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
  totalQuestions: yup.number().required(),
  duration: yup.number().min(1).required(),
  liveDate: yup.date().required(),
  deadDate: yup.date().required(),
  bannerImage: yup.string().url("Invalid image URL"),

  codingQuestion: yup.object({
    question: yup.string().required(),
    description: yup.string().required(),
    image: yup.string().url("Invalid image URL"),
    testCases: yup.array().of(
      yup.object({
        input: yup.string().required(),
        output: yup.string().required(),
      })
    ),
  }),
});

/* ================= COMPONENT ================= */

const CreateExamPage = () => {

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const [createExam] = useCreateExamMutation();

  const formik = useFormik({
    initialValues: {
      examName: "",
      totalQuestions: "",
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

        /* ================= DATE FIX ================= */

       const now = new Date();

let liveDateObj = new Date(values.liveDate);
const deadDateObj = new Date(values.deadDate);

// If teacher selects current time or past → force live
if (liveDateObj <= now) {
  liveDateObj = now;
}

        /* ================= PAYLOAD ================= */

  const examPayload = {
  examName: values.examName,
  totalQuestions: Number(values.totalQuestions),
  duration: Number(values.duration),
  liveDate: liveDateObj.toISOString(),
  deadDate: deadDateObj.toISOString(),
  bannerImage: values.bannerImage || "",
};
        console.log("Exam payload:", examPayload);

        /* ================= CREATE EXAM ================= */

        const examResponse = await createExam(examPayload).unwrap();

        console.log("Exam response:", examResponse);

        const examId =
          examResponse?.examId ||
          examResponse?.data?.examId ||
          examResponse?.exam?._id;

        if (!examId) {
          throw new Error("Exam ID not returned from server");
        }

        /* ================= CREATE CODING QUESTION ================= */

        await axiosInstance.post("/api/coding/question", {
          ...values.codingQuestion,
          examId: examId,
        });

        toast.success("Exam & Coding Question created successfully");

        formik.resetForm();

      } catch (err) {

        console.error("Exam creation error:", err);

        toast.error(
          err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          "Exam creation failed"
        );
      }
    },
  });

  return (
    <PageContainer title="Create Exam" description="Create a new examination">
      <Grid container justifyContent="center">
        <Grid item xs={12} md={10} lg={8}>
          <Card
            sx={{
              p: { xs: 3, md: 5 },
              transition: "all 0.3s ease",
              backgroundColor: isDark
                ? "rgba(28, 28, 30, 0.8)"
                : "#FFFFFF",
              backdropFilter: isDark ? "blur(16px)" : "none",
              color: isDark ? "#FFFFFF" : "#0F172A",
              border: isDark
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid #E2E8F0",
              boxShadow: isDark
                ? "0px 20px 50px rgba(0,0,0,0.4)"
                : "0px 10px 40px rgba(0,0,0,0.04)",
              borderRadius: "24px",
            }}
          >
            <Typography
              variant="h3"
              textAlign="center"
              mb={4}
              fontWeight="800"
              sx={{ color: isDark ? "#F8FAFC" : "inherit" }}
            >
              Create Exam
            </Typography>

            <ExamForm formik={formik} isDark={isDark} />
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default CreateExamPage;