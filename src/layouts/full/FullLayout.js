import React, { useState, useEffect } from 'react';
import { styled, Container, Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';

// Base solid background colors
const darkBase = '#0A0A0C';
const lightBase = '#F5F5F7';

// Clean White and Ice Blue gradients
const iceBlueGradientLight = 'linear-gradient(to top, #cceeff, #ffffff)';
const iceBlueGradientDark = 'linear-gradient(to top, #082f49, #0A0A0C)'; // Frosty dark blue for dark mode

const MainWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  backgroundColor: 'transparent', // Let the body background show through
  
  // Apply the Ice Blue Gradient Overlay using a pseudo-element
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: 0, // Behind content
    filter: 'blur(80px)', // Smooth, diffuse ambient blur
    opacity: 0.8, // Elegant brightness
    backgroundImage: iceBlueGradientLight, 
    transition: 'background-image 0.5s ease, opacity 0.5s ease',
    pointerEvents: 'none', // Ensure it doesn't block interactions/clicks
  },
  
  // Target the pseudo-element when the global '.dark' class is active
  ':root.dark &::before, .dark &::before': {
    backgroundImage: iceBlueGradientDark,
    opacity: 0.4, // Softer glow so it doesn't overwhelm dark mode
  }
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '60px',
  flexDirection: 'column',
  zIndex: 1, // Above background gradient
  backgroundColor: 'transparent',
}));

const FullLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- GLOBAL DARK MODE SYNC ---
  useEffect(() => {
    // 1. Set initial theme on load based on saved preferences
    const prefs = JSON.parse(localStorage.getItem('procto_prefs') || '{}');
    const isInitiallyDark = prefs.darkMode !== false; // Default to true if undefined

    const applyTheme = (isDark) => {
      document.body.style.backgroundColor = isDark ? darkBase : lightBase;
      document.body.style.color = isDark ? '#F3F4F6' : '#111827';
    };

    if (isInitiallyDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    applyTheme(isInitiallyDark);
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    // 2. Watch for class changes triggered by the Header component
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          applyTheme(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <MainWrapper className="mainwrapper text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />
      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper className="page-wrapper">
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        <Header
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          toggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        {/* ------------------------------------------- */}
        {/* PageContent */}
        {/* ------------------------------------------- */}
        <Container
          sx={{
            paddingTop: '20px',
            maxWidth: '1200px',
            position: 'relative', // for stacking context over gradient
            zIndex: 10,
          }}
        >
          {/* ------------------------------------------- */}
          {/* Page Route */}
          {/* ------------------------------------------- */}
          <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
            <Outlet />
          </Box>
          {/* ------------------------------------------- */}
          {/* End Page */}
          {/* ------------------------------------------- */}
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
};

export default FullLayout;