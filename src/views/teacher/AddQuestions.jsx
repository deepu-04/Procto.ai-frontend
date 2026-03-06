import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import AddQuestionForm from './components/AddQuestionForm';

const AddQuestions = () => {
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

  return (
    <PageContainer title="Add Questions Page" description="this is Add Questions page">
      <Box
        sx={{
          // Apply smooth transitions
          transition: 'all 0.3s ease',
          
          // Force dark mode styling onto the underlying DashboardCard (MUI Paper/Card)
          '& > div': { 
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#FFFFFF',
            backdropFilter: isDark ? 'blur(16px)' : 'none',
            color: isDark ? '#FFFFFF' : '#0F172A',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
            boxShadow: isDark 
              ? '0px 20px 50px rgba(0,0,0,0.4)' 
              : '0px 4px 20px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            borderRadius: '24px', // Slightly more modern rounded corners
          },
          
          // Ensure all Typography inside the card switches to the correct color
          '& .MuiTypography-root': {
            color: isDark ? '#E2E8F0' : 'inherit',
            transition: 'color 0.3s ease',
          }
        }}
      >
        <DashboardCard title="Add Questions Page">
          <Typography mb={4}>This is the Add Questions page</Typography>
          
          {/* Forward the isDark prop so the form inputs can also style themselves if needed */}
          <AddQuestionForm isDark={isDark} />
        </DashboardCard>
      </Box>
    </PageContainer>
  );
};

export default AddQuestions;