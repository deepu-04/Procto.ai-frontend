import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Box, Typography, Grid, Card, Stack, Button,
  Divider, Avatar, Chip, Alert, CircularProgress, LinearProgress, Skeleton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  TrendingUpRounded, LightbulbCircleOutlined, WarningAmberRounded,
  TrackChangesRounded, CloudDownloadRounded, CalendarTodayRounded, 
  AccessTimeRounded, WifiTetheringRounded, SignalWifiOffRounded,
  AutoAwesomeRounded
} from '@mui/icons-material';

import PageContainer from 'src/components/container/PageContainer';
import axiosInstance from '../../axios'; // FIX: Imported your secure axios instance

/* ================= DEMO DATA ================= */
const DEMO_PERFORMANCE = [
  { month: 'Jan', score: 55 }, { month: 'Feb', score: 62 },
  { month: 'Mar', score: 70 }, { month: 'Apr', score: 68 },
  { month: 'May', score: 85 }, { month: 'Jun', score: 82 },
];

const DEMO_SKILLS = [
  { subject: 'Java', actual: 88, expected: 90 },
  { subject: 'Python', actual: 60, expected: 85 },
  { subject: 'React.js', actual: 75, expected: 80 },
  { subject: 'SQL / Databases', actual: 92, expected: 85 },
  { subject: 'Spring Boot', actual: 45, expected: 75 },
];

const DEMO_EXAMS = [
  { id: 'AI-JAV-01', name: 'Core Java Concepts', score: 88, status: 'Passed', date: 'Just now' },
  { id: 'AI-SPR-02', name: 'Spring Boot Microservices', score: 45, status: 'Needs Review', date: '2 days ago' },
  { id: 'AI-SQL-03', name: 'Advanced SQL Queries', score: 92, status: 'Passed', date: '1 week ago' }
];

