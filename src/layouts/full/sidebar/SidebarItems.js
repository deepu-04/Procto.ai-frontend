import React from 'react';
import Menuitems from './MenuItems';
import { useLocation, NavLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const SidebarItems = ({ isCollapsed }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const pathDirect = pathname;

  return (
    <Box sx={{ px: isCollapsed ? 2 : 3 }}>
      <List
        component={motion.ul}
        variants={listVariants}
        initial="hidden"
        animate="show"
        sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}
      >
        <AnimatePresence>
          {Menuitems.map((item, index) => {
            
            // --- DYNAMIC ROLE FILTERING ---
            // If an item specifies roles, check if the current user has access
            if (item.roles && !item.roles.includes(userInfo?.role)) {
              return null;
            }

            // --- SUBHEADERS ---
            if (item.subheader) {
              // Hide subheader if the user doesn't belong to that specific area
              if (userInfo?.role === 'student' && item.subheader === 'Teacher Area') return null;
              if (userInfo?.role === 'teacher' && item.subheader === 'Student Area') return null;

              if (isCollapsed) return <Box key={`div-${index}`} sx={{ my: 1 }} />;

              return (
                <motion.div key={item.subheader} variants={itemVariants}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    sx={{
                      mt: 2,
                      mb: 1,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: '1px',
                    }}
                  >
                    {item.subheader}
                  </Typography>
                </motion.div>
              );
            }

            // --- NORMAL NAV ITEMS ---
            const selected = pathDirect === item.href;

            const buttonContent = (
              <ListItemButton
                component={NavLink}
                to={item.href}
                selected={selected}
                sx={{
                  borderRadius: '16px',
                  py: 1.2,
                  px: isCollapsed ? 0 : 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.3s ease',
                  color: selected ? '#FFFFFF' : '#475569',
                  border: '2px solid transparent',

                  // DARK GLASSMORPHISM + GRADIENT BORDER
                  background: selected
                    ? `linear-gradient(#1A1A24, #1A1A24) padding-box, 
                       linear-gradient(90deg, #00E5FF 0%, #7C3AED 35%, #E11D48 70%, #F97316 100%) border-box`
                    : 'transparent',

                  boxShadow: selected ? '0px 8px 20px rgba(0,0,0,0.15)' : 'none',

                  '&.Mui-selected': {
                    backgroundColor: 'transparent !important',
                  },

                  '&:hover': {
                    background: selected
                      ? `linear-gradient(#252530, #252530) padding-box, 
                         linear-gradient(90deg, #00E5FF 0%, #7C3AED 35%, #E11D48 70%, #F97316 100%) border-box`
                      : 'rgba(20, 20, 25, 0.85)',
                    color: '#FFFFFF',
                    boxShadow: selected
                      ? '0px 10px 25px rgba(124, 58, 237, 0.25)'
                      : '0px 4px 15px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 40,
                    color: 'inherit',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                    <item.icon stroke={selected ? 2.5 : 1.5} size="1.4rem" />
                  </motion.div>
                </ListItemIcon>

                {!isCollapsed && (
                  <ListItemText>
                    <Typography
                      variant="body2"
                      fontWeight={selected ? 600 : 500}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {item.title}
                    </Typography>
                  </ListItemText>
                )}
              </ListItemButton>
            );

            return (
              <motion.div key={item.id || index} variants={itemVariants}>
                <ListItem disablePadding>
                  {isCollapsed ? (
                    <Tooltip title={item.title} placement="right" arrow>
                      <Box sx={{ width: '100%' }}>{buttonContent}</Box>
                    </Tooltip>
                  ) : (
                    buttonContent
                  )}
                </ListItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>
    </Box>
  );
};

export default SidebarItems;