import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { flushSync } from 'react-dom';

import {
  ShieldCheckIcon,
  CursorArrowRaysIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  WifiIcon,
  ComputerDesktopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, Box, Typography, IconButton, Button } from '@mui/material';

import Footer from '../components/common/Footer';
import DemoModal from '../components/common/DemoModal';

/* ================= CURSOR LIGHTING & GRID EFFECT ================= */
const MouseGlow = () => {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Outer glow: Slower spring for a trailing, ambient light effect
  const smoothXOuter = useSpring(mouseX, { damping: 50, stiffness: 300, mass: 0.8 });
  const smoothYOuter = useSpring(mouseY, { damping: 50, stiffness: 300, mass: 0.8 });

  // Inner core: Faster spring to closely follow the cursor
  const smoothXInner = useSpring(mouseX, { damping: 30, stiffness: 500, mass: 0.1 });
  const smoothYInner = useSpring(mouseY, { damping: 30, stiffness: 500, mass: 0.1 });

  // Dynamic Mask Template: Creates a spotlight that reveals the grid underneath
  const gridMask = useMotionTemplate`radial-gradient(400px circle at ${smoothXOuter}px ${smoothYOuter}px, black, transparent)`;

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* ================= LIGHT MODE EFFECTS ================= */}
      <div className="dark:hidden">
        {/* Interactive Illuminated Grid */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9997]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 122, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 122, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            WebkitMaskImage: gridMask,
            maskImage: gridMask,
          }}
        />
        {/* Soft Trailing Aura */}
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9998] w-[800px] h-[800px] rounded-full mix-blend-normal"
          style={{
            x: smoothXOuter,
            y: smoothYOuter,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.06) 0%, rgba(191,90,242,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Bright Snappy Core */}
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9999] w-[350px] h-[350px] rounded-full mix-blend-normal"
          style={{
            x: smoothXInner,
            y: smoothYInner,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.1) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* ================= DARK MODE EFFECTS ================= */}
      <div className="hidden dark:block">
        {/* Interactive Illuminated Grid (Cool dual-color grid for dark mode) */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9997]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 122, 255, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(191, 90, 242, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            WebkitMaskImage: gridMask,
            maskImage: gridMask,
          }}
        />
        {/* Soft Trailing Aura */}
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9998] w-[800px] h-[800px] rounded-full mix-blend-screen"
          style={{
            x: smoothXOuter,
            y: smoothYOuter,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.15) 0%, rgba(191,90,242,0.08) 40%, transparent 70%)',
          }}
        />
        {/* Bright Snappy Core */}
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9999] w-[400px] h-[400px] rounded-full mix-blend-screen"
          style={{
            x: smoothXInner,
            y: smoothYInner,
            translateX: '-50%',
            translateY: '-50%',
            background: 'radial-gradient(circle, rgba(0,122,255,0.25) 0%, transparent 60%)',
          }}
        />
      </div>
    </>
  );
};

/* ================= 3D BACKGROUND SHAPES ================= */
const FloatingShape = ({ delay, duration, x, y, size, color, parallaxY }) => (
  <motion.div
    initial={{ rotateX: 0, rotateY: 0 }}
    animate={{ rotateX: [0, 180, 360], rotateY: [0, 180, 360] }}
    transition={{ duration: duration, repeat: Infinity, ease: 'linear', delay: delay }}
    className={`absolute hidden md:block rounded-[32px] opacity-40 dark:opacity-20 blur-[2px] ${color}`}
    style={{ left: x, top: y, width: size, height: size, transformStyle: 'preserve-3d', zIndex: 0, y: parallaxY }}
  />
);

