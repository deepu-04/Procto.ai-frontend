import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  SparklesIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from "@heroicons/react/24/solid";

// FIX: Import your configured axios instance to route requests to the live backend
import axiosInstance from "../../axios";

export default function ResumeExam() {
  const navigate = useNavigate();

  // JD States
  const [jdMode, setJdMode] = useState("text"); 
  const [jd, setJD] = useState("");
  const [jdFile, setJdFile] = useState(null);

  // Core States
  const [skills, setSkills] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  
  // Loading States
  const [loadingJD, setLoadingJD] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  const [isDark, setIsDark] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: "", message: "" });

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

  const showAlert = (title, message) => setPopup({ isOpen: true, title, message });

  const analyzeJD = async () => {
    if (jdMode === "text" && !jd.trim()) return showAlert("Missing Information", "Please enter a job description.");
    if (jdMode === "file" && !jdFile) return showAlert("File Required", "Please select a Job Description document.");

    try {
      setLoadingJD(true);
      let res;
      // FIX: Used axiosInstance and removed localhost:5000
      if (jdMode === "text") {
        res = await axiosInstance.post("/api/ai/analyze-jd", { jd });
      } else {
        const formData = new FormData();
        formData.append("jdFile", jdFile);
        res = await axiosInstance.post("/api/ai/analyze-jd-file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setSkills(res.data.skills || []);
    } catch (err) {
      console.error(err);
      showAlert("Analysis Failed", "Could not analyze the Job Description. Please try again.");
    }
    setLoadingJD(false);
  };

  const uploadResume = async () => {
    if (!resumeFile) return showAlert("File Required", "Please select a resume file first.");

    try {
      setLoadingResume(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("skills", skills.join(","));

      // FIX: Used axiosInstance and removed localhost:5000
      const res = await axiosInstance.post("/api/ai/analyze-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSkills(res.data.matched || skills);
    } catch (err) {
      console.error(err);
      showAlert("Upload Failed", "Resume analysis encountered an error.");
    }
    setLoadingResume(false);
  };

  /* ======================= */
  /* Generate Exam & Redirect */
  /* ======================= */
  const generateExam = async () => {
    try {
      setLoadingExam(true);
      // FIX: Used axiosInstance and removed localhost:5000
      const res = await axiosInstance.post("/api/ai/generate-exam", { skills });
      
      // Navigate to the AiExam component and pass the generated questions in state
      navigate("/candidate/ai-exam", { state: { examData: res.data.exam } });

    } catch (err) {
      console.error(err);
      showAlert("Generation Error", "Failed to generate the exam. Please try again.");
    }
    setLoadingExam(false);
  };

  const cardAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
  };

  return (
    <div className={`min-h-screen font-sans pb-20 transition-colors duration-500 ${isDark ? 'dark bg-[#000000] text-[#F2F2F7]' : 'bg-[#F2F2F7] text-[#1C1C1E]'}`}>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-500/20 dark:bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 space-y-8">
        
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-[800] tracking-tight mb-2">
            Tailored <span className="text-[#007AFF] dark:text-[#0A84FF]">Assessments</span>
          </h1>
          <p className="text-[#8E8E93] dark:text-[#AEAEB2] font-medium">
            Generate custom AI interviews based on specific Job Descriptions and Resumes.
          </p>
        </header>

        <motion.div variants={cardAnimation} initial="hidden" animate="visible" className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl rounded-[32px] p-8 border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-[12px] flex items-center justify-center text-[#1C1C1E] dark:text-white">
                <DocumentTextIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-[800] tracking-tight">Step 1: Job Description</h3>
            </div>
            
            <div className="flex bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 rounded-xl w-full sm:w-fit">
              <button onClick={() => setJdMode('text')} className={`flex-1 sm:flex-none px-6 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 ${jdMode === 'text' ? 'bg-white dark:bg-[#636366] text-[#1C1C1E] dark:text-white shadow-sm' : 'text-[#8E8E93] dark:text-[#AEAEB2]'}`}>Paste Text</button>
              <button onClick={() => setJdMode('file')} className={`flex-1 sm:flex-none px-6 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 ${jdMode === 'file' ? 'bg-white dark:bg-[#636366] text-[#1C1C1E] dark:text-white shadow-sm' : 'text-[#8E8E93] dark:text-[#AEAEB2]'}`}>Upload File</button>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            {jdMode === 'text' ? (
              <motion.textarea key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} value={jd} onChange={(e) => setJD(e.target.value)} placeholder="Paste job description here..." className="w-full h-40 bg-[#F2F2F7]/50 dark:bg-[#000000]/30 border-2 border-transparent rounded-[24px] p-6 text-[16px] font-medium placeholder:text-[#AEAEB2] focus:bg-white dark:focus:bg-[#000000] focus:border-[#007AFF]/30 focus:ring-0 transition-all mb-6 resize-none shadow-inner outline-none" />
            ) : (
              <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full mb-6">
                <input type="file" onChange={(e) => setJdFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" />
                <div className={`w-full py-12 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${jdFile ? 'border-[#007AFF] bg-[#007AFF]/5 dark:bg-[#0A84FF]/10' : 'border-[#C7C7CC] dark:border-[#48484A] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50'}`}>
                  <ArrowUpTrayIcon className={`w-8 h-8 ${jdFile ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`} />
                  <span className={`font-semibold text-[15px] ${jdFile ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>{jdFile ? jdFile.name : 'Upload JD Document (PDF / DOCX)'}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={analyzeJD} disabled={loadingJD || (jdMode === 'text' ? !jd.trim() : !jdFile)} className="w-full sm:w-auto bg-[#007AFF] dark:bg-[#0A84FF] text-white px-8 py-3.5 rounded-full font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">
            {loadingJD ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            {loadingJD ? "Analyzing Requirements..." : "Analyze Description"}
          </button>
        </motion.div>

        <AnimatePresence>
          {skills.length > 0 && (
            <motion.div variants={cardAnimation} initial="hidden" animate="visible" exit="hidden" className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl rounded-[32px] p-8 border border-white dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-lg font-[800] tracking-tight mb-4 flex items-center gap-2"><CheckCircleIcon className="w-6 h-6 text-[#34C759]" /> Extracted Core Skills</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {skills.map((s, i) => <span key={i} className="px-4 py-1.5 text-[13px] font-bold bg-[#E5F1FF] dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#60A5FA] rounded-full border border-[#007AFF]/10">{s}</span>)}
              </div>

              <div className="border-t border-[#E5E5EA] dark:border-[#38383A] pt-8">
                <h3 className="text-lg font-[800] tracking-tight mb-4">Step 2: Compare Resume (Optional)</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-2/3">
                    <input type="file" onChange={(e) => setResumeFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" />
                    <div className={`w-full p-4 rounded-[18px] border-2 border-dashed flex items-center justify-center gap-3 transition-colors ${resumeFile ? 'border-[#34C759] bg-[#34C759]/5' : 'border-[#C7C7CC] dark:border-[#48484A] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50'}`}>
                      <ArrowUpTrayIcon className={`w-6 h-6 ${resumeFile ? 'text-[#34C759]' : 'text-[#8E8E93]'}`} />
                      <span className={`font-semibold text-[14px] ${resumeFile ? 'text-[#34C759]' : 'text-[#8E8E93]'}`}>{resumeFile ? resumeFile.name : 'Upload PDF / DOCX'}</span>
                    </div>
                  </div>
                  <button onClick={uploadResume} disabled={loadingResume || !resumeFile} className="w-full sm:w-1/3 bg-[#34C759] text-white px-6 py-4 rounded-[18px] font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">
                    {loadingResume ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : "Filter Skills"}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={generateExam} disabled={loadingExam} className="w-full sm:w-auto bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-10 py-4 rounded-full font-bold text-[16px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">
                  {loadingExam ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : "Build Exam Matrix"} <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#007AFF]/10 dark:bg-[#0A84FF]/10 rounded-[24px] p-6 flex items-start gap-4 border border-[#007AFF]/20">
          <LightBulbIcon className="w-8 h-8 text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
          <div>
            <h4 className="font-[800] text-[#007AFF] dark:text-[#0A84FF] mb-2">Pro Tips for Accuracy</h4>
            <ul className="text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]/80 space-y-1.5">
              <li>• Ensure the JD includes specific tech stacks and experience levels.</li>
              <li>• The AI filters out skills that the candidate has not proven in their resume.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* iOS POPUP */}
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setPopup({ ...popup, isOpen: false })} />
            <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", damping: 25 }} className="relative w-[270px] bg-[#e5e5ea]/90 dark:bg-[#1e1e1e]/90 backdrop-blur-xl rounded-[14px] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 text-center flex flex-col items-center">
                <h3 className="text-[17px] font-[600] text-black dark:text-white leading-tight mb-1">{popup.title}</h3>
                <p className="text-[13px] font-[400] text-black/70 dark:text-white/70 leading-snug">{popup.message}</p>
              </div>
              <div className="border-t border-[#3c3c43]/20 dark:border-[#545458]/50 flex">
                <button onClick={() => setPopup({ ...popup, isOpen: false })} className="flex-1 py-3 text-[17px] text-[#007aff] dark:text-[#0a84ff] font-[600] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">OK</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}