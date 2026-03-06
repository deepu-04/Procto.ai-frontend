import React, { useState, useEffect } from 'react';
import { useMediaQuery, Box, Drawer, Typography, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Logo from '../shared/logo/Logo';
import SidebarItems from './SidebarItems';

const Sidebar = (props) => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const { userInfo } = useSelector((state) => state.auth || {});

  // --- Dynamic Dark Mode State ---
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Watch for class changes on the HTML tag to sync Dark Mode instantly
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

  // --- Load Profile Data from LocalStorage (Syncs with Header settings) ---
  const [accountData, setAccountData] = useState(() => {
    const saved = localStorage.getItem('procto_account');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('procto_avatar') || userInfo?.avatar || '';
  });

  const displayName = accountData.name || userInfo?.name || 'Student Name';
  const displayInitial = displayName.charAt(0).toUpperCase();

  // Collapse State
  const [isCollapsed, setIsCollapsed] = useState(false);

  const expandedWidth = 280;
  const collapsedWidth = 100;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  // ==========================================
  // DESKTOP SIDEBAR (Floating Card Style)
  // ==========================================
  if (lgUp) {
    return (
      <Box
        sx={{
          width: currentWidth,
          flexShrink: 0,
          transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <Drawer
          anchor="left"
          open={props.isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              width: currentWidth,
              transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxSizing: 'border-box',
              border: 'none',
              bgcolor: 'transparent',
            },
          }}
        >
          {/* Floating Inner Card */}
          <Box
            component={motion.div}
            layout
            sx={{
              height: 'calc(100vh - 32px)', // Leaves 16px gap top and bottom
              m: 2, // Margins to make it float
              bgcolor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderRadius: 4,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
              boxShadow: isDark 
                ? '0px 20px 50px rgba(0,0,0,0.5)' 
                : '0px 20px 50px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
            }}
          >
            {/* Header: Mac Dots as Toggle Button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                p: 2,
                pt: 3,
                px: isCollapsed ? 0 : 3,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Clickable Mac-style Dots */}
              <Box
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                  display: 'flex',
                  gap: 0.8,
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 2,
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                }}
              >
                <Box width={12} height={12} borderRadius="50%" bgcolor="#FF5F56" />
                <Box width={12} height={12} borderRadius="50%" bgcolor="#FFBD2E" />
                <Box width={12} height={12} borderRadius="50%" bgcolor="#27C93F" />
              </Box>
            </Box>

            {/* App Logo & Name */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 0 : 3,
                pb: 2,
                gap: 1.5,
                transition: 'all 0.3s ease',
              }}
            >
              <Logo />
              {!isCollapsed && (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    letterSpacing: '-0.5px',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s ease',
                  }}
                >
                  Procto.ai
                </Typography>
              )}
            </Box>

            {/* Menu Items Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { 
                  backgroundColor: isDark ? '#334155' : '#E2E8F0', 
                  borderRadius: '4px' 
                },
              }}
            >
              <SidebarItems isCollapsed={isCollapsed} />
            </Box>

            {/* Bottom User Profile Section */}
            <Box sx={{ p: 2, mt: 'auto' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: 1.5,
                  bgcolor: isCollapsed ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'),
                  p: isCollapsed ? 1 : 1.5,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                }}
              >
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#7C3AED', // Match the purple theme from header
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {displayInitial}
                </Avatar>

                {!isCollapsed && (
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      noWrap
                      sx={{ color: isDark ? '#FFFFFF' : '#0F172A', transition: 'color 0.3s ease' }}
                    >
                      {displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: isDark ? '#94A3B8' : 'text.secondary', transition: 'color 0.3s ease' }}
                      textTransform="capitalize"
                      noWrap
                      display="block"
                    >
                      {userInfo?.role || 'Student'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Drawer>
      </Box>
    );
  }

  // ==========================================
  // MOBILE SIDEBAR (Temporary Drawer)
  // ==========================================
  return (
    <Drawer
      anchor="left"
      open={props.isMobileSidebarOpen}
      onClose={props.onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: expandedWidth,
          bgcolor: isDark ? '#1C1C1E' : '#FFFFFF',
          boxShadow: (theme) => theme.shadows[8],
          borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : 0,
          transition: 'background-color 0.3s ease',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 3, gap: 1.5 }}>
        <Logo />
        <Typography 
          variant="h6" 
          sx={{ fontWeight: 800, fontSize: '1.3rem', color: isDark ? '#FFFFFF' : '#0F172A', transition: 'color 0.3s ease' }}
        >
          Procto.ai
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <SidebarItems isCollapsed={false} />
      </Box>

      {/* Mobile Profile Area */}
      <Box
        sx={{ 
          p: 3, 
          borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          transition: 'border-color 0.3s ease'
        }}
      >
        <Avatar src={avatarUrl} sx={{ bgcolor: '#7C3AED' }}>
          {displayInitial}
        </Avatar>
        <Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="bold"
            sx={{ color: isDark ? '#FFFFFF' : '#0F172A', transition: 'color 0.3s ease' }}
          >
            {displayName}
          </Typography>
          <Typography 
            variant="caption" 
            textTransform="capitalize"
            sx={{ color: isDark ? '#94A3B8' : 'text.secondary', transition: 'color 0.3s ease' }}
          >
            {userInfo?.role || 'Student'}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;