/* ================= DYNAMIC ISLAND NAVBAR ================= */
const DynamicIslandNav = () => {
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth || {});
  const userInfo = authState.userInfo || null;
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/auth/login');
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Use Cases', href: '#use-cases' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <motion.nav
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 1 }}
      className="pointer-events-auto flex items-center bg-white/90 dark:bg-[#111113]/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-full p-1.5 shadow-xl transition-colors duration-300"
    >
      {/* LOGO */}
      <motion.div layout className="pl-4 pr-3 flex items-center">
        <Link
          to="/"
          className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight"
        >
          Procto<span className="text-[#007AFF]">.ai</span>
        </Link>
      </motion.div>

      {/* EXPANDING LINKS */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="hidden md:flex items-center overflow-hidden whitespace-nowrap"
          >
            <div className="flex items-center gap-6 px-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-semibold text-gray-500 dark:text-[#8E8E93] hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIONS */}
      <motion.div layout className="flex items-center gap-2 pl-2">
        {!userInfo ? (
          <>
            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-100 dark:bg-[#2D333B] text-gray-800 dark:text-white rounded-full text-sm font-bold transition-colors"
              title="Login"
            >
              <UserCircleIcon className="w-5 h-5 text-[#007AFF]" />
              <span className="hidden sm:block">Login</span>
            </Link>
            <Link
              to="/auth/register"
              className="hidden sm:block px-5 py-2.5 bg-[#007AFF] text-white rounded-full text-sm font-bold hover:bg-[#0056b3] transition-colors whitespace-nowrap"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-100 dark:bg-[#2D333B] text-gray-800 dark:text-white rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#3A414A] transition-colors"
              title="Dashboard"
            >
              <UserCircleIcon className="w-5 h-5 text-[#007AFF]" />
              <span className="hidden sm:block">Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-50 dark:bg-[#3A1D1D] text-red-600 dark:text-[#FF453A] rounded-full text-sm font-bold hover:bg-red-100 dark:hover:bg-[#4A2525] transition-colors whitespace-nowrap"
              title="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </>
        )}
      </motion.div>
    </motion.nav>
  );
};

/* ================= MAIN HOME COMPONENT ================= */
export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [openDemo, setOpenDemo] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth || {});
  const userInfo = authState.userInfo || null;

  // 3D Parallax Scroll Hooks
  const { scrollYProgress } = useScroll();
  const yBg1 = useTransform(scrollYProgress, [0, 1], [0, 800]); // Fast background parallax
  const yBg2 = useTransform(scrollYProgress, [0, 1], [0, 600]); // Slower background parallax
  const yShapes = useTransform(scrollYProgress, [0, 1], [0, 300]); // Medium shape parallax
  const yContent = useTransform(scrollYProgress, [0, 1], [0, -100]); // Slight foreground parallax

  // Sync state with HTML class on mount
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark'); // Force dark by default
    }
    setIsDark(true);
  }, []);

  /* --- FLUSH-SYNC VIEW TRANSITION THEME TOGGLE --- */
  const toggleTheme = (e) => {
    const isDarkModeCurrently = document.documentElement.classList.contains('dark');
    const nextThemeIsDark = !isDarkModeCurrently;

    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark');
      setIsDark(nextThemeIsDark);
      return;
    }

    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || 0;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        document.documentElement.classList.toggle('dark');
        setIsDark(nextThemeIsDark);
      });
    });

    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        { clipPath: clipPath },
        {
          duration: 600,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  const handleStartTrial = () => {
    if (userInfo) {
      navigate('/dashboard');
    } else {
      navigate('/auth/login');
    }
  };

  /* --- Arc Timeline State --- */
  const [activeFeature, setActiveFeature] = useState(2);
  const [windowWidth, setWindowWidth] = useState(1000);
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const resize = () => setWindowWidth(window.innerWidth);
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [windowWidth]);

  const nextFeature = () => setActiveFeature((p) => (p + 1) % proctoFeatures.length);
  const prevFeature = () => setActiveFeature((p) => (p === 0 ? proctoFeatures.length - 1 : p - 1));

  const proctoFeatures = [
    {
      title: '1',
      realTitle: 'Environment Protection',
      subtitle: 'Browser & System Lockdown',
      desc: 'Prevents tab switching, screen capture, virtual machines, and unauthorized applications.',
    },
    {
      title: '2',
      realTitle: 'Live Monitoring',
      subtitle: 'Real-time candidate tracking',
      desc: 'Tracks focus changes, cursor movement, and detects background audio anomalies.',
    },
    {
      title: '3',
      realTitle: 'Biometric Verification',
      subtitle: 'Continuous Identity Checks',
      desc: 'Maps facial features continuously to detect proxies or multiple people in the frame.',
    },
    {
      title: '4',
      realTitle: 'AI Plagiarism Scan',
      subtitle: 'NLP-based answer similarity',
      desc: 'Cross-references typed answers against billions of web pages and internal databases.',
    },
    {
      title: '5',
      realTitle: 'Analytics Dashboard',
      subtitle: 'Post-exam intelligence',
      desc: 'Generates behavior risk scores, timelines, and comprehensive reports for administrators.',
    },
  ];

  const faqs = [
    {
      q: 'How does Procto.ai detect proxy candidates?',
      a: 'Our AI continuously maps facial biometrics, tracks eye movement, and monitors IP/Device fingerprints to instantly flag unauthorized replacements.',
    },
    {
      q: 'Is the plagiarism detection real-time?',
      a: 'Yes. As the candidate types, our NLP models analyze sentence structures against millions of sources and flag similarities instantly.',
    },
    {
      q: "Will this slow down the user's computer?",
      a: 'Not at all. Our monitoring runs on a highly optimized WebAssembly core, utilizing less than 2% of standard CPU resources.',
    },
    {
      q: "What happens if a user's internet drops?",
      a: 'Procto.ai caches behavioral logs locally and securely syncs them to our servers the moment the connection is restored.',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const ComparisonRow = ({ icon, text, active }) => (
    <div
      className={`p-4 flex items-center gap-3 ${active ? 'border-b border-gray-200 dark:border-white/10' : 'border-b border-gray-200 dark:border-gray-800'}`}
    >
      {icon === 'check' && (
        <CheckCircleIcon className="w-6 h-6 text-[#10B981] flex-shrink-0 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      )}
      {icon === 'x' && <XCircleIcon className="w-6 h-6 text-[#EF4444] flex-shrink-0" />}
      {icon === 'warn' && (
        <ExclamationTriangleIcon className="w-6 h-6 text-[#FACC15] flex-shrink-0" />
      )}
      <span
        className={
          active
            ? 'text-gray-900 dark:text-gray-200 font-medium'
            : 'text-gray-600 dark:text-gray-500'
        }
      >
        {text}
      </span>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-gray-900 dark:text-gray-200 overflow-x-hidden font-sans transition-colors duration-300 selection:bg-[#007AFF] selection:text-white">
      {/* ================= CURSOR SPOTLIGHT INJECTION ================= */}
      <MouseGlow />

      {/* CSS required for View Transitions API Radial Wipe */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Disable default crossfade */
        ::view-transition-old(root), 
        ::view-transition-new(root) { 
          animation: none; 
          mix-blend-mode: normal; 
        }
        /* Ensure the new view ALWAYS sits perfectly on top of the old view */
        ::view-transition-old(root) { z-index: 1; }
        ::view-transition-new(root) { z-index: 2; }
        
        /* Laser Scan Keyframe */
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `,
        }}
      />

      {/* ================= TOP NAVIGATION WRAPPER ================= */}
      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center items-center gap-3 px-4 pointer-events-none">
        <DynamicIslandNav />

        <motion.button
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 1 }}
          onClick={toggleTheme}
          className="pointer-events-auto p-3.5 rounded-full bg-white/90 dark:bg-[#111113]/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-xl text-gray-800 dark:text-[#FFD60A] hover:bg-gray-100 dark:hover:bg-[#3A414A] hover:scale-105 transition-all flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* ================= HERO SECTION (WITH 3D PARALLAX) ================= */}
      <section
        id="features"
        className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden"
      >
        {/* Parallax Background Globs */}
        <motion.div style={{ y: yBg1 }} className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 dark:bg-[#007AFF]/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />
        <motion.div style={{ y: yBg2 }} className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 dark:bg-[#BF5AF2]/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />

        <FloatingShape
          delay={0}
          duration={15}
          x="10%"
          y="20%"
          size="100px"
          color="bg-blue-400/50 border border-blue-400 dark:bg-[#007AFF]/30 dark:border-[#007AFF]/50"
          parallaxY={yShapes}
        />
        <FloatingShape
          delay={5}
          duration={20}
          x="85%"
          y="60%"
          size="150px"
          color="bg-purple-400/50 border border-purple-400 dark:bg-[#BF5AF2]/30 dark:border-[#BF5AF2]/50"
          parallaxY={yShapes}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{ y: yContent }} // Subtle parallax on text
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] backdrop-blur-xl mb-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors duration-300">
              <span className="flex h-2 w-2 rounded-full bg-[#34C759] animate-pulse"></span>
              <span className="text-sm font-semibold text-gray-800 dark:text-[#E5E5EA]">
                Procto.ai OS 2.0 is Live
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-gray-900 dark:text-white transition-colors duration-300">
              Secure Exams. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-[#007AFF] dark:to-[#5E5CE6]">
                Powered by AI.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-[#8E8E93] mb-10 max-w-2xl mx-auto lg:mx-0 font-medium transition-colors duration-300">
              Eliminate impersonation, detect unauthorized tabs, and stop plagiarism in real-time.
              Deploy military-grade exam environments in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              {/* Login Status CTA */}
              <button
                onClick={handleStartTrial}
                className="group relative px-8 py-4 bg-[#007AFF] text-white font-bold rounded-[20px] overflow-hidden transition-all hover:scale-105 shadow-lg hover:shadow-[0_0_30px_rgba(0,122,255,0.4)]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <BoltIcon className="w-5 h-5 text-white" /> Start Free Trial
                </span>
              </button>

              {/* Pricing Popup CTA */}
              <button onClick={() => setPricingOpen(true)} className="px-8 py-4 rounded-[20px] font-bold border border-gray-300 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all text-gray-900 dark:text-white shadow-sm">
                Contact Sales
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ y: yContent }} // Subtle parallax on the 3D element
            className="relative perspective-1000"
          >
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              className="relative z-10 rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_20px_60px_rgba(0,122,255,0.2)] border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0B0F19] transition-colors duration-300"
            >
              {/* Fake Dashboard Header */}
              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5 backdrop-blur-md transition-colors duration-300 relative z-40">
                <div className="w-3 h-3 rounded-full bg-[#FF453A]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFD60A]"></div>
                <div className="w-3 h-3 rounded-full bg-[#32ADE6]"></div>
                <div className="ml-4 text-xs text-gray-500 dark:text-[#8E8E93] font-mono tracking-wider">
                  live_monitoring_session.exe
                </div>
              </div>

              {/* Scanning Interface Area */}
              <div className="relative h-[300px] md:h-[350px] bg-gray-100 dark:bg-[#0B101E] flex items-center justify-center overflow-hidden transition-colors duration-300">
                <div
                  className="absolute inset-0 opacity-[0.05] dark:opacity-[0.15]"
                  style={{
                    backgroundImage:
                      'linear-gradient(#007AFF 1px, transparent 1px), linear-gradient(90deg, #007AFF 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    backgroundPosition: 'center center',
                  }}
                />
                <div
                  className="absolute top-0 left-0 right-0 h-[3px] bg-[#007AFF] shadow-[0_0_20px_5px_rgba(0,122,255,0.7)] z-30 pointer-events-none"
                  style={{ animation: 'scan 3s ease-in-out infinite' }}
                />

                {/* Floating Peripheral Icons */}
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-8 left-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur-md shadow-sm">
                  <VideoCameraIcon className="w-6 h-6 text-[#34C759]" />
                </motion.div>

                <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute top-8 right-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur-md shadow-sm">
                  <MicrophoneIcon className="w-6 h-6 text-[#32ADE6]" />
                </motion.div>

                <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 2.5, repeat: Infinity }} className="absolute bottom-24 left-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur-md shadow-sm">
                  <WifiIcon className="w-6 h-6 text-[#FFD60A]" />
                </motion.div>

                <motion.div animate={{ y: [4, -4, 4] }} transition={{ duration: 4, repeat: Infinity }} className="absolute bottom-24 right-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur-md shadow-sm">
                  <LockClosedIcon className="w-6 h-6 text-[#FF453A]" />
                </motion.div>

                <div className="relative flex items-center justify-center z-10">
                  <motion.div animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} className="absolute w-24 h-24 rounded-full border-2 border-[#007AFF]" />
                  <motion.div animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }} transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: 'easeOut' }} className="absolute w-24 h-24 rounded-full border-2 border-[#007AFF]" />

                  <div className="w-20 h-20 bg-white/80 dark:bg-[#007AFF]/20 border border-gray-300 dark:border-[#007AFF]/50 backdrop-blur-xl rounded-full flex items-center justify-center relative z-20 shadow-lg">
                    <ComputerDesktopIcon className="w-10 h-10 text-[#007AFF]" />
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-40">
                  <div className="bg-white/90 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-4 rounded-2xl shadow-lg transition-colors duration-300">
                    <p className="text-[#34C759] text-xs font-bold mb-1 tracking-wider">SYSTEM CHECK</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">SECURE</p>
                  </div>
                  <div className="bg-white/90 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-gray-200 dark:border-[#32ADE6]/50 p-3 rounded-xl flex items-center gap-3 shadow-lg transition-colors duration-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#32ADE6] animate-pulse"></span>
                    <p className="text-gray-900 dark:text-white text-sm font-semibold">AI Monitoring</p>
                  </div>
                </div>
              </div>
            </Tilt>
          </motion.div>
        </div>
      </section>

      {/* ================= BENTO GRID FEATURES ================= */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">
              Total Control. <span className="text-[#007AFF]">Zero Compromise.</span>
            </h2>
            <p className="text-gray-600 dark:text-[#8E8E93] text-lg max-w-2xl mx-auto transition-colors">
              Our AI engine works silently in the background, enforcing rules without disrupting the
              candidate experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Biometric Proxy Detection',
                icon: ShieldCheckIcon,
                desc: 'Facial mapping guarantees the person taking the test is the authorized candidate.',
                col: 'md:col-span-2',
              },
              {
                title: 'Browser Lockdown',
                icon: LockClosedIcon,
                desc: 'Prevents screen sharing, virtual machines, and switching to unauthorized applications.',
                col: 'md:col-span-1',
              },
              {
                title: 'Real-time Plagiarism AI',
                icon: DocumentMagnifyingGlassIcon,
                desc: 'Instantly cross-references typed answers against billions of web pages and past exams.',
                col: 'md:col-span-1',
              },
              {
                title: 'Behavior Analytics',
                icon: CursorArrowRaysIcon,
                desc: 'Tracks eye movement, cursor activity, and background noise to generate cheating risk scores.',
                col: 'md:col-span-2',
              },
            ].map((feat, i) => (
              <Tilt key={i} tiltMaxAngleX={3} tiltMaxAngleY={3} className={feat.col}>
                <div className="h-full p-8 rounded-[32px] bg-white dark:bg-[#1C1C1E]/40 border border-gray-200 dark:border-white/[0.08] shadow-sm dark:shadow-none backdrop-blur-2xl hover:bg-gray-50 dark:hover:bg-[#1C1C1E]/70 transition-colors relative overflow-hidden group">
                  <div className="absolute -inset-px bg-gradient-to-b from-blue-50 dark:from-[#007AFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px] pointer-events-none" />
                  <feat.icon className="h-12 w-12 text-[#007AFF] mb-6 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(0,122,255,0.4)]" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-gray-600 dark:text-[#8E8E93] leading-relaxed text-lg transition-colors">
                    {feat.desc}
                  </p>
                </div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARC TIMELINE ================= */}
      <section className="py-32 relative overflow-hidden bg-white dark:bg-[#0A0A0C] border-y border-gray-200 dark:border-white/5 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-6xl mx-auto px-6 mb-12 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-colors">
            The Examination Lifecycle
          </h2>
          <p className="text-lg text-gray-600 dark:text-[#8E8E93] max-w-2xl mx-auto transition-colors">
            See how Procto.ai secures every step of the testing journey.
          </p>
        </motion.div>

        <div className="relative w-full h-[220px] sm:h-[260px] max-w-6xl mx-auto">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 260"
            preserveAspectRatio="none"
            className="absolute inset-0"
          >
            <motion.path
              ref={pathRef}
              d={windowWidth < 640 ? 'M0 210 Q 500 30 1000 210' : 'M0 210 Q 500 90 1000 210'}
              fill="none"
              stroke={isDark ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.2)'}
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            {proctoFeatures.map((feature, i) => {
              const progress = ((i + 1) / (proctoFeatures.length + 1)) * pathLength;
              const point = pathRef.current?.getPointAtLength(progress) || { x: 0, y: 0 };
              const isActive = i === activeFeature;

              return (
                <motion.g
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setActiveFeature(i)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <foreignObject x={point.x - 20} y={point.y - 60} width="40" height="40">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        color: isActive ? (isDark ? '#FFFFFF' : '#111827') : '#8E8E93',
                      }}
                      className="text-center font-bold text-xl drop-shadow-md"
                    >
                      {feature.title}
                    </motion.div>
                  </foreignObject>
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 8 : 5}
                    fill={isActive ? '#007AFF' : isDark ? '#1C1C1E' : '#FFFFFF'}
                    stroke={isActive ? '#fff' : '#007AFF'}
                    strokeWidth={isActive ? 2 : 2}
                    animate={{ r: isActive ? 10 : 5, opacity: isActive ? 1 : 0.6 }}
                    style={{
                      filter: isActive ? 'drop-shadow(0 0 10px rgba(0,122,255,0.6))' : 'none',
                    }}
                  />
                </motion.g>
              );
            })}
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto px-6 mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white transition-colors">
                {proctoFeatures[activeFeature].realTitle}
              </h3>
              <p className="text-xl text-[#007AFF] mb-3 font-semibold">
                {proctoFeatures[activeFeature].subtitle}
              </p>
              <p className="text-gray-600 dark:text-[#8E8E93] text-lg transition-colors">
                {proctoFeatures[activeFeature].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-center gap-6">
            <button
              onClick={prevFeature}
              className="p-4 rounded-full bg-gray-100 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-900 dark:text-white backdrop-blur-xl"
            >
              ←
            </button>
            <button
              onClick={nextFeature}
              className="p-4 rounded-full bg-gray-100 dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-900 dark:text-white backdrop-blur-xl"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* ================= 3D COMPARISON SECTION ================= */}
      <section className="py-32 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">
              Evolution of <span className="text-[#BF5AF2]">Proctoring</span>
            </h2>
            <p className="text-gray-600 dark:text-[#8E8E93] text-lg transition-colors">
              See why forward-thinking institutions are leaving traditional methods behind.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full max-w-md bg-white dark:bg-[#1C1C1E]/40 border border-gray-200 dark:border-white/5 p-8 rounded-[32px] opacity-90 dark:opacity-70 scale-95 shadow-sm dark:shadow-none dark:backdrop-blur-md transition-colors duration-300"
            >
              <h3 className="text-2xl font-bold text-gray-600 dark:text-[#8E8E93] mb-6 transition-colors">
                Legacy Methods
              </h3>
              <div className="space-y-2">
                <ComparisonRow icon="x" text="Easily bypassed by advanced proxies" />
                <ComparisonRow icon="x" text="Cannot scale past a few hundred users" />
                <ComparisonRow icon="warn" text="Relies on human observation (error prone)" />
                <ComparisonRow icon="warn" text="Expensive per-candidate costs" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full max-w-md relative z-10 perspective-1000"
            >
              <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.05}>
                <div className="bg-gradient-to-b from-blue-50 to-white dark:from-[#1C1C1E] dark:to-[#0A0A0C] border border-blue-200 dark:border-[#007AFF]/40 p-10 rounded-[32px] shadow-xl dark:shadow-[0_20px_60px_-15px_rgba(0,122,255,0.3)] relative overflow-hidden backdrop-blur-2xl transition-colors duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheckIcon className="w-40 h-40 text-[#007AFF]" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 relative z-10 flex items-center gap-3 transition-colors">
                    Procto.ai{' '}
                    <span className="px-3 py-1 text-xs bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] rounded-lg border border-[#007AFF]/30">
                      Next Gen
                    </span>
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <ComparisonRow icon="check" text="Impenetrable AI environment lockdown" active />
                    <ComparisonRow icon="check" text="Infinitely scalable cloud architecture" active />
                    <ComparisonRow icon="check" text="Behavioral risk scores & instant flagging" active />
                    <ComparisonRow icon="check" text="Cost-effective, automated pay-per-exam" active />
                  </div>
                </div>
              </Tilt>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= USE CASES ================= */}
      <section id="use-cases" className="py-28 relative bg-white dark:bg-[#0A0A0C] border-y border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-gray-900 dark:text-white transition-colors">
            Built for every <span className="text-purple-500 dark:text-[#32ADE6]">Industry</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ['Corporate Hiring', BriefcaseIcon],
              ['Universities', AcademicCapIcon],
              ['IT Certifications', ClipboardDocumentCheckIcon],
              ['Compliance Testing', BuildingOfficeIcon],
              ['Government Exams', ShieldCheckIcon],
              ['Bootcamps', GlobeAltIcon],
            ].map(([title, Icon]) => (
              <div
                key={title}
                className="group p-6 rounded-[24px] bg-gray-50 dark:bg-[#1C1C1E]/50 border border-gray-200 dark:border-white/5 hover:border-purple-300 dark:hover:border-[#32ADE6]/40 transition-all duration-300 flex items-center gap-5 cursor-default backdrop-blur-md shadow-sm dark:shadow-none"
              >
                <div className="p-3 rounded-[16px] bg-purple-100 dark:bg-[#32ADE6]/10 group-hover:bg-purple-200 dark:group-hover:bg-[#32ADE6]/20 transition-colors">
                  <Icon className="h-8 w-8 text-purple-600 dark:text-[#32ADE6]" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-200 transition-colors">
                  {title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-32 relative px-6 bg-white dark:bg-[#0A0A0C] border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01}>
            <div className="relative rounded-[40px] overflow-hidden p-12 md:p-20 text-center bg-gradient-to-br from-blue-500 via-[#007AFF] to-indigo-600 dark:from-[#007AFF] dark:via-[#5E5CE6] dark:to-[#BF5AF2] shadow-2xl dark:shadow-[0_0_80px_rgba(0,122,255,0.3)] border border-white/20 transition-colors duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-[80px]" />

              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 relative z-10 tracking-tight">
                Ready to secure your exams?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto relative z-10 font-medium">
                Join top universities and enterprises running fair, automated, and cheat-proof
                examinations globally.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <button onClick={handleStartTrial} className="bg-white text-[#007AFF] px-8 py-4 rounded-full font-extrabold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  Start Free Trial
                </button>
                <button onClick={() => setPricingOpen(true)} className="border-2 border-white/40 bg-black/10 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-black/20 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>
          </Tilt>
        </div>
      </section>

      {/* ================= PRICING POPUP MODAL ================= */}
      <Dialog
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: isDark ? '#111113' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#000000',
            borderRadius: '24px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box p={4} pt={6} position="relative" sx={{ minHeight: '600px' }}>
          <IconButton onClick={() => setPricingOpen(false)} sx={{ position: 'absolute', top: 16, right: 16, color: isDark ? '#FFF' : '#000' }}>
            <XMarkIcon className="w-6 h-6" />
          </IconButton>
          
          <Typography variant="h3" fontWeight="800" align="center" mb={2}>Select your Proxy Plan</Typography>
          <Typography variant="body1" align="center" color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} mb={6} sx={{ maxWidth: '600px', mx: 'auto' }}>
            Choose the perfect security tier for your organization. Upgrade your proxy defenses and eliminate impersonation risks.
          </Typography>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* PLAN 1 */}
            <div className={`p-8 rounded-[24px] border ${isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-gray-50 border-gray-200'} flex flex-col`}>
              <Typography variant="h5" fontWeight="bold" mb={1}>Proxy Sentinel</Typography>
              <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} mb={4}>Perfect for small organizations.</Typography>
              <Typography variant="h3" fontWeight="800" mb={4}>$99<span className="text-lg text-gray-500 font-normal">/mo</span></Typography>
              
              <div className="space-y-3 flex-1 mb-8">
                {['Basic Environment Lockdown', 'Standard Identity Check', 'Email Support', 'Up to 500 candidates/mo'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#007AFF]" />
                    <Typography variant="body2">{feat}</Typography>
                  </div>
                ))}
              </div>
              <Button variant="outlined" fullWidth sx={{ borderRadius: '12px', py: 1.5, borderColor: '#007AFF', color: '#007AFF' }}>Get Started</Button>
            </div>

            {/* PLAN 2 (Highlighted) */}
            <div className={`relative p-8 rounded-[24px] border-2 border-[#007AFF] ${isDark ? 'bg-[#1C1C1E]' : 'bg-white'} shadow-[0_0_40px_rgba(0,122,255,0.2)] flex flex-col scale-105 z-10`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#007AFF] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Most Popular</div>
              <Typography variant="h5" fontWeight="bold" mb={1}>Proxy Guardian</Typography>
              <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} mb={4}>Advanced AI for universities.</Typography>
              <Typography variant="h3" fontWeight="800" mb={4}>$299<span className="text-lg text-gray-500 font-normal">/mo</span></Typography>
              
              <div className="space-y-3 flex-1 mb-8">
                {['Continuous Biometric Verification', 'Real-Time Plagiarism AI', 'Behavior Analytics', 'Priority 24/7 Support', 'Up to 5,000 candidates/mo'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#007AFF]" />
                    <Typography variant="body2">{feat}</Typography>
                  </div>
                ))}
              </div>
              <Button variant="contained" fullWidth sx={{ borderRadius: '12px', py: 1.5, bgcolor: '#007AFF', '&:hover': { bgcolor: '#0056b3' } }}>Choose Guardian</Button>
            </div>

            {/* PLAN 3 */}
            <div className={`p-8 rounded-[24px] border ${isDark ? 'bg-[#1C1C1E] border-white/10' : 'bg-gray-50 border-gray-200'} flex flex-col`}>
              <Typography variant="h5" fontWeight="bold" mb={1}>Omni-Proxy</Typography>
              <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} mb={4}>Enterprise grade security.</Typography>
              <Typography variant="h3" fontWeight="800" mb={4}>Custom</Typography>
              
              <div className="space-y-3 flex-1 mb-8">
                {['Dedicated Account Manager', 'Custom API Integrations', 'White-label Interface', 'Unlimited candidates', 'On-premise deployment options'].map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[#007AFF]" />
                    <Typography variant="body2">{feat}</Typography>
                  </div>
                ))}
              </div>
              <Button variant="outlined" fullWidth sx={{ borderRadius: '12px', py: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', color: isDark ? '#FFF' : '#000' }}>Contact Sales</Button>
            </div>
          </div>
        </Box>
      </Dialog>

      <Footer />
      <DemoModal open={openDemo} onClose={() => setOpenDemo(false)} />
    </div>
  );
}