export default function Analytics() {
  // --- Data States ---
  const [performanceData, setPerformanceData] = useState(DEMO_PERFORMANCE);
  const [skillGapData, setSkillGapData] = useState(DEMO_SKILLS);
  const [recentExams, setRecentExams] = useState(DEMO_EXAMS);
  const [totalExamsCount, setTotalExamsCount] = useState(3);
  const [averageScore, setAverageScore] = useState(75);
  
  // --- AI Analysis States ---
  const [aiInsights, setAiInsights] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Status States ---
  const [isLiveData, setIsLiveData] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  
  // --- UI States ---
  const [isDark, setIsDark] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // =========================================================
  // 1. DARK MODE MUTATION OBSERVER
  // =========================================================
  useEffect(() => {
    const htmlElement = document.documentElement;
    setIsDark(htmlElement.classList.contains('dark'));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(htmlElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(htmlElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // =========================================================
  // 2. LIVE DATA FETCHING
  // =========================================================
  const fetchLiveAnalytics = useCallback(async () => {
    try {
      setIsFetching(true);
      
      const storedUserId = localStorage.getItem("userId");
      let parsedUser = null;
      
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          parsedUser = JSON.parse(userInfoStr);
        }
      } catch (e) {
        console.warn("Failed to parse userInfo from localStorage", e);
      }

      // Prioritize the direct "userId", fallback to parsed user IDs
      const userId = storedUserId || parsedUser?._id || parsedUser?.id; 

      if (!userId) {
        setError("User session not found. Showing demo graphs.");
        setIsFetching(false);
        return; 
      }

      // FIX: Grab token and use axiosInstance to securely call the hosted backend, not localhost!
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/api/user/analytics-dashboard?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Robust extraction in case the backend wraps it in 'data.data'
      const data = response.data?.data || response.data;
      
      if (data && (data.history || data.exams)) {
        if (data.history?.length > 0) setPerformanceData(data.history);
        if (data.gaps?.length > 0) setSkillGapData(data.gaps.map(item => ({ ...item, actual: item.actual ?? 0 })));
        if (data.exams?.length > 0) setRecentExams(data.exams);
        
        setTotalExamsCount(data.stats?.totalExams || data.exams?.length || 0);
        setAverageScore(data.stats?.avgScore || 0);
        
        setIsLiveData(true);
        setError(null);
      } else {
        setError("No live AI exams found for your account. Showing demo graphs.");
      }
    } catch (err) {
      setError("Unable to connect to AI server. Displaying demo graphs.");
      console.error("Analytics fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAnalytics();
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchLiveAnalytics]);

  // =========================================================
  // 3. DYNAMIC KPI CALCULATION
  // =========================================================
  const getDynamicStats = () => {
    if (!skillGapData || skillGapData.length === 0) return { criticalGap: 'N/A', topStrength: 'N/A' };
    
    const worst = [...skillGapData].sort((a, b) => (b.expected - b.actual) - (a.expected - a.actual))[0];
    const best = [...skillGapData].sort((a, b) => b.actual - a.actual)[0];

    return {
      criticalGap: (worst.expected - worst.actual > 0) ? worst.subject : 'None',
      topStrength: best.subject || 'N/A'
    };
  };

  const dynamicStats = getDynamicStats();

  // =========================================================
  // 4. AI SUGGESTION GENERATOR
  // =========================================================
  const generateAiAnalysis = () => {
    setIsAnalyzing(true);
    setAiInsights("");

    setTimeout(() => {
      const worst = [...skillGapData].sort((a, b) => (b.expected - b.actual) - (a.expected - a.actual))[0];
      const best = [...skillGapData].sort((a, b) => b.actual - a.actual)[0];
      
      let insightText = "";
      
      if (worst && (worst.expected - worst.actual > 10)) {
        insightText += `System detects a **${worst.expected - worst.actual}% skill gap** in **${worst.subject}**. To improve outcomes, prioritize studying this subject. I recommend taking targeted practice exams focusing specifically on ${worst.subject} fundamentals. `;
      } else {
        insightText += `Excellent trajectory. You are meeting or exceeding benchmarks across all tested subjects. `;
      }

      if (best) {
        insightText += `Your strongest technical domain is **${best.subject}** with a proficiency of **${best.actual}%**. To maximize your career profile, consider highlighting ${best.subject} projects on your resume.`;
      }

      setAiInsights(insightText);
      setIsAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    if (!isFetching) {
      generateAiAnalysis();
    }
    // eslint-disable-next-line
  }, [isFetching]);

  // =========================================================
  // 5. EXCEL EXPORT
  // =========================================================
  const downloadExcelReport = () => {
    const wb = XLSX.utils.book_new();
    const summaryWS = XLSX.utils.json_to_sheet([
      { Metric: "Data Source", Value: isLiveData ? "Live Database" : "Demo Data" },
      { Metric: "Generated At", Value: currentDateTime.toLocaleString() },
      { Metric: "Total AI Exams", Value: totalExamsCount },
      { Metric: "Avg AI Score", Value: `${averageScore}%` },
      { Metric: "Top AI Strength", Value: dynamicStats.topStrength },
      { Metric: "Critical Gap Subject", Value: dynamicStats.criticalGap },
    ]);
    
    const skillWS = XLSX.utils.json_to_sheet(skillGapData.map(skill => ({
      "Subject": skill.subject, "Your Score": skill.actual, "Target Score": skill.expected, "Gap (%)": skill.expected - skill.actual
    })));

    const examWS = XLSX.utils.json_to_sheet(recentExams);
    
    XLSX.utils.book_append_sheet(wb, summaryWS, "Overview");
    XLSX.utils.book_append_sheet(wb, skillWS, "Subject Proficiencies");
    XLSX.utils.book_append_sheet(wb, examWS, "Exam History");
    XLSX.writeFile(wb, `AI_Exam_Analytics_${Date.now()}.xlsx`);
  };

  // --- iOS Design Tokens ---
  const themeConfig = {
    bg: isDark ? '#000000' : '#F2F2F7',
    card: isDark ? 'rgba(28, 28, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    text: isDark ? '#FFFFFF' : '#000000',
    secondaryText: isDark ? '#8E8E93' : '#636366',
    accent: '#0A84FF',
    glass: 'blur(25px) saturate(200%)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
    gridLine: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  };

  return (
    <PageContainer title="AI Analytics">
      <Box sx={{ minHeight: '100vh', bgcolor: themeConfig.bg, p: { xs: 2, md: 5 }, transition: 'all 0.4s ease', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
        
        {/* TOP HEADER */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }} mb={5} spacing={2}>
          <Box>
            <Typography variant="caption" sx={{ color: themeConfig.secondaryText, fontWeight: 600, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CalendarTodayRounded sx={{ fontSize: 14 }} />
              {currentDateTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              <AccessTimeRounded sx={{ fontSize: 14, ml: 1 }} />
              {currentDateTime.toLocaleTimeString()}
            </Typography>
            <Typography variant="h3" sx={{ color: themeConfig.text, fontWeight: 800, letterSpacing: '-1.5px' }}>
              Subject Insights
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Chip 
              icon={isLiveData ? <WifiTetheringRounded /> : <SignalWifiOffRounded />} 
              label={isFetching ? "Syncing..." : (isLiveData ? "Live Data" : "Demo Mode")} 
              color={isLiveData ? "success" : "warning"}
              variant={isDark ? "outlined" : "filled"}
              sx={{ fontWeight: 'bold' }}
            />
            <Button 
              variant="contained" 
              onClick={downloadExcelReport}
              sx={{ borderRadius: '14px', bgcolor: themeConfig.accent, px: 3, fontWeight: 600, textTransform: 'none', boxShadow: '0 4px 14px rgba(10, 132, 255, 0.3)' }}
              startIcon={isFetching ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadRounded />}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="info" sx={{mb: 4, borderRadius: '12px'}}>{error}</Alert>}

        {/* KPI CARDS */}
        <Grid container spacing={3} mb={5}>
          {[
            { label: "AI Exams Taken", val: totalExamsCount, icon: <TrackChangesRounded />, color: '#32D74B' },
            { label: "Average Score", val: `${averageScore}%`, icon: <TrendingUpRounded />, color: '#0A84FF' },
            { label: "Critical Subject Gap", val: dynamicStats.criticalGap, icon: <WarningAmberRounded />, color: '#FF9F0A' },
            { label: "Top Subject Strength", val: dynamicStats.topStrength, icon: <LightbulbCircleOutlined />, color: '#BF5AF2' },
          ].map((item, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ p: 3, borderRadius: '24px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, boxShadow: 'none' }}>
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography variant="h4" sx={{ color: themeConfig.text, fontWeight: 800 }}>{item.val}</Typography>
                <Typography variant="body2" sx={{ color: themeConfig.secondaryText, fontWeight: 500 }}>{item.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* AI PERFORMANCE COACH SECTION */}
        <Card sx={{ p: 4, borderRadius: '30px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, mb: 5, boxShadow: 'none', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', top: '-50%', right: '-10%', width: '50%', height: '200%', background: 'radial-gradient(ellipse at center, rgba(10, 132, 255, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
            <Box sx={{ bgcolor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(10, 132, 255, 0.1)', p: 2, borderRadius: '20px', color: themeConfig.accent }}>
              <AutoAwesomeRounded sx={{ fontSize: 36 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h5" sx={{ color: themeConfig.text, fontWeight: 800, mb: 1 }}>AI Performance Coach</Typography>
              
              {isAnalyzing ? (
                <Stack spacing={2} mt={2}>
                  <Skeleton animation="wave" height={20} width="90%" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <Skeleton animation="wave" height={20} width="70%" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <Typography variant="caption" sx={{ color: themeConfig.accent, fontWeight: 600 }}>Synthesizing data...</Typography>
                </Stack>
              ) : (
                <Typography variant="body1" sx={{ color: themeConfig.secondaryText, mt: 1, lineHeight: 1.7, fontSize: '1.05rem' }}>
                  <span dangerouslySetInnerHTML={{ __html: aiInsights.replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${themeConfig.text}">$1</strong>`) }} />
                </Typography>
              )}
            </Box>
            <Button 
              variant="outlined" 
              onClick={generateAiAnalysis}
              disabled={isAnalyzing}
              sx={{ borderRadius: '12px', borderColor: themeConfig.border, color: themeConfig.text, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}
            >
              Re-Analyze
            </Button>
          </Stack>
        </Card>

        {/* CHARTS */}
        <Grid container spacing={4} mb={5}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 4, borderRadius: '30px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, height: 450, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ color: themeConfig.text, fontWeight: 700, mb: 4 }}>Learning Curve</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeConfig.accent} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={themeConfig.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeConfig.gridLine} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: themeConfig.secondaryText, fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '15px', backgroundColor: themeConfig.card, border: themeConfig.border, backdropFilter: themeConfig.glass, color: themeConfig.text }} />
                  <Area type="monotone" dataKey="score" stroke={themeConfig.accent} strokeWidth={4} fill="url(#colorScore)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 4, borderRadius: '30px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, height: 450, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ color: themeConfig.text, fontWeight: 700, mb: 2 }}>Subject Competency Map</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart data={skillGapData}>
                  <PolarGrid stroke={themeConfig.gridLine} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: themeConfig.secondaryText, fontSize: 11, fontWeight: 500 }} />
                  <Radar name="Actual Score" dataKey="actual" stroke={themeConfig.accent} fill={themeConfig.accent} fillOpacity={0.5} animationDuration={1500} />
                  <Tooltip contentStyle={{ borderRadius: '15px', backgroundColor: themeConfig.card, border: themeConfig.border, backdropFilter: themeConfig.glass }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>

        {/* BOTTOM SECTION */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 4, borderRadius: '30px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, minHeight: 350, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ color: themeConfig.text, fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrackChangesRounded sx={{ color: '#F59E0B' }} /> Gap Breakdown
              </Typography>
              
              <Stack spacing={3}>
                {skillGapData.filter(g => g.expected > g.actual).length > 0 ? (
                  skillGapData
                    .filter(g => g.expected > g.actual)
                    .sort((a, b) => (b.expected - b.actual) - (a.expected - a.actual))
                    .slice(0, 3)
                    .map((gap, i) => (
                    <Box key={i}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" sx={{ color: themeConfig.text, fontWeight: 600 }}>{gap.subject}</Typography>
                        <Typography variant="caption" sx={{ color: '#FF453A', fontWeight: 700 }}>-{gap.expected - gap.actual}% Gap</Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={(gap.actual / gap.expected) * 100} 
                        sx={{ 
                          height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA',
                          '& .MuiLinearProgress-bar': { bgcolor: (gap.expected - gap.actual) > 20 ? '#FF453A' : '#FF9F0A', borderRadius: 4 } 
                        }} 
                      />
                    </Box>
                  ))
                ) : (
                  <Alert severity="success" sx={{ borderRadius: '12px' }}>Excellent work! All your subjects are currently meeting or exceeding expectations.</Alert>
                )}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ p: 4, borderRadius: '30px', bgcolor: themeConfig.card, backdropFilter: themeConfig.glass, border: themeConfig.border, minHeight: 350, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ color: themeConfig.text, fontWeight: 700, mb: 3 }}>Recent Subject Evaluations</Typography>
              <Stack spacing={0}>
                {recentExams.map((exam, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: isDark ? '#2C2C2E' : '#E5E5EA', color: themeConfig.accent, fontWeight: 800 }}>
                            {exam.score ?? 0}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: themeConfig.text, fontWeight: 600 }}>{exam.name}</Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.secondaryText }}>{exam.date} • ID: {exam.id}</Typography>
                          </Box>
                        </Stack>
                        <Chip 
                          label={exam.status} 
                          sx={{ 
                            bgcolor: exam.status === 'Passed' ? 'rgba(50, 215, 75, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                            color: exam.status === 'Passed' ? '#32D74B' : '#FF453A',
                            fontWeight: 700, borderRadius: '10px'
                          }} 
                        />
                      </Stack>
                      {i < recentExams.length - 1 && <Divider sx={{ borderColor: themeConfig.gridLine }} />}
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}