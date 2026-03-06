import React, { useState, useEffect } from 'react';
import { Grid, Typography, CircularProgress, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from '../../../components/shared/BlankCard';
import ExamCard from './ExamCard';
import { useGetExamsQuery } from 'src/slices/examApiSlice';

const Exams = () => {
  const { data: userExams = [], isLoading, isError, error } = useGetExamsQuery();

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

  console.log('Exam User:', userExams);

  // 🔄 Loading
  if (isLoading) {
    return (
      <Box minHeight="60vh" display="flex" alignItems="center" justifyContent="center">
        <CircularProgress sx={{ color: isDark ? '#3B82F6' : 'primary.main' }} />
      </Box>
    );
  }

  // ❌ Error
  if (isError) {
    return (
      <PageContainer title="Exams">
        <Typography 
          sx={{ color: isDark ? '#F87171' : 'error.main' }} 
          textAlign="center"
        >
          Failed to load exams. {error?.data?.message || 'Please try again later.'}
        </Typography>
      </PageContainer>
    );
  }

  // 📭 Empty
  if (!Array.isArray(userExams) || userExams.length === 0) {
    return (
      <PageContainer title="Exams">
        <Typography 
          textAlign="center" 
          sx={{ color: isDark ? '#94A3B8' : 'text.secondary' }}
        >
          No exams available for you right now.
        </Typography>
      </PageContainer>
    );
  }

  // 🔄 Sort Exams: Push expired exams to the bottom of the grid
  const sortedExams = [...userExams].sort((a, b) => {
    const now = new Date();
    const aIsExpired = now > new Date(a.deadDate);
    const bIsExpired = now > new Date(b.deadDate);

    // If 'a' is expired but 'b' is not, 'a' goes down the list
    if (aIsExpired && !bIsExpired) return 1;
    // If 'b' is expired but 'a' is not, 'b' goes down the list
    if (!aIsExpired && bIsExpired) return -1;

    // If both are in the same state (both active or both expired), keep original order
    return 0;
  });

  // ✅ Success
  return (
    <PageContainer title="Exams" description="List of exams">
      <Grid container spacing={3}>
        {sortedExams.map((exam) => (
          <Grid item sm={6} md={4} lg={3} key={exam.examId || exam._id}>
            {/* Override BlankCard styles to ensure it doesn't render a white background 
              or border that interferes with our premium ExamCard dark mode styling. 
            */}
            <Box 
              sx={{ 
                height: '100%', 
                '& > div': { 
                  height: '100%', 
                  backgroundColor: 'transparent !important', 
                  border: 'none !important', 
                  boxShadow: 'none !important' 
                } 
              }}
            >
              <BlankCard>
                <ExamCard exam={exam} />
              </BlankCard>
            </Box>
          </Grid>
        ))}
      </Grid>
    </PageContainer>
  );
};

export default Exams;