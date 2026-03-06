import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DemoModal({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
         
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
           
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 relative pointer-events-auto">
            
              <button
                onClick={onClose}
                className="absolute top-5 right-5 bg-gray-200/50 hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>

             
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                  Request Demo
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  See how Procto.ai secures your exams.
                </p>
              </div>

              
              <form className="space-y-4">
               
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-gray-100/50 border border-gray-200/60 rounded-[16px] px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:bg-white transition-all font-medium"
                />

                <input
                  type="email"
                  placeholder="Work Email"
                  className="w-full bg-gray-100/50 border border-gray-200/60 rounded-[16px] px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:bg-white transition-all font-medium"
                />

               
                <div className="flex items-center bg-gray-100/50 border border-gray-200/60 rounded-[16px] px-5 py-3.5 focus-within:ring-2 focus-within:ring-[#007AFF]/50 focus-within:bg-white transition-all">
                  <span className="mr-2 text-lg">🇮🇳</span>
                  <span className="mr-3 text-gray-500 font-semibold border-r border-gray-300 pr-3">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="flex-1 bg-transparent outline-none text-gray-900 font-medium placeholder-gray-400"
                  />
                </div>

                
                <select className="w-full bg-gray-100/50 border border-gray-200/60 rounded-[16px] px-5 py-3.5 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="" disabled selected>
                    Select your role
                  </option>
                  <option>CXO / VP / Director</option>
                  <option>HR Professional</option>
                  <option>University Admin</option>
                  <option>Student</option>
                  <option>Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Organization / Company"
                  className="w-full bg-gray-100/50 border border-gray-200/60 rounded-[16px] px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 focus:bg-white transition-all font-medium"
                />

                
                <p className="text-xs text-gray-400 text-center pt-2">
                  By submitting, you agree to our{' '}
                  <span className="text-[#007AFF] hover:underline cursor-pointer font-medium">
                    Terms & Privacy Policy
                  </span>
                  .
                </p>

                
                <button
                  type="submit"
                  className="w-full bg-[#007AFF] hover:bg-[#0056b3] text-white py-4 rounded-[16px] font-bold text-lg shadow-[0_4px_14px_rgba(0,122,255,0.4)] transition-all active:scale-[0.98] mt-2"
                >
                  Confirm Request
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
