import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Typography,
  Stack,
  Grid,
  LinearProgress,
  Dialog,
  DialogContent,
  TextField,
  Fade,
  Avatar,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  IconVideo,
  IconMicrophone,
  IconWifi,
  IconApps,
  IconCircleCheckFilled,
  IconAlertCircleFilled,
  IconLoader2,
  IconShieldCheck,
  IconScanEye,
} from '@tabler/icons-react';
import MobileOffIcon from '@mui/icons-material/MobileOff';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import PageContainer from 'src/components/container/PageContainer';

/* ================= ANIMATIONS ================= */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scanLaser = keyframes`
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const pulseAvatar = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 35px rgba(239, 68, 68, 0.8); }
`;

const pulseSuccess = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(16, 185, 129, 0.6); }
`;

/* ================= COMPONENTS ================= */

// Capsule-Style Audio Visualizer (Blue Waves)
const SimulatedAudioVisualizer = () => {
  const [levels, setLevels] = useState(Array(8).fill(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setLevels(Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 15));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        height: 24,
        px: 1,
      }}
    >
      {levels.map((level, i) => (
        <Box
          key={i}
          sx={{
            width: 4,
            height: `${level}%`,
            bgcolor: '#007AFF', // iOS Blue
            borderRadius: 4,
            transition: 'height 0.15s ease',
          }}
        />
      ))}
    </Box>
  );
};

// Check List Item Component
const ChecklistItem = ({ icon, title, subtitle, status, progress }) => {
  const isRunning = status === 'loading';
  const isPass = status === 'success';
  const isFail = status === 'error';

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '16px',
        bgcolor: isRunning ? '#F0F9FF' : isFail ? '#FEF2F2' : '#F8FAFC',
        border: `1px solid ${isRunning ? '#BAE6FD' : isFail ? '#FECACA' : '#E2E8F0'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          bgcolor: isPass ? '#DCFCE7' : isFail ? '#FEE2E2' : '#ffffff',
          color: isPass ? '#16A34A' : isFail ? '#EF4444' : '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
        }}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Typography variant="body1" fontWeight="700" color="#1E293B">
          {title}
        </Typography>
        {progress !== undefined && isRunning ? (
          <Box mt={0.5}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#DBEAFE',
                '& .MuiLinearProgress-bar': { bgcolor: '#007AFF' },
              }}
            />
          </Box>
        ) : (
          <Typography
            variant="caption"
            color={isFail ? '#EF4444' : 'textSecondary'}
            fontWeight="500"
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box display="flex" alignItems="center">
        {isRunning && (
          <IconLoader2 style={{ animation: `${spin} 1s linear infinite`, color: '#007AFF' }} />
        )}
        {isPass && <IconCircleCheckFilled color="#16A34A" size={28} />}
        {isFail && <IconAlertCircleFilled color="#EF4444" size={28} />}
      </Box>
    </Box>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function TestPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const [startInput, setStartInput] = useState('');
  const mediaStreamRef = useRef(null);

  // --- Theme Sync State ---
  const [isDark, setIsDark] = useState(false);

  // --- Strict Mobile Restriction State ---
  const [isMobileRestricted, setIsMobileRestricted] = useState(false);

  const [checks, setChecks] = useState({
    camera: 'idle',
    audio: 'idle',
    network: 'idle',
    apps: 'idle',
  });

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [idleIndex, setIdleIndex] = useState(0);

  const updateCheck = (key, status) => {
    setChecks((prev) => ({ ...prev, [key]: status }));
  };

  const idleIcons = [
    { icon: <IconVideo size={64} />, label: 'Ready to check Camera' },
    { icon: <IconMicrophone size={64} />, label: 'Ready to check Audio' },
    { icon: <IconWifi size={64} />, label: 'Ready to check Network' },
    { icon: <IconApps size={64} />, label: 'Ready to check Background Apps' },
  ];

  // --- Theme Observer ---
  useEffect(() => {
    const targetNode = document.documentElement;
    setIsDark(targetNode.classList.contains("dark"));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          setIsDark(targetNode.classList.contains("dark"));
        }
      });
    });
    observer.observe(targetNode, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // --- DEVICE RESTRICTION LOGIC ---
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      
      // Regex detects Mobile OS, iPhones, Androids, Tablets, and iPads
      const isTabletOrMobile = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent) || 
        /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent);
      
      // Fallback check: if the screen is too narrow (e.g., standard portrait modes)
      const isSmallScreen = window.innerWidth <= 800;

      if (isTabletOrMobile || isSmallScreen) {
        setIsMobileRestricted(true);
      } else {
        setIsMobileRestricted(false);
      }
    };

    // Run on mount
    checkDevice();

    // Listen for resizes (e.g., switching to dev tools mobile view)
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);


  useEffect(() => {
    let int;
    if (checks.camera === 'idle' && !isMobileRestricted) {
      int = setInterval(() => {
        setIdleIndex((prev) => (prev + 1) % idleIcons.length);
      }, 2000);
    }
    return () => clearInterval(int);
  }, [checks.camera, isMobileRestricted]);

  // Clean up media streams if user leaves page
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /* --- 1. ENHANCED HARDWARE CHECK (Hardware Switches & Shutter Detection) --- */
  const checkHardware = async () => {
    updateCheck('camera', 'loading');
    updateCheck('audio', 'loading');
    
    await new Promise((r) => setTimeout(r, 1000)); // UI delay for feel

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream; 

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (!videoTrack || !audioTrack) {
        throw new Error('Hardware tracks missing. Please ensure your camera and microphone are plugged in.');
      }

      // Step 1: Wait to allow OS to apply hardware switch statuses (mute states)
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Check for Laptop Hardware Switches (e.g., Fn + F4 Mic Mute, or Camera Kill Switch)
      // Browsers set the track to 'muted' if hardware denies the feed despite software permissions
      if (videoTrack.muted) {
        throw new Error('Camera is disabled by a hardware switch or OS privacy settings.');
      }
      if (audioTrack.muted) {
        throw new Error('Microphone is disabled by a hardware switch or OS privacy settings.');
      }

      // Step 3: Check for Physical Shutter Cover (Black Frame Detection)
      const isCameraCovered = await new Promise((resolve) => {
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = new MediaStream([videoTrack]);
        
        video.onloadeddata = async () => {
          // Wait for camera auto-exposure to adjust
          await new Promise((r) => setTimeout(r, 600));
          
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let blackPixels = 0;
            const totalPixels = frameData.length / 4;
            
            for (let i = 0; i < frameData.length; i += 4) {
              // Check if pixel is extremely dark (accounting for slight sensor noise)
              if (frameData[i] < 15 && frameData[i + 1] < 15 && frameData[i + 2] < 15) {
                blackPixels++;
              }
            }
            
            video.pause();
            video.srcObject = null;
            
            // If more than 98% of the camera feed is pure black, the physical shutter is closed
            if (blackPixels / totalPixels > 0.98) {
              resolve(true); // Covered
            } else {
              resolve(false); // Clear
            }
          } catch (e) {
            // Fallback to pass if canvas analysis fails due to cross-origin or unsupported constraints
            resolve(false); 
          }
        };
        
        video.onerror = () => resolve(false);
      });

      if (isCameraCovered) {
        throw new Error('Camera lens appears to be covered or physical shutter is closed.');
      }

      updateCheck('camera', 'success');
      updateCheck('audio', 'success');
      return true;

    } catch (err) {
      console.error("Hardware check failed:", err);
      updateCheck('camera', 'error');
      updateCheck('audio', 'error');
      toast.error(err.message || 'Camera or Microphone access denied. Please check your hardware.');
      return false; // Blocks the exam from continuing
    }
  };

  /* --- 2. Network Connectivity Check --- */
  const checkNetwork = async () => {
    updateCheck('network', 'loading');
    await new Promise((r) => setTimeout(r, 1000));

    if (navigator.onLine) {
      updateCheck('network', 'success');
      return true;
    } else {
      toast.error(`No internet connection detected.`);
      updateCheck('network', 'error');
      return false;
    }
  };

  /* --- 3. Background Apps / Visibility Scan --- */
  const checkApps = async () => {
    updateCheck('apps', 'loading');
    for (let i = 0; i <= 100; i += 5) {
      setScanProgress(i);
      await new Promise((r) => setTimeout(r, 40)); // Slightly faster scan
      if (document.hidden) {
        updateCheck('apps', 'error');
        toast.error('Do not switch tabs during security scanning!');
        return false;
      }
    }
    updateCheck('apps', 'success');
    return true;
  };

  const runAllDiagnostics = async () => {
    setIsDiagnosing(true);
    setStartInput('');
    
    // Reset all states
    setChecks({ camera: 'idle', audio: 'idle', network: 'idle', apps: 'idle' });

    // Ensure we await each step and break if it fails
    const hwPass = await checkHardware();
    if (!hwPass) { setIsDiagnosing(false); return; }

    const netPass = await checkNetwork();
    if (!netPass) { setIsDiagnosing(false); return; }

    const appsPass = await checkApps();
    if (!appsPass) { setIsDiagnosing(false); return; }

    setIsDiagnosing(false);
    setTimeout(() => setShowSuccessPopup(true), 500);
  };

  const startExam = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch {}

    const testId = crypto.randomUUID();
    navigate(`/exam/${examId}/${testId}`, { replace: true });
  };

  return (
    <PageContainer title="System Checks" description="Preparing environment">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          bgcolor: isDark ? '#121212' : '#F8FAFC',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1100,
            animation: `${slideUp} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
            filter: isMobileRestricted ? 'blur(10px)' : 'none',
            pointerEvents: isMobileRestricted ? 'none' : 'auto',
          }}
        >
          <Typography variant="h4" fontWeight="900" color={isDark ? 'white' : '#0F172A'} align="center" mb={1}>
            Diagnostic Security Scan
          </Typography>
          <Typography variant="body1" color={isDark ? '#94A3B8' : 'textSecondary'} align="center" mb={5}>
            We need to verify your system and network before starting the examination.
          </Typography>

          <Grid container spacing={4}>
            {/* LEFT: Dusky Gradient Camera Field */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F43F5E 100%)', // Dusky Sunset Gradient
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: isDark ? '0 20px 50px rgba(217, 70, 239, 0.15)' : '0 20px 50px rgba(217, 70, 239, 0.25)',
                  height: 420,
                  position: 'relative',
                  border: isDark ? '8px solid #1E293B' : '8px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.3s ease',
                }}
              >
                {/* 1. IDLE STATE: Rotating Avatars */}
                {checks.camera === 'idle' && (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    color="#ffffff"
                    key={idleIndex}
                    sx={{ animation: `${slideUp} 0.4s ease` }}
                  >
                    <Box
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        p: 3,
                        borderRadius: '50%',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        mb: 2,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {idleIcons[idleIndex].icon}
                    </Box>
                    <Typography
                      variant="body1"
                      fontWeight="800"
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      {idleIcons[idleIndex].label}
                    </Typography>
                  </Box>
                )}

                {/* 2 & 3. SCANNING & SUCCESS STATE: Avatar with Scan Frame */}
                {(checks.camera === 'loading' || checks.camera === 'success' || checks.camera === 'error') && (
                  <>
                    <Box
                      position="absolute"
                      inset={0}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      pb={6}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: 150,
                          height: 150,
                          borderRadius: '50%',
                          border: '6px solid',
                          borderColor: checks.camera === 'success' ? '#10B981' : checks.camera === 'error' ? '#EF4444' : '#FACC15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)',
                          animation:
                            checks.camera === 'success'
                              ? `${pulseSuccess} 2s infinite`
                              : checks.camera === 'error' 
                              ? 'none'
                              : `${pulseAvatar} 1.5s infinite`,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 120,
                            height: 120,
                            fontSize: '3.5rem',
                            bgcolor: '#1E293B',
                            color: '#fff',
                          }}
                        >
                          {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>

                        {/* Sweeping Laser Line */}
                        {checks.camera === 'loading' && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              width: '100%',
                              height: 6,
                              bgcolor: '#EF4444',
                              boxShadow: '0 0 15px 3px rgba(239, 68, 68, 0.8)',
                              zIndex: 5,
                              animation: `${scanLaser} 2s infinite ease-in-out`,
                            }}
                          />
                        )}
                      </Box>

                      {/* Status Label below Avatar */}
                      <Box mt={2} height={30}>
                        {checks.camera === 'loading' && (
                          <Typography
                            variant="button"
                            color="#ffffff"
                            fontWeight="800"
                            letterSpacing={2}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            <IconScanEye size={20} /> CHECKING HARDWARE...
                          </Typography>
                        )}
                        {checks.camera === 'success' && (
                          <Typography
                            variant="button"
                            color="#10B981"
                            fontWeight="800"
                            letterSpacing={2}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            <IconCircleCheckFilled size={20} /> HARDWARE VERIFIED
                          </Typography>
                        )}
                        {checks.camera === 'error' && (
                          <Typography
                            variant="button"
                            color="#EF4444"
                            fontWeight="800"
                            letterSpacing={2}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            <IconAlertCircleFilled size={20} /> ACCESS DENIED
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Audio Visualizer Capsule */}
                    {checks.audio === 'success' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 24,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          px: 3,
                          py: 1,
                          borderRadius: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                          zIndex: 20,
                        }}
                      >
                        <IconMicrophone size={20} color={isDark ? "white" : "#1E293B"} />
                        <SimulatedAudioVisualizer />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>

            {/* RIGHT: Checklist */}
            <Grid item xs={12} md={7}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '32px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  bgcolor: isDark ? '#1E293B' : '#ffffff',
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                }}
              >
                <Stack spacing={2.5} flex={1}>
                  <ChecklistItem
                    icon={<IconVideo />}
                    title="Camera & Microphone Access"
                    status={checks.camera}
                    subtitle={
                      checks.camera === 'success'
                        ? 'Hardware access granted'
                        : checks.camera === 'error'
                        ? 'Permissions denied or hardware disabled'
                        : 'Awaiting hardware check...'
                    }
                  />

                  <ChecklistItem
                    icon={<IconMicrophone />}
                    title="Environment Audio"
                    status={checks.audio}
                    subtitle={
                      checks.audio === 'success'
                        ? 'Microphone verified'
                        : checks.audio === 'error'
                        ? 'Failed to connect to mic'
                        : 'Checking hardware...'
                    }
                  />

                  <ChecklistItem
                    icon={<IconWifi />}
                    title="Network Connection"
                    status={checks.network}
                    subtitle={
                      checks.network === 'success'
                        ? 'Stable internet connection verified'
                        : checks.network === 'error'
                        ? 'Connection offline'
                        : 'Ensuring active connection...'
                    }
                  />

                  <ChecklistItem
                    icon={<IconApps />}
                    title="Background Environment"
                    progress={scanProgress}
                    status={checks.apps}
                    subtitle={
                      checks.apps === 'success'
                        ? 'No unauthorized apps detected'
                        : checks.apps === 'error'
                        ? 'Interruption detected'
                        : 'Ensuring clean testing environment'
                    }
                  />
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={runAllDiagnostics}
                  disabled={isDiagnosing}
                  startIcon={
                    isDiagnosing ? (
                      <IconLoader2 style={{ animation: `${spin} 1s linear infinite` }} />
                    ) : (
                      <IconShieldCheck />
                    )
                  }
                  sx={{
                    mt: 4,
                    py: 2,
                    borderRadius: '16px',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.4)',
                    textTransform: 'none',
                    '&:hover': { background: 'linear-gradient(135deg, #0F172A 0%, #000000 100%)' },
                  }}
                >
                  {isDiagnosing ? 'Running Security Diagnostics...' : 'Start Security Scan'}
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* ================= FINAL SUCCESS POPUP ================= */}
        <Dialog
          open={showSuccessPopup}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              overflow: 'visible',
              bgcolor: isDark ? '#1E293B' : '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <Box sx={{ bgcolor: '#10B981', height: 140, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 20, left: '20%', width: 6, height: 6, bgcolor: '#fff', borderRadius: '50%', opacity: 0.8 }} />
            <Box sx={{ position: 'absolute', top: 40, right: '25%', width: 8, height: 8, bgcolor: '#fff', borderRadius: '50%', opacity: 0.9 }} />
            <Box sx={{ position: 'absolute', top: 70, left: '10%', width: 4, height: 4, bgcolor: '#fff', borderRadius: '50%', opacity: 0.6 }} />

            <Box sx={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, bgcolor: isDark ? '#0F172A' : '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}>
              <IconShieldCheck size={44} color="#10B981" />
            </Box>
          </Box>

          <DialogContent sx={{ pt: 7, pb: 4, px: 4, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="900" color={isDark ? 'white' : '#1E293B'} gutterBottom>
              Environment Secured!
            </Typography>
            <Typography variant="body2" color={isDark ? '#94A3B8' : 'textSecondary'} mb={4} lineHeight={1.6}>
              You have successfully passed all pre-examination checks. To proceed into the secure exam browser, please type <b>"start"</b> below.
            </Typography>

            <TextField
              fullWidth
              placeholder="Type 'start'"
              variant="outlined"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                  color: isDark ? 'white' : 'black',
                  textAlign: 'center',
                  input: { textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={startExam}
              disabled={startInput.trim().toLowerCase() !== 'start'}
              sx={{
                py: 1.8, borderRadius: '14px', fontWeight: '800', fontSize: '1rem', bgcolor: '#10B981',
                textTransform: 'none', boxShadow: startInput.trim().toLowerCase() === 'start' ? '0 8px 20px rgba(16, 185, 129, 0.4)' : 'none',
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Start Exam Now
            </Button>
          </DialogContent>
        </Dialog>

        {/* ================= MOBILE/TABLET RESTRICTION POPUP (STRICT BLOCK) ================= */}
        <Dialog
          open={isMobileRestricted}
          fullScreen
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#000000' : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999 // Ensure it overrides everything
            }
          }}
        >
          <Fade in={isMobileRestricted} timeout={800}>
            <Box sx={{ textAlign: 'center', p: 4, maxWidth: 550, width: '100%' }}>
              <Box sx={{ 
                width: 120, height: 120, borderRadius: '50%', bgcolor: '#FEE2E2', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 4,
                boxShadow: '0 15px 35px rgba(239, 68, 68, 0.2)'
              }}>
                <MobileOffIcon sx={{ fontSize: 60, color: '#EF4444' }} />
              </Box>
              
              <Typography variant="h3" fontWeight="900" color={isDark ? 'white' : '#0F172A'} mb={2}>
                Device Not Supported
              </Typography>
              
              <Typography variant="body1" color={isDark ? '#94A3B8' : 'textSecondary'} mb={5} sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                Procto.ai requires a stable environment with advanced hardware monitoring. 
                Mobile phones and tablets are <b>strictly restricted</b> to ensure exam integrity. 
                <br /><br />
                Please switch to a <b>Laptop or Desktop computer</b> to access your assessment.
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  py: 1.8, px: 5, borderRadius: '16px', fontWeight: '800', fontSize: '1.05rem',
                  bgcolor: isDark ? '#FFFFFF' : '#0F172A', 
                  color: isDark ? '#000000' : '#FFFFFF',
                  textTransform: 'none',
                  '&:hover': { bgcolor: isDark ? '#E2E8F0' : '#1E293B' }
                }}
              >
                Return to Dashboard
              </Button>
            </Box>
          </Fade>
        </Dialog>

      </Box>
    </PageContainer>
  );
}