import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
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
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-4 pointer-events-none">
      
      <motion.nav
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 1 }}
        className="pointer-events-auto flex items-center bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        
        <motion.div layout className="pl-3 sm:pl-4 pr-2 flex items-center">
          <Link to="/" className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Procto<span className="text-[#007AFF]">.ai</span>
          </Link>
        </motion.div>

        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ width: 0, opacity: 0, filter: 'blur(10px)' }}
              animate={{ width: 'auto', opacity: 1, filter: 'blur(0px)' }}
              exit={{ width: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="hidden md:flex items-center overflow-hidden whitespace-nowrap"
            >
              <div className="flex items-center gap-6 px-6 border-l border-r border-white/10 mx-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-sm font-semibold text-[#8E8E93] hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="flex items-center gap-2 pl-2">
          {!userInfo ? (
            <>
              
              <Link
                to="/auth/login"
                className="flex items-center justify-center px-5 py-2 sm:px-3 sm:py-2 bg-[#007AFF] sm:bg-transparent text-white sm:text-[#8E8E93] hover:text-white sm:shadow-none shadow-[0_4px_12px_rgba(0,122,255,0.4)] rounded-[20px] text-sm font-bold sm:font-semibold transition-colors"
              >
                Login
              </Link>

              
              <Link
                to="/auth/register"
                className="hidden sm:block rounded-[20px] bg-[#007AFF] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0056b3] transition-colors shadow-[0_4px_12px_rgba(0,122,255,0.4)] whitespace-nowrap"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full sm:rounded-[20px] transition-colors"
                title="Dashboard"
              >
                <UserCircleIcon className="w-5 h-5 text-[#007AFF]" />
                <span className="hidden sm:block">Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-[#FF453A]/10 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full sm:rounded-[20px] text-sm font-bold text-[#FF453A] hover:bg-[#FF453A]/20 transition-colors"
                title="Logout"
              >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </>
          )}
        </motion.div>
      </motion.nav>
    </div>
  );
}
