import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, TextField, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { IconShieldCheck } from '@tabler/icons-react';

/* ================= COMPONENT ================= */
const Success = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /* -------- Dynamic Container Size for Confetti -------- */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    // Initial calculation
    updateDimensions();
    
    // Update on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /* -------- Timer: Confetti -------- */
  useEffect(() => {
    // Stop generating new confetti after 5 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(confettiTimer);
  }, []);

  // Handle final submission of feedback and exit
  const handleComplete = () => {
    console.log('Feedback submitted:', { rating: selectedRating, text: feedbackText });
    navigate('/dashboard'); // Adjusted to go to dashboard
  };

  /* --- iOS Style Emoji Data --- */
  const emojis = [
    { id: 1, icon: '😭', label: 'Terrible' },
    { id: 2, icon: '😕', label: 'Bad' },
    { id: 3, icon: '😐', label: 'Okay' },
    { id: 4, icon: '🙂', label: 'Good' },
    { id: 5, icon: '🤩', label: 'Excellent' },
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        // 1. Takes up remaining height after the top header (adjust 110px if needed)
        height: 'calc(100vh - 110px)', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        overflow: 'hidden', // Strictly clips anything outside boundaries
        bgcolor: 'transparent', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        boxSizing: 'border-box',
        // 2. Optical Centering: Pushes the card slightly up so it visually feels dead-center
        pb: { xs: 4, md: 8 }, 
      }}
    >
      {/* 🎉 BACKGROUND AMBIENT GLOWS */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: { xs: '80vw', md: '40vw' },
          height: { xs: '80vw', md: '40vw' },
          bgcolor: 'rgba(52, 199, 89, 0.08)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: { xs: '70vw', md: '35vw' },
          height: { xs: '70vw', md: '35vw' },
          bgcolor: 'rgba(0, 122, 255, 0.06)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* 🎉 CONFETTI (Confined to container to prevent scrollbars) */}
      {showConfetti && dimensions.width > 0 && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            numberOfPieces={300}
            gravity={0.12}
            recycle={false}
            colors={['#34C759', '#007AFF', '#FFCC00', '#FF3B30', '#5856D6']}
          />
        </Box>
      )}

      {/* 📱 MAIN GLASSMORPHISM CARD */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        style={{ 
          zIndex: 20, 
          width: '100%', 
          maxWidth: '500px', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'center', 
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            width: '100%', 
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: { xs: '24px', sm: '32px' },
            p: { xs: 4, sm: 5 }, 
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05), 0 1px 5px rgba(0,0,0,0.03)',
            border: '1px solid rgba(255,255,255,1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* ✅ ANIMATED APPLE-STYLE CHECKMARK */}
          <Box sx={{ position: 'relative', width: { xs: 70, sm: 80 }, height: { xs: 70, sm: 80 }, mb: { xs: 2, sm: 3 } }}>
            <motion.svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
              <motion.circle
                cx="50"
                cy="50"
                r="50"
                fill="#34C759"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              />
              <motion.path
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M28 52.5 L43 67.5 L72 34"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
              />
            </motion.svg>
          </Box>

          <Typography
            variant="h4"
            fontWeight="800"
            color="#1C1C1E"
            letterSpacing="-0.5px"
            mb={1}
            fontSize={{ xs: '1.5rem', sm: '2rem' }}
          >
            Test Completed
          </Typography>

          <Typography
            variant="body1"
            color="#8E8E93"
            mb={{ xs: 2, sm: 3 }}
            lineHeight={1.4}
            fontWeight="500"
            fontSize={{ xs: '0.9rem', sm: '1rem' }}
          >
            Your responses have been successfully submitted and securely encrypted.
          </Typography>

          {/* SECURITY BADGE */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: '#E5F9ED',
              px: 2,
              py: 0.75,
              borderRadius: '12px',
              mb: { xs: 3, sm: 4 },
            }}
          >
            <IconShieldCheck size={16} color="#34C759" />
            <Typography variant="caption" fontWeight="700" color="#248A3D">
              Securely Recorded
            </Typography>
          </Box>

          {/* Divider */}
          <Box sx={{ width: '100%', height: '1px', bgcolor: 'rgba(0,0,0,0.06)', mb: { xs: 2, sm: 4 } }} />

          {/* ⭐ EXPERIENCE RATING SECTION */}
          <Typography variant="subtitle2" fontWeight="700" color="#1C1C1E" mb={1.5}>
            How was your experience?
          </Typography>

          <Box display="flex" justifyContent="center" gap={{ xs: 0.5, sm: 1.5 }} mb={{ xs: 2, sm: 3 }}>
            {emojis.map((emoji) => {
              const isSelected = selectedRating === emoji.id;
              return (
                <motion.div
                  key={emoji.id}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    scale: isSelected ? 1.25 : 1,
                    opacity: selectedRating && !isSelected ? 0.4 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <IconButton
                    onClick={() => setSelectedRating(emoji.id)}
                    sx={{
                      fontSize: { xs: '1.75rem', sm: '2.5rem' },
                      p: { xs: 0.5, sm: 1 },
                      transition: 'all 0.2s',
                      bgcolor: isSelected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(0, 122, 255, 0.05)' },
                    }}
                    title={emoji.label}
                  >
                    {emoji.icon}
                  </IconButton>
                </motion.div>
              );
            })}
          </Box>

          {/* 📝 FEEDBACK TEXTFIELD */}
          <AnimatePresence>
            {selectedRating && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ width: '100%', overflow: 'hidden' }}
              >
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Tell us more (optional)..."
                  variant="outlined"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  sx={{
                    mb: { xs: 3, sm: 4 },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#F8FAFC',
                      borderRadius: '16px',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: 'rgba(0, 122, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#007AFF' },
                    },
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTION BUTTON */}
          <Button
            onClick={handleComplete}
            disableElevation
            fullWidth
            sx={{
              py: { xs: 1.5, sm: 2 },
              bgcolor: '#007AFF',
              color: '#fff',
              borderRadius: '50px',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: '700',
              textTransform: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 8px 20px rgba(0, 122, 255, 0.25)',
              mt: selectedRating ? 0 : 2, 
              '&:hover': {
                bgcolor: '#0056b3',
                transform: 'scale(0.98)',
              },
            }}
          >
            {selectedRating ? 'Submit Feedback & Return' : 'Return to Dashboard'}
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Success;