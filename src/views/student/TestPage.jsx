import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Button,
  Typography,
  Modal,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import RouterIcon from '@mui/icons-material/Router';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from '../../slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from '../../context/CheatingLogContext';
import axiosInstance from '../../axios'; // Added to securely hit relative backend paths

// --- Dynamic Screen Watermarking ---
const WatermarkOverlay = ({ userInfo }) => {
  const watermarkText = `${userInfo?.email || 'Student'} | ${userInfo?.name || 'ID: Unknown'} | IP Tracking Active`;
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0.03,
        display: 'flex',
        flexWrap: 'wrap',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {Array.from({ length: 50 }).map((_, i) => (
        <Typography
          key={i}
          sx={{
            transform: 'rotate(-30deg)',
            whiteSpace: 'nowrap',
            fontSize: '1.5rem',
            p: 4,
            color: 'black',
            fontWeight: 'bold',
          }}
        >
          {watermarkText}
        </Typography>
      ))}
    </Box>
  );
};

const TestPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Audio & Hardware Refs
  const heartbeatRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioAnimationRef = useRef(null);
  const susTimerRef = useRef(null);

  // Tracking Refs to prevent Infinite Loops & Toast Spam
  const lastKeyTimeRef = useRef(Date.now());
  const lastViolationTimesRef = useRef({});
  const loggedViolationsRef = useRef(new Set());
  
  // FIX: Separated IP tracking refs to prevent IPv4 vs IPv6 mismatches causing false VPN flags
  const initialWebrtcIpRef = useRef(null);
  const initialIpifyIpRef = useRef(null);
  
  const cheatingLogRef = useRef({});
  const hasAutoSubmittedRef = useRef(false);

  const { cheatingLog, updateCheatingLog, resetCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth || {});

  const [questions, setQuestions] = useState([]);
  const {
    data: questionsData,
    isLoading: isQuestionsLoading,
    error: questionsError,
  } = useGetQuestionsQuery(examId);
  const { data: userExamdata, isLoading: isExamsLoading, error: examsError } = useGetExamsQuery();

  // States
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenStrikes, setFullscreenStrikes] = useState(0);

  // Security States
  const [isSuspiciousEnv, setIsSuspiciousEnv] = useState(false);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [multipleIpDetected, setMultipleIpDetected] = useState(false);

  // Dynamic Blur & Darkness States
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [darknessLevel, setDarknessLevel] = useState(0);

  // Section Transition States
  const [sectionSwitchModal, setSectionSwitchModal] = useState(false);
  const [targetSection, setTargetSection] = useState('coding');
  const [currentSection, setCurrentSection] = useState('mcq');

  // Real-time indicators
  const [riskScore, setRiskScore] = useState(0);
  const trustScore = Math.max(0, 100 - riskScore);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [hasShownTrustModal, setHasShownTrustModal] = useState(false);
  const [sessionEvents, setSessionEvents] = useState([]);

  // Question UI State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));

  useEffect(() => {
    cheatingLogRef.current = cheatingLog || {};
  }, [cheatingLog]);

  useEffect(() => {
    if (Array.isArray(userExamdata)) {
      const exam = userExamdata.find((e) => e.examId === examId);
      if (exam?.duration) {
  setExamDurationInSeconds(exam.duration * 60);
}
    }
  }, [userExamdata, examId]);

  // Robustly handle API response shapes for questions
  useEffect(() => {
    if (Array.isArray(questionsData)) {
      setQuestions(questionsData);
    } else if (questionsData && Array.isArray(questionsData.questions)) {
      setQuestions(questionsData.questions);
    } else if (questionsData && Array.isArray(questionsData.data)) {
      setQuestions(questionsData.data);
    }
  }, [questionsData]);

  // --- ANTI-SPAM AUTO SUBMIT ---
  useEffect(() => {
    if (riskScore >= 100 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      toast.error('System Integrity critical. Auto-submitting exam.');
      handleTestSubmission();
    }
  }, [riskScore]);

  // --- Trust Indicator Logic ---
  const getTrustColor = () => {
    if (trustScore > 50) return '#22C55E';
    if (trustScore > 20) return '#FACC15';
    return '#EF4444';
  };

  useEffect(() => {
    if (trustScore <= 50 && !hasShownTrustModal) {
      setShowTrustModal(true);
      setHasShownTrustModal(true);
    }
  }, [trustScore, hasShownTrustModal]);

  // --- Active Countdown Timer ---
  useEffect(() => {
    if (!isFullscreen || networkIssue || vpnDetected || multipleIpDetected || isSuspiciousEnv)
      return;
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
  }, [isFullscreen, networkIssue, vpnDetected, multipleIpDetected, isSuspiciousEnv]);

  // --- STABLE REGISTRATION ---
  const registerViolation = useCallback(
    (type, message, severity = 'critical', weight = 20) => {
      const now = Date.now();
      const lastTime = lastViolationTimesRef.current[type] || 0;

      if (now - lastTime < 10000) return;
      lastViolationTimesRef.current[type] = now;

      if (
        ['VPN_DETECTED', 'MULTIPLE_IPS', 'DEV_TOOLS_OR_VM'].includes(type) &&
        loggedViolationsRef.current.has(type)
      ) {
        return;
      }
      loggedViolationsRef.current.add(type);

      updateCheatingLog({ [type]: (cheatingLogRef.current[type] || 0) + 1 });

      setSessionEvents((prev) => [
        {
          type: type.replace(/_/g, ' ').toUpperCase(),
          message,
          time: new Date().toLocaleTimeString(),
          severity,
        },
        ...prev,
      ]);

      setRiskScore((prev) => Math.min(100, prev + weight));
      toast.error(message);
    },
    [updateCheatingLog],
  );

  // --- DYNAMIC Object Detection & Screen Darkening ---
  const handleObjectDetection = useCallback(
    (item, distanceScale = 0.8) => {
      const dynamicBlur = distanceScale * 30;
      const dynamicDarkness = Math.min(0.95, distanceScale * 1.2);

      setBlurIntensity(dynamicBlur);
      setDarknessLevel(dynamicDarkness);
      setIsSuspiciousEnv(true);

      registerViolation('PROHIBITED_OBJECT', `${item} detected in environment`, 'critical', 25);

      if (susTimerRef.current) clearTimeout(susTimerRef.current);
      susTimerRef.current = setTimeout(() => {
        setIsSuspiciousEnv(false);
        setBlurIntensity(0);
        setDarknessLevel(0);
      }, 5000);
    },
    [registerViolation],
  );

  // --- WebRTC Multiple IP / Remote PC Detection ---
  useEffect(() => {
    if (!isFullscreen) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.createDataChannel('');
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {});

    pc.onicecandidate = (event) => {
      if (!event || !event.candidate) return;
      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g;
      const matches = event.candidate.candidate.match(ipRegex);

      if (matches && matches.length > 0) {
        const detectedIp = matches[0];
        const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.)/.test(detectedIp);

        if (!isPrivate) {
          if (!initialWebrtcIpRef.current) {
            initialWebrtcIpRef.current = detectedIp;
          } else if (initialWebrtcIpRef.current !== detectedIp) {
            setMultipleIpDetected(true);
            registerViolation(
              'MULTIPLE_IPS',
              'Secondary routing IP detected (Remote PC / VPN active)',
              'critical',
              40,
            );
          }
        }
      }
    };
    return () => pc.close();
  }, [isFullscreen, registerViolation]);

  // --- Realtime Public IP Monitor ---
  const monitorPublicIP = async () => {
    try {
      // FIX: Force API to return IPv4 to prevent mismatches
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      const currentIp = data.ip;

      if (!initialIpifyIpRef.current) {
        initialIpifyIpRef.current = currentIp;
      } else if (initialIpifyIpRef.current !== currentIp) {
        setVpnDetected(true);
        registerViolation(
          'VPN_DETECTED',
          'Network IP changed dynamically mid-exam (VPN/Proxy active)',
          'critical',
          40,
        );
      }
    } catch (err) {
      console.log('IP Monitor skipped');
    }
  };

  // --- Network Interruption Detection ---
  useEffect(() => {
    const handleOffline = () => {
      setNetworkIssue(true);
      registerViolation('NETWORK_DISCONNECT', 'Internet connection lost', 'high', 15);
    };
    const handleOnline = () => setNetworkIssue(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [registerViolation]);

  // --- Audio Monitoring ---
  const initializeAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 256;
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;

        if (average > 35) {
          registerViolation('AUDIO_ANOMALY', 'Ambient noise or speaking detected', 'high', 10);
        }
        audioAnimationRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
      audioContextRef.current = audioContext;
    } catch (err) {
      registerViolation('HARDWARE_ERROR', 'Microphone access denied', 'critical', 30);
    }
  };

  // --- Secure Browser Event Lockdowns ---
  useEffect(() => {
    if (!isFullscreen) return;

    if (navigator.webdriver || window.outerWidth - window.innerWidth > 200) {
      registerViolation(
        'DEV_TOOLS_OR_VM',
        'Virtual Machine or Developer Tools detected',
        'critical',
        50,
      );
    }

    const handleContextMenu = (e) => {
      e.preventDefault();
      registerViolation('SECURE_BROWSER', 'Right-click disabled', 'high', 5);
    };
    const handleCopy = (e) => {
      e.preventDefault();
      registerViolation('SECURE_BROWSER', 'Copy disabled', 'high', 10);
    };
    const handlePaste = (e) => {
      e.preventDefault();
      registerViolation('SECURE_BROWSER', 'Paste disabled', 'high', 10);
    };
    const handleCut = (e) => {
      e.preventDefault();
      registerViolation('SECURE_BROWSER', 'Cut disabled', 'high', 10);
    };
    const handleDrag = (e) => {
      e.preventDefault();
      registerViolation('SECURE_BROWSER', 'Drag/Drop disabled', 'high', 5);
    };
    const handleVisibilityChange = () => {
      if (document.hidden)
        registerViolation('TAB_SWITCH', 'User switched tabs or minimized', 'critical', 25);
    };
    const handleWindowBlur = () => {
      registerViolation('WINDOW_BLUR', 'Exam window lost focus', 'critical', 20);
    };

    const handleKeyDown = (e) => {
      const now = Date.now();
      if (now - lastKeyTimeRef.current < 20) {
        registerViolation('ABNORMAL_KEYSTROKES', 'Automated input pattern detected', 'high', 15);
      }
      lastKeyTimeRef.current = now;

      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['s', 'S', '3', '4', '5'].includes(e.key))
      ) {
        e.preventDefault();
        registerViolation(
          'SCREEN_CAPTURE_ATTEMPT',
          'Screenshot or screen recording shortcut used',
          'critical',
          35,
        );
      }

      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        registerViolation('SECURE_BROWSER', 'Shortcuts disabled', 'high', 10);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('dragstart', handleDrag);
    document.addEventListener('drop', handleDrag);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    initializeAudioMonitoring();

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('dragstart', handleDrag);
      document.removeEventListener('drop', handleDrag);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);

      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isFullscreen, registerViolation]);

  const handleStartExam = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      localStorage.setItem('examInProgress', examId);

      await monitorPublicIP();

      heartbeatRef.current = setInterval(async () => {
        if (!navigator.onLine) return;
        monitorPublicIP();

        try {
          // FIX: Secure backend call replacing the hardcoded http://localhost:5000 
          // Softened to prevent false-positives triggered by hosted reverse proxies
          const res = await axiosInstance.get('/network/check');
          const result = res.data;
          
          if (result && result.ipChanged === true) {
            setVpnDetected(true);
            registerViolation(
              'VPN_DETECTED',
              'Active VPN or network routing change detected',
              'critical',
              40,
            );
          } else if (result && result.networkRisk?.risk >= 85) {
            registerViolation('NETWORK_RISK', 'Suspicious network routing', 'high', 25);
          }
        } catch (err) {
            // Silently fail if endpoint is down, rely on frontend monitorPublicIP instead
        }
      }, 10000);
    } catch {
      toast.error('Fullscreen access required.');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !hasAutoSubmittedRef.current) {
        setIsFullscreen(false);
        const newStrikes = fullscreenStrikes + 1;
        setFullscreenStrikes(newStrikes);
        registerViolation(
          'FULLSCREEN_EXIT',
          `Exited fullscreen mode. Warning ${newStrikes}/3`,
          'critical',
          20,
        );

        if (newStrikes >= 3 && !hasAutoSubmittedRef.current) {
          toast.error('Maximum violations reached. Submitting test.');
          hasAutoSubmittedRef.current = true;
          handleTestSubmission();
        }
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [fullscreenStrikes, registerViolation]);

  // --- SECTION TRANSITION & SUBMISSION LOGIC ---
  const handleTestSubmission = useCallback(async () => {
  if (isSubmitting) return;

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");

    // ================= TOKEN CHECK =================
    if (!token) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
      setIsSubmitting(false);
      return;
    }

    // ================= PREVENT EMPTY SUBMISSION =================
    if (Object.keys(answers).length === 0) {
      toast.error("No answers selected");
      setIsSubmitting(false);
      return;
    }

    // ================= FORMAT MCQ ANSWERS =================
    const userResponses = Object.keys(answers).map((idx) => {
      const index = Number(idx);

      return {
        questionId: questions[index]?._id,
        selectedOption: answers[index],
      };
    });

    // ================= SUBMIT RESULT =================
    await axiosInstance.post(
      "/api/results/submit",
      {
        examId,
        answers: userResponses,
        codingSubmissions: [], // MCQ section only
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // ================= SAVE CHEATING LOG =================
    const payload = {
      examId,
      username: userInfo?.name,
      email: userInfo?.email,
      ...cheatingLogRef.current,
    };

    await saveCheatingLogMutation(payload).unwrap();

    toast.success("Exam submitted successfully");

    // ================= EXIT FULLSCREEN =================
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }

    navigate("/success");

  } catch (error) {

    console.error("Submission Error:", error);

    toast.error(
      error?.response?.data?.message || "Submission failed. Check connection."
    );

    setIsSubmitting(false);
    hasAutoSubmittedRef.current = false;
  }
}, [
  answers,
  questions,
  examId,
  userInfo,
  saveCheatingLogMutation,
  navigate,
  isSubmitting,
]);

  const handleSectionChangeAttempt = (sectionValue) => {
    if (sectionValue === 'coding') {
      setTargetSection('coding');
      setSectionSwitchModal(true);
    } else {
      setTargetSection(sectionValue);
      setSectionSwitchModal(true);
    }
  };

  const confirmSectionSwitch = () => {
    setSectionSwitchModal(false);
    if (targetSection === 'submit') {
      handleTestSubmission();
    } else if (targetSection === 'coding') {
      navigate(`/exam/${examId}/code`);
    } else {
      handleTestSubmission();
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentQuestionIdx(nextIdx);
      setVisitedQuestions((prev) => new Set(prev).add(nextIdx));
    }
  };

  const handlePaletteClick = (idx) => {
    setCurrentQuestionIdx(idx);
    setVisitedQuestions((prev) => new Set(prev).add(idx));
  };

  const handleSelectOption = (optIdx) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIdx]: optIdx }));
  };

  const handleClearOption = () => {
    setAnswers((prev) => {
      const newAns = { ...prev };
      delete newAns[currentQuestionIdx];
      return newAns;
    });
  };

  const formatTime = (seconds = 0) =>
  new Date(seconds * 1000).toISOString().substr(11, 8);

  const currentQ = questions[currentQuestionIdx] || {};
  const displayQuestionText =
    currentQ.questionText || currentQ.question || currentQ.text || currentQ.title || 'Loading...';
  const currentOptions = currentQ.options || currentQ.choices || currentQ.answers || [];

  const attemptedCount = Object.keys(answers || {}).length;
  // Dynamically checking if it's the last question or only question available
  const isLastQuestion = questions.length === 0 || currentQuestionIdx === questions.length - 1;

  if (isExamsLoading || isQuestionsLoading)
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: '#E9EEF4',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      {/* --- ALL SECURITY MODALS --- */}
      <Modal
        open={multipleIpDetected}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <RouterIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2} color="error">
            Multiple IP Addresses Detected
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Your exam is paused. We detected multiple network interfaces or a secondary Public IP
            routing to this machine. This indicates a Remote PC connection (AnyDesk/TeamViewer) or
            VPN tunnel, which is strictly prohibited. Please disable them to continue.
          </Typography>
        </Box>
      </Modal>

      <Modal
        open={vpnDetected && !multipleIpDetected}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <VpnLockIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2} color="error">
            VPN / Proxy Detected
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Your exam has been paused because a VPN, secure proxy, or dynamic IP change was detected
            mid-exam. Please disable it to maintain exam integrity.
          </Typography>
        </Box>
      </Modal>

      <Modal
        open={showTrustModal && !vpnDetected && !multipleIpDetected}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
          zIndex: 99999,
        }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}
        >
          <HealthAndSafetyIcon sx={{ fontSize: 60, color: '#FACC15', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2}>
            Trust Score Warning
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={4}>
            Your system integrity score has dropped to {trustScore}%. Multiple violations have been
            logged. Continued suspicious activity will result in automatic exam termination.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ bgcolor: '#4F46E5', py: 1.5, borderRadius: 1.5 }}
            onClick={() => setShowTrustModal(false)}
          >
            I Understand
          </Button>
        </Box>
      </Modal>

      <Modal
        open={networkIssue && !vpnDetected && !multipleIpDetected}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <WarningRoundedIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2} color="error">
            Connection Lost
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Your exam is paused. We detected a network disconnect. Please reconnect to your original
            network to continue.
          </Typography>
          <CircularProgress size={30} sx={{ mt: 2 }} />
        </Box>
      </Modal>

      <Modal
        open={!isFullscreen && !networkIssue && !vpnDetected && !multipleIpDetected}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
          zIndex: 99999,
        }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}
        >
          <WarningRoundedIcon sx={{ fontSize: 60, color: '#FACC15', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2}>
            Fullscreen Required
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3} px={2}>
            This assessment requires your browser window to be in full screen mode.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#4F46E5',
              '&:hover': { bgcolor: '#4338CA' },
              mb: 4,
              py: 1.5,
              borderRadius: 1.5,
            }}
            onClick={handleStartExam}
          >
            Enter Fullscreen
          </Button>
        </Box>
      </Modal>

      {/* --- SECTION TRANSITION MODAL --- */}
      <Modal
        open={sectionSwitchModal}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      >
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 5,
            width: 450,
            outline: 'none',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <WarningRoundedIcon sx={{ fontSize: 60, color: '#FACC15', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2}>
            Proceed to Next Section?
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={4}>
            Are you sure you want to complete this section? You will not be able to return to these
            questions once you proceed.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => setSectionSwitchModal(false)}
              sx={{ px: 4, borderRadius: 1.5, color: 'text.secondary', borderColor: '#E2E8F0' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={confirmSectionSwitch}
              sx={{ px: 4, borderRadius: 1.5, bgcolor: '#4F46E5' }}
            >
              Proceed
            </Button>
          </Box>
        </Box>
      </Modal>

      {isFullscreen && (
        <>
          <WatermarkOverlay userInfo={userInfo} />

          {/* DYNAMIC SCREEN DARKENING OVERLAY */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: `rgba(0,0,0,${darknessLevel})`,
              opacity: isSuspiciousEnv ? 1 : 0,
              pointerEvents: isSuspiciousEnv ? 'all' : 'none',
              transition: 'background-color 0.5s ease-in-out, opacity 0.5s ease-in-out',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <WarningRoundedIcon sx={{ fontSize: 100, color: '#EF4444', mb: 2 }} />
            <Typography variant="h2" color="#EF4444" fontWeight="bold">
              Suspicious Environment
            </Typography>
            <Typography variant="h5" color="white" mt={2}>
              Prohibited object detected.
            </Typography>
            <Typography variant="body1" color="gray" mt={1}>
              The exam is paused. Please remove the object immediately.
            </Typography>
          </Box>

          {/* MAIN UI COMPONENT WITH DYNAMIC BLUR */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              filter: `blur(${blurIntensity}px)`,
              transition: 'filter 0.5s ease-in-out',
              pointerEvents: isSuspiciousEnv ? 'none' : 'auto',
            }}
          >
            {/* HEADER */}
            <Box
              sx={{
                height: 80,
                bgcolor: '#6B879E',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 4,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                zIndex: 10,
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MonitorHeartIcon sx={{ color: '#002B5B' }} />
                </Box>
                <Box color="white">
                  <Typography variant="h6" fontWeight={700} lineHeight={1}>
                    Procto.ai
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Advanced proctoring System
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={3}>
                <Button
                  variant="contained"
                  onClick={() => handleSectionChangeAttempt('submit')}
                  sx={{
                    bgcolor: '#FDBA74',
                    color: 'black',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { bgcolor: '#F9A826' },
                  }}
                >
                  Finish Test
                </Button>

                {/* Circular Webcam with LIVE Tag */}
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    border: '3px solid white',
                    bgcolor: '#ccc',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'red',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 1,
                      zIndex: 20,
                    }}
                  >
                    LIVE
                  </Box>
                  <Box
                    sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
                  >
                    <WebCam
                      cheatingLog={cheatingLog}
                      updateCheatingLog={updateCheatingLog}
                      onObjectDetected={(item, scale) => handleObjectDetection(item, scale)}
                      onFaceLost={() =>
                        registerViolation('FACE_LOST', 'Face not visible', 'high', 20)
                      }
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* MAIN CONTENT AREA */}
            <Box sx={{ flex: 1, display: 'flex', gap: 3, p: 3, overflow: 'hidden' }}>
              {/* LEFT PANE - Question Area */}
              <Box
                sx={{
                  flex: 7,
                  bgcolor: 'white',
                  borderRadius: 4,
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflowY: 'auto',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={4}>
                  <Typography variant="h6">Question {currentQuestionIdx + 1}</Typography>
                  <Typography
                    variant="body1"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Revise Later
                  </Typography>
                </Box>

                <Typography variant="h5" fontWeight={400} mb={6} sx={{ maxWidth: '80%' }}>
                  {displayQuestionText}
                </Typography>

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body1">Choose the best option</Typography>
                  <Typography
                    variant="body1"
                    sx={{ cursor: 'pointer', fontWeight: 500 }}
                    onClick={handleClearOption}
                  >
                    Clear
                  </Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={2} mb={4}>
                  {currentOptions.map((opt, i) => {
                    const optionText =
                      typeof opt === 'object'
                        ? opt.optionText || opt.option || opt.text || opt.value
                        : opt;
                    const isSelected = answers[currentQuestionIdx] === i;
                    return (
                      <Box
                        key={i}
                        onClick={() => handleSelectOption(i)}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: isSelected ? '#10B981' : '#E0E0E0',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                          bgcolor: isSelected ? '#F0FDF4' : 'transparent',
                          '&:hover': { borderColor: '#10B981' },
                        }}
                      >
                        <Typography variant="body1" fontWeight={isSelected ? 600 : 400}>
                          {optionText}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#0EA5E9', borderRadius: 1.5, textTransform: 'none', px: 4 }}
                  >
                    Save Draft
                  </Button>

                  {/* DYNAMIC NEXT/SUBMIT BUTTON */}
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: '#22C55E',
                      borderRadius: 1.5,
                      textTransform: 'none',
                      px: 4,
                      '&:hover': { bgcolor: '#16A34A' },
                    }}
                    onClick={
                      isLastQuestion
                        ? () => handleSectionChangeAttempt('coding')
                        : handleNextQuestion
                    }
                  >
                    {isLastQuestion ? 'Proceed to Coding' : 'Next Question'}
                  </Button>
                </Box>
              </Box>

              {/* RIGHT PANE - Sidebar */}
              <Box
                sx={{
                  flex: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  overflow: 'hidden',
                }}
              >
                {/* Timers & Palette Card */}
                <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, flexShrink: 0 }}>
                  <Box display="flex" gap={2} mb={3}>
                    <Box flex={1}>
                      <Typography variant="caption" fontWeight="bold">
                        Test Timer
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: '#E5E7EB',
                          borderRadius: 1.5,
                          py: 1,
                          textAlign: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography fontWeight="bold">
                          {formatTime(examDurationInSeconds)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="caption" fontWeight="bold">
                        Section Timer
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: '#E5E7EB',
                          borderRadius: 1.5,
                          py: 1,
                          textAlign: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography fontWeight="bold">
                          {formatTime(examDurationInSeconds)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* SECTION CHOOSER DROPDOWN */}
                  <Box mb={3}>
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="textSecondary"
                      mb={0.5}
                      display="block"
                    >
                      Current Section
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={currentSection}
                        onChange={(e) => {
                          setCurrentSection(e.target.value);
                          handleSectionChangeAttempt(e.target.value);
                        }}
                        sx={{
                          bgcolor: '#F8FAFC',
                          borderRadius: 1.5,
                          '& fieldset': { borderColor: '#E2E8F0' },
                          fontSize: 14,
                        }}
                      >
                        <MenuItem value="mcq" disabled>
                          Multiple Choice (Completed)
                        </MenuItem>
                        <MenuItem value="coding">Coding Questions</MenuItem>
                        <MenuItem value="submit">Final Submission</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box mb={2} display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="caption"
                      sx={{ bgcolor: '#E5E7EB', px: 1, py: 0.2, borderRadius: 1 }}
                    >
                      Attempted {attemptedCount}/{questions.length}
                    </Typography>
                  </Box>

                  {/* QUESTION PALETTE */}
                  <Box display="flex" flexWrap="wrap" gap={1.5}>
                    {questions.map((_, i) => {
                      let bgColor = '#EF4444'; // Red (Not Visited)
                      if (answers[i] !== undefined)
                        bgColor = '#22C55E'; // Green (Answered)
                      else if (visitedQuestions.has(i)) bgColor = '#FACC15'; // Yellow (Visited)

                      return (
                        <Box
                          key={i}
                          onClick={() => handlePaletteClick(i)}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: bgColor,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: currentQuestionIdx === i ? '2px solid black' : 'none',
                          }}
                        >
                          <Typography
                            fontWeight="bold"
                            color={bgColor === '#FACC15' ? 'black' : 'white'}
                          >
                            {i + 1}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Trust Indicator Card */}
                <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, flexShrink: 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={600} fontSize={18}>
                        Trust indicator
                      </Typography>
                      <HealthAndSafetyIcon sx={{ color: getTrustColor() }} />
                    </Box>
                    <Typography fontSize={12} color={getTrustColor()} fontWeight="bold">
                      {trustScore}% integrity
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={trustScore}
                    sx={{
                      height: 12,
                      borderRadius: 10,
                      bgcolor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getTrustColor(),
                        borderRadius: 10,
                        transition: 'background-color 0.5s ease',
                      },
                    }}
                  />
                </Box>

                {/* Session Events Logger (SCROLLING ONLY THIS PART) */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <Box p={3} pb={2} display="flex" alignItems="center" gap={1}>
                    <ErrorOutlineIcon sx={{ color: '#F43F5E' }} />
                    <Typography fontWeight={600} fontSize={18}>
                      Session Events
                    </Typography>
                  </Box>

                  <Box sx={{ px: 3, pb: 3, flex: 1, overflowY: 'auto' }}>
                    {sessionEvents.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No anomalies detected.
                      </Typography>
                    ) : (
                      sessionEvents.map((evt, i) => (
                        <Box key={i} sx={{ bgcolor: '#FECDD3', borderRadius: 3, p: 2, mb: 2 }}>
                          <Typography
                            color="#BE123C"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            mb={1}
                          >
                            <ErrorOutlineIcon fontSize="small" />{' '}
                            {evt.type === 'FACE_LOST' ? 'Face Removed' : evt.type}
                          </Typography>
                          <Typography fontSize={12} color="#BE123C" mb={1}>
                            {evt.message}
                          </Typography>
                          <Typography fontSize={10} color="#BE123C" textAlign="right">
                            {evt.time}
                          </Typography>
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
  );
};

export default TestPage;