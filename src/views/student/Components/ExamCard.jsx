import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  IconButton,
  Stack,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  EventAvailable,
  EventBusy,
  CheckCircle,
  LockClock,
  TimerOutlined,
  QuizOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '../../teacher/components/DeleteIcon';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

/* ================= EXAM SUITABLE IMAGES ================= */
const BANNERS = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop', // Code/Tech
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop', // Notebook/Writing
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop', // Math/Data
  'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?q=80&w=1000&auto=format&fit=crop', // Focus/Study
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1000&auto=format&fit=crop', // Library
];

/* ================= PREMIUM GRADIENT THEMES ================= */
const CARD_THEMES = [
  // Mint Green
  { 
    bg: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)', 
    text: '#065F46', icon: '#10B981', 
    darkBg: 'linear-gradient(145deg, #064E3B 0%, #022C22 100%)', 
    darkText: '#A7F3D0', darkIcon: '#34D399' 
  }, 
  // Sky Blue
  { 
    bg: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)', 
    text: '#075985', icon: '#3B82F6', 
    darkBg: 'linear-gradient(145deg, #0C4A6E 0%, #082F49 100%)', 
    darkText: '#BAE6FD', darkIcon: '#38BDF8' 
  }, 
  // Purple
  { 
    bg: 'linear-gradient(145deg, #FAF5FF 0%, #F3E8FF 100%)', 
    text: '#6B21A8', icon: '#A855F7', 
    darkBg: 'linear-gradient(145deg, #4C1D95 0%, #2E1065 100%)', 
    darkText: '#E9D5FF', darkIcon: '#C084FC' 
  }, 
  // Orange
  { 
    bg: 'linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 100%)', 
    text: '#9A3412', icon: '#F97316', 
    darkBg: 'linear-gradient(145deg, #7C2D12 0%, #431407 100%)', 
    darkText: '#FED7AA', darkIcon: '#FB923C' 
  }, 
  // Rose
  { 
    bg: 'linear-gradient(145deg, #FFF1F2 0%, #FFE4E6 100%)', 
    text: '#9F1239', icon: '#F43F5E', 
    darkBg: 'linear-gradient(145deg, #881337 0%, #4C0519 100%)', 
    darkText: '#FECDD3', darkIcon: '#FB7185' 
  }, 
  // Yellow
  { 
    bg: 'linear-gradient(145deg, #FEFCE8 0%, #FEF9C3 100%)', 
    text: '#854D0E', icon: '#EAB308', 
    darkBg: 'linear-gradient(145deg, #713F12 0%, #422006 100%)', 
    darkText: '#FEF08A', darkIcon: '#FACC15' 
  }, 
];

/* ================= HELPERS ================= */
const statusConfig = {
  UPCOMING: { color: 'warning', icon: <LockClock fontSize="small" />, label: 'Upcoming' },
  LIVE: { color: 'success', icon: <CheckCircle fontSize="small" />, label: 'Live Now' },
  EXPIRED: { color: 'error', icon: <EventBusy fontSize="small" />, label: 'Expired' },
  // UPDATED: Changed label from "Completed" to "Attempted"
  ATTEMPTED: { color: 'info', icon: <CheckCircle fontSize="small" />, label: 'Attempted' }, 
};

const getExamStatus = (liveDate, deadDate, isAttempted) => {
  const now = new Date().getTime();
  const start = new Date(liveDate).getTime();
  const end = new Date(deadDate).getTime();

  if (isAttempted) return "ATTEMPTED";
  if (now > end) return "EXPIRED";
  if (now < start) return "UPCOMING";

  return "LIVE";
};

const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const MotionCard = motion(Card);

