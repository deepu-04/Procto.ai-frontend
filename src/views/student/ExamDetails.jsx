import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import axiosInstance from '../../axios'; 
import WebCam from './Components/WebCam'; 

import {
  Box, CircularProgress, Button, Typography, Modal,
  LinearProgress, Dialog, Slide, TextField, Fade, Avatar, DialogContent 
} from '@mui/material'; 

import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import WifiIcon from '@mui/icons-material/Wifi';
import MobileOffIcon from '@mui/icons-material/MobileOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import { DocumentTextIcon, PlayIcon, CheckBadgeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { IconShieldCheck, IconCamera, IconScanEye } from '@tabler/icons-react';

import { useSaveCheatingLogMutation } from '../../slices/cheatingLogApiSlice';
import { useCheatingLog } from '../../context/CheatingLogContext';

// --- 3D Popup Animation Styles (RESTORED) ---
const modal3DStyle = {
  borderRadius: 3, p: 5, width: 450, outline: 'none', textAlign: 'center',
  boxShadow: '0px 20px 40px rgba(0,0,0,0.4), 0px 0px 0px 1px rgba(255,255,255,0.1) inset',
  transform: 'scale(1)', animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
  '@keyframes popIn': { '0%': { transform: 'scale(0.8)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
};

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WatermarkOverlay = ({ userInfo }) => {
  const watermarkText = `${userInfo?.email || 'Candidate'} | IP Tracking Active | Procto.ai`;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999, opacity: 0.03, display: 'flex', flexWrap: 'wrap', overflow: 'hidden', userSelect: 'none' }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <Typography key={i} sx={{ transform: 'rotate(-30deg)', whiteSpace: 'nowrap', fontSize: '1.5rem', p: 4, color: 'black', fontWeight: 'bold' }}>
          {watermarkText}
        </Typography>
      ))}
    </Box>
  );
};

