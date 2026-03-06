import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Typography,
  Menu,
  MenuItem,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Divider,
  Checkbox,
  Switch,
  FormControlLabel,
  Avatar,
  Snackbar,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { motion } from 'framer-motion';

import { 
  IconBellRinging, 
  IconMenu, 
  IconUser, 
  IconCheckbox, 
  IconSettings, 
  IconX,
  IconLogout,
  IconPhoto,
  IconTrash,
  IconPlus,
  IconBulb,
  IconMessageCircleOff,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// --- Styled Components for Transparent/Glassmorphic UI ---

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  padding: '16px 24px',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  [theme.breakpoints.down('md')]: {
    padding: '12px 16px',
  },
}));

const FloatingPill = styled(Toolbar)(({ theme }) => ({
  backgroundColor: 'rgba(20, 20, 25, 0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '50px',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 6px 6px 16px !important',
  minHeight: '60px !important',
  width: '100%',
  margin: '0 auto',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(20, 20, 25, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
}));

const ProfilePill = styled(Box)(({ theme }) => ({
  borderRadius: '40px',
  padding: '4px 8px 4px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: '#FFFFFF',
  cursor: 'pointer',
  background: `
    linear-gradient(#1A1A24, #1A1A24) padding-box, 
    linear-gradient(90deg, #00E5FF 0%, #7C3AED 35%, #E11D48 70%, #F97316 100%) border-box
  `,
  border: '2px solid transparent',
  boxShadow: '0px 4px 15px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0px 6px 20px rgba(225, 29, 72, 0.25)',
  },
}));

// Transition for iOS-style Dropdown Notification
function SlideDownTransition(props) {
  return <Slide {...props} direction="down" />;
}

// Pastel colors for tasks
const TASK_COLORS = ['#FEF3C7', '#DBEAFE', '#DCFCE7', '#F3E8FF', '#FFE4E6', '#CCFBF1'];

