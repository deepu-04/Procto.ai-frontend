import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
  TablePagination,
  Fade,
} from '@mui/material';
import { keyframes } from '@mui/system';
// --- iOS Style Light Icons ---
import {
  IconSearch,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconCode,
  IconCrown, 
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import axiosInstance from '../../axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

// --- Native MUI Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const popIn = keyframes`
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`;

// 3D continuous rotation for the winner crown
const rotate3D = keyframes`
  0% { transform: perspective(400px) rotateY(0deg); }
  100% { transform: perspective(400px) rotateY(360deg); }
`;

// Soft glowing pulse for the backgrounds
const pulseGlow = keyframes`
  0% { box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.2); }
  50% { box-shadow: 0 15px 50px -5px rgba(56, 189, 248, 0.3); }
  100% { box-shadow: 0 10px 40px -10px rgba(139, 92, 246, 0.2); }
`;

// Blinking cursor for typewriter effect
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

// --- Custom Typewriter Component ---
const TypewriterText = ({ text, isDark }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 100); 
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <span
        style={{
          background: isDark 
            ? 'linear-gradient(90deg, #F8FAFC, #60A5FA)' 
            : 'linear-gradient(90deg, #1E293B, #3B82F6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          transition: 'background 0.3s ease',
        }}
      >
        {displayedText}
      </span>
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: '5px',
          height: '0.85em',
          bgcolor: '#3B82F6',
          ml: 1,
          borderRadius: '2px',
          animation: `${blink} 1s step-end infinite`,
        }}
      />
    </span>
  );
};

// API Configuration
const API_ENDPOINTS = {
  getExams: '/api/exams',
  getAllResults: '/api/results/all',
  getUserResults: '/api/results/user',
  getExamResults: (examId) => `/api/results/exam/${examId}`,
  toggleVisibility: (id) => `/api/results/${id}/toggle-visibility`,
};

const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
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

  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [animatePodium, setAnimatePodium] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchExams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(API_ENDPOINTS.getExams, { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      setExams(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const endpoint = userInfo?.role === 'teacher' ? API_ENDPOINTS.getAllResults : API_ENDPOINTS.getUserResults;
      
      const response = await axiosInstance.get(endpoint, { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      
      // 🛠️ THE FIX: Ultra-Robust Data Extraction
      // Safely checks multiple common backend JSON wrapper patterns
      let rawData = response.data;
      if (rawData && !Array.isArray(rawData) && typeof rawData === 'object') {
        rawData = rawData.results || rawData.data || rawData.result || Object.values(rawData).find(Array.isArray) || [];
      }
      
      const resultsData = Array.isArray(rawData) ? rawData : []; 
      const sortedData = [...resultsData].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

      setResults(sortedData);
      setFilteredResults(sortedData);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch results';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, [fetchExams, fetchResults]);

  useEffect(() => {
    if (!loading && filteredResults.length > 0) {
      const timer = setTimeout(() => setAnimatePodium(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, filteredResults]);

  useEffect(() => {
    let filtered = [...results];
    if (selectedExam !== 'all') {
      filtered = filtered.filter(
        (r) => r.examId?._id === selectedExam || r.examId === selectedExam,
      );
    }
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.userId?.name?.toLowerCase().includes(search) ||
          r.userId?.email?.toLowerCase().includes(search) ||
          r.examId?.examName?.toLowerCase().includes(search),
      );
    }
    if (selectedTab === 1) {
      filtered = filtered.filter((r) => r.mcqScore !== undefined || r.percentage !== undefined);
    }
    if (selectedTab === 2) {
      filtered = filtered.filter((r) => r.codingSubmissions?.length > 0);
    }

    setFilteredResults(filtered);
    setPage(0);
  }, [results, searchTerm, selectedExam, selectedTab]);

  const paginatedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  
  const topPerformers = useMemo(
    () => [...filteredResults].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 3),
    [filteredResults],
  );

  const chartData = useMemo(() => {
    if (userInfo?.role === 'student') {
      return [...filteredResults]
        .reverse()
        .map((r, i) => ({
          name: r.examId?.examName || `Exam ${i + 1}`,
          score: parseFloat((r.percentage || 0).toFixed(1)),
        }));
    } else {
      const examMap = {};
      filteredResults.forEach((r) => {
        const name = r.examId?.examName || 'Unknown';
        if (!examMap[name]) examMap[name] = { sum: 0, count: 0 };
        examMap[name].sum += r.percentage || 0;
        examMap[name].count += 1;
      });
      return Object.keys(examMap).map((key) => ({
        name: key,
        avgScore: parseFloat((examMap[key].sum / examMap[key].count).toFixed(1)),
      }));
    }
  }, [filteredResults, userInfo]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    setAnimatePodium(false);
    fetchResults();
    fetchExams();
  };
  
  const handleViewCode = (result) => {
    setSelectedResult(result);
    setCodeDialogOpen(true);
  };

  const handleToggleVisibility = async (resultId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.put(
        API_ENDPOINTS.toggleVisibility(resultId),
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        },
      );
      toast.success('Visibility updated');
      setResults((prev) =>
        prev.map((r) => (r._id === resultId ? { ...r, showToStudent: !r.showToStudent } : r)),
      );
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const getBand = (percentage) => {
    if (percentage >= 90) return { label: 'Platinum', color: '#0284C7', bg: '#E0F2FE', darkColor: '#38BDF8', darkBg: 'rgba(2, 132, 199, 0.2)' };
    if (percentage >= 75) return { label: 'Gold', color: '#B45309', bg: '#FEF3C7', darkColor: '#FBBF24', darkBg: 'rgba(180, 83, 9, 0.2)' };
    if (percentage >= 60) return { label: 'Silver', color: '#475569', bg: '#F1F5F9', darkColor: '#94A3B8', darkBg: 'rgba(71, 85, 105, 0.3)' };
    return { label: 'Bronze', color: '#9A3412', bg: '#FFEDD5', darkColor: '#FB923C', darkBg: 'rgba(154, 52, 18, 0.2)' };
  };

  // --- UI Components ---
  const renderPodiumBlock = (performer, rank) => {
    if (!performer) return null;
    const heights = { 1: 180, 2: 130, 3: 100 };
    const gradients = {
      1: 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)',
      2: 'linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)',
      3: 'linear-gradient(180deg, #D97706 0%, #92400E 100%)',
    };

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mx={2}
        sx={{
          animation: `${popIn} 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards`,
          animationDelay: `${rank * 0.15}s`,
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={1}>
          {rank === 1 && (
            <IconCrown
              size={54}
              stroke={1.5}
              style={{
                color: '#FBBF24',
                marginBottom: -18,
                zIndex: 10,
                position: 'relative',
                animation: `${rotate3D} 3.5s linear infinite`,
                filter: 'drop-shadow(0px 4px 6px rgba(251, 191, 36, 0.8))',
              }}
            />
          )}
          <Avatar
            sx={{
              bgcolor: rank === 1 ? '#0052FF' : '#4F46E5',
              width: 60,
              height: 60,
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              border: isDark ? '3px solid #1E293B' : '3px solid white',
              zIndex: 1,
            }}
          >
            {performer.userId?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        </Box>

        <Typography
          variant="caption"
          fontWeight="bold"
          noWrap
          sx={{ maxWidth: 100, textAlign: 'center', color: isDark ? '#F8FAFC' : '#1E293B', fontSize: '0.85rem' }}
        >
          {performer.userId?.name?.split(' ')[0] || 'Unknown'}
        </Typography>
        <Typography
          variant="caption"
          fontWeight="bold"
          mb={1.5}
          sx={{ fontSize: '0.8rem', color: isDark ? '#60A5FA' : '#2563EB' }}
        >
          {performer.percentage?.toFixed(0)} pts
        </Typography>

        <Box
          sx={{
            width: 90,
            height: animatePodium ? heights[rank] : 0,
            opacity: animatePodium ? 1 : 0,
            transition: 'height 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease',
            background: gradients[rank],
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            pt: 2,
            boxShadow: isDark 
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.8), inset 0 4px 6px -1px rgba(255, 255, 255, 0.15)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.3), inset 0 4px 6px -1px rgba(255, 255, 255, 0.3)',
          }}
        >
          <Typography
            variant="h3"
            color="white"
            fontWeight="900"
            sx={{
              opacity: animatePodium ? 0.8 : 0,
              transition: 'opacity 0.3s 0.5s',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            #{rank}
          </Typography>
        </Box>
      </Box>
    );
  };

  const LeaderboardPodium = () => {
    const titleText =
      userInfo?.role === 'teacher'
        ? 'Overall Class Performance'
        : `${userInfo?.name ? userInfo.name.split(' ')[0] + "'s" : 'Your'} Performance`;

    return (
      <Box
        textAlign="center"
        py={5}
        mb={5}
        sx={{
          background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.4))' : 'linear-gradient(135deg, #ffffff, #f8fafc)',
          backdropFilter: isDark ? 'blur(16px)' : 'none',
          borderRadius: '32px',
          animation: `${pulseGlow} 6s infinite`,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
          transition: 'all 0.3s ease',
        }}
      >
        <Typography
          variant="h3"
          fontWeight="900"
          gutterBottom
          sx={{ minHeight: '1.2em', display: 'flex', justifyContent: 'center' }}
        >
          <TypewriterText text={titleText} isDark={isDark} />
        </Typography>
        <Typography variant="subtitle1" sx={{ color: isDark ? '#94A3B8' : 'textSecondary', transition: 'color 0.3s' }} mb={6}>
          Celebrating the highest achieving scholars
        </Typography>

        <Box display="flex" justifyContent="center" alignItems="flex-end" height={280}>
          {renderPodiumBlock(topPerformers[1], 2)}
          {renderPodiumBlock(topPerformers[0], 1)}
          {renderPodiumBlock(topPerformers[2], 3)}
        </Box>
      </Box>
    );
  };

  if (loading && !refreshing) {
    return (
      <PageContainer title="Results">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} sx={{ color: isDark ? '#60A5FA' : 'primary.main' }} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={userInfo?.role === 'student' ? 'My Results' : 'Overall Leaderboard'}>
      <Fade in={true} timeout={600}>
        <Box sx={{ pt: 2, pb: 4 }}>
          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : undefined,
                color: isDark ? '#FCA5A5' : undefined,
                '& .MuiAlert-icon': { color: isDark ? '#F87171' : undefined }
              }}
            >
              {error}
            </Alert>
          )}

          {/* 1. Podium Section */}
          {topPerformers.length > 0 && <LeaderboardPodium />}

          <Grid container spacing={5}>
            {/* 2. Analytics Section */}
            <Grid item xs={12}>
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(28, 28, 30, 0.6)' : '#ffffff',
                  backdropFilter: isDark ? 'blur(16px)' : 'none',
                  borderRadius: '32px',
                  p: 4,
                  animation: `${pulseGlow} 6s infinite`,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#F8FAFC' : '#1E293B', transition: 'color 0.3s' }}>
                      Performance Analytics
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : 'textSecondary', transition: 'color 0.3s' }}>
                      Visual breakdown of scores over time
                    </Typography>
                  </Box>
                  <Tooltip title="Refresh Graph">
                    <IconButton
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{ 
                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                        color: isDark ? '#F8FAFC' : 'inherit',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }
                      }}
                    >
                      <IconRefresh size={20} stroke={1.5} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {chartData.length > 0 ? (
                  <Box
                    height={400}
                    mt={3}
                    sx={{ animation: `${fadeInUp} 0.6s ease backwards`, animationDelay: '0.2s' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      {userInfo?.role === 'student' ? (
                        <LineChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: -20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9'} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                            angle={-25}
                            textAnchor="end"
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                            domain={[0, 100]}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#1E293B' : '#ffffff',
                              color: isDark ? '#F8FAFC' : '#1E293B',
                              borderRadius: '16px',
                              border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            }}
                          />
                          <Line
                            isAnimationActive={true}
                            animationDuration={2000}
                            type="monotone"
                            dataKey="score"
                            stroke={isDark ? '#60A5FA' : '#3B82F6'}
                            strokeWidth={4}
                            dot={{ r: 6, fill: isDark ? '#60A5FA' : '#3B82F6', strokeWidth: 3, stroke: isDark ? '#1E293B' : '#fff' }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      ) : (
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: -20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9'} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                            angle={-25}
                            textAnchor="end"
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                            domain={[0, 100]}
                          />
                          <RechartsTooltip
                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}
                            contentStyle={{
                              backgroundColor: isDark ? '#1E293B' : '#ffffff',
                              color: isDark ? '#F8FAFC' : '#1E293B',
                              borderRadius: '16px',
                              border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            }}
                          />
                          <Bar
                            isAnimationActive={true}
                            animationDuration={2000}
                            dataKey="avgScore"
                            fill={isDark ? '#60A5FA' : '#3B82F6'}
                            radius={[8, 8, 0, 0]}
                            barSize={45}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box height={400} display="flex" alignItems="center" justifyContent="center">
                    <Typography sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>Not enough data for analytics.</Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* 3. Table Section */}
            <Grid item xs={12}>
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(28, 28, 30, 0.6)' : '#ffffff',
                  backdropFilter: isDark ? 'blur(16px)' : 'none',
                  borderRadius: '32px',
                  p: 4,
                  animation: `${pulseGlow} 6s infinite`,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Typography variant="h5" fontWeight="800" sx={{ color: isDark ? '#F8FAFC' : '#1E293B', transition: 'color 0.3s' }} mb={3}>
                  Detailed Exam Rankings
                </Typography>

                <Box
                  mb={3}
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  p={2}
                  bgcolor={isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC'}
                  borderRadius="20px"
                  sx={{ transition: 'background-color 0.3s ease' }}
                >
                  {userInfo?.role === 'teacher' && (
                    <FormControl sx={{ minWidth: 200 }} size="small">
                      <InputLabel sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>Select Exam</InputLabel>
                      <Select
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        label="Select Exam"
                        sx={{ 
                          borderRadius: 3, 
                          color: isDark ? '#F8FAFC' : 'inherit',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'inherit',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'inherit',
                          },
                          '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : 'inherit' }
                        }}
                      >
                        <MenuItem value="all">All Exams</MenuItem>
                        {exams.map((exam) => (
                          <MenuItem key={exam._id} value={exam._id}>
                            {exam.examName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <TextField
                    label="Search Student / Exam"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    sx={{ 
                      minWidth: 200, 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 3,
                        color: isDark ? '#F8FAFC' : 'inherit',
                        '& fieldset': {
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0, 0, 0, 0.23)'
                        },
                        '&:hover fieldset': {
                          borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0, 0, 0, 0.87)'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDark ? '#94A3B8' : 'inherit',
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch size={18} stroke={1.5} color={isDark ? '#94A3B8' : 'inherit'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Tabs
                  value={selectedTab}
                  onChange={(e, v) => setSelectedTab(v)}
                  sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider',
                    '& .MuiTab-root': { 
                      borderRadius: '8px 8px 0 0',
                      color: isDark ? '#94A3B8' : 'inherit',
                    },
                    '& .Mui-selected': {
                      color: isDark ? '#60A5FA !important' : 'primary.main',
                    }
                  }}
                >
                  <Tab label={`All Results (${filteredResults.length})`} />
                  <Tab label="MCQ Results" />
                  <Tab label="Coding Results" />
                </Tabs>

                {filteredResults.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Typography sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>No records found.</Typography>
                  </Box>
                ) : (
                  <Box>
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{ 
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', 
                        borderRadius: '24px', 
                        overflow: 'hidden',
                        bgcolor: 'transparent',
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.4)' : '#F8FAFC' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B' }}>
                              RANK
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B' }}>
                              USER
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B' }}>
                              EXAM
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B' }}>
                              SCORE
                            </TableCell>
                            <TableCell
                              sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center' }}
                            >
                              BAND
                            </TableCell>
                            {userInfo?.role === 'teacher' && (
                              <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B' }}>
                                VISIBILITY
                              </TableCell>
                            )}
                            <TableCell
                              sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : '#64748B', textAlign: 'right' }}
                            >
                              ACTIONS
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedResults.map((result, index) => {
                            const actualRank = page * rowsPerPage + index + 1;
                            const band = getBand(result.percentage || 0);

                            return (
                              <TableRow
                                key={result._id}
                                hover
                                sx={{
                                  '& td': { borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' },
                                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05) !important' : 'rgba(0,0,0,0.02) !important' },
                                  animation: `${fadeInUp} 0.5s ease backwards`,
                                  animationDelay: `${index * 0.05}s`,
                                }}
                              >
                                <TableCell>
                                  <Box
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      bgcolor:
                                        actualRank === 1
                                          ? '#FBBF24'
                                          : actualRank === 2
                                            ? '#94A3B8'
                                            : actualRank === 3
                                              ? '#D97706'
                                              : (isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9'),
                                      color: actualRank <= 3 ? 'white' : (isDark ? '#94A3B8' : '#475569'),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {actualRank}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1.5}>
                                    <Avatar
                                      sx={{
                                        bgcolor: '#6366F1',
                                        width: 36,
                                        height: 36,
                                        fontSize: '0.9rem',
                                      }}
                                    >
                                      {result.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight="700" sx={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                                        {result.userId?.name?.toUpperCase() || 'UNKNOWN USER'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
                                        {result.userId?.email || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="500" sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                                    {result.examId?.examName || 'Unknown Exam'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                                    {result.percentage?.toFixed(1)}%{' '}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}
                                    >
                                      ({result.totalMarks} pts)
                                    </Typography>
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={band.label}
                                    size="small"
                                    sx={{
                                      bgcolor: isDark ? band.darkBg : band.bg,
                                      color: isDark ? band.darkColor : band.color,
                                      fontWeight: 'bold',
                                      borderRadius: '8px',
                                      border: isDark ? `1px solid ${band.darkColor}40` : 'none',
                                    }}
                                  />
                                </TableCell>
                                {userInfo?.role === 'teacher' && (
                                  <TableCell>
                                    <IconButton
                                      onClick={() => handleToggleVisibility(result._id)}
                                      sx={{ color: result.showToStudent ? '#10B981' : (isDark ? '#475569' : '#94A3B8') }}
                                      size="small"
                                    >
                                      {result.showToStudent ? (
                                        <IconEye size={20} stroke={1.5} />
                                      ) : (
                                        <IconEyeOff size={20} stroke={1.5} />
                                      )}
                                    </IconButton>
                                  </TableCell>
                                )}
                                <TableCell align="right">
                                  {result.codingSubmissions?.length > 0 ? (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<IconCode size={16} />}
                                      onClick={() => handleViewCode(result)}
                                      sx={{
                                        borderRadius: 4,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined,
                                        color: isDark ? '#60A5FA' : undefined,
                                        '&:hover': {
                                          borderColor: isDark ? '#60A5FA' : undefined,
                                          bgcolor: isDark ? 'rgba(96, 165, 250, 0.1)' : undefined,
                                        }
                                      }}
                                    >
                                      Code
                                    </Button>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: isDark ? '#475569' : 'textSecondary' }}>
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={filteredResults.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                      sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Dialog */}
          <Dialog
            open={codeDialogOpen}
            onClose={() => setCodeDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { minHeight: '60vh', borderRadius: '32px', bgcolor: isDark ? '#1C1C1E' : '#ffffff' } }}
          >
            <DialogTitle sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <IconCode size={24} color={isDark ? "#60A5FA" : "#3B82F6"} stroke={2} />
                <Typography variant="h6" fontWeight="800" sx={{ color: isDark ? '#F8FAFC' : '#1E293B' }}>
                  Code Submissions
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 4, px: 4 }}>
              {selectedResult?.codingSubmissions?.length > 0 ? (
                selectedResult.codingSubmissions.map((sub, i) => (
                  <Box key={i} mb={5}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                        Question {i + 1}
                      </Typography>
                      <Chip
                        label={sub.language}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 'bold', borderRadius: 2, color: isDark ? '#94A3B8' : 'inherit', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'inherit' }}
                      />
                    </Box>
                    <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', bgcolor: isDark ? '#000000' : '#ffffff' }}>
                      <SyntaxHighlighter
                        language={sub.language}
                        style={atomOneDark}
                        showLineNumbers
                        customStyle={{ margin: 0, padding: '20px', fontSize: '0.9rem', backgroundColor: isDark ? '#000000' : '#282C34' }}
                      >
                        {sub.code || '// No code submitted'}
                      </SyntaxHighlighter>
                    </Paper>
                  </Box>
                ))
              ) : (
                <Typography textAlign="center" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>No code available</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }}>
              <Button
                onClick={() => setCodeDialogOpen(false)}
                variant="contained"
                disableElevation
                sx={{ borderRadius: 4, px: 4, py: 1, textTransform: 'none', fontWeight: 'bold', bgcolor: isDark ? '#3B82F6' : 'primary.main' }}
              >
                Close Window
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </PageContainer>
  );
};

export default ResultPage;