const ProctoAiInterviewResults = ({ open, examResult, isDark, onReturnToDashboard }) => {
  return (
    <Dialog fullScreen open={open} TransitionComponent={Transition} PaperProps={{ sx: { bgcolor: isDark ? '#000' : '#E9EEF4' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 4 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[32px] p-10 text-center shadow-2xl border border-white/10 w-full max-w-md">
          <div className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto mb-6">
            <CheckBadgeIcon className="w-14 h-14 text-[#34C759]" />
          </div>
          <Typography variant="h4" fontWeight="800" mb={1} className="dark:text-white">Assessment Complete</Typography>
          <Typography variant="body1" color="textSecondary" mb={4} className="dark:text-gray-400">
            Your custom AI interview has been submitted and recorded.
          </Typography>
          <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', p: 3, borderRadius: 4, mb: 6 }}>
            <Typography variant="h2" fontWeight="900" color={isDark ? '#0A84FF' : '#007AFF'}>
              {examResult?.score} / {examResult?.total}
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="textSecondary" textTransform="uppercase" letterSpacing={2}>
              Final Score
            </Typography>
            <Typography variant="body2" mt={2} color={(examResult?.trust || 0) > 50 ? '#34C759' : '#EF4444'} fontWeight="bold">
              System Trust: {examResult?.trust}%
            </Typography>
          </Box>
          <Button fullWidth variant="contained" onClick={onReturnToDashboard} sx={{ bgcolor: isDark ? '#0A84FF' : '#007AFF', borderRadius: 10, py: 1.5, fontWeight: 'bold' }}>
            Return to Dashboard
          </Button>
        </motion.div>
      </Box>
    </Dialog>
  );
};

export default function ExamDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId } = useParams();
  const { userInfo } = useSelector((state) => state.auth || {});

  const [examStage, setExamStage] = useState('dashboard');
  const [savedExams, setSavedExams] = useState(() => {
    const saved = localStorage.getItem('procto_ai_exams');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeExam, setActiveExam] = useState(null); 
  const [examResult, setExamResult] = useState(null); 
  const [isDark, setIsDark] = useState(false);
  
  // Media Refs
  const previewVideoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const dialogVideoRef = useRef(null);

  const [sysChecks, setSysChecks] = useState({ cam: 'pending', mic: 'pending', net: 'pending' });
  const allChecksPassed = sysChecks.cam === 'passed' && sysChecks.mic === 'passed' && sysChecks.net === 'passed';

  const [cheatingLog, setCheatingLog] = useState({});
  const cheatingLogRef = useRef({});
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();

  const updateCheatingLog = useCallback((updates) => {
    setCheatingLog((prev) => {
      const newLog = { ...prev, ...updates };
      cheatingLogRef.current = newLog;
      return newLog;
    });
  }, []);

  // Security Refs
  const susTimerRef = useRef(null);
  const hardwareMonitorRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const lastKeyTimeRef = useRef(Date.now());
  const lastViolationTimesRef = useRef({});
  const loggedViolationsRef = useRef(new Set());
  const hasAutoSubmittedRef = useRef(false);
  const initialWebrtcIpRef = useRef(null);
  const initialIpifyIpRef = useRef(null);

  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenStrikes, setFullscreenStrikes] = useState(0);

  const [isSuspiciousEnv, setIsSuspiciousEnv] = useState(false);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [darknessLevel, setDarknessLevel] = useState(0);

  const [riskScore, setRiskScore] = useState(0);
  const trustScore = Math.max(0, 100 - riskScore);
  const [sessionEvents, setSessionEvents] = useState([]);
  
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [hasShownTrustModal, setHasShownTrustModal] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [multipleIpDetected, setMultipleIpDetected] = useState(false);
  const [hardwareIssue, setHardwareIssue] = useState({ missing: false, type: '', message: '' });
  const [isMobileRestricted, setIsMobileRestricted] = useState(false);

  // Verification Capture States
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [startInput, setStartInput] = useState('');
  const [personMismatch, setPersonMismatch] = useState(false);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));

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
    if (location.state?.examData) {
      const examSubject = location.state.subject || location.state.topic || location.state.examName || "General IT";
      
      const newExam = {
        id: `ai-exam-${Date.now()}`,
        name: location.state.examName || "AI Generated Assessment", 
        subject: examSubject,
        date: new Date().toISOString(),
        questions: location.state.examData,
        completed: false,
        score: null,
        securityLog: []
      };
      const updatedExams = [newExam, ...savedExams];
      setSavedExams(updatedExams);
      localStorage.setItem('procto_ai_exams', JSON.stringify(updatedExams));
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate, savedExams]);

  const initiateSystemCheck = (examObj) => {
    setActiveExam(examObj);
    setExamStage('system_check');
    runHardwareTests();
  };

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
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame1 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          await new Promise((r) => setTimeout(r, 150));
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame2 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          let blackPixels = 0;
          let identicalPixels = 0;
          const totalPixels = frame1.length / 4;
          
          for (let i = 0; i < frame1.length; i += 4) {
            if (frame1[i] < 15 && frame1[i + 1] < 15 && frame1[i + 2] < 15) blackPixels++;
            if (Math.abs(frame1[i] - frame2[i]) < 2 && Math.abs(frame1[i+1] - frame2[i+1]) < 2 && Math.abs(frame1[i+2] - frame2[i+2]) < 2) {
              identicalPixels++;
            }
          }
          
          video.pause();
          video.srcObject = null;
          
          resolve({ covered: blackPixels / totalPixels > 0.98, isStatic: identicalPixels / totalPixels > 0.99 });
        } catch (e) {
          resolve({ covered: false, isStatic: false }); 
        }
      };
      video.onerror = () => { clearTimeout(timeout); resolve({ covered: false, isStatic: true }); };
    });
  };

  const bindHardwareListeners = useCallback((track, type) => {
    track.onmute = () => {
      setHardwareIssue({ missing: true, type, message: `Your ${type === 'video' ? 'Camera' : 'Microphone'} was disabled via keyboard or system settings. Please unmute to continue.` });
      setSysChecks(prev => ({ ...prev, [type === 'video' ? 'cam' : 'mic']: 'error' }));
    };
    track.onunmute = () => {
      setHardwareIssue({ missing: false, type: '', message: '' });
      setSysChecks(prev => ({ ...prev, [type === 'video' ? 'cam' : 'mic']: 'success' }));
    };
    track.onended = () => {
      setHardwareIssue({ missing: true, type, message: `Your ${type === 'video' ? 'Camera' : 'Microphone'} was physically disconnected.` });
      setSysChecks(prev => ({ ...prev, [type === 'video' ? 'cam' : 'mic']: 'error' }));
      setShowSuccessPopup(false);
    };
  }, []);

  const runHardwareTests = async () => {
    setSysChecks({ cam: 'loading', mic: 'loading', net: 'loading' });
    setTimeout(() => { setSysChecks(prev => ({ ...prev, net: navigator.onLine ? 'passed' : 'failed' })); }, 1000);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = stream.getVideoTracks()[0];
      
      const { covered, isStatic } = await checkShutter(videoTrack);
      if (covered) throw new Error('Camera lens appears to be covered.');
      if (isStatic) throw new Error('Camera feed is frozen. A hardware switch may be engaged.');

      videoStreamRef.current = stream; 
      if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
      
      bindHardwareListeners(videoTrack, 'video');
      bindHardwareListeners(stream.getAudioTracks()[0], 'audio');

      setSysChecks(prev => ({ ...prev, cam: 'passed', mic: 'passed' }));
    } catch (err) {
      setSysChecks(prev => ({ ...prev, cam: 'failed', mic: 'failed' }));
      toast.error(`Hardware Error: ${err.message || "Permissions denied."}`);
    }
  };

  const stopPreviewStream = () => {
    if (previewVideoRef.current && previewVideoRef.current.srcObject) {
      previewVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleBeginAssessment = () => {
    setExamStage('identity_verification');
    setStartInput('');
    setCapturedImage(null);
    setShowSuccessPopup(true);
  };

  useEffect(() => {
    const attachVerificationStream = async () => {
      if (showSuccessPopup && !capturedImage && dialogVideoRef.current) {
        try {
          const streamIsActive = videoStreamRef.current && videoStreamRef.current.getVideoTracks().some(t => t.readyState === 'live');
          
          if (streamIsActive) {
            dialogVideoRef.current.srcObject = videoStreamRef.current;
          } else {
            const freshStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStreamRef.current = freshStream;
            dialogVideoRef.current.srcObject = freshStream;
          }
          await dialogVideoRef.current.play();
        } catch (err) {
          console.error("Camera failed to attach to verification modal:", err);
          toast.error("Camera connection lost. Please allow permissions.");
        }
      }
    };

    attachVerificationStream();
  }, [showSuccessPopup, capturedImage, examStage]);

  const handleCaptureImage = () => {
    if (dialogVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = dialogVideoRef.current.videoWidth || 640;
      canvas.height = dialogVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
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

  const handleStartLiveExam = async () => {
    setShowSuccessPopup(false);
    stopPreviewStream(); 
    
    setExamStage('exam');
    setExamDurationInSeconds((activeExam?.questions?.length || 0) * 120); 
    setCurrentQuestionIdx(0);
    setAnswers({});
    setVisitedQuestions(new Set([0]));
    setRiskScore(0);
    setSessionEvents([]);
    setCheatingLog({});
    hasAutoSubmittedRef.current = false;
    
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      toast.error('Fullscreen access required to start the exam.');
    }
  };

  const registerViolation = useCallback((type, message, severity = 'critical', weight = 20) => {
    if (examStage !== 'exam') return;
    const now = Date.now();
    const lastTime = lastViolationTimesRef.current[type] || 0;
    if (now - lastTime < 10000) return;
    lastViolationTimesRef.current[type] = now;

    if (['VPN_DETECTED', 'MULTIPLE_IPS', 'DEV_TOOLS_OR_VM'].includes(type) && loggedViolationsRef.current.has(type)) return;
    loggedViolationsRef.current.add(type);

    updateCheatingLog({ [type]: (cheatingLogRef.current[type] || 0) + 1 });
    setSessionEvents((prev) => [{ type: type.replace(/_/g, ' ').toUpperCase(), message, time: new Date().toLocaleTimeString(), severity }, ...prev]);
    setRiskScore((prev) => Math.min(100, prev + weight));
    toast.error(message);
  }, [updateCheatingLog, examStage]);

  const handleTestSubmission = useCallback(async () => {
    if (isSubmitting || !activeExam) return;
    setIsSubmitting(true);

    let score = 0;
    activeExam.questions.forEach((q, index) => {
      if (answers[index] !== undefined && q.options[answers[index]] === q.correctAnswer) {
        score += 1;
      }
    });

    const totalQuestions = activeExam.questions.length || 0;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const subjectName = activeExam.subject || activeExam.name || "General AI Exam";

    const formattedAnswers = Object.entries(answers).map(([qIndex, selectedOpt]) => ({
      questionText: activeExam.questions[qIndex]?.question,
      selectedOption: selectedOpt,
      isCorrect: activeExam.questions[qIndex]?.options[selectedOpt] === activeExam.questions[qIndex]?.correctAnswer
    }));

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post('/api/user/save-ai-result', { 
        examId: activeExam.id, 
        userId: userInfo?._id || userInfo?.id,
        examName: activeExam.name || "AI Generated Exam",
        subject: subjectName,
        answers: formattedAnswers, 
        totalMarks: totalQuestions,
        score: score,
        percentage: percentage,
        trustScore: trustScore,
        securityLog: sessionEvents,
        feedback: `AI Exam: ${subjectName}. Trust Score: ${trustScore}%`
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success("Result synced to database successfully!");
    } catch (error) {
      console.error("Backend Rejected the Data. Reason:", error.response?.data || error.message);
      toast.warning(`Sync Failed: ${error.response?.data?.message || 'Server Error'}`);
    }

    const updatedExams = savedExams.map(ex => 
      ex.id === activeExam.id ? { ...ex, completed: true, score: score, securityLog: sessionEvents } : ex
    );
    setSavedExams(updatedExams);
    localStorage.setItem('procto_ai_exams', JSON.stringify(updatedExams));

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }

    setExamResult({ score, total: totalQuestions, trust: trustScore });
    setExamStage('result');
    setIsSubmitting(false);
  }, [activeExam, answers, isSubmitting, sessionEvents, trustScore, userInfo, savedExams]);

  useEffect(() => {
    if (riskScore >= 100 && !hasAutoSubmittedRef.current && examStage === 'exam') {
      hasAutoSubmittedRef.current = true;
      toast.error('System Integrity critical. Auto-submitting exam.');
      handleTestSubmission();
    }
  }, [riskScore, examStage, handleTestSubmission]);

  useEffect(() => {
    if (trustScore <= 50 && !hasShownTrustModal && examStage === 'exam') {
      setShowTrustModal(true);
      setHasShownTrustModal(true);
    }
  }, [trustScore, hasShownTrustModal, examStage]);

  const handleObjectDetection = useCallback((item, distanceScale = 0.8) => {
    setBlurIntensity(distanceScale * 30);
    setDarknessLevel(Math.min(0.95, distanceScale * 1.2));
    setIsSuspiciousEnv(true);
    registerViolation('PROHIBITED_OBJECT', `${item} detected`, 'critical', 25);

    if (susTimerRef.current) clearTimeout(susTimerRef.current);
    susTimerRef.current = setTimeout(() => {
      setIsSuspiciousEnv(false);
      setBlurIntensity(0);
      setDarknessLevel(0);
    }, 5000);
  }, [registerViolation]);

  useEffect(() => {
    if (examStage !== 'exam' || !isFullscreen || networkIssue || isSuspiciousEnv || !activeExam) return;
    const timer = setInterval(() => {
      setExamDurationInSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasAutoSubmittedRef.current) {
            hasAutoSubmittedRef.current = true;
            handleTestSubmission();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFullscreen, networkIssue, isSuspiciousEnv, activeExam, examStage, handleTestSubmission]);

  // Hidden Identity Verification Ping
  useEffect(() => {
    const verifyFaceMatch = async () => {
      if (examStage !== 'exam' || !isFullscreen || !videoStreamRef.current) return;
      
      const baselineImage = sessionStorage.getItem('student_verification_image');
      if (!baselineImage) return;

      try {
        const track = videoStreamRef.current.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        
        const currentImage = canvas.toDataURL('image/jpeg', 0.5);

        const res = await axiosInstance.post('/api/proctoring/verify-face', {
          examId,
          baselineImage,
          currentImage
        });

        if (res.data && res.data.match === false) {
          setPersonMismatch(true);
          registerViolation('PERSON_MISMATCH', 'Identity mismatch detected.', 'critical', 40);
        } else if (res.data && res.data.match === true) {
          setPersonMismatch(false);
        }
      } catch (err) {
        console.warn('Face ping failed, continuing exam smoothly.');
      }
    };

    if (examStage === 'exam' && isFullscreen) {
      faceCheckIntervalRef.current = setInterval(verifyFaceMatch, 5000); 
    }

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [examStage, isFullscreen, examId, registerViolation]);

  useEffect(() => {
    if (examStage !== 'exam' || !isFullscreen || !activeExam) return;
    if (navigator.webdriver || window.outerWidth - window.innerWidth > 200) {
      registerViolation('DEV_TOOLS_OR_VM', 'Virtual Machine/Dev Tools detected', 'critical', 50);
    }
    const preventDefaultAction = (e, type, msg, weight) => { e.preventDefault(); registerViolation(type, msg, 'high', weight); };
    const handleVisibilityChange = () => { if (document.hidden) registerViolation('TAB_SWITCH', 'Switched tabs', 'critical', 25); };
    const handleWindowBlur = () => registerViolation('WINDOW_BLUR', 'Window lost focus', 'critical', 20);
    
    const handleKeyDown = (e) => {
      const now = Date.now();
      if (now - lastKeyTimeRef.current < 20) registerViolation('ABNORMAL_KEYSTROKES', 'Automated input', 'high', 15);
      lastKeyTimeRef.current = now;
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['s', 'S', '3', '4', '5'].includes(e.key))) {
        e.preventDefault(); registerViolation('SCREEN_CAPTURE_ATTEMPT', 'Screenshot attempted', 'critical', 35);
      }
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault(); registerViolation('SECURE_BROWSER', 'Shortcuts disabled', 'high', 10);
      }
    };

    document.addEventListener('contextmenu', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Right-click disabled', 5));
    document.addEventListener('copy', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Copy disabled', 10));
    document.addEventListener('paste', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Paste disabled', 10));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Right-click disabled', 5));
      document.removeEventListener('copy', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Copy disabled', 10));
      document.removeEventListener('paste', (e) => preventDefaultAction(e, 'SECURE_BROWSER', 'Paste disabled', 10));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, activeExam, registerViolation, examStage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (examStage !== 'exam' || !activeExam) return;
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        const newStrikes = fullscreenStrikes + 1;
        setFullscreenStrikes(newStrikes);
        registerViolation('FULLSCREEN_EXIT', `Exited fullscreen mode. Warning ${newStrikes}/3`, 'critical', 20);
        if (newStrikes >= 3 && !hasAutoSubmittedRef.current) {
          hasAutoSubmittedRef.current = true;
          handleTestSubmission();
        }
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [fullscreenStrikes, activeExam, registerViolation, examStage, handleTestSubmission]);

  const handleSelectOption = (optIdx) => setAnswers((prev) => ({ ...prev, [currentQuestionIdx]: optIdx }));
  const getTrustColor = () => trustScore > 50 ? '#22C55E' : trustScore > 20 ? '#FACC15' : '#EF4444';
  const formatTime = (seconds) => new Date(seconds * 1000).toISOString().substr(11, 8);

  const currentQ = activeExam?.questions[currentQuestionIdx] || {};
  const isLastQuestion = activeExam && currentQuestionIdx === (activeExam.questions?.length || 1) - 1;

  const CheckItem = ({ icon, title, status }) => (
    <Box display="flex" alignItems="center" justifyContent="space-between" p={2} mb={2} borderRadius={3} bgcolor={isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'}>
      <Box display="flex" alignItems="center" gap={2}>
        {icon}
        <Typography fontWeight="600" color={isDark ? 'white' : 'black'}>{title}</Typography>
      </Box>
      {status === 'loading' || status === 'pending' ? <CircularProgress size={20} /> : null}
      {status === 'passed' && <CheckCircleIcon className="w-6 h-6 text-[#34C759]" />}
      {status === 'failed' && <XCircleIcon className="w-6 h-6 text-[#EF4444]" />}
    </Box>
  );

  return (
    <>
      {/* -------------------------------------------------------------------------------- */}
      {/* BACKGROUND VIEW: DASHBOARD */}
      {/* -------------------------------------------------------------------------------- */}
      <div className={`min-h-screen p-8 transition-colors duration-500 ${isDark ? 'dark bg-[#000000] text-[#F2F2F7]' : 'bg-[#F2F2F7] text-[#1C1C1E]'}`}>
        <div className="max-w-6xl mx-auto">
          <header className="mb-10">
            <Typography variant="h3" fontWeight="800" mb={1} className="dark:text-white">
              My <span style={{ color: isDark ? '#0A84FF' : '#007AFF' }}>Assessments</span>
            </Typography>
            <Typography variant="body1" color="textSecondary" className="dark:text-[#AEAEB2]">
              Select a generated AI exam to begin. Ensure you are in a quiet environment.
            </Typography>
          </header>

          {savedExams.length === 0 ? (
            <Box textAlign="center" py={10}>
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <Typography variant="h6" fontWeight="bold" className="dark:text-white">No Exams Generated</Typography>
              <Typography color="textSecondary" className="dark:text-[#AEAEB2]">Go back to the generator to create an AI exam.</Typography>
            </Box>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedExams.map((exam) => (
                <motion.div key={exam.id} whileHover={!exam.completed ? { y: -5 } : {}} className={`p-6 rounded-[28px] border-2 transition-all flex flex-col h-full ${exam.completed ? 'bg-gray-100/50 dark:bg-[#1C1C1E]/50 border-transparent opacity-75' : 'bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-white dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.05)] cursor-pointer'}`} onClick={() => !exam.completed && initiateSystemCheck(exam)}>
                  
                  <div className="flex justify-between items-start mb-6">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ bgcolor: isDark ? '#2C2C2E' : 'white', borderRadius: 1.5, p: 0.5, display: 'flex', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <MonitorHeartIcon sx={{ color: isDark ? '#0A84FF' : '#007AFF' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="800" className="dark:text-white" sx={{ lineHeight: 1.2 }}>
                        Procto.ai <br />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8E8E93', letterSpacing: '1px' }}>ASSESSMENTS</span>
                      </Typography>
                    </Box>
                    {exam.completed && <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>}
                  </div>
                  
                  <Box mb={4}>
                    <Typography variant="subtitle2" fontWeight="700" className="dark:text-white mb-1">
                      {exam.subject || exam.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="dark:text-[#AEAEB2]">
                      Generated on {new Date(exam.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Typography variant="body2" fontWeight="bold" className="dark:text-white">{exam.questions?.length || 0} Questions</Typography>
                    {exam.completed ? (
                      <Typography variant="body2" fontWeight="bold" color="success.main">Score: {exam.score}/{exam.questions?.length || 0}</Typography>
                    ) : (
                      <PlayIcon className="w-6 h-6 text-[#007AFF] dark:text-[#0A84FF]" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* OVERLAY 1: SYSTEM CHECK */}
      {/* -------------------------------------------------------------------------------- */}
      <Dialog fullScreen open={examStage === 'system_check'} TransitionComponent={Transition} PaperProps={{ sx: { bgcolor: isDark ? '#000' : '#E9EEF4' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 4 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl rounded-[32px] p-8 max-w-4xl w-full shadow-2xl border border-white/20 dark:border-white/10 flex flex-col md:flex-row gap-8">
            
            <Box flex={1} display="flex" flexDirection="column">
              <Typography variant="h4" fontWeight="800" mb={1} color={isDark ? 'white' : 'black'}>System Diagnostics</Typography>
              <Typography variant="body2" color="textSecondary" mb={4}>Please ensure your hardware is configured correctly before starting the proctored assessment.</Typography>
              
              <CheckItem icon={<VideocamIcon color="primary" />} title="Camera Connection" status={sysChecks.cam} />
              <CheckItem icon={<MicIcon color="primary" />} title="Microphone Input" status={sysChecks.mic} />
              <CheckItem icon={<WifiIcon color="primary" />} title="Network Stability" status={sysChecks.net} />

              <Box mt="auto" display="flex" gap={2}>
                <Button variant="outlined" fullWidth onClick={() => { stopPreviewStream(); setExamStage('dashboard'); }} sx={{ borderRadius: 10, py: 1.5, borderColor: isDark ? '#38383A' : '#E2E8F0', color: isDark ? 'white' : 'black' }}>
                  Cancel
                </Button>
                <Button variant="contained" fullWidth disabled={!allChecksPassed} onClick={handleBeginAssessment} sx={{ borderRadius: 10, py: 1.5, bgcolor: '#007AFF', fontWeight: 'bold' }}>
                  Begin Assessment
                </Button>
              </Box>
            </Box>

            <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <Box sx={{ width: '100%', height: 280, bgcolor: 'black', borderRadius: 4, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                <video ref={previewVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                {sysChecks.cam !== 'passed' && (
                  <Box position="absolute" top={0} left={0} width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
                    <Typography color="white" fontWeight="bold">Waiting for Camera...</Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="textSecondary" mt={2}>
                This feed is used to verify your identity and monitor the environment.
              </Typography>
            </Box>

          </motion.div>
        </Box>
      </Dialog>

      {/* -------------------------------------------------------------------------------- */}
      {/* IDENTITY VERIFICATION MODAL */}
      {/* -------------------------------------------------------------------------------- */}
      <Dialog
        open={showSuccessPopup}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 9999999 }} 
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
                  ref={(el) => {
                    dialogVideoRef.current = el;
                    if (el && videoStreamRef.current && el.srcObject !== videoStreamRef.current) {
                      el.srcObject = videoStreamRef.current;
                    }
                  }}
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
                onClick={handleStartLiveExam}
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

      {/* -------------------------------------------------------------------------------- */}
      {/* PERSON MISMATCH MODAL */}
      {/* -------------------------------------------------------------------------------- */}
      <Modal open={personMismatch && !hardwareIssue.missing} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <Box sx={{ ...modal3DStyle, bgcolor: isDark ? '#1E293B' : 'white' }}>
          <IconScanEye size={60} color="#EF4444" style={{ marginBottom: '8px' }} />
          <Typography variant="h5" fontWeight={700} mb={2} color="error">Identity Verification Failed</Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            The system detected a different person taking the exam. Please ensure only the registered student is in front of the camera.
          </Typography>
          <Button variant="contained" color="error" fullWidth onClick={() => setPersonMismatch(false)} sx={{ py: 1.5, borderRadius: 1.5 }}>
            I Understand
          </Button>
        </Box>
      </Modal>

      {/* -------------------------------------------------------------------------------- */}
      {/* OVERLAY 2: LIVE EXAM */}
      {/* -------------------------------------------------------------------------------- */}
      <Dialog fullScreen open={examStage === 'exam'} TransitionComponent={Transition} PaperProps={{ sx: { bgcolor: isDark ? '#000' : '#E9EEF4' } }}>
        <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          
          <Modal open={!isFullscreen && !networkIssue} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', zIndex: 99999 }}>
            <Box sx={{ bgcolor: isDark ? '#1C1C1E' : 'white', borderRadius: 4, p: 5, width: 400, textAlign: 'center', outline: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
              <WarningRoundedIcon sx={{ fontSize: 60, color: '#FACC15', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} mb={2} color={isDark ? 'white' : 'black'}>Fullscreen Required</Typography>
              <Typography variant="body2" color="textSecondary" mb={4}>To maintain exam integrity, please return to fullscreen mode.</Typography>
              <Button variant="contained" fullWidth sx={{ bgcolor: '#007AFF', borderRadius: 10, py: 1.5, fontWeight: 'bold' }} onClick={() => document.documentElement.requestFullscreen().then(() => setIsFullscreen(true))}>
                Enter Fullscreen
              </Button>
            </Box>
          </Modal>

          <Modal open={showTrustModal && !networkIssue && !hardwareIssue.missing} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', zIndex: 99999 }}>
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 5, width: 450, outline: 'none', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <HealthAndSafetyIcon sx={{ fontSize: 60, color: '#FACC15', mb: 1 }} />
              <Typography variant="h5" fontWeight={700} mb={2}>Trust Score Warning</Typography>
              <Typography variant="body2" color="textSecondary" mb={4}>
                Your system integrity score has dropped to {trustScore}%. Multiple violations have been logged. Continued suspicious activity will result in automatic exam termination.
              </Typography>
              <Button variant="contained" fullWidth sx={{ bgcolor: '#4F46E5', py: 1.5, borderRadius: 1.5 }} onClick={() => setShowTrustModal(false)}>
                I Understand
              </Button>
            </Box>
          </Modal>

          {isFullscreen && (
            <>
              <WatermarkOverlay userInfo={userInfo} />

              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: `rgba(0,0,0,${darknessLevel})`, opacity: isSuspiciousEnv ? 1 : 0, pointerEvents: isSuspiciousEnv ? 'all' : 'none', transition: 'all 0.5s ease', zIndex: 9998, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <WarningRoundedIcon sx={{ fontSize: 100, color: '#EF4444', mb: 2 }} />
                <Typography variant="h3" color="#EF4444" fontWeight="bold">Suspicious Environment</Typography>
                <Typography variant="h6" color="white" mt={2}>Prohibited object detected. Remove it to continue.</Typography>
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', filter: `blur(${blurIntensity}px)`, transition: 'filter 0.5s ease', pointerEvents: isSuspiciousEnv ? 'none' : 'auto' }}>
                
                <Box sx={{ height: 80, bgcolor: isDark ? '#1C1C1E' : '#6B879E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 10, borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1, display: 'flex', alignItems: 'center' }}><MonitorHeartIcon sx={{ color: '#002B5B' }} /></Box>
                    <Box color="white">
                      <Typography variant="h6" fontWeight={700} lineHeight={1}>Procto.ai</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Live Assessment Active: {activeExam?.subject || activeExam?.name}</Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={3}>
                    <Button variant="contained" onClick={handleTestSubmission} sx={{ bgcolor: '#EF4444', color: 'white', fontWeight: 'bold', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#DC2626' } }}>
                      Submit & Exit
                    </Button>
                    <Box sx={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid white', position: 'relative' }}>
                      <Box sx={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', bgcolor: 'red', color: 'white', fontSize: '9px', fontWeight: 'bold', px: 0.6, py: 0.2, borderRadius: 1, zIndex: 20 }}>LIVE</Box>
                      <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                        <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} onObjectDetected={handleObjectDetection} onFaceLost={() => registerViolation('FACE_LOST', 'Face not visible', 'high', 20)} />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', gap: 3, p: 3, overflow: 'hidden' }}>
                  <Box sx={{ flex: 7, bgcolor: isDark ? '#1C1C1E' : 'white', borderRadius: 4, p: 4, display: 'flex', flexDirection: 'column', overflowY: 'auto', border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <Typography variant="h6" color={isDark ? 'white' : 'black'} mb={4}>Question {currentQuestionIdx + 1}</Typography>
                    <Typography variant="h5" fontWeight={500} mb={6} color={isDark ? 'white' : 'black'}>{currentQ.question}</Typography>

                    <Box display="flex" flexDirection="column" gap={2} mb={4}>
                      {currentQ.options?.map((opt, i) => {
                        const isSelected = answers[currentQuestionIdx] === i;
                        return (
                          <Box key={i} onClick={() => handleSelectOption(i)} sx={{ p: 2, border: '2px solid', borderColor: isSelected ? '#007AFF' : (isDark ? '#38383A' : '#E0E0E0'), borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', bgcolor: isSelected ? (isDark ? '#007AFF20' : '#E5F1FF') : 'transparent', '&:hover': { borderColor: '#007AFF' } }}>
                            <Typography variant="body1" color={isSelected ? '#007AFF' : (isDark ? 'white' : 'black')} fontWeight={isSelected ? 700 : 500}>{opt}</Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" sx={{ bgcolor: isLastQuestion ? '#34C759' : '#007AFF', borderRadius: 10, px: 6, py: 1.5, fontWeight: 'bold' }} onClick={isLastQuestion ? handleTestSubmission : () => { setCurrentQuestionIdx(prev => prev + 1); setVisitedQuestions(prev => new Set(prev).add(currentQuestionIdx + 1)); }}>
                        {isLastQuestion ? 'Submit Assessment' : 'Next Question'}
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ bgcolor: isDark ? '#1C1C1E' : 'white', borderRadius: 4, p: 3, border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                      <Typography variant="caption" fontWeight="bold" color="textSecondary">Time Remaining</Typography>
                      <Typography variant="h4" fontWeight="900" color={isDark ? 'white' : 'black'} mb={3}>{formatTime(examDurationInSeconds)}</Typography>
                      
                      <Box display="flex" flexWrap="wrap" gap={1.5}>
                        {activeExam?.questions?.map((_, i) => {
                          let bgColor = isDark ? '#38383A' : '#E5E7EB';
                          let color = isDark ? 'white' : 'black';
                          if (answers[i] !== undefined) { bgColor = '#007AFF'; color = 'white'; }
                          else if (visitedQuestions.has(i)) { bgColor = '#FACC15'; color = 'black'; }

                          return (
                            <Box key={i} onClick={() => { setCurrentQuestionIdx(i); setVisitedQuestions(prev => new Set(prev).add(i)); }} sx={{ width: 40, height: 40, bgcolor: bgColor, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: currentQuestionIdx === i ? '2px solid white' : 'none', outline: currentQuestionIdx === i ? `2px solid ${isDark ? '#0A84FF' : 'black'}` : 'none' }}>
                              <Typography fontWeight="bold" color={color}>{i + 1}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>

                    <Box sx={{ bgcolor: isDark ? '#1C1C1E' : 'white', borderRadius: 4, p: 3, border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} color={isDark ? 'white' : 'black'}>System Trust</Typography>
                        <Typography fontSize={14} color={getTrustColor()} fontWeight="bold">{trustScore}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={trustScore} sx={{ height: 10, borderRadius: 5, bgcolor: isDark ? '#38383A' : '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: getTrustColor(), borderRadius: 5 } }} />
                    </Box>

                    <Box sx={{ bgcolor: isDark ? '#1C1C1E' : 'white', borderRadius: 4, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                      <Box p={3} pb={2} display="flex" alignItems="center" gap={1}>
                        <ErrorOutlineIcon sx={{ color: '#F43F5E' }} />
                        <Typography fontWeight={700} color={isDark ? 'white' : 'black'}>Security Logs</Typography>
                      </Box>
                      <Box sx={{ px: 3, pb: 3, flex: 1, overflowY: 'auto' }}>
                        {sessionEvents.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">No anomalies detected.</Typography>
                        ) : (
                          sessionEvents.map((evt, i) => (
                            <Box key={i} sx={{ bgcolor: isDark ? '#4C0519' : '#FECDD3', borderRadius: 3, p: 2, mb: 2 }}>
                              <Typography color={isDark ? '#FDA4AF' : '#BE123C'} fontWeight="bold" display="flex" alignItems="center" gap={1} mb={0.5}>
                                <ErrorOutlineIcon fontSize="small" /> {evt.type}
                              </Typography>
                              <Typography fontSize={12} color={isDark ? '#FDA4AF' : '#BE123C'} opacity={0.9}>{evt.message}</Typography>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>

                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Dialog>

      {/* -------------------------------------------------------------------------------- */}
      {/* OVERLAY 3: RESULTS DIALOG */}
      {/* -------------------------------------------------------------------------------- */}
      <ProctoAiInterviewResults 
        open={examStage === 'result'} 
        examResult={examResult} 
        isDark={isDark} 
        onReturnToDashboard={() => setExamStage('dashboard')} 
      />

      {/* -------------------------------------------------------------------------------- */}
      {/* MOBILE RESTRICTION OVERLAY */}
      {/* -------------------------------------------------------------------------------- */}
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

      {/* -------------------------------------------------------------------------------- */}
      {/* HARDWARE ERROR MODAL */}
      {/* -------------------------------------------------------------------------------- */}
      <Modal open={hardwareIssue.missing} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 5, width: 450, outline: 'none', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {hardwareIssue.type === 'audio' ? (
            <MicOffIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          ) : (
            <VideocamOffIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          )}
          <Typography variant="h5" fontWeight={700} mb={2} color="error">Hardware Disconnected</Typography>
          <Typography variant="body1" color="textSecondary" mb={4}>
            {hardwareIssue.message}
          </Typography>
          <Button variant="contained" color="primary" onClick={runHardwareTests} sx={{ borderRadius: 10, py: 1.5, fontWeight: 'bold', width: '100%' }}>
            Retry Connection
          </Button>
        </Box>
      </Modal>

    </>
  );
}