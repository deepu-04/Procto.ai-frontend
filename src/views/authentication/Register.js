import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Stack,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Snackbar,
  Slide,
  CircularProgress,
  InputBase,
  InputAdornment,
  IconButton,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Dialog,
} from '@mui/material';
import { motion } from 'framer-motion';
import { keyframes } from '@mui/system';

// --- Firebase Authentication ---
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup, 
  getAdditionalUserInfo 
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase'; 

// --- EmailJS Integration ---
import emailjs from '@emailjs/browser';

// --- Proctoring & UI Icons ---
import {
  VideocamOutlined,
  VisibilityOutlined,
  SecurityOutlined,
  MicNoneOutlined,
  ComputerOutlined,
  SmartToyOutlined,
  FaceRetouchingNaturalOutlined,
  GpsFixedOutlined,
  CheckCircleOutline,
  CancelOutlined,
  Visibility,
  VisibilityOff,
  ArrowForwardIosRounded,
  SchoolOutlined,
  MenuBookOutlined
} from '@mui/icons-material';

import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';

import { useFormik } from 'formik';
import * as yup from 'yup';

import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './../../slices/authSlice';

import axiosInstance from '../../axios'; 

/* ================== ANIMATIONS ================== */
const spin = keyframes`
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;
const reverseSpin = keyframes`
  100% { transform: translate(-50%, -50%) rotate(-360deg); }
