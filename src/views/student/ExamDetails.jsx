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
  IconCamera,
} from '@tabler/icons-react';
import MobileOffIcon from '@mui/icons-material/MobileOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, height: 24, px: 1 }}>
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
          <Typography variant="caption" color={isFail ? '#EF4444' : 'textSecondary'} fontWeight="500">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box display="flex" alignItems="center">
        {isRunning && <IconLoader2 style={{ animation: `${spin} 1s linear infinite`, color: '#007AFF' }} />}
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
  
  // Independent stream refs for precise hardware tracking
  const videoStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const dialogVideoRef = useRef(null); // Ref for the capture video element

  const [isDark, setIsDark] = useState(false);
  const [isMobileRestricted, setIsMobileRestricted] = useState(false);

  // Verification Capture States
  const [capturedImage, setCapturedImage] = useState(null);

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
  const [hardwareIssue, setHardwareIssue] = useState({ missing: false, type: '', message: '' });

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
      const isTabletOrMobile = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent) || 
        /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 800;

      setIsMobileRestricted(isTabletOrMobile || isSmallScreen);
    };

    checkDevice();
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

  // Clean up media streams
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((track) => track.stop());
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  /* --- Stream Attachment for Image Capture --- */
  useEffect(() => {
    if (showSuccessPopup && !capturedImage && dialogVideoRef.current && videoStreamRef.current) {
      dialogVideoRef.current.srcObject = videoStreamRef.current;
    }
  }, [showSuccessPopup, capturedImage]);

  /* --- Global Hardware Listener (Catches Keyboard Mutes) --- */
  const bindHardwareListeners = useCallback((track, type) => {
    track.onmute = () => {
      setHardwareIssue({
        missing: true,
        type, 
        message: `Your ${type === 'video' ? 'Camera' : 'Microphone'} was disabled via keyboard or system settings. Please unmute to continue.`
      });
      updateCheck(type === 'video' ? 'camera' : 'audio', 'error');
      setShowSuccessPopup(false); 
    };
    
    track.onunmute = () => {
      setHardwareIssue({ missing: false, type: '', message: '' });
      updateCheck(type === 'video' ? 'camera' : 'audio', 'success');
    };

    track.onended = () => {
      setHardwareIssue({
        missing: true,
        type, 
        message: `Your ${type === 'video' ? 'Camera' : 'Microphone'} was physically disconnected.`
      });
      updateCheck(type === 'video' ? 'camera' : 'audio', 'error');
      setShowSuccessPopup(false);
    };
  }, []);

  /* --- Helper: Check Physical Shutter & Fake Driver Feeds --- */
  const checkShutter = (videoTrack) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = new MediaStream([videoTrack]);
      
      const timeout = setTimeout(() => resolve({ covered: false, isStatic: true }), 3000);

      video.onloadeddata = async () => {
        clearTimeout(timeout);
        await new Promise((r) => setTimeout(r, 600)); 
        
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          // Frame 1
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame1 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          // Wait briefly to capture a second frame for noise comparison
          await new Promise((r) => setTimeout(r, 150));
          
          // Frame 2
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame2 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          let blackPixels = 0;
          let identicalPixels = 0;
          const totalPixels = frame1.length / 4;
          
          for (let i = 0; i < frame1.length; i += 4) {
            // Check for physical shutter (pure black)
            if (frame1[i] < 15 && frame1[i + 1] < 15 && frame1[i + 2] < 15) {
              blackPixels++;
            }
            // Check for fake/driver images (e.g. Lenovo Camera-off slash image has 0 noise)
            if (
              Math.abs(frame1[i] - frame2[i]) < 2 &&
              Math.abs(frame1[i+1] - frame2[i+1]) < 2 &&
              Math.abs(frame1[i+2] - frame2[i+2]) < 2
            ) {
              identicalPixels++;
            }
          }
          
          video.pause();
          video.srcObject = null;
          
          resolve({
            covered: blackPixels / totalPixels > 0.98,
            isStatic: identicalPixels / totalPixels > 0.99 
          });
        } catch (e) {
          resolve({ covered: false, isStatic: false }); 
        }
      };
      video.onerror = () => {
        clearTimeout(timeout);
        resolve({ covered: false, isStatic: true });
      };
    });
  };

  /* --- 1. ENHANCED HARDWARE CHECK --- */
  const checkHardware = async () => {
    updateCheck('camera', 'loading');
    updateCheck('audio', 'loading');
    await new Promise((r) => setTimeout(r, 800)); 

    let camPass = false;
    let micPass = false;

    // --- A. CAMERA CHECK ---
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = vStream;
      const videoTrack = vStream.getVideoTracks()[0];

      // Give OS time to assert hardware mute state
      await new Promise((r) => setTimeout(r, 300)); 

      if (!videoTrack || videoTrack.muted || videoTrack.readyState === 'ended') {
        throw new Error('Camera is disabled by a hardware switch or OS privacy settings.');
      }

      const { covered, isStatic } = await checkShutter(videoTrack);
      if (covered) throw new Error('Camera lens appears to be covered.');
      if (isStatic) throw new Error('Camera feed is frozen. A hardware switch may be engaged.');

      bindHardwareListeners(videoTrack, 'video');
      camPass = true;
      updateCheck('camera', 'success');
    } catch (err) {
      updateCheck('camera', 'error');
      toast.error(`Camera Error: ${err.message || 'Access denied'}`);
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // --- B. AUDIO CHECK ---
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = aStream;
      const audioTrack = aStream.getAudioTracks()[0];

      await new Promise((r) => setTimeout(r, 300));

      if (!audioTrack || audioTrack.muted || audioTrack.readyState === 'ended') {
        throw new Error('Microphone is disabled by a hardware switch or OS privacy settings.');
      }

      bindHardwareListeners(audioTrack, 'audio');
      micPass = true;
      updateCheck('audio', 'success');
    } catch (err) {
      updateCheck('audio', 'error');
      toast.error(`Microphone Error: ${err.message || 'Access denied'}`);
      if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // Only allow proceeding if BOTH pass
    if (!camPass || !micPass) {
      if (!camPass && audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
      if (!micPass && videoStreamRef.current) videoStreamRef.current.getTracks().forEach(t => t.stop());
    }
    return camPass && micPass;
  };

  /* --- 2. Network Connectivity Check --- */
  const checkNetwork = async () => {
    updateCheck('network', 'loading');
    await new Promise((r) => setTimeout(r, 800));

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
      await new Promise((r) => setTimeout(r, 40));
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
    setCapturedImage(null); // Reset capture state on new run
    sessionStorage.removeItem('student_verification_image');
    setChecks({ camera: 'idle', audio: 'idle', network: 'idle', apps: 'idle' });

    const hwPass = await checkHardware();
    if (!hwPass) { setIsDiagnosing(false); return; }

    const netPass = await checkNetwork();
    if (!netPass) { setIsDiagnosing(false); return; }

    const appsPass = await checkApps();
    if (!appsPass) { setIsDiagnosing(false); return; }

    setIsDiagnosing(false);
    setTimeout(() => setShowSuccessPopup(true), 500); // Triggers the popup safely
  };

  // Regular interval check as a fallback incase the events drop
  const monitorHardwareDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCam = devices.some(device => device.kind === 'videoinput');
      const hasMic = devices.some(device => device.kind === 'audioinput');

      if (!hasCam || !hasMic) {
        setHardwareIssue({
          missing: true, 
          type: !hasCam && !hasMic ? 'both' : (!hasCam ? 'video' : 'audio'),
          message: !hasCam && !hasMic ? 'Webcam and Microphone are disconnected.' : 
                   !hasCam ? 'Webcam is disconnected.' : 'Microphone is disconnected.'
        });
        updateCheck(!hasCam ? 'camera' : 'audio', 'error');
        setShowSuccessPopup(false); 
      } else {
        const isVideoDead = videoStreamRef.current?.getTracks().every(track => track.readyState === 'ended' || track.muted);
        const isAudioDead = audioStreamRef.current?.getTracks().every(track => track.readyState === 'ended' || track.muted);

        if (isVideoDead || isAudioDead) {
          const deadType = isVideoDead ? 'video' : 'audio';
          setHardwareIssue({
            missing: true,
            type: deadType,
            message: `Your ${deadType === 'video' ? 'Camera' : 'Microphone'} is currently muted or blocked by another application.`,
          });
          updateCheck(deadType === 'video' ? 'camera' : 'audio', 'error');
          setShowSuccessPopup(false); 
        } else {
          setHardwareIssue({ missing: false, type: '', message: '' });
        }
      }
    } catch (err) {
      console.error("Hardware monitor error:", err);
    }
  }, []);

  useEffect(() => {
    navigator.mediaDevices.addEventListener('devicechange', monitorHardwareDevices);
    const interval = setInterval(monitorHardwareDevices, 5000);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', monitorHardwareDevices);
      clearInterval(interval);
    };
  }, [monitorHardwareDevices]);

  /* --- Image Capture Handlers --- */
  const handleCaptureImage = () => {
    if (dialogVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = dialogVideoRef.current.videoWidth || 640;
      canvas.height = dialogVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      // Draw the video frame to canvas
      ctx.drawImage(dialogVideoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      setCapturedImage(dataUrl);
      sessionStorage.setItem('student_verification_image', dataUrl);
      toast.success("Image captured successfully!");
    }
  };

  const handleRetakeImage = () => {
    setCapturedImage(null);
    sessionStorage.removeItem('student_verification_image');
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
          position: 'fixed', // This strictly hides the navbar by overtaking the full screen
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2,
          bgcolor: isDark ? '#121212' : '#F8FAFC',
          transition: 'background-color 0.3s ease',
          overflowY: 'auto',
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
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 50%, #F43F5E 100%)',
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
                    <Typography variant="body1" fontWeight="800" textTransform="uppercase" letterSpacing={1}>
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
                          animation: checks.camera === 'success' ? `${pulseSuccess} 2s infinite` : checks.camera === 'error' ? 'none' : `${pulseAvatar} 1.5s infinite`,
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
                          <Typography variant="button" color="#ffffff" fontWeight="800" letterSpacing={2} display="flex" alignItems="center" gap={1}>
                            <IconScanEye size={20} /> CHECKING HARDWARE...
                          </Typography>
                        )}
                        {checks.camera === 'success' && (
                          <Typography variant="button" color="#10B981" fontWeight="800" letterSpacing={2} display="flex" alignItems="center" gap={1}>
                            <IconCircleCheckFilled size={20} /> HARDWARE VERIFIED
                          </Typography>
                        )}
                        {checks.camera === 'error' && (
                          <Typography variant="button" color="#EF4444" fontWeight="800" letterSpacing={2} display="flex" alignItems="center" gap={1}>
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
                    title="Webcam Access"
                    status={checks.camera}
                    subtitle={
                      checks.camera === 'success'
                        ? 'Camera verified and active'
                        : checks.camera === 'error'
                        ? 'Camera denied, blocked, or covered'
                        : 'Awaiting hardware check...'
                    }
                  />
                  <ChecklistItem
                    icon={<IconMicrophone />}
                    title="Microphone Access"
                    status={checks.audio}
                    subtitle={
                      checks.audio === 'success'
                        ? 'Microphone verified'
                        : checks.audio === 'error'
                        ? 'Microphone denied or muted'
                        : 'Awaiting hardware check...'
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
                  startIcon={isDiagnosing ? <IconLoader2 style={{ animation: `${spin} 1s linear infinite` }} /> : <IconShieldCheck />}
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

        {/* ================= FINAL SUCCESS & CAPTURE POPUP ================= */}
        <Dialog
          open={showSuccessPopup}
          maxWidth="sm"
          fullWidth
          sx={{ zIndex: 9999999 }} // Ensures it overrides the main box
          PaperProps={{
            sx: {
              borderRadius: '24px',
              overflow: 'visible',
              bgcolor: isDark ? '#1E293B' : '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <Box sx={{ bgcolor: '#10B981', height: 100, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 20, left: '20%', width: 6, height: 6, bgcolor: '#fff', borderRadius: '50%', opacity: 0.8 }} />
            <Box sx={{ position: 'absolute', top: 40, right: '25%', width: 8, height: 8, bgcolor: '#fff', borderRadius: '50%', opacity: 0.9 }} />
            <Box sx={{ position: 'absolute', top: 60, left: '10%', width: 4, height: 4, bgcolor: '#fff', borderRadius: '50%', opacity: 0.6 }} />

            <Box sx={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, bgcolor: isDark ? '#0F172A' : '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}>
              <IconShieldCheck size={44} color="#10B981" />
            </Box>
          </Box>

          <DialogContent sx={{ pt: 7, pb: 4, px: 4, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="900" color={isDark ? 'white' : '#1E293B'} gutterBottom>
              Identity Verification
            </Typography>

            {!capturedImage ? (
              <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
                <Typography variant="body2" color={isDark ? '#94A3B8' : 'textSecondary'} mb={3} lineHeight={1.6}>
                  Please position your face clearly in the frame and capture a photo to verify your identity.
                </Typography>
                
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 320,
                    height: 240,
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: 'black',
                    mb: 3,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  }}
                >
                  <video
                    ref={dialogVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handleCaptureImage}
                  startIcon={<IconCamera />}
                  sx={{ py: 1.5, px: 4, borderRadius: '12px', fontWeight: 'bold', bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
                >
                  Capture Photo
                </Button>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 160,
                    height: 120,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '3px solid #10B981',
                    mb: 1,
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <img src={capturedImage} alt="Verification" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                </Box>
                
                <Button variant="text" size="small" onClick={handleRetakeImage} sx={{ mb: 3, fontWeight: 'bold', color: '#64748B' }}>
                  Retake Photo
                </Button>

                <Typography variant="body2" color={isDark ? '#94A3B8' : 'textSecondary'} mb={3} lineHeight={1.6}>
                  Verification successful! To proceed into the secure exam browser, please type <b>"start"</b> below.
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
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* ================= HARDWARE ERROR POPUP ================= */}
        <Dialog
          open={hardwareIssue.missing}
          sx={{ zIndex: 9999999 }}
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: isDark ? '#1E293B' : '#ffffff',
              p: 2,
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)'
            }
          }}
        >
          <DialogContent>
            <Box mb={2} color="#EF4444" display="flex" justifyContent="center">
              {hardwareIssue.type === 'video' ? <VideocamOffIcon sx={{ fontSize: 60 }} /> : <MicOffIcon sx={{ fontSize: 60 }} />}
            </Box>
            <Typography variant="h5" fontWeight="800" color={isDark ? 'white' : '#0F172A'} mb={1}>
              Hardware Disconnected
            </Typography>
            <Typography variant="body1" color={isDark ? '#94A3B8' : 'textSecondary'} mb={4}>
              {hardwareIssue.message}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setHardwareIssue({ missing: false, type: '', message: '' });
                runAllDiagnostics(); 
              }}
              sx={{ py: 1.5, borderRadius: '12px', bgcolor: '#EF4444', fontWeight: 'bold', '&:hover': { bgcolor: '#DC2626' } }}
            >
              Retry Connection
            </Button>
          </DialogContent>
        </Dialog>

        {/* ================= MOBILE RESTRICTION POPUP ================= */}
        <Dialog
          open={isMobileRestricted}
          fullScreen
          sx={{ zIndex: 9999999 }}
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#000000' : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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