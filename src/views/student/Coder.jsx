import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';
import axiosInstance from '../../axios';
import {
  Box,
  CircularProgress,
  Button,
  Typography,
  Modal,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import RouterIcon from '@mui/icons-material/Router';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import TerminalIcon from '@mui/icons-material/Terminal';
import WebCam from '../student/Components/WebCam';

import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// FIXED IMPORTS: Using relative paths prevents the "_s is not a function" Webpack crash
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from '../../slices/cheatingLogApiSlice';
import { useCheatingLog } from '../../context/CheatingLogContext';

/* ================= CONFIG & BOILERPLATE ================= */
// Piston API uses version '*' to automatically resolve the correct backend version
const LANGUAGE_TEMPLATES = {
  c: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    // Write your C++ code here\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");\n',
  python: '# Write your Python code here\nprint("Hello, World!")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n        System.out.println("Hello, World!");\n    }\n}\n',
};

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

// --- 3D Popup Animation Styles ---
const modal3DStyle = {
  bgcolor: 'white',
  borderRadius: 3,
  p: 5,
  width: 450,
  outline: 'none',
  textAlign: 'center',
  boxShadow: '0px 20px 40px rgba(0,0,0,0.4), 0px 0px 0px 1px rgba(255,255,255,0.1) inset',
  transform: 'scale(1)',
  animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
  '@keyframes popIn': {
    '0%': { transform: 'scale(0.8)', opacity: 0 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
};

export default function Coder() {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Proctoring Refs
  const heartbeatRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioAnimationRef = useRef(null);
  const susTimerRef = useRef(null);

  const lastKeyTimeRef = useRef(Date.now());
  const lastViolationTimesRef = useRef({});
  const loggedViolationsRef = useRef(new Set());
  
  const initialWebrtcIpRef = useRef(null);
  const initialIpifyIpRef = useRef(null);
  
  const cheatingLogRef = useRef({});
  const hasAutoSubmittedRef = useRef(false);

  const { cheatingLog, updateCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const { userInfo } = useSelector((state) => state.auth || {});

  const [questions, setQuestions] = useState([]);
  const { data: questionsData, isLoading: isQuestionsLoading } = useGetQuestionsQuery(examId);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();

  // Global States
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenStrikes, setFullscreenStrikes] = useState(0);

  // Editor States
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES['c']);
  const [savedCodes, setSavedCodes] = useState({}); // Stores code per question and language
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Navigation States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [revisitQuestions, setRevisitQuestions] = useState(new Set());
  const [answers, setAnswers] = useState({}); 
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  // Tracking solved code questions

  // Security States
  const [isSuspiciousEnv, setIsSuspiciousEnv] = useState(false);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [multipleIpDetected, setMultipleIpDetected] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [darknessLevel, setDarknessLevel] = useState(0);

  // Real-time indicators
  const [riskScore, setRiskScore] = useState(0);
  const trustScore = Math.max(0, 100 - riskScore);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [hasShownTrustModal, setHasShownTrustModal] = useState(false);
  const [sessionEvents, setSessionEvents] = useState([]);

  /* ================= DATA INITIALIZATION ================= */
  useEffect(() => {
    cheatingLogRef.current = cheatingLog || {};
  }, [cheatingLog]);

  useEffect(() => {
    if (Array.isArray(userExamdata)) {
      const exam = userExamdata.find(
  (e) => e.examId === examId || e._id === examId
);
      if (exam?.duration) setExamDurationInSeconds(exam.duration * 60);
    }
  }, [userExamdata, examId]);

  useEffect(() => {
  if (!questionsData) return;

  let extractedQuestions = [];

  if (Array.isArray(questionsData)) {
    extractedQuestions = questionsData;
  } 
  else if (Array.isArray(questionsData.questions)) {
    extractedQuestions = questionsData.questions;
  } 
  else if (Array.isArray(questionsData.data)) {
    extractedQuestions = questionsData.data;
  } 
  else if (Array.isArray(questionsData.data?.questions)) {
    extractedQuestions = questionsData.data.questions;
  } 
  else if (Array.isArray(questionsData.results)) {
    extractedQuestions = questionsData.results;
  }

  setQuestions(extractedQuestions);

}, [questionsData]);

  /* ================= PROCTORING LOGIC ================= */
  useEffect(() => {
  if (riskScore >= 100 && !hasAutoSubmittedRef.current) {
    hasAutoSubmittedRef.current = true;
    toast.error("System Integrity critical. Auto-submitting exam.");
    handleTestSubmission();
  }
}, [riskScore]);

  const getTrustColor = () => {
    if (trustScore > 50) return '#22C55E';
    if (trustScore > 20) return '#FACC15';
    return '#EF4444';
  };

  const getTrustEmoji = () => {
    if (trustScore > 80) return '😇';
    if (trustScore > 50) return '😐';
    if (trustScore > 20) return '😟';
    return '😡';
  };

  useEffect(() => {
    if (trustScore <= 50 && !hasShownTrustModal) {
      setShowTrustModal(true);
      setHasShownTrustModal(true);
    }
  }, [trustScore, hasShownTrustModal]);

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
          if (!initialWebrtcIpRef.current) initialWebrtcIpRef.current = detectedIp;
          else if (initialWebrtcIpRef.current !== detectedIp) {
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

  const monitorPublicIP = async () => {
    try {
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
        if (average > 35)
          registerViolation('AUDIO_ANOMALY', 'Ambient noise or speaking detected', 'high', 10);
        audioAnimationRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
      audioContextRef.current = audioContext;
    } catch (err) {
      registerViolation('HARDWARE_ERROR', 'Microphone access denied', 'critical', 30);
    }
  };

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

    const preventDefault = (e) => e.preventDefault();
    const handleVisibilityChange = () => {
      if (document.hidden)
        registerViolation('TAB_SWITCH', 'User switched tabs or minimized', 'critical', 25);
    };
    const handleWindowBlur = () => {
      registerViolation('WINDOW_BLUR', 'Exam window lost focus', 'critical', 20);
    };

    const handleKeyDown = (e) => {
      const now = Date.now();
      if (now - lastKeyTimeRef.current < 20)
        registerViolation('ABNORMAL_KEYSTROKES', 'Automated input pattern detected', 'high', 15);
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

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('drop', preventDefault);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);

    initializeAudioMonitoring();

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('drop', preventDefault);
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
          const res = await axiosInstance.get('/network/check');
          const result = res.data;
          
          if (result && (result.vpnDetected === true || result.networkRisk?.vpn === true)) {
            setVpnDetected(true);
            registerViolation(
              'VPN_DETECTED',
              'Active VPN or Proxy detected by backend',
              'critical',
              40,
            );
          } else if (result && (result.networkRisk?.risk >= 85 || result.ipChanged === true)) {
            registerViolation('NETWORK_RISK', 'Suspicious network routing', 'high', 25);
          }
        } catch {}
      }, 10000);
    } catch {
      toast.error('Fullscreen access required.');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (hasAutoSubmittedRef.current || isSubmitting) return;

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
  }, [fullscreenStrikes, registerViolation, isSubmitting]);

  /* ================= EDITOR LOGIC ================= */
  
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setSavedCodes((prev) => ({
      ...prev,
      [currentQuestionIdx]: {
        ...(prev[currentQuestionIdx] || {}),
        [language]: newCode,
      },
    }));
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    
    const existingCode = savedCodes[currentQuestionIdx]?.[newLang];
    setCode(existingCode !== undefined ? existingCode : LANGUAGE_TEMPLATES[newLang]);
  };

  const handleResetCode = () => {
    if (
      window.confirm(
        'Are you sure you want to reset your code to the default template? This action cannot be undone.',
      )
    ) {
      const resetCode = LANGUAGE_TEMPLATES[language];
      setCode(resetCode);
      setSavedCodes((prev) => ({
        ...prev,
        [currentQuestionIdx]: {
          ...(prev[currentQuestionIdx] || {}),
          [language]: resetCode,
        },
      }));
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setIsError(false);
    setOutput('');
    setTestResults(null);
    
    const testCases = questions[currentQuestionIdx]?.testCases || [];
    
    try {
      if (testCases.length === 0) {
        // Run normally without specific test cases
        const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language: language === 'c' || language === 'cpp' ? 'cpp' : language, // Piston compiler alias logic
          version: '*',
          files: [{ content: code }],
        });
        setOutput(res.data.run.stderr || res.data.run.stdout || 'Program exited with no output.');
        setIsError(!!res.data.run.stderr);
      } else {
        // Loop through test cases and feed stdin
        const results = [];
        for (const tc of testCases) {
          const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: language === 'c' || language === 'cpp' ? 'cpp' : language,
            version: '*',
            files: [{ content: code }],
            stdin: tc.input || ""
          });
          
          const actualOutput = (res.data.run.stdout || "").trim();
          const expectedOutput = (tc.output || "").trim();
          const hasError = !!res.data.run.stderr;
          const passed = !hasError && (actualOutput === expectedOutput);
          
          results.push({
            ...tc,
            actualOutput: hasError ? res.data.run.stderr.trim() : actualOutput,
            passed
          });
        }
        setTestResults(results);
      }
    } catch {
      setIsError(true);
      setOutput('Execution failed. Please check your network or code syntax.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = () => {

  const currentQ = questions[currentQuestionIdx] || {};

  const submission = {
    questionId: currentQ._id,
    code: code,
    language: language || "javascript",
  };

  setCodingSubmissions((prev) => {

    const existing = prev.find(
      (item) => item.questionId === submission.questionId
    );

    if (existing) {
      return prev.map((item) =>
        item.questionId === submission.questionId ? submission : item
      );
    }

    return [...prev, submission];
  });

  // mark coding question attempted
  setAnswers((prev) => ({
  ...prev,
  [currentQuestionIdx]: {
    attempted: true
  }
}));

  toast.success("Solution submitted successfully!");
};
 
///////////////// test solution///////////
  const handleTestSubmission = useCallback(async () => {

  if (isSubmitting) return;

  setIsSubmitting(true);
  hasAutoSubmittedRef.current = true;

  try {

    const token = localStorage.getItem("token");

    const formattedAnswers = {};

    Object.keys(answers || {}).forEach((idx) => {

      const questionId = questions[idx]?._id;

      if (!questionId) return;

      formattedAnswers[questionId] = answers[idx];

    });

    const payload = {
      examId,
      answers: formattedAnswers,
      codingSubmissions: codingSubmissions || [],
    };

    console.log("Submitting exam payload:", payload);

    await axiosInstance.post(
      "/api/results/submit",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const cheatingPayload = {
      ...cheatingLogRef.current,
      username: userInfo?.name,
      email: userInfo?.email,
      examId,
    };

    await saveCheatingLogMutation(cheatingPayload).unwrap();

    toast.success("Exam submitted successfully");

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }

    navigate("/success");

  } catch (error) {

    console.error("Exam submission error:", error?.response?.data || error);

    toast.error(
      error?.response?.data?.message || "Submission failed. Check connection."
    );

    setIsSubmitting(false);
    hasAutoSubmittedRef.current = false;

  }

}, [
  answers,
  questions,
  codingSubmissions,
  examId,
  userInfo,
  navigate,
  saveCheatingLogMutation,
  isSubmitting
]);





  const handlePaletteClick = (idx) => {
    setCurrentQuestionIdx(idx);
    setVisitedQuestions((prev) => new Set(prev).add(idx));
    setTestResults(null); 
    setOutput('');
    
    // Restore saved code for the clicked question
    const existingCode = savedCodes[idx]?.[language];
    setCode(existingCode !== undefined ? existingCode : LANGUAGE_TEMPLATES[language]);
  };

  const handleRevisitToggle = () => {
    setRevisitQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIdx)) newSet.delete(currentQuestionIdx);
      else newSet.add(currentQuestionIdx);
      return newSet;
    });
  };