/* ================= COMPONENT ================= */
export default function ExamCard({ exam }) {
  const {
    examName,
    duration,
    totalQuestions,
    totalMarks = totalQuestions, 
    examId,
    liveDate,
    deadDate,
    bannerImage,
    attemptedBy = [],
  } = exam || {};

  const { userInfo } = useSelector((state) => state.auth || {});
  const navigate = useNavigate();

  // --- Dynamic Dark Mode State ---
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const isTeacher = userInfo?.role === 'teacher';
  
  // ENHANCED: Robustly checks for attempted status regardless of how the backend structures the array
  const isAttempted = exam.isAttempted || attemptedBy?.some(
    (user) => user === userInfo?._id || user?._id === userInfo?._id
  );

  const status = getExamStatus(liveDate, deadDate, isAttempted);

  // Disabled if expired or attempted (unless teacher)
  const disabled = !isTeacher && (status === "EXPIRED" || status === "ATTEMPTED" || status === "UPCOMING");

  /* ================= THEME PICK ================= */
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < (str?.length || 0); i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
  };

  const themeIndex = hashString(examId) % CARD_THEMES.length;
  const theme = CARD_THEMES[themeIndex];
  const banner = bannerImage || BANNERS[hashString(examId) % BANNERS.length];
  const config = statusConfig[status];

  // Resolve active theme colors based on Dark Mode
  const activeBg = isDark ? theme.darkBg : theme.bg;
  const activeText = isDark ? theme.darkText : theme.text;
  const activeIcon = isDark ? theme.darkIcon : theme.icon;

  /* ================= HANDLERS ================= */
  const handleCardClick = () => {
    if (isTeacher) {
      toast.info("Teachers cannot attempt exams.");
      return;
    }

    if (status === "ATTEMPTED") {
      toast.info("You have already attempted this exam.");
      return;
    }

    if (status === "EXPIRED") {
      toast.error("This exam has expired.");
      return;
    }

    if (status === "UPCOMING") {
      toast.warning("Exam not started yet.");
      return;
    }

    navigate(`/exam/${examId}`);
  };

  return (
    <MotionCard
      elevation={0} // Removes default MUI paper drop shadow/border interference
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled ? { y: -8, boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.12)' } : {}}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      sx={{
        borderRadius: '24px', 
        overflow: 'hidden',
        // Anti-aliasing hacks to remove white corner fringing
        transform: 'translateZ(0)', 
        WebkitMaskImage: '-webkit-radial-gradient(white, black)', 
        
        filter: status === 'EXPIRED' ? 'grayscale(0.8) opacity(0.7)' : 'none',
        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.06)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        
        // Using "background" instead of "backgroundColor" supports our lush gradients
        background: activeBg, 
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
        outline: 'none',
        transition: 'box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease',
      }}
    >
      <CardActionArea
        onClick={handleCardClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          backgroundColor: 'transparent', // Inherits perfectly from parent gradient
          '&:hover': { backgroundColor: 'transparent' },
          '&:hover .banner-image': { transform: !disabled ? 'scale(1.08)' : 'none' },
        }}
      >
        {/* ================= BANNER & STATUS BADGE ================= */}
        <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden', height: 160 }}>
          <CardMedia
            component="img"
            height="160"
            image={banner}
            alt="Exam Banner"
            className="banner-image"
            sx={{
              transition: 'transform 0.5s ease-in-out',
              filter: 'brightness(0.85)',
              objectFit: 'cover',
            }}
          />

          <Chip
            label={config.label}
            color={config.color}
            size="small"
            icon={config.icon}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              bgcolor: config.color === 'success' ? '#10B981' : undefined,
              color: '#FFF'
            }}
          />
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* ================= TITLE + DELETE ================= */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
            <Typography variant="h5" fontWeight={800} sx={{ color: activeText, lineHeight: 1.3, transition: 'color 0.3s ease' }}>
              {examName || 'Assessment'}
            </Typography>

            {isTeacher && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); 
                }} 
                sx={{
                  ml: 1,
                  bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' },
                }}
              >
                <DeleteIcon examId={examId} />
              </IconButton>
            )}
          </Stack>

          {/* ================= METRICS ROW ================= */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            bgcolor={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)'}
            p={1.5}
            borderRadius="16px"
            boxShadow={isDark ? 'inset 0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.02)'}
            mb={2.5}
            sx={{ 
              backdropFilter: 'blur(10px)',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease' 
            }}
            divider={<Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />}
          >
            {/* Questions */}
            <Stack alignItems="center" flex={1}>
              <QuizOutlined sx={{ fontSize: 20, color: activeIcon, mb: 0.5, transition: 'color 0.3s ease' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94A3B8' : 'text.secondary' }}>
                {totalQuestions} Qs
              </Typography>
            </Stack>

            {/* Duration */}
            <Stack alignItems="center" flex={1}>
              <TimerOutlined sx={{ fontSize: 20, color: activeIcon, mb: 0.5, transition: 'color 0.3s ease' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94A3B8' : 'text.secondary' }}>
                {duration} Min
              </Typography>
            </Stack>

            {/* Marks */}
            <Stack alignItems="center" flex={1}>
              <WorkspacePremiumOutlined sx={{ fontSize: 20, color: activeIcon, mb: 0.5, transition: 'color 0.3s ease' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94A3B8' : 'text.secondary' }}>
                {totalMarks} Pts
              </Typography>
            </Stack>
          </Stack>

          {/* ================= DATES ================= */}
          <Box sx={{ 
            bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.5)', 
            backdropFilter: 'blur(10px)',
            p: 2, 
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.8)',
            transition: 'background-color 0.3s ease'
          }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EventAvailable sx={{ fontSize: 20, color: activeIcon, transition: 'color 0.3s ease' }} />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? '#94A3B8' : 'text.secondary', fontWeight: 600 }}
                    display="block"
                    lineHeight={1.2}
                  >
                    Start Window
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: activeText, transition: 'color 0.3s ease' }}>
                    {formatDate(liveDate)}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <EventBusy
                  sx={{
                    fontSize: 20,
                    color: status === 'EXPIRED' ? 'error.main' : (isDark ? 'rgba(255,255,255,0.3)' : 'text.disabled'),
                    transition: 'color 0.3s ease'
                  }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? '#94A3B8' : 'text.secondary', fontWeight: 600 }}
                    display="block"
                    lineHeight={1.2}
                  >
                    Deadline
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: activeText, transition: 'color 0.3s ease' }}>
                    {formatDate(deadDate)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>
    </MotionCard>
  );
}