import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  CpuChipIcon,
  InboxIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';

const TEMPLATES = [
  { 
    id: 1, 
    title: 'React Developer', 
    icon: <CodeBracketIcon className="w-6 h-6" />, 
    color: '#007AFF', 
    text: 'Senior Frontend Engineer with expertise in React, Tailwind, and Framer Motion.' 
  },
  { 
    id: 2, 
    title: 'UI Designer', 
    icon: <PaintBrushIcon className="w-6 h-6" />, 
    color: '#AF52DE', 
    text: 'Product Designer focused on high-fidelity mobile interfaces and iOS design systems.' 
  },
  { 
    id: 3, 
    title: 'AI Engineer', 
    icon: <CpuChipIcon className="w-6 h-6" />, 
    color: '#34C759', 
    text: 'Machine Learning engineer specialized in LLM fine-tuning and API integration.' 
  },
];

export default function ProctoDashboard() {
  const [activeTab, setActiveTab] = useState('assigned');
  const [jd, setJd] = useState('');
  const [isDark, setIsDark] = useState(false);
  const textAreaRef = useRef(null);
  const navigate = useNavigate();

  /**
   * MUTATION OBSERVER
   * Listens to the <html> element for theme changes triggered by the parent
   */
  useEffect(() => {
    const targetNode = document.documentElement;
    
    // Check initial state on mount
    setIsDark(targetNode.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setIsDark(targetNode.classList.contains('dark'));
        }
      });
    });

    observer.observe(targetNode, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const handleTemplateSelect = (text) => {
    setJd(text);
    textAreaRef.current?.focus();
  };

  const handleStartInterview = () => {
    if (!jd.trim()) return;
    navigate('/candidate/procto-interview/loader', { state: { jobDescription: jd, mode: 'ai' } });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] font-sans text-[#1C1C1E] dark:text-[#F2F2F7] pb-20 transition-colors duration-500 selection:bg-blue-100 dark:selection:bg-blue-900/40">
      
      {/* BACKGROUND ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-purple-400/10 dark:bg-purple-600/5 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[#8E8E93] dark:text-[#9898ED] font-semibold text-[13px] uppercase tracking-[0.05em] mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-4xl font-[800] tracking-tight text-[#1C1C1E] dark:text-white">
              Procto<span className="text-[#007AFF] dark:text-[#0A84FF]">.ai</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-md px-4 py-2 rounded-full border border-white dark:border-white/10 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[13px] font-bold text-[#3C3C43] dark:text-[#EBEBF5]/60">System Online</span>
            </div>
          </div>
        </header>

        {/* SEGMENTED CONTROL (iOS Style) */}
        <div className="flex bg-[#747480]/10 dark:bg-[#747480]/20 p-1 rounded-xl w-full sm:w-fit mb-10 backdrop-blur-lg border border-white/10">
          {['assigned', 'create'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-8 py-2 rounded-[10px] text-[14px] font-bold transition-all duration-300 ${
                activeTab === tab 
                ? 'bg-white dark:bg-[#636366] text-[#1C1C1E] dark:text-white shadow-[0_3px_8px_rgba(0,0,0,0.12)]' 
                : 'text-[#3C3C43] dark:text-[#EBEBF5]/60 hover:text-[#1C1C1E] dark:hover:text-white'
              }`}
            >
              {tab === 'assigned' ? 'My Interviews' : 'New Session'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'assigned' ? (
            <motion.div 
              key="assigned"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-[32px] border border-white dark:border-white/10 p-16 flex flex-col items-center justify-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none"
            >
              <div className="w-20 h-20 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-[22px] flex items-center justify-center mb-6 shadow-inner">
                <InboxIcon className="w-10 h-10 text-[#C7C7CC] dark:text-[#48484A]" />
              </div>
              <h2 className="text-2xl font-[800] text-[#1C1C1E] dark:text-white tracking-tight">Everything is quiet</h2>
              <p className="text-[#8E8E93] dark:text-[#AEAEB2] font-medium mt-2 max-w-[280px]">Your assigned interviews will appear here when ready.</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="mt-8 px-8 py-3.5 bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-full font-bold text-[15px] hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Create a Session
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* TEMPLATE CARDS */}
              <div className="grid md:grid-cols-3 gap-5">
                {TEMPLATES.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleTemplateSelect(item.text)}
                    className={`relative p-6 rounded-[28px] cursor-pointer transition-all border-2 flex flex-col h-full ${
                      jd === item.text 
                      ? 'bg-white dark:bg-[#2C2C2E] border-[#007AFF] dark:border-[#0A84FF] shadow-xl' 
                      : 'bg-white/80 dark:bg-[#1C1C1E]/80 border-transparent hover:bg-white dark:hover:bg-[#2C2C2E] shadow-sm'
                    }`}
                  >
                    <div 
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 text-white shadow-lg"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <h3 className="text-[17px] font-[800] text-[#1C1C1E] dark:text-white mb-1">{item.title}</h3>
                    <p className="text-[13px] font-medium text-[#8E8E93] dark:text-[#AEAEB2] leading-relaxed flex-grow">
                      Ready-to-use profile for {item.title} assessment.
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${jd === item.text ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#3C3C43] dark:text-[#AEAEB2]'}`}>
                        {jd === item.text ? 'Selected' : 'Select'}
                      </span>
                      {jd === item.text ? (
                        <CheckCircleIcon className="w-5 h-5 text-[#007AFF] dark:text-[#0A84FF]" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-[#C7C7CC] dark:text-[#48484A]" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* INPUT AREA */}
              <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[32px] p-8 sm:p-10 border border-white dark:border-white/10 shadow-2xl dark:shadow-none shadow-slate-200/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px] flex items-center justify-center text-[#1C1C1E] dark:text-white">
                      <DocumentTextIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-[800] tracking-tight text-[#1C1C1E] dark:text-white">Job Description</h3>
                  </div>
                  {jd && (
                    <button 
                      onClick={() => setJd('')}
                      className="text-[13px] font-bold text-[#FF3B30] dark:text-[#FF453A] hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors"
                    >
                      Clear Text
                    </button>
                  )}
                </div>
                
                <div className="relative group">
                  <textarea
                    ref={textAreaRef}
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Enter the specific requirements or paste a JD here..."
                    className="w-full h-48 bg-[#F2F2F7]/50 dark:bg-[#000000]/30 border-2 border-transparent rounded-[24px] p-6 text-[16px] font-medium text-[#1C1C1E] dark:text-white placeholder:text-[#AEAEB2] dark:placeholder:text-[#636366] focus:bg-white dark:focus:bg-[#000000] focus:border-[#007AFF]/30 focus:ring-0 transition-all mb-8 resize-none shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleStartInterview}
                    disabled={!jd.trim()}
                    className="w-full sm:w-auto bg-[#007AFF] dark:bg-[#0A84FF] text-white px-10 py-4 rounded-full font-bold text-[17px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-30 disabled:grayscale"
                  >
                    Launch Session <SparklesIcon className="w-5 h-5" />
                  </button>
                  <p className="text-[12px] font-bold text-[#8E8E93] dark:text-[#636366] text-center sm:text-left">
                    Press <span className="bg-[#E5E5EA] dark:bg-[#2C2C2E] px-1.5 py-0.5 rounded text-[#1C1C1E] dark:text-[#AEAEB2]">Enter</span> to quickly begin
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}