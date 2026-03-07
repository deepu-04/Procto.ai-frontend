import React, { useState, useEffect } from 'react';
import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useCreateExamMutation } from '../../slices/examApiSlice';
import axiosInstance from '../../axios';

/* ================= VALIDATION ================= */
const examValidationSchema = yup.object({
  examName: yup.string().required('Exam Name is required'),
  totalQuestions: yup.number().required(),
  duration: yup.number().min(1).required(),
  liveDate: yup.date().required(),
  deadDate: yup.date().required(),
  bannerImage: yup.string().url('Invalid image URL'),

  codingQuestion: yup.object({
    question: yup.string().required(),
    description: yup.string().required(),
    image: yup.string().url('Invalid image URL'),
    testCases: yup.array().of(
      yup.object({
        input: yup.string().required(),
        output: yup.string().required(),
      }),
    ),
  }),
});

/* ================= COMPONENT ================= */
const CreateExamPage = () => {
  // --- Dynamic Dark Mode State ---
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Watch for global class changes on the HTML tag to sync Dark Mode instantly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const [createExam] = useCreateExamMutation();

  const formik = useFormik({
    initialValues: {
      examName: '',
      totalQuestions: '',
      duration: '',
      liveDate: '',
      deadDate: '',
      bannerImage: '',
      codingQuestion: {
        question: '',
        description: '',
        image: '',
        testCases: [{ input: '', output: '', isHidden: false }],
      },
    },
    validationSchema: examValidationSchema,

    onSubmit: async (values) => {
      try {
        // 🛠️ THE FIX: Server-Client Clock Drift Compensation
        // We subtract 2 minutes from the liveDate. This ensures that if the user 
        // selects the "Current Time", the server explicitly sees it as the past, 
        // forcing the exam to go "Live" immediately instead of getting stuck in "Upcoming".
        const liveDateObj = new Date(values.liveDate);
        liveDateObj.setMinutes(liveDateObj.getMinutes() - 2);

        const deadDateObj = new Date(values.deadDate);

        // Send strictly formatted ISO strings to prevent Timezone shift bugs
        const formattedPayload = {
          ...values,
          liveDate: liveDateObj.toISOString(),
          deadDate: deadDateObj.toISOString(),
        };

        const exam = await createExam(formattedPayload).unwrap();

        await axiosInstance.post('/api/coding/question', {
          ...values.codingQuestion,
          examId: exam.examId,
        });

        toast.success('Exam & Coding Question created successfully');
        formik.resetForm();
      } catch (err) {
        toast.error(err?.data?.message || 'Creation failed');
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
              // Smooth transitions
              transition: 'all 0.3s ease',
              // Dark mode glassmorphic styling
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#FFFFFF',
              backdropFilter: isDark ? 'blur(16px)' : 'none',
              color: isDark ? '#FFFFFF' : '#0F172A',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
              boxShadow: isDark
                ? '0px 20px 50px rgba(0,0,0,0.4)'
                : '0px 10px 40px rgba(0,0,0,0.04)',
              borderRadius: '24px',
            }}
          >
            <Typography 
              variant="h3" 
              textAlign="center" 
              mb={4} 
              fontWeight="800"
              sx={{ 
                color: isDark ? '#F8FAFC' : 'inherit',
                transition: 'color 0.3s ease' 
              }}
            >
              Create Exam
            </Typography>
            
            {/* Pass isDark down so the internal form fields can adapt their colors */}
            <ExamForm formik={formik} isDark={isDark} />
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default CreateExamPage;