const formatTime = (seconds = 0) => new Date(seconds * 1000).toISOString().substr(11, 8);

  const currentQ = questions[currentQuestionIdx] || {};
  const displayQuestionTitle =
    currentQ.question || currentQ.title || currentQ.name || `Question ${currentQuestionIdx + 1}`;
  const displayQuestionText =
    currentQ.description || currentQ.text || currentQ.body || currentQ.content || 'Question details are unavailable.';
  const attemptedCount = Object.keys(answers || {}).length;

  if (isExamsLoading || isQuestionsLoading)
    return (
      <Box minHeight="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );

  /* ================= UI RENDER ================= */
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: '#E9EEF4',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
      }}
    >
      {/* --- ALL SECURITY MODALS (3D POPUP STYLES) --- */}
      <Modal
        open={multipleIpDetected}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}
      >
        <Box sx={modal3DStyle}>
          <RouterIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} mb={2} color="error">
            Multiple IP Addresses Detected
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Your exam is paused. We detected multiple network interfaces or a secondary Public IP
            routing to this machine. This indicates a Remote PC connection or VPN tunnel, which is
            strictly prohibited. Please disable them to continue.
          </Typography>
        </Box>
      </Modal>

      <Modal
        open={vpnDetected && !multipleIpDetected}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}
      >
        <Box sx={modal3DStyle}>
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
          zIndex: 999999,
        }}
      >
        <Box sx={modal3DStyle}>
          <Typography fontSize={60} mb={1}>{getTrustEmoji()}</Typography>
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
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}
      >
        <Box sx={modal3DStyle}>
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
          zIndex: 999999,
        }}
      >
        <Box sx={modal3DStyle}>
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
              zIndex: 99998,
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
            {/* 1. HEADER */}
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
                  onClick={handleTestSubmission}
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

            {/* 2. MAIN 3-COLUMN CONTENT AREA */}
            <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
              {/* LEFT PANE - Question Description */}
              <Box
                sx={{
                  flex: 3,
                  bgcolor: 'white',
                  borderRadius: 4,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight="bold">
                    {displayQuestionTitle}
                  </Typography>
                  <Button
                    startIcon={
                      revisitQuestions.has(currentQuestionIdx) ? (
                        <BookmarkIcon />
                      ) : (
                        <BookmarkBorderIcon />
                      )
                    }
                    size="small"
                    onClick={handleRevisitToggle}
                    sx={{
                      color: revisitQuestions.has(currentQuestionIdx)
                        ? '#A855F7'
                        : 'text.secondary',
                      fontWeight: revisitQuestions.has(currentQuestionIdx) ? 'bold' : 'normal',
                    }}
                  >
                    {revisitQuestions.has(currentQuestionIdx) ? 'Marked' : 'Revisit Later'}
                  </Button>
                </Box>

                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155' }}
                >
                  {displayQuestionText}
                </Typography>

                {currentQ.testCases && currentQ.testCases.length > 0 && (
                  <Box mt={4}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                      Example Test Cases
                    </Typography>
                    {currentQ.testCases
                      .filter((tc) => !tc.isHidden)
                      .map((tc, i) => (
                        <Box
                          key={i}
                          mb={2}
                          p={2}
                          bgcolor="#F8FAFC"
                          borderRadius={2}
                          border="1px solid #E2E8F0"
                        >
                          <Typography variant="caption" fontWeight="bold" display="block">
                            Input:
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" mb={1}>
                            {tc.input}
                          </Typography>
                          <Typography variant="caption" fontWeight="bold" display="block">
                            Output:
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {tc.output}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                )}
              </Box>

              {/* CENTER PANE - Code Editor & Execution */}
              <Box
                sx={{
                  flex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Editor Header */}
                <Box
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 4,
                    px: 3,
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleResetCode}
                    sx={{ borderColor: '#E2E8F0', color: 'text.secondary' }}
                  >
                    Reset Code
                  </Button>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="textSecondary">
                      Language
                    </Typography>
                    <FormControl size="small">
                      <Select
                        value={language}
                        onChange={handleLanguageChange}
                        sx={{ height: 32, fontSize: '0.875rem' }}
                      >
                        <MenuItem value="c">C</MenuItem>
                        <MenuItem value="cpp">C++</MenuItem>
                        <MenuItem value="javascript">JavaScript</MenuItem>
                        <MenuItem value="python">Python</MenuItem>
                        <MenuItem value="java">Java</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                {/* Monaco Editor */}
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: 'white',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    position: 'relative',
                  }}
                >
                  <Box px={2} py={1} borderBottom="1px solid #E2E8F0" bgcolor="#F8FAFC">
                    <Typography variant="caption" fontWeight="bold" color="textSecondary">
                      Main Code
                    </Typography>
                  </Box>
                  <Editor
                    height="calc(100% - 36px)"
                    theme="vs-dark"
                    language={language === 'c' || language === 'cpp' ? 'cpp' : language}
                    value={code}
                    onChange={(v) => handleCodeChange(v || '')}
                    options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                  />
                </Box>

                {/* Execution Panel with Test Case UI */}
                <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', maxHeight: '40%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Console Execution
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={2} mb={2}>
                    <Button
                      variant="contained"
                      onClick={runCode}
                      disabled={isRunning}
                      startIcon={
                        isRunning ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <PlayArrowIcon />
                        )
                      }
                      sx={{ bgcolor: '#3b82f6', textTransform: 'none' }}
                    >
                      {isRunning ? 'Running...' : 'Run Test Cases'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmitSolution}
                      startIcon={<CheckCircleOutlineIcon />}
                      sx={{ bgcolor: '#22c55e', textTransform: 'none' }}
                    >
                      Submit Solution
                    </Button>
                  </Box>

                  <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
                    {/* Basic Output Fallback if no test cases provided */}
                    {output && !testResults && (
                      <Box
                        bgcolor="#0F172A"
                        borderRadius={2}
                        border="1px solid #334155"
                        overflow="hidden"
                      >
                        <Box bgcolor="#1E293B" px={2} py={1} display="flex" alignItems="center" gap={1} borderBottom="1px solid #334155">
                          <TerminalIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
                          <Typography variant="caption" fontWeight="bold" color="#E2E8F0">Terminal Output</Typography>
                        </Box>
                        <Box p={2}>
                          <Typography variant="body2" whiteSpace="pre-wrap" fontFamily="monospace" color={isError ? '#ef4444' : '#10B981'}>
                            {output}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Advanced Test Case Results Rendering */}
                    {testResults && (
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Typography variant="subtitle2" fontWeight="bold">Test Case Results:</Typography>
                        {testResults.map((tr, i) => (
                          <Box key={i} p={1.5} borderRadius={2} border={tr.passed ? '1px solid #22C55E' : '1px solid #EF4444'} bgcolor={tr.passed ? '#F0FDF4' : '#FEF2F2'}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              {tr.passed ? <CheckCircleOutlineIcon sx={{ color: '#22C55E', fontSize: 20 }} /> : <CancelRoundedIcon sx={{ color: '#EF4444', fontSize: 20 }} />}
                              <Typography variant="body2" fontWeight="bold" color={tr.passed ? '#166534' : '#991B1B'}>
                                Test Case {i + 1} {tr.isHidden ? "(Hidden)" : ""} : {tr.passed ? 'Passed' : 'Failed'}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                              {!tr.isHidden && (
                                <>
                                  <Typography variant="caption" color="textSecondary">Input:</Typography>
                                  <Typography variant="body2" fontFamily="monospace" bgcolor="rgba(0,0,0,0.05)" p={0.5} borderRadius={1}>{tr.input}</Typography>
                                  <Typography variant="caption" color="textSecondary">Expected Output:</Typography>
                                  <Typography variant="body2" fontFamily="monospace" bgcolor="rgba(0,0,0,0.05)" p={0.5} borderRadius={1}>{tr.output}</Typography>
                                </>
                              )}
                              <Typography variant="caption" color="textSecondary">Your Output:</Typography>
                              <Typography variant="body2" fontFamily="monospace" bgcolor="rgba(0,0,0,0.05)" p={0.5} borderRadius={1} color={tr.passed ? '#166534' : '#991B1B'}>{tr.actualOutput || 'No Output'}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* RIGHT PANE - Proctoring Sidebar */}
              <Box
                sx={{
                  flex: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Timers & Palette */}
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

                  <Box mb={2} display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="caption"
                      sx={{ bgcolor: '#E5E7EB', px: 1, py: 0.2, borderRadius: 1 }}
                    >
                      Attempted {attemptedCount}/{questions.length}
                    </Typography>
                  </Box>

                  {/* QUESTION PALETTE WITH REVISIT STATE LOGIC */}
                  <Box display="flex" flexWrap="wrap" gap={1.5}>
                    {questions.map((_, i) => {
                      let bgColor = '#EF4444'; // Red (Not Visited)
                      if (answers[i])
                        bgColor = '#22C55E'; // Green (Answered / Submitted)
                      else if (revisitQuestions.has(i))
                        bgColor = '#A855F7'; // Purple (Marked for Revisit)
                      else if (visitedQuestions.has(i))
                        bgColor = '#FACC15'; // Yellow (Visited)

                      return (
                        <Box
                          key={i}
                          onClick={() => handlePaletteClick(i)}
                          sx={{
                            width: 35,
                            height: 35,
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
                            fontSize={14}
                            color={bgColor === '#FACC15' ? 'black' : 'white'}
                          >
                            {i + 1}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Trust Indicator */}
                <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, flexShrink: 0 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={600} fontSize={16}>
                        Trust indicator
                      </Typography>
                      <Typography fontSize={18} lineHeight={1}>
                        {getTrustEmoji()}
                      </Typography>
                    </Box>
                    <Typography fontSize={12} color={getTrustColor()} fontWeight="bold">
                      {trustScore}% integrity
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={trustScore}
                    sx={{
                      height: 10,
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

                {/* Session Events Logger */}
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
                  <Box p={2.5} pb={1} display="flex" alignItems="center" gap={1}>
                    <ErrorOutlineIcon sx={{ color: '#F43F5E', fontSize: 20 }} />
                    <Typography fontWeight={600} fontSize={16}>
                      Session Events
                    </Typography>
                  </Box>

                  <Box sx={{ px: 2.5, pb: 2.5, flex: 1, overflowY: 'auto' }}>
                    {sessionEvents.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No anomalies detected.
                      </Typography>
                    ) : (
                      sessionEvents.map((evt, i) => (
                        <Box key={i} sx={{ bgcolor: '#FECDD3', borderRadius: 3, p: 1.5, mb: 1.5 }}>
                          <Typography
                            color="#BE123C"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            mb={0.5}
                          >
                            <ErrorOutlineIcon fontSize="small" />{' '}
                            {evt.type === 'FACE_LOST' ? 'Face Removed' : evt.type}
                          </Typography>
                          <Typography fontSize={11} color="#BE123C" mb={0.5}>
                            {evt.message}
                          </Typography>
                          <Typography fontSize={9} color="#BE123C" textAlign="right">
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
}