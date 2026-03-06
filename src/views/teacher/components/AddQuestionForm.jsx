import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Checkbox,
  Stack,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Tooltip,
  Grid,
} from '@mui/material';
import swal from 'sweetalert';
import { useCreateQuestionMutation, useGetExamsQuery } from 'src/slices/examApiSlice';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AddQuestionForm = () => {
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

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [selectedExamId, setSelectedExamId] = useState('');

  const { data: examsData = [], isLoading: isExamsLoading } = useGetExamsQuery();
  const [createQuestion, { isLoading }] = useCreateQuestionMutation();

  // Set default exam when exams load
  useEffect(() => {
    if (examsData.length > 0 && !selectedExamId) {
      setSelectedExamId(examsData[0].examId);
    }
  }, [examsData, selectedExamId]);

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !updatedCorrectOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const handleAddQuestion = async () => {
    // Validate exam selection
    if (!selectedExamId) {
      swal('Hold on!', 'Please select an exam first.', 'error');
      return;
    }

    // Validate question text
    if (newQuestion.trim() === '') {
      swal('Missing Question', 'Question field cannot be empty.', 'warning');
      return;
    }

    // Validate options
    if (newOptions.some((option) => option.trim() === '')) {
      swal('Incomplete Options', 'Please fill out all 4 options.', 'warning');
      return;
    }

    // Validate at least one correct option
    if (!correctOptions.includes(true)) {
      swal('No Correct Answer', 'You must select at least one correct option.', 'warning');
      return;
    }

    const questionPayload = {
      question: newQuestion,
      options: newOptions.map((option, index) => ({
        optionText: option,
        isCorrect: correctOptions[index],
      })),
      examId: selectedExamId,
    };

    try {
      const res = await createQuestion(questionPayload).unwrap();
      toast.success('✨ Question added successfully!');

      setQuestions((prev) => [...prev, res]);

      // Reset form for the next question
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setCorrectOptions([false, false, false, false]);
    } catch (err) {
      console.error('Create Question Error:', err);
      swal('Error', err?.data?.message || 'Failed to create question.', 'error');
    }
  };

  const handleSubmitQuestions = () => {
    if (questions.length === 0 && !newQuestion) {
      toast.info('Nothing to clear.');
      return;
    }
    setQuestions([]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
    toast.info('Session cleared.');
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', py: 4 }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #E2E8F0',
            boxShadow: isDark ? '0px 10px 40px rgba(0,0,0,0.2)' : '0px 10px 40px rgba(0,0,0,0.04)',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'white',
            backdropFilter: isDark ? 'blur(10px)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {/* ================= HEADER & EXAM SELECTOR ================= */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
            <Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                gap={1}
                mb={1}
                sx={{ color: isDark ? '#F8FAFC' : 'inherit', transition: 'color 0.3s ease' }}
              >
                <QuizIcon sx={{ color: isDark ? '#A78BFA' : '#7C3AED' }} /> Add Multiple Choice Questions
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
                Select an exam and build your question bank.
              </Typography>
            </Box>

            <Box minWidth={250}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>Target Exam</InputLabel>
                <Select
                  value={selectedExamId}
                  label="Target Exam"
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  disabled={isExamsLoading}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: isDark ? '#1E293B' : '#fff',
                        color: isDark ? '#fff' : '#000',
                      }
                    }
                  }}
                  sx={{ 
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', 
                    borderRadius: 2,
                    color: isDark ? '#F8FAFC' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.87)'
                    },
                    '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : 'inherit' }
                  }}
                >
                  {examsData.map((exam) => (
                    <MenuItem key={exam.examId} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider sx={{ mb: 4, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider' }} />

          {/* ================= SESSION PREVIEW (Added Questions) ================= */}
          <AnimatePresence>
            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Box 
                  mb={5} 
                  p={3} 
                  bgcolor={isDark ? 'rgba(22, 101, 52, 0.15)' : '#F0FDF4'} 
                  borderRadius={3} 
                  border={isDark ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid #BBF7D0'}
                  sx={{ transition: 'all 0.3s ease' }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color={isDark ? '#4ADE80' : '#166534'}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <AssignmentIcon fontSize="small" /> Recently Added Questions (
                      {questions.length})
                    </Typography>
                    <Tooltip title="Clear Session">
                      <IconButton size="small" color="error" onClick={handleSubmitQuestions}>
                        <DeleteSweepIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Stack spacing={2}>
                    {questions.map((questionObj, qIndex) => (
                      <Paper
                        key={questionObj._id || qIndex}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #DCFCE7',
                          bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                        }}
                      >
                        <Typography variant="body1" fontWeight="bold" mb={1} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                          Q{qIndex + 1}. {questionObj.question}
                        </Typography>
                        <Grid container spacing={1}>
                          {questionObj.options.map((opt, oIndex) => (
                            <Grid item xs={12} sm={6} key={oIndex}>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                p={1}
                                borderRadius={1}
                                bgcolor={
                                  opt.isCorrect 
                                    ? (isDark ? 'rgba(22, 101, 52, 0.3)' : '#DCFCE7') 
                                    : (isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC')
                                }
                              >
                                {opt.isCorrect ? (
                                  <CheckCircleIcon fontSize="small" sx={{ color: isDark ? '#34D399' : 'success.main' }} />
                                ) : (
                                  <RadioButtonUncheckedIcon fontSize="small" sx={{ color: isDark ? '#475569' : 'disabled' }} />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ color: opt.isCorrect ? (isDark ? '#34D399' : 'success.main') : (isDark ? '#94A3B8' : 'textPrimary') }}
                                >
                                  {opt.optionText}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= NEW QUESTION BUILDER ================= */}
          <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
            Create New Question
          </Typography>

          <TextField
            label="Question Text"
            placeholder="Type your question here..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ 
              mb: 4, 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2, 
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                color: isDark ? '#F8FAFC' : 'inherit',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.23)',
                },
                '&:hover fieldset': {
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.87)',
                }
              },
              '& .MuiInputLabel-root': {
                color: isDark ? '#94A3B8' : 'inherit',
              }
            }}
          />

          <Typography variant="subtitle2" fontWeight="bold" mb={2} sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
            Answer Options (Select the correct one)
          </Typography>

          <Grid container spacing={2}>
            {newOptions.map((option, index) => {
              const isCorrect = correctOptions[index];
              return (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    component={motion.div}
                    whileHover={{ scale: 1.01 }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      pl: 2,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: isCorrect ? '#10B981' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                      bgcolor: isCorrect 
                        ? (isDark ? 'rgba(22, 101, 52, 0.2)' : '#F0FDF4') 
                        : (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'),
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Checkbox
                      checked={isCorrect}
                      onChange={() => handleOptionChange(index)}
                      icon={<RadioButtonUncheckedIcon sx={{ color: isDark ? '#475569' : 'inherit' }} />}
                      checkedIcon={<CheckCircleIcon />}
                      color="success"
                      sx={{ p: 0.5, mr: 1 }}
                    />
                    <TextField
                      variant="standard"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const updatedOptions = [...newOptions];
                        updatedOptions[index] = e.target.value;
                        setNewOptions(updatedOptions);
                      }}
                      fullWidth
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        '& input': {
                          py: 1,
                          color: isCorrect ? (isDark ? '#34D399' : '#065F46') : (isDark ? '#E2E8F0' : 'inherit'),
                          fontWeight: isCorrect ? 'bold' : 'normal',
                        },
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider' }} />

          {/* ================= ACTION BUTTONS ================= */}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={handleSubmitQuestions}
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                color: isDark ? '#94A3B8' : 'text.secondary',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                '&:hover': { 
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : '#CBD5E1'
                },
              }}
            >
              Clear Form
            </Button>
            <Button
              variant="contained"
              onClick={handleAddQuestion}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddCircleOutlineIcon />
                )
              }
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2,
                bgcolor: isDark ? '#8B5CF6' : '#7C3AED',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: isDark ? '0 4px 14px rgba(139, 92, 246, 0.4)' : '0 4px 14px rgba(124, 58, 237, 0.4)',
                '&:hover': { 
                  bgcolor: isDark ? '#7C3AED' : '#6D28D9', 
                  boxShadow: isDark ? '0 6px 20px rgba(139, 92, 246, 0.6)' : '0 6px 20px rgba(124, 58, 237, 0.6)' 
                },
              }}
            >
              {isLoading ? 'Saving...' : 'Save Question'}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default AddQuestionForm;