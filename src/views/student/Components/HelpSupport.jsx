import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton, Typography, Drawer } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  PlusIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  ClockIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { 
  IconRobot, 
  IconCode, 
  IconChartBar, 
  IconInfoCircle, 
  IconSettingsAutomation 
} from '@tabler/icons-react';

// =========================================================================
// IMPORTANT: Replace with your actual Gemini API Key
// =========================================================================
const GEMINI_API_KEY = "AIzaSyBdRnvZjK-IPik9W1XAujKo2Olh2HOEERQ";

/* ================= AMBIENT BACKGROUND GLOWS ================= */
const AmbientBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-blue-400/20 dark:bg-blue-600/15 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
    <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-purple-400/20 dark:bg-purple-600/15 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
    <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-orange-400/10 dark:bg-orange-600/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
  </div>
);

export default function HelpSupport() {
  const { userInfo } = useSelector((state) => state.auth || {});
  const userName = userInfo?.name || 'Student';

  // --- CHAT & AI STATES ---
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // --- HISTORY STATES ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistoryList, setChatHistoryList] = useState([]);

  // --- STT (SPEECH TO TEXT) STATES ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // --- TYPING EFFECT STATE ---
  const [placeholderText, setPlaceholderText] = useState('');
  const fullPlaceholder = "Initiate a query or send a command to the AI...";

  // Check Dark Mode dynamically
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Load chat history from local storage on mount
  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem('procto_chat_history') || '[]');
    setChatHistoryList(savedChats);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Placeholder Typing Effect
  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeout;

    const type = () => {
      if (!isDeleting && currentIndex <= fullPlaceholder.length) {
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));
        currentIndex++;
        timeout = setTimeout(type, 50);
      } else if (isDeleting && currentIndex >= 0) {
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));
        currentIndex--;
        timeout = setTimeout(type, 20);
      } else {
        isDeleting = !isDeleting;
        timeout = setTimeout(type, isDeleting ? 3000 : 500); 
      }
    };

    timeout = setTimeout(type, 500);
    return () => clearTimeout(timeout);
  }, []);

  /* ================= SPEECH TO TEXT LOGIC ================= */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop when they pause naturally
      recognitionRef.current.interimResults = true; // Show text as they speak
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setQuery(transcript);
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
      setQuery(''); 
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  /* ================= ACTION PILLS DATA ================= */
  const suggestionCards = [
    {
      title: 'Create Exam on React',
      icon: <IconCode size={20} className="text-green-500" />,
      color: 'bg-green-50 dark:bg-green-500/10',
      prompt: 'Create me an exam on React Developer'
    },
    {
      title: 'Analyze Performance',
      icon: <IconChartBar size={20} className="text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-500/10',
      prompt: 'Analyze my past exam performance and give me a summary.'
    },
    {
      title: 'Platform Details',
      icon: <IconInfoCircle size={20} className="text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-500/10',
      prompt: 'What security features does Procto.ai use during an exam?'
    },
    {
      title: 'System Diagnostics',
      icon: <IconSettingsAutomation size={20} className="text-orange-500" />,
      color: 'bg-orange-50 dark:bg-orange-500/10',
      prompt: 'How do I run a system check before my exam?'
    }
  ];

  /* ================= ACCURATE GEMINI AI LOGIC ================= */
  const handleSend = async (textToProcess) => {
    const text = typeof textToProcess === 'string' ? textToProcess : query;
    if (!text.trim() || isTyping) return;
    
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setQuery('');
    setIsTyping(true);

    try {
      const exams = JSON.parse(localStorage.getItem('procto_ai_exams') || '[]');
      const completedExams = exams.filter(e => e.completed);
      const totalScore = completedExams.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const totalPossible = completedExams.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
      const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

      const systemPrompt = `You are Procto.ai Assistant, an intelligent chatbot for an advanced proctoring and assessment platform.
      Context: The user has completed ${completedExams.length} exams with an average score of ${avgPercentage}%.
      
      Analyze the user's query: "${text}"

      IF the user wants to CREATE AN EXAM, TEST, or QUIZ:
      Generate exactly 3 multiple choice questions on that topic. You MUST return ONLY a JSON object in this exact format:
      {
        "type": "exam",
        "message": "I have successfully created an exam on that topic! You can find it waiting for you in your Assessments dashboard.",
        "topic": "Extracted Topic Name (e.g. React Developer)",
        "questions": [
          { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A" }
        ]
      }

      IF the user asks about their PERFORMANCE or RESULTS:
      Return ONLY a JSON object in this exact format:
      {
        "type": "chat",
        "message": "Based on my data, you have completed ${completedExams.length} assessments with an overall accuracy of ${avgPercentage}%. [Add a personalized encouraging remark here]"
      }

      IF it's a GENERAL question about Procto.ai or anything else:
      Return ONLY a JSON object in this exact format:
      {
        "type": "chat",
        "message": "Your helpful, conversational response here."
      }
      
      CRITICAL RULE: Output ONLY raw JSON. Do not include markdown blocks like \`\`\`json.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || "API Request Failed (Check your API Key)");
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) throw new Error("Invalid response format received from Gemini.");

      let rawText = data.candidates[0].content.parts[0].text;
      
      let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      
      const parsedData = JSON.parse(cleanText);
      let updatedMessages = [...newMessages];

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

      setMessages(updatedMessages);

      // Save to chat history immediately
      if (text.trim().length > 0) {
        const newHistoryItem = {
          id: Date.now(),
          query: text,
          response: parsedData.message,
          date: new Date().toISOString()
        };
        const existingHistory = JSON.parse(localStorage.getItem('procto_chat_history') || '[]');
        const updatedHistory = [newHistoryItem, ...existingHistory];
        localStorage.setItem('procto_chat_history', JSON.stringify(updatedHistory));
        setChatHistoryList(updatedHistory);
      }

    } catch (error) {
      console.error("Chatbot Error:", error);
      let errorMsg = "I'm having trouble processing that request right now.";
      if (error.message.includes("API Key") || error.message.includes("API Request Failed")) {
        errorMsg = "API Error: Please ensure you have pasted a valid Gemini API Key into the code.";
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadHistoryItem = (item) => {
    setMessages([
      { sender: 'user', text: item.query },
      { sender: 'ai', text: item.response }
    ]);
    setIsHistoryOpen(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setIsHistoryOpen(false);
  };

  return (
    <div className="h-full bg-[#FDFDFD] dark:bg-[#0A0A0C] text-gray-900 dark:text-gray-100 font-sans relative z-0 flex flex-col rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
      
      {/* CSS to hide the scrollbar but keep functionality */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <AmbientBackground />

      {/* ================= HEADER WITH HISTORY ICON ================= */}
      <header className="flex justify-between items-center px-6 py-4 relative z-20">
        <Typography variant="h6" fontWeight="800" sx={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Procto AI
        </Typography>
        <IconButton onClick={() => setIsHistoryOpen(true)} sx={{ color: isDark ? '#9CA3AF' : '#6B7280', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
          <ClockIcon className="w-5 h-5" />
        </IconButton>
      </header>

      {/* ================= iOS STYLE SPEECH-TO-TEXT POPUP ================= */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Changed to fixed inset-0 and extremely high z-index to center on the whole screen
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            onClick={toggleListening}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center justify-center p-8 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl rounded-[36px] shadow-2xl border border-gray-200 dark:border-white/10 w-80"
            >
              {/* Pulsing Orb */}
              <div className="relative flex items-center justify-center w-28 h-28 mb-6 cursor-pointer" onClick={toggleListening}>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#007AFF] rounded-full"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute inset-2 bg-blue-400 rounded-full"
                />
                <div className="relative z-10 w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg">
                  <MicrophoneIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <Typography variant="h5" fontWeight="800" className="text-gray-900 dark:text-white mb-2 text-center">Speak Now</Typography>
              <Typography variant="body1" className="text-center text-gray-500 dark:text-gray-400 min-h-[48px] max-h-24 overflow-hidden mb-6 w-full">
                {query || "I'm listening..."}
              </Typography>
              <button onClick={toggleListening} className="w-full px-6 py-3 rounded-full bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT AREA (Scrollable, Hidden Scrollbar) ================= */}
      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto relative z-10 overflow-y-auto px-6 pb-4 no-scrollbar">
        
        {/* STATE 1: HOME SCREEN (If no messages) */}
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center mt-8">
            <div className="relative flex items-center justify-center mb-8 w-28 h-28">
              <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400 via-indigo-400 to-purple-400 blur-xl opacity-60 dark:opacity-80" />
              <div className="relative bg-white dark:bg-[#1C1C1E] w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(59,130,246,0.3)] border border-gray-100 dark:border-white/5">
                <IconRobot className="text-blue-500" size={32} />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-center">
              <span className="text-[#007AFF] dark:text-[#0A84FF]">Welcome to Procto AI </span>
              <span className="text-gray-900 dark:text-white">{userName.split(' ')[0]}</span>
            </h1>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-10 text-center tracking-tight">
              How Can I Assist You Today?
            </h2>
            <div className="w-full space-y-3 pb-6">
              {suggestionCards.map((card, index) => (
                <motion.button key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSend(card.prompt)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.color}`}>{card.icon}</div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-[15px]">{card.title}</span>
                  </div>
                  <PlusIcon className="w-5 h-5 text-gray-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STATE 2: CHAT INTERFACE (If messages exist) */}
        {messages.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 4 }}>
            {messages.map((msg, idx) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 shrink-0 mt-1">
                    <IconRobot size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className={`max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-sm' : 'bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-[20px] rounded-tl-sm'}`} style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 shrink-0">
                  <IconRobot size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="px-5 py-4 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-[20px] rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-blue-400 rounded-full" />
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} className="h-4" /> 
          </Box>
        )}
      </div>

      {/* ================= BOTTOM INPUT BAR (Fixed inside flex layout) ================= */}
      <div className="w-full px-6 pb-6 pt-2 z-20 shrink-0 relative">
        <div className="max-w-3xl mx-auto flex items-center bg-white dark:bg-[#1C1C1E] rounded-full p-2 pr-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-white/10">
          <IconButton onClick={startNewChat} sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }} title="New Chat">
            <PlusIcon className="w-6 h-6" />
          </IconButton>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping || isListening}
            placeholder={isListening ? "Listening..." : placeholderText}
            className="flex-1 bg-transparent border-none outline-none px-3 text-[15px] text-gray-900 dark:text-white placeholder-gray-400"
          />
          
          {query.trim() ? (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => handleSend()} disabled={isTyping || isListening} className="w-10 h-10 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#0056b3] transition-colors ml-2 shadow-md disabled:opacity-50">
              <PaperAirplaneIcon className="w-5 h-5 -translate-y-[1px] translate-x-[1px]" />
            </motion.button>
          ) : (
            <IconButton onClick={toggleListening} sx={{ color: isListening ? '#007AFF' : (isDark ? '#9CA3AF' : '#6B7280') }}>
              <MicrophoneIcon className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
            </IconButton>
          )}
        </div>
      </div>

      {/* ================= HISTORY DRAWER (Slide from right) ================= */}
      <Drawer
        anchor="right"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '85vw', sm: 400 }, 
            bgcolor: isDark ? '#111827' : '#F9FAFB',
            backgroundImage: 'none',
            borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          }
        }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB' }}>
          <Typography variant="h6" fontWeight="bold" color={isDark ? 'white' : 'black'}>Chat History</Typography>
          <IconButton onClick={() => setIsHistoryOpen(false)} sx={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chatHistoryList.length === 0 ? (
            <Typography variant="body2" color="textSecondary" align="center" mt={4}>No chat history found.</Typography>
          ) : (
            chatHistoryList.map((item) => (
              <Box 
                key={item.id} 
                onClick={() => loadHistoryItem(item)}
                sx={{ 
                  p: 2, borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #E5E7EB',
                  '&:hover': { borderColor: '#3B82F6', bgcolor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' } 
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1.5} mb={1}>
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <Typography variant="body2" fontWeight="600" color={isDark ? 'white' : 'black'} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{item.query}"
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ ml: 4 }}>
                  {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Drawer>

    </div>
  );
}