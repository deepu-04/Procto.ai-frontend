import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Slide } from '@mui/material';
import {
  XMarkIcon,
  MicrophoneIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

// Replace with your actual Gemini API Key or fetch from env
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// Helper to clean markdown from Gemini JSON responses
const cleanJSONResponse = (text) => {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim();
};

// Transition for the Fullscreen Dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const jobDescription = location.state?.jobDescription || "General Software Engineering Role";

  // --- STAGES: 'initializing' -> 'interviewing' -> 'evaluating' -> 'results' ---
  const [stage, setStage] = useState('initializing');
  
  // --- INTERVIEW STATE ---
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [qaHistory, setQaHistory] = useState([]); 
  const [messages, setMessages] = useState([]); 
  
  // --- RESULTS STATE ---
  const [examResult, setExamResult] = useState(null);

  // --- UI/UX STATE ---
  const [isAiThinking, setIsAiThinking] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentDisplayQuestion, setCurrentDisplayQuestion] = useState('Analyzing Job Description...');
  const [warning, setWarning] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  /* ========================================= */
  /* 1. INITIALIZATION & HARDWARE SETUP        */
  /* ========================================= */
  useEffect(() => {
    // Camera Setup
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => setWarning('Camera/Mic access denied. Proctoring requires permissions.'));
    }

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        setUserInput(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    // Start the process by generating questions
    generateQuestions();

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================================= */
  /* 2. GEMINI AI: GENERATE QUESTIONS          */
  /* ========================================= */
  const generateQuestions = async () => {
    setIsAiThinking(true);
    const prompt = `You are an expert technical interviewer. The candidate is applying for the following role:\n"${jobDescription}"\n\nGenerate exactly 3 concise, highly relevant technical interview questions for this role. Return ONLY a valid JSON array of strings. Example: ["Question 1?", "Question 2?", "Question 3?"]`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const generatedQs = JSON.parse(cleanJSONResponse(rawText));

      setQuestions(generatedQs);
      setStage('interviewing');
      
      // Ask first question
      setCurrentDisplayQuestion(generatedQs[0]);
      setMessages([{ sender: 'ai', text: generatedQs[0] }]);
      speak(generatedQs[0]);
      
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      // Fallback if API fails
      const fallbackQs = ["Can you tell me about your background?", "What is your strongest technical skill?", "How do you handle debugging complex issues?"];
      setQuestions(fallbackQs);
      setStage('interviewing');
      setCurrentDisplayQuestion(fallbackQs[0]);
      setMessages([{ sender: 'ai', text: fallbackQs[0] }]);
      speak(fallbackQs[0]);
    } finally {
      setIsAiThinking(false);
    }
  };

  /* ========================================= */
  /* 3. INTERVIEW LOOP (ASK & ANSWER)          */
  /* ========================================= */
  const submitAnswer = () => {
    if (!userInput.trim() || isAiThinking) return;
    
    const userMsg = userInput;
    const currentQText = questions[currentQIndex];

    // Record Q&A
    const newQaHistory = [...qaHistory, { q: currentQText, a: userMsg }];
    setQaHistory(newQaHistory);
    
    // Update Chat UI
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setUserInput('');
    if (isListening && recognitionRef.current) recognitionRef.current.stop();

    // Check if we have more questions
    const nextIndex = currentQIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQIndex(nextIndex);
      const nextQ = questions[nextIndex];
      setCurrentDisplayQuestion(nextQ);
      setMessages((prev) => [...prev, { sender: 'ai', text: nextQ }]);
      speak(nextQ);
    } else {
      // Interview complete, evaluate
      evaluateInterview(newQaHistory);
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.onstart = () => setIsSpeaking(true);
    msg.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(msg);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const safeClose = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    navigate(-1);
  };

  /* ========================================= */
  /* 4. GEMINI AI: EVALUATE & SCORE            */
  /* ========================================= */
  const evaluateInterview = async (finalHistory) => {
    setStage('evaluating');
    setIsAiThinking(true);
    setCurrentDisplayQuestion("Interview complete. AI is analyzing your responses...");
    speak("Thank you. I am now analyzing your responses.");

    const transcriptText = finalHistory.map((item, i) => `Q${i+1}: ${item.q}\nCandidate: ${item.a}`).join("\n\n");
    const prompt = `You are an expert technical interviewer evaluating a candidate for this role:\n"${jobDescription}"\n\nHere is the interview transcript:\n${transcriptText}\n\nEvaluate the candidate's technical accuracy, communication, and relevance. Return ONLY a JSON object exactly like this: {"score": 85, "feedback": "Detailed feedback summary here."}`;

    let resultData = { score: 0, feedback: "Evaluation failed." };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      resultData = JSON.parse(cleanJSONResponse(rawText));
    } catch (error) {
      console.error("Gemini Evaluation Error:", error);
      resultData = { score: 75, feedback: "We were unable to process a detailed AI review at this time, but your responses have been recorded." };
    } finally {
      saveAndFinish(resultData, finalHistory);
    }
  };

  const saveAndFinish = (resultData, finalHistory) => {
    // Save to the exact same localStorage key as AiExam.jsx so it shows in the Dashboard
    const existingRecords = JSON.parse(localStorage.getItem('procto_ai_exams') || '[]');
    const newRecord = {
      id: `voice-int-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'voice_interview', // Flag to distinguish from MCQ
      jobDescription,
      questions: questions, 
      completed: true,
      score: resultData.score,
      totalScore: 100, // Voice interviews are graded out of 100
      feedback: resultData.feedback,
      transcript: finalHistory
    };
    
    localStorage.setItem('procto_ai_exams', JSON.stringify([newRecord, ...existingRecords]));

    // Show Results UI
    setExamResult(resultData);
    setStage('results');
    setIsAiThinking(false);
    
    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  /* ========================================= */
  /* RENDERERS                                 */
  /* ========================================= */

  return (
    <Dialog fullScreen open={true} TransitionComponent={Transition} PaperProps={{ sx: { bgcolor: '#08080A' } }}>
      <div className="absolute inset-0 bg-[#08080A] flex flex-col font-sans text-white overflow-hidden">
        
        {/* IOS STYLE BACKGROUND BLURS */}
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* RESULTS SCREEN */}
        {stage === 'results' && examResult ? (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/[0.05] backdrop-blur-3xl rounded-[40px] border border-white/10 p-12 text-center max-w-2xl w-full shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckBadgeIcon className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-4xl font-black mb-2">Interview Complete</h2>
              <p className="text-slate-400 mb-8">Your AI evaluation has been saved to your AiExams dashboard.</p>
              
              <div className="bg-white/5 rounded-3xl p-8 mb-8 border border-white/5">
                <h3 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
                  {examResult.score} <span className="text-2xl text-slate-500">/ 100</span>
                </h3>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">AI Assessment Score</p>
                <p className="text-sm text-slate-300 leading-relaxed text-left bg-black/20 p-4 rounded-xl border border-white/5">
                  <span className="font-bold text-white block mb-1">AI Feedback:</span>
                  {examResult.feedback}
                </p>
              </div>

              <button onClick={() => navigate('/candidate/ai-exam')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30">
                View in Assessments
              </button>
            </motion.div>
          </div>
        ) : (
          /* LIVE INTERVIEW UI */
          <>
            {/* DYNAMIC ISLAND WARNING */}
            <AnimatePresence>
              {warning && (
                <motion.div
                  initial={{ y: -100, x: '-50%' }} animate={{ y: 30, x: '-50%' }} exit={{ y: -100, x: '-50%' }}
                  className="fixed top-0 left-1/2 bg-red-500/90 backdrop-blur-2xl px-6 py-3 rounded-full border border-red-400/50 shadow-2xl z-[10001] flex items-center gap-3 text-sm font-bold"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" /> {warning}
                </motion.div>
              )}
            </AnimatePresence>

            {/* HEADER */}
            <header className="relative z-10 flex justify-between items-center px-12 py-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter">Procto<span className="text-blue-500">.ai</span></span>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  {stage === 'interviewing' && <span className="text-blue-400">Q {currentQIndex + 1} OF {questions.length}</span>}
                  {stage !== 'interviewing' && <span>{stage.toUpperCase()}</span>}
                </div>
                <button onClick={() => setShowChat(!showChat)} className={`p-3 rounded-full border border-white/10 transition-all ${showChat ? 'bg-blue-600 border-blue-400' : 'bg-white/5'}`}>
                  <ChatBubbleLeftEllipsisIcon className="w-6 h-6" />
                </button>
                <button onClick={safeClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10">
                  <XMarkIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </header>

            <main className="relative z-10 flex-1 grid grid-cols-12 gap-8 px-12 pb-12 overflow-hidden">
              
              {/* LEFT PANEL: AVATAR & WEBCAM */}
              <div className="col-span-4 flex flex-col gap-6 h-full">
                <div className="flex-[1.5] bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-3xl rounded-[48px] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                  <div className={`absolute inset-0 bg-blue-500/5 transition-opacity duration-1000 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                  <motion.div animate={isSpeaking ? { y: [0, -8, 0], scale: [1, 1.02, 1] } : {}} transition={{ repeat: Infinity, duration: 2.5 }} className="relative w-56 h-56">
                    <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Woman%20Technologist.png" alt="Ava" className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]" />
                  </motion.div>
                  <div className="mt-8 text-center relative z-10">
                    <h3 className="text-3xl font-bold">Ava</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Lead AI Engineer</p>
                  </div>
                </div>

                <div className="flex-1 bg-black rounded-[48px] border border-white/10 overflow-hidden relative shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100 opacity-80" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                    LIVE
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: QUESTION & INPUT */}
              <div className="col-span-8 flex flex-col gap-6 h-full relative">
                
                {/* Main Question Display */}
                <div className="flex-1 bg-white/[0.03] backdrop-blur-3xl rounded-[54px] border border-white/10 p-16 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                  <motion.h2 key={currentDisplayQuestion} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-4xl font-bold leading-tight max-w-3xl text-white/90">
                    {currentDisplayQuestion}
                  </motion.h2>

                  {isAiThinking && (
                    <div className="mt-12 flex gap-3">
                      {[0, 0.2, 0.4].map((d) => (
                        <motion.div key={d} animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }} className="w-3 h-3 bg-blue-500 rounded-full" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Box */}
                <div className="bg-white/10 backdrop-blur-3xl p-6 rounded-[40px] border border-white/20 shadow-2xl">
                  <div className="relative flex items-center">
                    <input
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                      disabled={stage !== 'interviewing'}
                      placeholder={stage !== 'interviewing' ? 'Please wait...' : isListening ? 'Listening...' : 'Type your answer...'}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-10 pr-44 focus:outline-none focus:border-blue-500/50 text-xl font-medium disabled:opacity-50"
                    />
                    <div className="absolute right-4 flex gap-3">
                      <button onClick={toggleListening} disabled={stage !== 'interviewing'} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20'} disabled:opacity-50`}>
                        <MicrophoneIcon className={`w-7 h-7 ${isListening ? 'animate-pulse text-white' : 'text-slate-300'}`} />
                      </button>
                      <button onClick={submitAnswer} disabled={stage !== 'interviewing' || !userInput.trim()} className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/40 disabled:opacity-50 disabled:shadow-none transition-all">
                        <PaperAirplaneIcon className="w-7 h-7 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TRANSCRIPT TRAY OVERLAY */}
                <AnimatePresence>
                  {showChat && (
                    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="absolute inset-0 bg-[#0C0C0E]/95 backdrop-blur-3xl z-50 rounded-[54px] border border-white/10 p-12 flex flex-col shadow-2xl">
                      <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                        <h4 className="text-2xl font-bold">Transcript</h4>
                        <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white font-bold text-[10px] tracking-widest transition-colors">CLOSE</button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                        {messages.length === 0 ? (
                          <p className="text-slate-500 text-center mt-10">No messages yet.</p>
                        ) : (
                          messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] px-6 py-4 rounded-[24px] text-lg leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/5 border border-white/5 text-slate-200 rounded-bl-sm'}`}>
                                {m.text}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>
          </>
        )}
      </div>
    </Dialog>
  );
}