// --- Helper function to dynamically format time ---
const formatTimeAgo = (ts, currentTimeMs) => {
  if (!ts) return '';
  const timestamp = new Date(ts).getTime();
  if (isNaN(timestamp)) return ''; 

  const secondsPast = Math.floor((currentTimeMs - timestamp) / 1000);

  if (secondsPast < 60) return 'Just now';
  if (secondsPast < 3600) {
    const mins = Math.floor(secondsPast / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (secondsPast < 86400) {
    const hrs = Math.floor(secondsPast / 3600);
    return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  }
  
  const date = new Date(timestamp);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
};

const Header = (props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Responsive break points
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { userInfo } = useSelector((state) => state.auth || {});

  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 10000); 
    return () => clearInterval(timer);
  }, []);

  const [accountData, setAccountData] = useState(() => {
    const saved = localStorage.getItem('procto_account');
    return saved ? JSON.parse(saved) : {
      name: userInfo?.name || 'sameer',
      email: userInfo?.email || 'shaiksameer0407@gmail.com',
      phone: '',
    };
  });

  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('procto_avatar') || "");

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('procto_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Review new application UI', done: false, color: '#DBEAFE' },
      { id: 2, text: 'Complete mandatory compliance training', done: true, color: '#DCFCE7' },
    ];
  });
  const [newTaskText, setNewTaskText] = useState('');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('procto_notifications');
    if (saved) {
      return JSON.parse(saved).map(n => ({ ...n, timestamp: n.timestamp || Date.now() }));
    }
    return [
      { id: 'welcome', title: 'Welcome to Procto.ai!', message: 'Your secure dashboard is ready. Setup your profile to get started.', timestamp: Date.now(), read: false }
    ];
  });
  
  const [aiExamCount, setAiExamCount] = useState(() => {
    return JSON.parse(localStorage.getItem('procto_ai_exams') || '[]').length;
  });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('procto_prefs');
    return saved ? JSON.parse(saved) : { emailAlerts: true, smsAlerts: false, darkMode: true };
  });

  const [localName, setLocalName] = useState(accountData.name);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => { localStorage.setItem('procto_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('procto_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => {
    localStorage.setItem('procto_prefs', JSON.stringify(preferences));
    if (preferences.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [preferences]);

  useEffect(() => {
    const handleStorageChange = () => {
      const currentExams = JSON.parse(localStorage.getItem('procto_ai_exams') || '[]');
      if (currentExams.length > aiExamCount) {
        const latestExam = currentExams[0]; 
        const newNotif = {
          id: Date.now(),
          title: 'AI Exam Created ✨',
          message: `Your custom exam for "${latestExam.jobDescription || 'Custom Role'}" is ready to take.`,
          timestamp: Date.now(),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
        setAiExamCount(currentExams.length);
        setToast({ open: true, message: 'New AI Exam generated successfully!', type: 'success' });
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 1000);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [aiExamCount]);

  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const isNotifOpen = Boolean(notifAnchorEl);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileOpen = Boolean(profileAnchorEl);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const handleNotifClick = (e) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleProfileClick = (e) => setProfileAnchorEl(e.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);

  const openSettings = (tab) => {
    setActiveTab(tab);
    setSettingsOpen(true);
    handleProfileClose(); 
  };

  const handleLogout = () => {
    handleProfileClose();
    localStorage.removeItem('userInfo');
    navigate('/');
  };

  const handleAccountChange = (e) => setAccountData({ ...accountData, [e.target.name]: e.target.value });

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const initiateSaveAccount = () => setConfirmOpen(true);
  const confirmSaveAccount = () => {
    setLocalName(accountData.name);
    localStorage.setItem('procto_account', JSON.stringify(accountData));
    localStorage.setItem('procto_avatar', avatarUrl);
    setConfirmOpen(false);
    setSettingsOpen(false);
    setToast({ open: true, message: 'Account details saved successfully!', type: 'success' });
  };

  const initiateDeleteAccount = () => setDeleteConfirmOpen(true);
  const confirmDeleteAccount = () => {
    localStorage.clear();
    setDeleteConfirmOpen(false);
    setSettingsOpen(false);
    handleProfileClose();
    navigate('/');
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const randomColor = TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
    setTasks([{ id: Date.now(), text: newTaskText, done: false, color: randomColor }, ...tasks]);
    setNewTaskText('');
    setToast({ open: true, message: 'Task Created', type: 'add' });
  };

  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => { setTasks(tasks.filter(t => t.id !== id)); setToast({ open: true, message: 'Task Deleted', type: 'delete' }); };
  const togglePreference = (pref) => setPreferences({ ...preferences, [pref]: !preferences[pref] });

  const markAllNotificationsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const clearAllNotifications = () => setNotifications([]);

  const handleNotificationClick = (notifId) => {
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
    handleNotifClose();
    navigate('/candidate/ai-exam'); 
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayIdentifier = localName || userInfo?.email || 'Student';

  const isDark = preferences.darkMode;
  const bgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#F2F2F7' : '#0F172A';
  const textMuted = isDark ? '#8E8E93' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const hoverColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const listBgColor = isDark ? '#2C2C2E' : '#F8FAFC';

  const getToastStyle = () => {
    switch (toast.type) {
      case 'add': return { icon: <IconPlus size={18} color="#34C759" />, color: '#34C759' }; 
      case 'delete': return { icon: <IconTrash size={18} color="#FF3B30" />, color: '#FF3B30' }; 
      case 'success': default: return { icon: <IconCheck size={18} color="#007AFF" />, color: '#007AFF' }; 
    }
  };

  return (
    <>
      <AppBarStyled position="sticky" color="default">
        <FloatingPill>
          <Box display="flex" alignItems="center">
            <IconButton
              aria-label="menu"
              onClick={props.toggleMobileSidebar}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF',
                display: { lg: 'none', xs: 'inline-flex' }, backdropFilter: 'blur(4px)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <IconMenu width="20" height="20" />
            </IconButton>

            <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, color: '#E2E8F0', fontWeight: 600, ml: 1 }}>
              Welcome back,{' '}
              <Box component="span" sx={{ textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#7C3AED' }}>
                {_.startCase(localName)}
              </Box>
            </Typography>
          </Box>

          <Box flexGrow={1} />

          <Stack spacing={2} direction="row" alignItems="center">
            <motion.div animate={shouldShake ? { rotate: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
              <IconButton size="medium" onClick={handleNotifClick} sx={{ color: '#FFFFFF', transition: 'all 0.2s', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}>
                <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { backgroundColor: '#FF5F56', boxShadow: '0 0 0 2px rgba(20, 20, 25, 0.8)', fontWeight: 'bold' } }}>
                  <IconBellRinging size="22" stroke="1.5" />
                </Badge>
              </IconButton>
            </motion.div>

            <ProfilePill onClick={handleProfileClick}>
              <Typography variant="body2" fontWeight="600" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {displayIdentifier}
              </Typography>
              <Avatar src={avatarUrl} alt={localName} sx={{ width: 32, height: 32, bgcolor: '#7C3AED' }}>
                {localName.charAt(0).toUpperCase()}
              </Avatar>
            </ProfilePill>
          </Stack>
        </FloatingPill>

        {/* PROFILE MENU */}
        <Menu
          anchorEl={profileAnchorEl} open={isProfileOpen} onClose={handleProfileClose}
          TransitionComponent={Fade} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 2, width: 250, borderRadius: 3, boxShadow: isDark ? '0px 10px 40px rgba(0,0,0,0.5)' : '0px 10px 40px rgba(0,0,0,0.1)', border: `1px solid ${borderColor}`, bgcolor: bgColor, color: textColor } }}
        >
          <Box px={2} py={1.5} display="flex" alignItems="center" gap={2}>
            <Avatar src={avatarUrl} sx={{ width: 40, height: 40, bgcolor: '#7C3AED' }}>{localName.charAt(0).toUpperCase()}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>{_.startCase(localName)}</Typography>
              <Typography variant="caption" color={textMuted}>{accountData.email}</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 0.5, borderColor }} />
          <MenuItem onClick={() => openSettings('account')} sx={{ py: 1.5, '&:hover': { bgcolor: hoverColor } }}><ListItemIcon><IconUser size="20" color={textMuted} /></ListItemIcon>My Profile</MenuItem>
          <MenuItem onClick={() => openSettings('account')} sx={{ py: 1.5, '&:hover': { bgcolor: hoverColor } }}><ListItemIcon><IconSettings size="20" color={textMuted} /></ListItemIcon>Account Settings</MenuItem>
          <MenuItem onClick={() => openSettings('tasks')} sx={{ py: 1.5, '&:hover': { bgcolor: hoverColor } }}><ListItemIcon><IconCheckbox size="20" color={textMuted} /></ListItemIcon>My Tasks</MenuItem>
          <Divider sx={{ my: 0.5, borderColor }} />
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#E11D48', '&:hover': { bgcolor: isDark ? 'rgba(225, 29, 72, 0.1)' : '#FFE4E6' } }}><ListItemIcon><IconLogout size="20" color="#E11D48" /></ListItemIcon>Log Out</MenuItem>
        </Menu>

        {/* NOTIFICATIONS MENU */}
        <Menu
          anchorEl={notifAnchorEl} open={isNotifOpen} onClose={handleNotifClose}
          TransitionComponent={Fade} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 2.5, width: 340, maxWidth: '90vw', borderRadius: 4, boxShadow: isDark ? '0px 20px 50px rgba(0,0,0,0.6)' : '0px 20px 50px rgba(0,0,0,0.15)', border: `1px solid ${borderColor}`, p: 0, overflow: 'hidden', bgcolor: bgColor, color: textColor } }}
        >
          <Box p={2.5} borderBottom={`1px solid ${borderColor}`} display="flex" justifyContent="space-between" alignItems="center" bgcolor={listBgColor}>
            <Typography variant="subtitle1" fontWeight="800" color={textColor}>Notifications</Typography>
            <Box display="flex" gap={2} alignItems="center">
              {unreadCount > 0 && <Typography variant="caption" fontWeight="bold" color="#3B82F6" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={markAllNotificationsRead}>Mark read</Typography>}
              {notifications.length > 0 && <Typography variant="caption" fontWeight="bold" color="#EF4444" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={clearAllNotifications}>Clear all</Typography>}
            </Box>
          </Box>
          <List sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <Box p={4} textAlign="center" display="flex" flexDirection="column" alignItems="center">
                <IconMessageCircleOff size="32" color={textMuted} style={{ marginBottom: '8px' }} />
                <Typography variant="body2" color={textMuted}>No new notifications</Typography>
              </Box>
            ) : (
              notifications.map((notif, index) => (
                <React.Fragment key={notif.id}>
                  <ListItem button onClick={() => handleNotificationClick(notif.id)} sx={{ py: 2, px: 2.5, bgcolor: notif.read ? 'transparent' : (isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'), transition: 'background 0.2s', '&:hover': { bgcolor: hoverColor } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ w: 10, h: 10, p: 1, borderRadius: '50%', bgcolor: notif.read ? (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0') : '#3B82F6', color: notif.read ? textMuted : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {notif.title.includes('AI') ? <IconBulb size={18} /> : <IconBellRinging size={18} />}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={notif.read ? "600" : "800"} color={textColor}>{notif.title}</Typography>
                          <Typography variant="caption" color={textMuted} fontWeight="500">{formatTimeAgo(notif.timestamp, currentTimeMs)}</Typography>
                        </Box>
                      }
                      secondary={<Typography variant="body2" color={textMuted} mt={0.5} sx={{ lineHeight: 1.4 }}>{notif.message}</Typography>}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider sx={{ borderColor }} />}
                </React.Fragment>
              ))
            )}
          </List>
        </Menu>
      </AppBarStyled>

      {/* ================= FULLY RESPONSIVE PROFILE SETTINGS MODAL ================= */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3, 
            height: { xs: '90vh', sm: '70vh' }, 
            minHeight: '500px',
            bgcolor: bgColor, color: textColor, overflow: 'hidden',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
            m: { xs: 1, sm: 2 } // Adds a tiny margin on mobile so it doesn't hit absolute screen edges
          },
        }}
      >
        {/* Changed layout direction based on screen size */}
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} height="100%">
          
          {/* Top/Left Sidebar Navigation */}
          <Box sx={{ 
            width: { xs: '100%', sm: 250 }, 
            bgcolor: listBgColor, 
            borderRight: { xs: 'none', sm: `1px solid ${borderColor}` }, 
            borderBottom: { xs: `1px solid ${borderColor}`, sm: 'none' }, 
            display: 'flex', flexDirection: 'column' 
          }}>
            <Box p={{ xs: 2, sm: 3 }} borderBottom={{ xs: 'none', sm: `1px solid ${borderColor}` }}>
              <Typography variant="h6" fontWeight="bold" color={textColor}>Settings</Typography>
            </Box>
            
            {/* Scrollable Horizontal List on Mobile, Vertical on Desktop */}
            <List sx={{ 
              p: 1, 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'column' }, 
              overflowX: { xs: 'auto', sm: 'visible' },
              '&::-webkit-scrollbar': { display: 'none' } // Hide scrollbar on mobile
            }}>
              {[
                { id: 'account', label: 'Account', icon: <IconUser size="20" /> },
                { id: 'tasks', label: 'Tasks', icon: <IconCheckbox size="20" /> },
                { id: 'preferences', label: 'Prefs', icon: <IconSettings size="20" /> },
              ].map((item) => (
                <ListItem
                  button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2, 
                    mb: { xs: 0, sm: 0.5 },
                    mr: { xs: 1, sm: 0 }, // Spacing between tabs on mobile
                    bgcolor: activeTab === item.id ? (isDark ? '#3A3A3C' : '#E2E8F0') : 'transparent',
                    '&:hover': { bgcolor: isDark ? '#3A3A3C' : '#E2E8F0' },
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    minWidth: { xs: 'auto', sm: '100%' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, display: 'flex', justifyContent: 'center', color: activeTab === item.id ? textColor : textMuted }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: activeTab === item.id ? 600 : 500,
                      color: activeTab === item.id ? textColor : textMuted,
                      display: { xs: activeTab === item.id ? 'block' : 'none', sm: 'block' } // Only show text of active tab on mobile to save space
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Right Content Area */}
          <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
            <Box p={{ xs: 2, sm: 3 }} display="flex" justifyContent="space-between" alignItems="center" borderBottom={`1px solid ${borderColor}`}>
              <Typography variant="h6" fontWeight="bold" color={textColor} textTransform="capitalize">
                {activeTab.replace('-', ' ')}
              </Typography>
              <IconButton onClick={() => setSettingsOpen(false)} size="small">
                <IconX size="20" color={textMuted} />
              </IconButton>
            </Box>

            {/* Scrollable Content Pane */}
            <Box p={{ xs: 2, sm: 4 }} flex={1} overflow="auto">
              
              {/* --- MY ACCOUNT TAB --- */}
              {activeTab === 'account' && (
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" alignItems="center" gap={3} mb={4}>
                    <Badge
                      overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <IconButton component="label" sx={{ bgcolor: '#7C3AED', color: 'white', width: 30, height: 30, border: `2px solid ${bgColor}`, '&:hover': { bgcolor: '#6D28D9' } }}>
                          <IconPhoto size={16} />
                          <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                        </IconButton>
                      }
                    >
                      <Avatar src={avatarUrl} sx={{ width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, fontSize: { xs: 24, sm: 32 }, bgcolor: '#7C3AED' }}>
                        {accountData.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color={textColor}>Profile Picture</Typography>
                      <Typography variant="body2" color={textMuted}>Upload a new avatar</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 4, borderColor }} />

                  <Typography variant="body2" color={textMuted} mb={3}>
                    Manage your personal information and contact details.
                  </Typography>
                  <Stack spacing={3} mb={5}>
                    <TextField 
                      label="Full Name" name="name" value={accountData.name} onChange={handleAccountChange} fullWidth variant="outlined" size="small" 
                      InputLabelProps={{ style: { color: textMuted } }} InputProps={{ style: { color: textColor } }} sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
                    />
                    <TextField 
                      label="Email Address" name="email" value={accountData.email} onChange={handleAccountChange} fullWidth variant="outlined" size="small" 
                      InputLabelProps={{ style: { color: textMuted } }} InputProps={{ style: { color: textColor } }} sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
                    />
                    <TextField 
                      label="Phone Number" name="phone" value={accountData.phone} onChange={handleAccountChange} fullWidth variant="outlined" size="small" placeholder="+1 (555) 000-0000" 
                      InputLabelProps={{ style: { color: textMuted } }} InputProps={{ style: { color: textColor } }} sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor } }}
                    />
                    <Button variant="contained" onClick={initiateSaveAccount} sx={{ alignSelf: 'flex-start', bgcolor: '#7C3AED', width: { xs: '100%', sm: 'auto' }, '&:hover': { bgcolor: '#6D28D9' } }}>
                      Save Changes
                    </Button>
                  </Stack>

                  {/* DELETE ACCOUNT SECTION */}
                  <Divider sx={{ mb: 4, borderColor }} />
                  <Box p={{ xs: 2, sm: 3 }} sx={{ borderRadius: 2, border: '1px solid rgba(239, 68, 68, 0.3)', bgcolor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#FEF2F2' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="#EF4444" display="flex" alignItems="center" gap={1}>
                      <IconAlertTriangle size="20" /> Danger Zone
                    </Typography>
                    <Typography variant="body2" color={textMuted} mt={1} mb={2}>
                      Once you delete your account, there is no going back.
                    </Typography>
                    <Button 
                      variant="outlined" color="error" onClick={initiateDeleteAccount} fullWidth={isMobile}
                      sx={{ fontWeight: 'bold', textTransform: 'none', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              )}

              {/* --- MY TASKS TAB --- */}
              {activeTab === 'tasks' && (
                <Box>
                  <Typography variant="body2" color={textMuted} mb={3}>
                    Keep track of your pending and completed tasks.
                  </Typography>

                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={4}>
                    <TextField 
                      fullWidth size="small" placeholder="Add a new task..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      InputProps={{ style: { color: textColor } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, borderColor } }}
                    />
                    <Button variant="contained" onClick={handleAddTask} sx={{ bgcolor: isDark ? '#3B82F6' : '#0F172A', borderRadius: 2, minWidth: { xs: '100%', sm: '100px' }, '&:hover': { bgcolor: isDark ? '#2563EB' : '#334155' } }} startIcon={<IconPlus size={18} />}>
                      Add
                    </Button>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {tasks.map((task) => (
                      <ListItem key={task.id} sx={{ bgcolor: (isDark && !task.color?.startsWith('rgba')) ? 'rgba(255,255,255,0.05)' : (task.color || '#F8FAFC'), borderRadius: 3, mb: 1.5, boxShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)', border: `1px solid ${borderColor}`, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.01)' } }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Checkbox edge="start" checked={task.done} onChange={() => toggleTask(task.id)} sx={{ color: textMuted, '&.Mui-checked': { color: isDark ? '#3B82F6' : '#0F172A' } }} />
                        </ListItemIcon>
                        <ListItemText primary={task.text} sx={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? textMuted : textColor, '& .MuiTypography-root': { fontWeight: 500, fontSize: { xs: '0.9rem', sm: '1rem' } } }} />
                        <IconButton onClick={() => deleteTask(task.id)} size="small" sx={{ color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.1)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' } }}><IconTrash size={18} /></IconButton>
                      </ListItem>
                    ))}
                    {tasks.length === 0 && <Typography variant="body2" color={textMuted} textAlign="center" mt={4}>No tasks available. Add one above!</Typography>}
                  </List>
                </Box>
              )}

              {/* --- PREFERENCES TAB --- */}
              {activeTab === 'preferences' && (
                <Box>
                  <Typography variant="body2" color={textMuted} mb={3}>
                    Customize your experience and notification settings.
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch checked={preferences.darkMode} onChange={() => togglePreference('darkMode')} color="primary" />}
                      label={<Box><Typography fontWeight="500" color={textColor}>Dark Mode</Typography><Typography variant="caption" color={textMuted}>Apply a dark theme.</Typography></Box>}
                      sx={{ m: 0, justifyContent: 'space-between', width: '100%' }} labelPlacement="start"
                    />
                    <Divider sx={{ borderColor }} />
                    <FormControlLabel
                      control={<Switch checked={preferences.emailAlerts} onChange={() => togglePreference('emailAlerts')} color="primary" />}
                      label={<Box><Typography fontWeight="500" color={textColor}>Email Alerts</Typography><Typography variant="caption" color={textMuted}>Get daily updates.</Typography></Box>}
                      sx={{ m: 0, justifyContent: 'space-between', width: '100%' }} labelPlacement="start"
                    />
                    <Divider sx={{ borderColor }} />
                    <FormControlLabel
                      control={<Switch checked={preferences.smsAlerts} onChange={() => togglePreference('smsAlerts')} color="primary" />}
                      label={<Box><Typography fontWeight="500" color={textColor}>SMS Alerts</Typography><Typography variant="caption" color={textMuted}>Text messages for logins.</Typography></Box>}
                      sx={{ m: 0, justifyContent: 'space-between', width: '100%' }} labelPlacement="start"
                    />
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* ================= SAVE ACCOUNT CONFIRMATION ================= */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, m: 2, bgcolor: bgColor, color: textColor } }}>
        <DialogTitle fontWeight="bold">Proceed with changes?</DialogTitle>
        <DialogContent><DialogContentText sx={{ color: textMuted }}>You are about to update your account details. Proceed?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: textMuted }}>Cancel</Button>
          <Button onClick={confirmSaveAccount} variant="contained" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Proceed</Button>
        </DialogActions>
      </Dialog>

      {/* ================= DELETE ACCOUNT CONFIRMATION ================= */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1, m: 2, bgcolor: isDark ? '#2C2C2E' : '#FFFFFF', color: textColor, border: '1px solid rgba(239, 68, 68, 0.5)' } }}>
        <DialogTitle fontWeight="bold" sx={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 1 }}><IconAlertTriangle size="24" /> Delete Account</DialogTitle>
        <DialogContent><DialogContentText sx={{ color: textMuted, fontWeight: 500 }}>Are you sure? This action <strong>cannot</strong> be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: textMuted, fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}>Keep My Account</Button>
          <Button onClick={confirmDeleteAccount} variant="contained" color="error" sx={{ fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}>Yes, Delete Everything</Button>
        </DialogActions>
      </Dialog>

      {/* ================= iOS TOAST ================= */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} TransitionComponent={SlideDownTransition}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', color: textColor, px: 2.5, py: 1.2, borderRadius: '50px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: `1px solid ${borderColor}`, mt: { xs: 7, sm: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: '50%', p: 0.5 }}>{getToastStyle().icon}</Box>
          <Typography variant="body2" fontWeight="600" sx={{ letterSpacing: '-0.3px', color: getToastStyle().color }}>{toast.message}</Typography>
        </Box>
      </Snackbar>
    </>
  );
};

Header.propTypes = { toggleMobileSidebar: PropTypes.func.isRequired };
export default Header;