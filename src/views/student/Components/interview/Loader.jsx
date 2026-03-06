import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function InterviewLoader() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Simulate Gemini API call to generate questions based on location.state.jobDescription
    const timer = setTimeout(() => {
      const generatedQuestions = [
        'How do you handle state management in complex applications?',
        'Explain your experience with modular architecture.',
        'How do you ensure accessibility in your UI components?',
      ];
      navigate('/candidate/procto-interview/session', { state: { questions: generatedQuestions } });
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full"
        />
        <SparklesIcon className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold text-slate-800"
      >
        Gemini AI is crafting your interview...
      </motion.h2>
      <p className="text-slate-400 mt-2 max-w-xs">
        Analyzing job description and tailoring behavioral questions.
      </p>
    </div>
  );
}
