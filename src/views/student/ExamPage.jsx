import React, { useState, useEffect, useRef } from 'react';
import { Typography, Box, IconButton, InputBase, Avatar } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import Exams from './Components/Exams';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  PlusIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  IconCode, 
  IconChartBar,
  IconInfoCircle,
  IconSettingsAutomation,
  IconUserShield 
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';

// =========================================================================
// IMPORTANT: It is highly recommended to use environment variables in production
// Example: const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIza...";
// =========================================================================
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyCF45Pld4UlwEaxIg5dxKFETSZwN1xs9iI";

// =========================================================================
// AI CHATBOT WIDGET COMPONENT (iOS THEME)
// =========================================================================
const ProctoAIChatbot = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // STT States
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Hover Tooltip State
  const [isHovered, setIsHovered] = useState(false);
  
  // Get user info for personalized tooltip
  const { userInfo } = useSelector((state) => state.auth || {});
  const userName = userInfo?.name?.split(' ')[0] || 'there';

  // Typing Effect State for Header
  const [agentNameText, setAgentNameText] = useState('');
  const fullAgentName = "Procto Agent";

  useEffect(() => {
    if (isOpen) {
      setAgentNameText('');
      let i = 0;
      const interval = setInterval(() => {
        setAgentNameText(fullAgentName.slice(0, i + 1));
        i++;
        if (i >= fullAgentName.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // SMOOTH SCROLL EFFECT: Start to End
  useEffect(() => {
    const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 300); 
    return () => clearTimeout(timeoutId);
  }, [messages, isTyping]);

  /* ================= SPEECH TO TEXT LOGIC ================= */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; 
      recognitionRef.current.interimResults = true; 
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(''); 
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const predefinedActions = [
    { title: 'Create Exam on React', icon: <IconCode size={18} color="#34C759" />, color: 'bg-green-50 dark:bg-[#1C1C1E] text-[#34C759] border-green-100 dark:border-[rgba(255,255,255,0.1)]' },
    { title: 'Analyze Performance', icon: <IconChartBar size={18} color="#007AFF" />, color: 'bg-blue-50 dark:bg-[#1C1C1E] text-[#007AFF] border-blue-100 dark:border-[rgba(255,255,255,0.1)]' },
    { title: 'Platform Details', icon: <IconInfoCircle size={18} color="#AF52DE" />, color: 'bg-indigo-50 dark:bg-[#1C1C1E] text-[#AF52DE] border-indigo-100 dark:border-[rgba(255,255,255,0.1)]' },
    { title: 'System Diagnostics', icon: <IconSettingsAutomation size={18} color="#FF9500" />, color: 'bg-orange-50 dark:bg-[#1C1C1E] text-[#FF9500] border-orange-100 dark:border-[rgba(255,255,255,0.1)]' },
  ];

  const handleSend = async (text) => {
    if (!text.trim() || isTyping) return;
    
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const exams = JSON.parse(localStorage.getItem('procto_ai_exams') || '[]');
      const completedExams = exams.filter(e => e.completed);
      const totalScore = completedExams.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const totalPossible = completedExams.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
      const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

      const systemPrompt = `You are Procto Agent, a highly secure AI proxy and proctoring assistant.
      Context: The user has completed ${completedExams.length} exams with an average score of ${avgPercentage}%.
      
      Analyze the user's query: "${text}"

      IF the user wants to CREATE AN EXAM or TEST:
      Generate exactly 10 multiple choice questions on that topic. You MUST return ONLY a JSON object in this exact format:
      {
        "type": "exam",
        "message": "I have successfully provisioned a secure exam environment for that topic. It is waiting for you in your Active Exams dashboard.",
        "topic": "Extracted Topic Name",
        "questions": [
          { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }
        ]
      }

      IF the user asks about their PERFORMANCE or RESULTS:
      Return ONLY a JSON object in this exact format:
      {
        "type": "chat",
        "message": "Based on my proxy logs, you have completed ${completedExams.length} assessments with an overall accuracy of ${avgPercentage}%. Keep up the good work."
      }

      IF it's a GENERAL question:
      Return ONLY a JSON object in this exact format:
      {
        "type": "chat",
        "message": "Your conversational response here."
      }
      
      CRITICAL RULE: Output ONLY raw JSON. Do not include markdown blocks like \`\`\`json.`;

      // FIX 1: Updated to gemini-1.5-flash (the stable, working endpoint)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || "API Request Failed");
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
         throw new Error("Invalid response format received.");
      }

      let rawText = data.candidates[0].content.parts[0].text;
      let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      
      let updatedMessages = [...newMessages];

      // FIX 2: Added try-catch for JSON parsing. If Gemini ignores the prompt and sends plain text, it won't crash.
      try {
        const parsedData = JSON.parse(cleanText);
        
        if (parsedData.type === 'exam') {
          const newExam = {
            id: `ai-exam-${Date.now()}`,
            date: new Date().toISOString(),
            questions: parsedData.questions,
            completed: false,
            score: null,
            jobDescription: parsedData.topic || "Custom AI Exam",
            type: "mcq"
          };
          localStorage.setItem('procto_ai_exams', JSON.stringify([newExam, ...exams]));
          updatedMessages.push({ sender: 'ai', text: parsedData.message });
          window.dispatchEvent(new Event("storage")); 
        } else {
          updatedMessages.push({ sender: 'ai', text: parsedData.message });
        }
      } catch (parseError) {
        // Fallback: If it's not JSON, just show what the AI said naturally
        updatedMessages.push({ sender: 'ai', text: rawText.trim() });
      }

      setMessages(updatedMessages);

    } catch (error) {
      console.error("Chatbot Error:", error);
      let errorMsg = "Proxy connection error. Please try again later.";
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("API Request Failed")) {
        errorMsg = "Agent initialization failed: Invalid API Key configuration. Your key may have been revoked by Google if it was exposed in a public repository.";
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // iOS Colors
  const iosBlue = "#007AFF";
  const iosLightGray = "#E9E9EB";
  const iosDarkGray = "#262628";

  return (
    <>
      <style>{`
        .chat-scrollbar::-webkit-scrollbar { width: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
      `}</style>

      {/* FLOATING ACTION BUTTON WITH TOOLTIP */}
      <AnimatePresence>
        {!isOpen && (
          <Box style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, display: 'flex', alignItems: 'flex-end', flexDirection: 'column', gap: '12px' }}>
            
            {/* Animated Tooltip Bubble */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#000000',
                    padding: '10px 16px',
                    borderRadius: '16px 16px 4px 16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                    marginRight: '8px',
                    maxWidth: '220px',
                  }}
                >
                  <Typography variant="body2" fontWeight="600" sx={{ lineHeight: 1.4 }}>
                    Hey {userName}! Click to open Procto Agent ✨
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Floating Button */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <IconButton
                onClick={() => setIsOpen(true)}
                sx={{
                  width: 60, height: 60,
                  background: isDark ? '#1C1C1E' : '#FFFFFF',
                  color: iosBlue,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                  '&:hover': { transform: 'scale(1.05)', background: isDark ? '#2C2C2E' : '#F9FAFB' },
                  transition: 'all 0.2s ease'
                }}
              >
                <IconUserShield size={30} stroke={1.5} />
              </IconButton>
            </motion.div>

          </Box>
        )}
      </AnimatePresence>

      {/* CHAT WIDGET WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
              width: 380, height: 700, maxHeight: '85vh',
              borderRadius: 32,
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column', 
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            {/* Soft Ambient Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[200px] h-[200px] bg-blue-400/20 dark:bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-[30%] right-[-10%] w-[150px] h-[150px] bg-purple-400/20 dark:bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[200px] h-[200px] bg-orange-400/10 dark:bg-orange-600/10 blur-[60px] rounded-full pointer-events-none" />

            {/* iOS STYLE HEADER */}
            <Box sx={{ 
              p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', 
              zIndex: 20, flexShrink: 0, position: 'relative',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' 
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconUserShield size={20} color={isDark ? "#FFF" : "#000"} />
                <Typography variant="subtitle1" fontWeight="700" color={isDark ? '#FFF' : '#000'}>
                  {agentNameText}
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>
                </Typography>
              </Box>
            </Box>

            {/* CHAT AREA (SCROLLABLE with CUSTOM SCROLLBAR) */}
            <Box className="chat-scrollbar" sx={{ 
              flex: 1, minHeight: 0, overflowY: 'auto', 
              p: 2.5, zIndex: 10, display: 'flex', flexDirection: 'column' 
            }}>
              
              {/* Welcome Screen */}
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center mt-6 mb-8">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: isDark ? '#2C2C2E' : '#F2F2F7', mb: 3 }}>
                    <IconUserShield size={40} color={isDark ? "#FFF" : "#000"} stroke={1.2} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="700" align="center" color={isDark ? '#FFF' : '#000'} mb={1}>
                    Secure Proxy Agent
                  </Typography>
                  <Typography variant="body2" align="center" color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} px={2}>
                    I am monitoring your environment. Select an action or type a command below.
                  </Typography>

                  {/* Action Pills (iOS Style) */}
                  <Box sx={{ width: '100%', mt: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {predefinedActions.map((action, idx) => (
                      <Box
                        key={idx}
                        onClick={() => handleSend(action.title)}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 1.5, px: 2, borderRadius: '16px', cursor: 'pointer',
                          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F7',
                          color: isDark ? '#FFF' : '#000',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {action.icon}
                          <Typography variant="body2" fontWeight="600">{action.title}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </motion.div>
              )}

              {/* Chat Messages (Authentic iOS iMessage Style) */}
              {messages.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 2 }}>
                  {messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                        {!isUser && (
                          <Avatar sx={{ width: 24, height: 24, bgcolor: isDark ? '#2C2C2E' : '#E5E5EA', mr: 1, alignSelf: 'flex-end', mb: 0.5 }}>
                            <IconUserShield size={14} color={isDark ? "#FFF" : "#000"} />
                          </Avatar>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          sx={{
                            maxWidth: '75%',
                            p: 1.5, px: 2,
                            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            bgcolor: isUser ? iosBlue : (isDark ? iosDarkGray : iosLightGray),
                            color: isUser ? '#FFF' : (isDark ? '#FFF' : '#000'),
                          }}
                        >
                          <Typography variant="body2" sx={{ lineHeight: 1.4, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                            {msg.text}
                          </Typography>
                        </motion.div>
                      </Box>
                    );
                  })}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: isDark ? '#2C2C2E' : '#E5E5EA', mr: 1, alignSelf: 'flex-end', mb: 0.5 }}>
                        <IconUserShield size={14} color={isDark ? "#FFF" : "#000"} />
                      </Avatar>
                      <Box sx={{ p: 1.5, px: 2, borderRadius: '20px 20px 20px 4px', bgcolor: isDark ? iosDarkGray : iosLightGray, display: 'flex', gap: 0.5, alignItems: 'center', height: '38px' }}>
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                      </Box>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-1" />
                </Box>
              )}
            </Box>

            {/* INPUT AREA (PERMANENTLY PINNED) */}
            <Box sx={{ 
              p: 2, zIndex: 20, flexShrink: 0, 
              bgcolor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' 
            }}>
              <Box
                sx={{
                  display: 'flex', alignItems: 'center',
                  bgcolor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderRadius: 10, p: '4px 8px',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #D1D1D6',
                }}
              >
                {/* Close Widget Button positioned like the iOS Plus icon */}
                <IconButton onClick={() => setIsOpen(false)} sx={{ color: isDark ? '#9CA3AF' : '#8E8E93' }} title="Close Widget">
                  <XMarkIcon className="w-5 h-5" />
                </IconButton>

                {isListening ? (
                  /* Inline Audio Wave Effect */
                  <Box sx={{ ml: 1, flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, height: '32px' }}>
                    <Typography variant="body2" color={iosBlue} sx={{ mr: 1, fontWeight: 'bold' }}>Listening...</Typography>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['8px', '20px', '8px'] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
                        style={{ width: '4px', backgroundColor: iosBlue, borderRadius: '4px' }}
                      />
                    ))}
                  </Box>
                ) : (
                  <InputBase
                    fullWidth
                    placeholder="Message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                    sx={{ ml: 1, flex: 1, color: isDark ? '#FFF' : '#000', fontSize: '0.95rem' }}
                  />
                )}
                
                {input.trim() && !isListening ? (
                  <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    onClick={() => handleSend(input)}
                    disabled={isTyping}
                    className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#0056b3] transition-colors ml-1 shadow-sm"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 -translate-y-[1px] translate-x-[1px]" />
                  </motion.button>
                ) : (
                  <IconButton onClick={toggleListening} sx={{ color: isListening ? iosBlue : (isDark ? '#9CA3AF' : '#8E8E93') }}>
                    <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                  </IconButton>
                )}
              </Box>
            </Box>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// =========================================================================
// MAIN EXAM PAGE COMPONENT
// =========================================================================
const ExamPage = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
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

  return (
    <PageContainer title="Exam Page" description="Active Exams">
      <div id="chatbot-widget-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box
          sx={{
            transition: 'all 0.3s ease',
            '& > div': { 
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.8)' : '#FFFFFF',
              backdropFilter: isDark ? 'blur(16px)' : 'none',
              color: isDark ? '#FFFFFF' : '#0F172A',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
              boxShadow: isDark 
                ? '0px 20px 50px rgba(0,0,0,0.4)' 
                : '0px 4px 20px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
            },
            '& .MuiTypography-root': {
              color: isDark ? '#FFFFFF' : 'inherit',
              transition: 'color 0.3s ease',
            }
          }}
        >
          <DashboardCard title="All Active Exams">
            <Exams isDark={isDark} />
          </DashboardCard>
        </Box>

        {/* Integrate the AI Chatbot Widget */}
        <ProctoAIChatbot isDark={isDark} />
      </div>
    </PageContainer>
  );
};

export default ExamPage;