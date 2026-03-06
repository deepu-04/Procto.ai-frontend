import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  TablePagination,
  Button,
  FormControl,
  InputLabel,
  InputAdornment,
  Divider,
} from '@mui/material';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { useGetCheatingLogsQuery } from 'src/slices/cheatingLogApiSlice';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import WarningIcon from '@mui/icons-material/Warning';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'; 

import { motion, AnimatePresence } from 'framer-motion';

// Animation Variants
const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const MotionTableRow = motion(TableRow);

export default function CheatingTable() {
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

  const [filter, setFilter] = useState('');
  const [topFilter, setTopFilter] = useState('All'); // 'All', 10, 20, 30
  const [selectedExamId, setSelectedExamId] = useState('');
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExamsQuery();
  const {
    data: cheatingLogsData,
    isLoading: logsLoading,
    error: logsError,
  } = useGetCheatingLogsQuery(selectedExamId, {
    skip: !selectedExamId,
  });

  useEffect(() => {
    if (examsData && examsData.length > 0) {
      setSelectedExamId(examsData[0].examId);
    }
  }, [examsData]);

  useEffect(() => {
    if (cheatingLogsData) {
      setCheatingLogs(Array.isArray(cheatingLogsData) ? cheatingLogsData : []);
    }
  }, [cheatingLogsData]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [filter, topFilter, selectedExamId]);

  /* ================= ROBUST VIOLATION PARSERS ================= */
  const getCalculatedTotal = (log) => {
    if (typeof log.totalViolations === 'number') return log.totalViolations;
    if (Array.isArray(log.violations)) return log.violations.length;

    let total = 0;
    const sysKeys = ['_id', 'id', 'examId', 'username', 'email', 'screenshots', 'createdAt', 'updatedAt', '__v'];
    Object.keys(log).forEach((key) => {
      if (!sysKeys.includes(key) && typeof log[key] === 'number') {
        total += log[key];
      }
    });
    return total;
  };

  const getViolationTypes = (log) => {
    const types = new Set();

    if (Array.isArray(log.violations) && log.violations.length > 0) {
      log.violations.forEach((v) => types.add(v.type || v));
    }

    const sysKeys = ['_id', 'id', 'examId', 'username', 'email', 'screenshots', 'createdAt', 'updatedAt', '__v', 'totalViolations'];
    Object.keys(log).forEach((key) => {
      if (!sysKeys.includes(key) && typeof log[key] === 'number' && log[key] > 0) {
        types.add(key.replace(/_/g, ' '));
      }
    });

    return types.size > 0 ? Array.from(types).join(', ') : 'None';
  };

  /* ================= FILTERING & SORTING LOGIC ================= */
  let processedLogs = [...cheatingLogs].map((log) => ({
    ...log,
    computedTotal: getCalculatedTotal(log),
  }));

  processedLogs.sort((a, b) => b.computedTotal - a.computedTotal);

  if (topFilter !== 'All') {
    processedLogs = processedLogs.slice(0, parseInt(topFilter, 10));
  }

  processedLogs = processedLogs.filter(
    (log) =>
      log.username?.toLowerCase().includes(filter.toLowerCase()) ||
      log.email?.toLowerCase().includes(filter.toLowerCase()),
  );

  const paginatedLogs = processedLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  /* ================= HANDLERS ================= */
  const handleViewScreenshots = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getViolationColor = (count) => {
    if (count >= 5) return 'error';
    if (count >= 2) return 'warning';
    if (count === 0) return 'default';
    return 'info';
  };

  const getViolationIcon = (count) => {
    if (count >= 5) return <WarningIcon color="error" fontSize="small" />;
    if (count >= 2) return <WarningIcon color="warning" fontSize="small" />;
    return null;
  };

  /* ================= EXPORT LOGIC ================= */
  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Total Violations', 'Violation Types Details'];
    const rows = processedLogs.map((log, i) => [
      i + 1,
      `"${log.username || 'Unknown'}"`,
      `"${log.email || 'N/A'}"`,
      log.computedTotal,
      `"${getViolationTypes(log)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Proctoring_Logs_${selectedExamId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(processedLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Proctoring_Logs_${selectedExamId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ================= RENDER ================= */
  if (examsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress sx={{ color: isDark ? '#60A5FA' : 'primary.main' }} />
      </Box>
    );
  }

  if (examsError) {
    return (
      <Typography color={isDark ? '#FCA5A5' : 'error'} p={3}>
        Error loading exams: {examsError.data?.message || examsError.error || 'Unknown error'}
      </Typography>
    );
  }

  if (!examsData || examsData.length === 0) {
    return (
      <Typography p={3} color={isDark ? '#94A3B8' : 'textSecondary'}>
        No exams available. Please create an exam first.
      </Typography>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* HEADER & FILTERS */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
          bgcolor: isDark ? 'rgba(28, 28, 30, 0.6)' : '#ffffff',
          backdropFilter: isDark ? 'blur(16px)' : 'none',
          border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1} sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}>
            <HealthAndSafetyIcon color={isDark ? "inherit" : "primary"} sx={{ color: isDark ? '#60A5FA' : undefined }} /> 
            Proctoring Integrity Logs
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={handleExportCSV}
              sx={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined, color: isDark ? '#E2E8F0' : undefined }}
            >
              Export CSV
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={handleExportJSON}
              sx={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : undefined, color: isDark ? '#E2E8F0' : undefined }}
            >
              Export JSON
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider' }} />

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>Select Exam</InputLabel>
              <Select
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(e.target.value)}
                label="Select Exam"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: isDark ? '#1E293B' : '#fff',
                      color: isDark ? '#fff' : '#000',
                    }
                  }
                }}
                sx={{ 
                  color: isDark ? '#F8FAFC' : 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.87)'
                  },
                  '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : 'inherit' }
                }}
              >
                {examsData.map((exam) => (
                  <MenuItem key={exam.examId} value={exam.examId}>
                    {exam.examName || 'Unnamed Exam'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>Filter Violations</InputLabel>
              <Select
                value={topFilter}
                onChange={(e) => setTopFilter(e.target.value)}
                label="Filter Violations"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: isDark ? '#1E293B' : '#fff',
                      color: isDark ? '#fff' : '#000',
                    }
                  }
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <FormatListNumberedIcon sx={{ color: isDark ? '#94A3B8' : 'inherit' }} />
                  </InputAdornment>
                }
                sx={{ 
                  color: isDark ? '#F8FAFC' : 'inherit',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.87)'
                  },
                  '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : 'inherit' }
                }}
              >
                <MenuItem value="All">Show All Candidates</MenuItem>
                <MenuItem value="10">Top 10 Worst Offenders</MenuItem>
                <MenuItem value="20">Top 20 Worst Offenders</MenuItem>
                <MenuItem value="30">Top 30 Worst Offenders</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Search Candidate..."
              variant="outlined"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
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
                    <SearchIcon sx={{ color: isDark ? '#94A3B8' : 'inherit' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* TABLE CONTENT */}
      {logsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: isDark ? '#60A5FA' : 'primary.main' }} />
        </Box>
      ) : logsError ? (
        <Typography color={isDark ? '#FCA5A5' : 'error'} p={2}>
          Error loading logs.
        </Typography>
      ) : (
        <Paper
          sx={{ 
            borderRadius: 3, 
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)', 
            overflow: 'hidden',
            bgcolor: isDark ? 'rgba(28, 28, 30, 0.6)' : '#ffffff',
            backdropFilter: isDark ? 'blur(16px)' : 'none',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
            transition: 'all 0.3s ease',
          }}
        >
          <TableContainer
            component={motion.div}
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <Table>
              <TableHead sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.4)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : 'inherit' }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : 'inherit' }}>Candidate Info</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: isDark ? '#94A3B8' : 'inherit' }}>
                    Total Violations
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#94A3B8' : 'inherit' }}>Violation Breakdowns</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', color: isDark ? '#94A3B8' : 'inherit' }}>Evidence</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <AnimatePresence>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, borderBottom: 'none' }}>
                        <Typography sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }} variant="subtitle1">
                          No cheating logs match your criteria. Excellent integrity!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <MotionTableRow
                        component={motion.tr}
                        variants={rowVariants}
                        key={log._id || index}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          '& td': { borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(224, 224, 224, 1)' },
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05) !important' : 'rgba(0,0,0,0.04) !important' }
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight="bold" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
                            #{page * rowsPerPage + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}>{log.username || 'Unknown'}</Typography>
                          <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
                            {log.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getViolationIcon(log.computedTotal)}
                            label={log.computedTotal}
                            color={getViolationColor(log.computedTotal)}
                            sx={{ fontWeight: 'bold', px: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 300, whiteSpace: 'normal', wordWrap: 'break-word', color: isDark ? '#E2E8F0' : 'inherit' }}
                          >
                            {getViolationTypes(log)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              log.screenshots?.length ? 'View Snapshots' : 'No Snapshots captured'
                            }
                          >
                            <span>
                              <IconButton
                                onClick={() => handleViewScreenshots(log)}
                                disabled={!log.screenshots?.length}
                                sx={{
                                  bgcolor: log.screenshots?.length ? (isDark ? 'rgba(96, 165, 250, 0.15)' : '#E0E7FF') : 'transparent',
                                  '&:hover': { bgcolor: isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(0, 0, 0, 0.04)' }
                                }}
                              >
                                <ImageIcon
                                  color={log.screenshots?.length ? 'primary' : 'disabled'}
                                  sx={{ color: isDark && log.screenshots?.length ? '#60A5FA' : undefined }}
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </MotionTableRow>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>

          {/* PAGINATION */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={processedLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ 
              borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #E2E8F0', 
              bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC',
              color: isDark ? '#E2E8F0' : 'inherit',
              '& .MuiTablePagination-selectIcon': { color: isDark ? '#94A3B8' : 'inherit' }
            }}
          />
        </Paper>
      )}

      {/* SCREENSHOTS DIALOG */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: isDark ? '#1C1C1E' : '#ffffff' } }}
      >
        <DialogTitle sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}>
              Evidence Snapshots: {selectedLog?.username}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: isDark ? '#0F172A' : '#F1F5F9' }}>
          <Grid container spacing={3}>
            {selectedLog?.screenshots?.map((screenshot, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ 
                  borderRadius: 2, 
                  boxShadow: isDark ? '0 4px 15px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.1)',
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white'
                }}>
                  <CardMedia
                    component="img"
                    height="220"
                    image={screenshot.url}
                    alt={`Violation - ${screenshot.type}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ bgcolor: isDark ? 'transparent' : 'white' }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color={isDark ? '#FCA5A5' : 'error'}
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
                      <WarningIcon fontSize="small" />{' '}
                      {screenshot.type?.replace(/_/g, ' ') || 'Unknown Issue'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }} display="block" mt={1}>
                      Timestamp: {new Date(screenshot.detectedAt || Date.now()).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}