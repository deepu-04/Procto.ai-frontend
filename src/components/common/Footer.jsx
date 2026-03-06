import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  ShieldCheckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="relative bg-[#F5F5F7] dark:bg-[#0A0A0C] border-t border-gray-200 dark:border-white/5 transition-colors duration-300 overflow-hidden pt-20 pb-8">
      {/* Ambient iOS Style Bottom Glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-blue-500/10 dark:bg-[#007AFF]/15 blur-[120px] rounded-full transition-colors duration-500" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid gap-12 lg:gap-8 lg:grid-cols-12 relative z-10">
        {/* ================= BRAND WIDGET ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-4 pr-0 lg:pr-8"
        >
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000}>
            <div className="bg-white/80 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl border border-gray-200 dark:border-white/10 p-8 rounded-[32px] shadow-sm dark:shadow-none transition-colors duration-300">
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Procto<span className="text-[#007AFF]">.ai</span>
              </h3>
              <p className="text-base text-gray-600 dark:text-[#8E8E93] mt-4 font-medium leading-relaxed">
                The next-generation, AI-powered secure examination platform built for modern
                institutions.
              </p>
            </div>
          </Tilt>
        </motion.div>

        {/* ================= LINKS GRID ================= */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4">
          {/* PLATFORM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-gray-900 dark:text-white font-bold mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              {['Proxy Detection', 'Plagiarism Analysis', 'Live Proctoring', 'Admin Dashboard'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-500 dark:text-[#8E8E93] hover:text-[#007AFF] dark:hover:text-white transition-colors flex items-center group"
                    >
                      {item}
                      <ArrowUpRightIcon className="w-3 h-3 ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* USE CASES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-gray-900 dark:text-white font-bold mb-6 tracking-wide">
              Use Cases
            </h4>
            <ul className="space-y-4 text-sm font-medium">
              {['Recruitment Exams', 'Universities', 'Certifications', 'Enterprises'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-500 dark:text-[#8E8E93] hover:text-[#007AFF] dark:hover:text-white transition-colors flex items-center group"
                    >
                      {item}
                      <ArrowUpRightIcon className="w-3 h-3 ml-1 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* CONTACT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-2 sm:col-span-1"
          >
            <h4 className="text-gray-900 dark:text-white font-bold mb-6 tracking-wide">Contact</h4>
            <div className="space-y-5 text-sm font-medium text-gray-500 dark:text-[#8E8E93]">
              <a
                href="mailto:support@procto.ai"
                className="flex items-center gap-3 hover:text-[#007AFF] dark:hover:text-white transition-colors"
              >
                <div className="p-2 rounded-full bg-gray-200/50 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                  <EnvelopeIcon className="h-4 w-4" />
                </div>
                support@procto.ai
              </a>
              <a
                href="tel:+919000000000"
                className="flex items-center gap-3 hover:text-[#007AFF] dark:hover:text-white transition-colors"
              >
                <div className="p-2 rounded-full bg-gray-200/50 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                  <PhoneIcon className="h-4 w-4" />
                </div>
                +91 90000 00000
              </a>
              <a
                href="https://www.procto.ai"
                className="flex items-center gap-3 hover:text-[#007AFF] dark:hover:text-white transition-colors"
              >
                <div className="p-2 rounded-full bg-gray-200/50 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                  <GlobeAltIcon className="h-4 w-4" />
                </div>
                www.procto.ai
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-gray-300 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-gray-500 dark:text-[#8E8E93] transition-colors duration-300 relative z-10">
        <p>© {new Date().getFullYear()} Procto.ai. All rights reserved.</p>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <ShieldCheckIcon className="h-5 w-5 text-[#34C759]" />
          <span className="tracking-wide">Secure • Trusted • AI-Powered</span>
        </div>
      </div>
    </footer>
  );
}
