import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Fade,
  IconButton,
} from '@mui/material';

import { IconListCheck, IconMail, IconUser, IconLogout } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';

import { logout } from './../../../slices/authSlice';
import { useLogoutMutation } from './../../../slices/usersApiSlice';

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate('/auth/login');
    } catch (err) {
      console.error(err);
    }
  };

  // Generate a dynamic, premium avatar based on the user's name using DiceBear.
  // The 'micah' style creates highly stylized, modern faces.
  // Because it uses a seed, 'Sameer' will always generate the exact same face.
  const userName = userInfo?.name || 'User';
  const dynamicAvatarUrl =
    userInfo?.avatar ||
    `https://api.dicebear.com/7.x/micah/svg?seed=${userName}&backgroundColor=f8fafc`;

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        aria-controls={Boolean(anchorEl) ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
        sx={{
          p: 0, // Remove default padding for a cleaner look
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)', // Apple-like subtle pop on hover
          },
        }}
      >
        <Avatar
          src={dynamicAvatarUrl}
          alt={userName}
          sx={{
            width: 40,
            height: 40,
            border: '2px solid transparent',
            background:
              'linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #7C3AED, #00E5FF) border-box',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          }}
        />
      </IconButton>

      {/* ------------------------------------------- */}
      {/* Apple-Style Glassmorphic Menu Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade} // Smooth fade in/out
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            mt: 1.5,
            width: 240,
            borderRadius: 4, // Highly rounded corners like iOS
            bgcolor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent
            backdropFilter: 'blur(20px)', // Frost glass effect
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0px 10px 40px rgba(0,0,0,0.12)', // Soft, wide shadow

            // The tiny arrow pointing up to the avatar
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 18,
              width: 12,
              height: 12,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
              borderTop: '1px solid rgba(255, 255, 255, 0.5)',
            },

            // Styling for Menu Items
            '& .MuiMenuItem-root': {
              mx: 1, // Margin on sides to make them look like floating pills
              mb: 0.5,
              borderRadius: 2,
              padding: '8px 16px',
              transition: 'background-color 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        }}
      >
        {/* User Info Header Section */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="700" color="text.primary" noWrap>
            {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {userInfo?.email || 'student@domain.com'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.06)' }} />

        {/* Navigation Items */}
        <MenuItem component={Link} to="/user/profile" onClick={handleClose}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IconUser width={18} height={18} stroke={2} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}>
            My Profile
          </ListItemText>
        </MenuItem>

        <MenuItem component={Link} to="/user/account" onClick={handleClose}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IconMail width={18} height={18} stroke={2} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}>
            My Account
          </ListItemText>
        </MenuItem>

        <MenuItem component={Link} to="/user/tasks" onClick={handleClose}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IconListCheck width={18} height={18} stroke={2} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}>
            My Tasks
          </ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1, borderColor: 'rgba(0,0,0,0.06)' }} />

        {/* Logout Action (Styled distinctly) */}
        <MenuItem
          onClick={() => {
            handleClose();
            logoutHandler();
          }}
          sx={{
            color: '#EF4444', // Destructive red color
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08) !important', // Soft red hover
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
            <IconLogout width={18} height={18} stroke={2.5} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}>
            Log Out
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Profile;