`;

/* ================== VALIDATION ================== */
const schema = yup.object({
  name: yup.string().min(2, 'Too short').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 chars').required('Password is required'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
  role: yup.string().oneOf(['student', 'teacher']).required('Select a role'),
});

function SlideDownTransition(props) {
  return <Slide {...props} direction="down" />;
}

/* ================== SWIPE TO LOGIN COMPONENT (iOS STYLE) ================== */
const SwipeToLogin = ({ onSwipeSuccess, isLoading }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const THUMB_SIZE = 50;
  const PADDING = 4;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const dragLimit = width > 0 ? width - THUMB_SIZE - PADDING * 2 : 0;

  const handleDragEnd = (event, info) => {
    if (info.offset.x >= dragLimit * 0.75) {
      setSwiped(true);
      onSwipeSuccess();
    }
  };

  useEffect(() => {
    if (!isLoading && swiped) {
      setSwiped(false);
    }
  }, [isLoading, swiped]);

  return (
    <Box 
      ref={containerRef} 
      sx={{ 
        position: 'relative', width: '100%', height: 58, 
        borderRadius: '29px', bgcolor: '#F3F4F6', 
        border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', 
        display: 'flex', alignItems: 'center', mt: 1
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', left: `${THUMB_SIZE + PADDING}px`, right: '16px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          opacity: swiped || isLoading ? 0 : 1, transition: 'opacity 0.3s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.1, 0.8, 0.1], x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
              style={{ marginLeft: i === 0 ? 0 : '-8px', display: 'flex' }}
            >
              <ArrowForwardIosRounded sx={{ fontSize: 16, color: '#94A3B8' }} />
            </motion.div>
          ))}
        </Box>
        <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.95rem' }, whiteSpace: 'nowrap' }}>
          Swipe to register with Google
        </Typography>
      </Box>
      
      <motion.div
        drag={!swiped && !isLoading && width > 0 ? "x" : false}
        dragConstraints={{ left: 0, right: dragLimit > 0 ? dragLimit : 0 }}
        dragSnapToOrigin={!swiped}
        onDragEnd={handleDragEnd}
        animate={{ x: swiped || isLoading ? dragLimit : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: '50%',
          backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: swiped ? 'default' : 'grab', position: 'absolute', left: PADDING, zIndex: 2
        }}
        whileDrag={{ cursor: 'grabbing', scale: 0.95 }}
      >
        {isLoading ? (
          <CircularProgress size={22} sx={{ color: '#007AFF' }} />
        ) : (
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: '24px', height: '24px' }}>
            <g>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </g>
          </svg>
        )}
      </motion.div>
    </Box>
  );
};

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const authState = useSelector((s) => s.auth);
  const userInfo = authState?.userInfo || null;

  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ open: true, message, type });
  };

  // 🔥 THE DASHBOARD ROUTER: Safely returns exactly where the user needs to go
  const getDashboardPath = (role) => {
    if (role === 'teacher') return '/admin';
    return '/dashboard'; // Default Student path
  };

  // Automatically redirect if already logged in based on state
  useEffect(() => {
    if (userInfo?.token && userInfo?.role) {
      navigate(getDashboardPath(userInfo.role), { replace: true });
    }
  }, [userInfo, navigate]);

  const sendWelcomeEmail = async (userEmail, userName) => {
    try {
      const templateParams = {
        email: userEmail,
        name: userName || 'User',
      };
      await emailjs.send('service_oyq61no', 'template_jkm48u1', templateParams, 'wu6wPVpFFpcdRqWHo');
    } catch (error) {
      console.error("Failed to send welcome email via EmailJS.", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'student', 
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: values.name });

        const res = await axiosInstance.post('/api/users/register', {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role
        });
        
        const backendToken = res.data.token; 
        
        await sendWelcomeEmail(user.email, values.name);

        const userPayload = {
          uid: user.uid, 
          email: user.email, 
          name: values.name,
          role: values.role,
          token: backendToken 
        };

        localStorage.setItem('token', backendToken);
        localStorage.setItem('userInfo', JSON.stringify(userPayload));
        dispatch(setCredentials(userPayload));

        showToast(`Welcome ${values.role === 'teacher' ? 'Teacher' : 'Student'}! 🎉`, 'success');
        navigate(getDashboardPath(values.role), { replace: true });
        
      } catch (err) {
        const errMsg = err?.response?.data?.message || err.code?.replace('auth/', '').replace(/-/g, ' ') || 'Registration failed';
        showToast(errMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleGoogleSwipeInitiate = () => {
    setIsGoogleLoading(true);
    setRoleDialogOpen(true); 
  };

  const cancelGoogleLogin = () => {
    setRoleDialogOpen(false);
    setIsGoogleLoading(false); 
  };

  const executeGoogleLogin = async (selectedRole) => {
    setRoleDialogOpen(false); 

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const details = getAdditionalUserInfo(result);
      
      if (details && details.isNewUser) {
        await sendWelcomeEmail(user.email, user.displayName);
      }

      // Hit the unified backend route
      const res = await axiosInstance.post('/api/users/google', {
        name: user.displayName,
        email: user.email,
        uid: user.uid, 
        role: selectedRole
      });
      
      const backendToken = res.data.token;

      // 🔥 FIX: Always use the role returned by the backend!
      // This strictly prevents a Teacher from getting stuck in a Student dashboard loop.
      const trueRole = res.data.role || selectedRole;

      const userPayload = {
        uid: user.uid, 
        email: user.email, 
        name: user.displayName,
        avatar: user.photoURL,
        role: trueRole, 
        token: backendToken
      };

      localStorage.setItem('token', backendToken);
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      dispatch(setCredentials(userPayload));

      if (trueRole !== selectedRole && !details.isNewUser) {
         showToast(`Logged in successfully! (Note: Your account is registered as a ${trueRole})`, 'success');
      } else {
         showToast(`Logged in successfully!`, 'success');
      }

      // Safely route the user
      navigate(getDashboardPath(trueRole), { replace: true });
      
    } catch (error) {
      const errMsg = error.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled' : 'Google Sign-In failed.';
      showToast(errMsg, 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const OrbitRing = ({ size, duration, icons }) => (
    <Box
      sx={{
        position: 'absolute', top: '50%', left: '50%',
        width: size, height: size,
        transform: 'translate(-50%, -50%)',
        border: '1px dashed rgba(59, 130, 246, 0.3)', 
        borderRadius: '50%',
        animation: `${spin} ${duration}s linear infinite`,
      }}
    >
      {icons.map((iconObj, index) => {
        const angle = (index / icons.length) * 360;
        const x = Math.cos((angle * Math.PI) / 180) * (size / 2);
        const y = Math.sin((angle * Math.PI) / 180) * (size / 2);

        return (
          <Box
            key={index}
            sx={{
              position: 'absolute', top: `calc(50% + ${y}px)`, left: `calc(50% + ${x}px)`,
              transform: 'translate(-50%, -50%)', width: 32, height: 32,
              bgcolor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#007AFF',
              animation: `${reverseSpin} ${duration}s linear infinite`,
            }}
          >
            {iconObj.component}
          </Box>
        );
      })}
    </Box>
  );

  return (
    <PageContainer title="Register" description="Create an account on Procto.ai">
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideDownTransition}
      >
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            color: '#0F172A', px: 2.5, py: 1.2, mt: 2,
            borderRadius: '50px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid rgba(0,0,0,0.05)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: toast.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,199,89,0.1)', borderRadius: '50%', p: 0.5 }}>
            {toast.type === 'error' ? <CancelOutlined sx={{ fontSize: 20, color: '#EF4444' }} /> : <CheckCircleOutline sx={{ fontSize: 20, color: '#34C759' }} />}
          </Box>
          <Typography variant="body2" fontWeight="600" sx={{ letterSpacing: '-0.3px', textTransform: 'capitalize' }}>
            {toast.message}
          </Typography>
        </Box>
      </Snackbar>

      <Dialog 
        open={roleDialogOpen} 
        onClose={cancelGoogleLogin}
        PaperProps={{
          sx: {
            borderRadius: '24px', p: 3, width: '100%', maxWidth: '360px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            textAlign: 'center', m: 2
          }
        }}
      >
        <Typography variant="h6" fontWeight="800" color="#1E293B" mb={1}>Select Account Type</Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          How will you be using Procto.ai?
        </Typography>
        
        <Stack spacing={2}>
          <Button 
            variant="outlined" 
            onClick={() => executeGoogleLogin('student')}
            startIcon={<SchoolOutlined />}
            sx={{ py: 1.5, borderRadius: '16px', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 'bold', textTransform: 'none', '&:hover': { borderColor: '#007AFF', bgcolor: '#F0F7FF' } }}
          >
            I am a Student
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => executeGoogleLogin('teacher')}
            startIcon={<MenuBookOutlined />}
            sx={{ py: 1.5, borderRadius: '16px', borderColor: '#E2E8F0', color: '#0F172A', fontWeight: 'bold', textTransform: 'none', '&:hover': { borderColor: '#007AFF', bgcolor: '#F0F7FF' } }}
          >
            I am a Teacher
          </Button>
        </Stack>

        <Button onClick={cancelGoogleLogin} sx={{ mt: 3, color: '#94A3B8', textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
      </Dialog>

      <Box
        sx={{
          minHeight: '100dvh', 
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F4F7FC 0%, #E9F0FA 100%)', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '960px', position: 'relative', zIndex: 2 }}
        >
          <Card
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              borderRadius: '36px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
              background: '#FFFFFF',
              minHeight: { xs: 'auto', md: '600px' }, 
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: { xs: 4, md: 5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Stack spacing={2} maxWidth={400} mx="auto" w="100%">
                <Box display="flex" justifyContent="center" mb={0}>
                  <Logo />
                </Box>

                <Box textAlign="center" mb={1}>
                  <Typography variant="h5" fontWeight="800" color="#1E293B">
                    Create an account
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={0.5}>
                    Enter your details to securely access Procto.ai
                  </Typography>
                </Box>

                <form onSubmit={formik.handleSubmit}>
                  <Stack spacing={2}>
                    
                    <Box>
                      <Typography variant="caption" fontWeight="700" color="#1E293B" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Full Name</Typography>
                      <InputBase
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        sx={{
                          bgcolor: '#F4F6F8', borderRadius: '16px', px: 2.5, py: 1.2, fontSize: '0.95rem', color: '#1E293B',
                          border: formik.touched.name && formik.errors.name ? '1px solid #EF4444' : '1px solid transparent',
                          transition: 'all 0.2s ease',
                          '&.Mui-focused': { bgcolor: '#FFFFFF', border: '1px solid #007AFF', boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.15)' }
                        }}
                      />
                      {formik.touched.name && formik.errors.name && (
                        <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0.5, display: 'block' }}>{formik.errors.name}</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="caption" fontWeight="700" color="#1E293B" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Email</Typography>
                      <InputBase
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        fullWidth
                        sx={{
                          bgcolor: '#F4F6F8', borderRadius: '16px', px: 2.5, py: 1.2, fontSize: '0.95rem', color: '#1E293B',
                          border: formik.touched.email && formik.errors.email ? '1px solid #EF4444' : '1px solid transparent',
                          transition: 'all 0.2s ease',
                          '&.Mui-focused': { bgcolor: '#FFFFFF', border: '1px solid #007AFF', boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.15)' }
                        }}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0.5, display: 'block' }}>{formik.errors.email}</Typography>
                      )}
                    </Box>

                    <Box display="flex" gap={2}>
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight="700" color="#1E293B" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Password</Typography>
                        <InputBase
                          id="password"
                          name="password"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Password"
                          value={formik.values.password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          fullWidth
                          endAdornment={
                            <InputAdornment position="end" sx={{ mr: 0 }}>
                              <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                                {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          }
                          sx={{
                            bgcolor: '#F4F6F8', borderRadius: '16px', pl: 2.5, pr: 1, py: 1.2, fontSize: '0.95rem', color: '#1E293B',
                            border: formik.touched.password && formik.errors.password ? '1px solid #EF4444' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                            '&.Mui-focused': { bgcolor: '#FFFFFF', border: '1px solid #007AFF', boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.15)' }
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight="700" color="#1E293B" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Confirm</Typography>
                        <InputBase
                          id="confirm_password"
                          name="confirm_password"
                          type={showPass ? 'text' : 'password'}
                          placeholder="Confirm"
                          value={formik.values.confirm_password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          fullWidth
                          sx={{
                            bgcolor: '#F4F6F8', borderRadius: '16px', px: 2.5, py: 1.2, fontSize: '0.95rem', color: '#1E293B',
                            border: formik.touched.confirm_password && formik.errors.confirm_password ? '1px solid #EF4444' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                            '&.Mui-focused': { bgcolor: '#FFFFFF', border: '1px solid #007AFF', boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.15)' }
                          }}
                        />
                      </Box>
                    </Box>
                    {(formik.touched.password && formik.errors.password) || (formik.touched.confirm_password && formik.errors.confirm_password) ? (
                      <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0, display: 'block' }}>
                        {formik.errors.password || formik.errors.confirm_password}
                      </Typography>
                    ) : null}

                    <FormControl component="fieldset" sx={{ mt: 0.5, ml: 1 }}>
                      <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                        Register as
                      </FormLabel>
                      <RadioGroup
                        row
                        value={formik.values.role}
                        onChange={(e) => formik.setFieldValue('role', e.target.value)}
                      >
                        <FormControlLabel value="student" control={<Radio size="small" sx={{ color: '#007AFF', '&.Mui-checked': { color: '#007AFF' } }}/>} label={<Typography variant="body2" fontWeight="500">Student</Typography>} />
                        <FormControlLabel value="teacher" control={<Radio size="small" sx={{ color: '#007AFF', '&.Mui-checked': { color: '#007AFF' } }}/>} label={<Typography variant="body2" fontWeight="500">Teacher</Typography>} />
                      </RadioGroup>
                    </FormControl>

                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        mt: 1, py: 1.5, borderRadius: '16px', bgcolor: '#007AFF',
                        color: '#fff', fontWeight: 'bold', textTransform: 'none', fontSize: '15px',
                        boxShadow: 'none', '&:hover': { bgcolor: '#0056b3', boxShadow: 'none' },
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                    </Button>
                  </Stack>
                </form>

                <Box mt={0}>
                  <Divider sx={{ mb: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                    Or register with
                  </Divider>
                  <SwipeToLogin 
                    onSwipeSuccess={handleGoogleSwipeInitiate} 
                    isLoading={isGoogleLoading} 
                  />
                </Box>

                <Stack direction="row" spacing={1} justifyContent="center" mt={0.5}>
                  <Typography color="textSecondary" variant="body2">
                    Already have an account?
                  </Typography>
                  <Typography
                    component={Link}
                    to="/auth/login"
                    fontWeight="600"
                    variant="body2"
                    sx={{ textDecoration: 'none', color: '#007AFF' }}
                  >
                    Login here
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {isMdUp && (
              <Box
                sx={{
                  flex: 1.15,
                  background: 'linear-gradient(135deg, #EBF4FF 0%, #F5F9FF 100%)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 5,
                  overflow: 'hidden',
                }}
              >
                <Typography variant="h6" fontWeight="800" color="#0F172A" sx={{ zIndex: 2, position: 'absolute', top: 40 }}>
                  Secure Proctoring Everywhere
                </Typography>

                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 2
                  }}
                >
                  <Box
                    sx={{
                      width: 70, height: 70, borderRadius: '50%', bgcolor: '#007AFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 10px 25px rgba(0, 122, 255, 0.4)', zIndex: 10,
                    }}
                  >
                    <Typography variant="h4" color="white" fontWeight="900">
                      p
                    </Typography>
                  </Box>

                  <OrbitRing
                    size={140} duration={15}
                    icons={[
                      { component: <VideocamOutlined fontSize="small" /> },
                      { component: <VisibilityOutlined fontSize="small" /> },
                    ]}
                  />

                  <OrbitRing
                    size={240} duration={25}
                    icons={[
                      { component: <SecurityOutlined fontSize="small" /> },
                      { component: <MicNoneOutlined fontSize="small" /> },
                      { component: <ComputerOutlined fontSize="small" /> },
                    ]}
                  />

                  <OrbitRing
                    size={340} duration={35}
                    icons={[
                      { component: <SmartToyOutlined fontSize="small" /> },
                      { component: <FaceRetouchingNaturalOutlined fontSize="small" /> },
                      { component: <GpsFixedOutlined fontSize="small" /> },
                    ]}
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  textAlign="center"
                  maxWidth="85%"
                  sx={{ zIndex: 2, position: 'absolute', bottom: 40 }}
                >
                  Powered by advanced AI for a smooth, secure, and reliable examination experience
                  anywhere online.
                </Typography>
              </Box>
            )}
          </Card>
        </motion.div>
      </Box>
    </PageContainer>
  );
}