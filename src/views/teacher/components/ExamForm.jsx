import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Divider,
  Switch,
  Stack,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useCreateExamMutation, useCreateQuestionMutation } from 'src/slices/examApiSlice';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const steps = ['Exam Details & Audience', 'Build Questions', 'Review & Deploy'];

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const pageAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Reusable UI Component for the "Tips" box
const TipsBox = ({ title, tips, isDark }) => (
  <Box
    sx={{
      bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F7FF',
      p: 3,
      borderRadius: 3,
      display: 'flex',
      gap: 2,
      mt: 4,
      border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #E0EFFF',
      transition: 'all 0.3s ease',
    }}
  >
    <Box
      sx={{
        bgcolor: isDark ? '#2563EB' : '#3B82F6',
        color: 'white',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <LightbulbIcon fontSize="small" sx={{ color: '#FCD34D' }} />
    </Box>
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#93C5FD' : '#1E3A8A', mb: 1 }}>
        {title || 'Tips for best results:'}
      </Typography>
      <Box
        component="ul"
        sx={{ m: 0, pl: 2, color: isDark ? '#BFDBFE' : '#1E3A8A', '& li': { mb: 0.5, fontSize: '0.875rem' } }}
      >
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </Box>
    </Box>
  </Box>
);

const ExamForm = ({ formik, isDark: propIsDark }) => {
  // --- Dynamic Dark Mode State ---
  const [isDark, setIsDark] = useState(() => propIsDark ?? document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (propIsDark !== undefined) {
      setIsDark(propIsDark);
      return;
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, [propIsDark]);

  const [activeStep, setActiveStep] = useState(0);
  const { values, handleChange } = formik;

  const [createExam, { isLoading: creatingExam }] = useCreateExamMutation();
  const [createQuestion, { isLoading: creatingQuestion }] = useCreateQuestionMutation();

  // --- STATES FOR ADVANCED FEATURES ---
  const [audienceType, setAudienceType] = useState('all');
  const [emailInput, setEmailInput] = useState('');
  const [targetEmails, setTargetEmails] = useState([]);

  // Dynamic Questions Array
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      section: 'coding', // 'coding', 'aptitude', 'verbal'
      questionText: '',
      description: '',
      image: '',
      testCases: [{ input: '', output: '', isHidden: false }], // For Coding
      options: ['', '', '', ''], // For MCQ (Aptitude/Verbal)
      correctOptionIndex: 0, // For MCQ
    },
  ]);

  /* ================= HANDLERS ================= */
  const handleAddEmail = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailRegex.test(email) && !targetEmails.includes(email)) {
        setTargetEmails([...targetEmails, email]);
        setEmailInput('');
      } else if (!emailRegex.test(email)) {
        toast.warning('Please enter a valid email address');
      }
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setTargetEmails(targetEmails.filter((email) => email !== emailToRemove));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        section: 'aptitude',
        questionText: '',
        description: '',
        image: '',
        testCases: [{ input: '', output: '', isHidden: false }],
        options: ['', '', '', ''],
        correctOptionIndex: 0,
      },
    ]);
  };

  const removeQuestion = (idToRemove) => {
    if (questions.length === 1) return toast.warning('You must have at least one question.');
    setQuestions(questions.filter((q) => q.id !== idToRemove));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateTestCase = (qId, tcIndex, field, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newTCs = [...q.testCases];
          newTCs[tcIndex][field] = value;
          return { ...q, testCases: newTCs };
        }
        return q;
      }),
    );
  };

  const updateOption = (qId, optIndex, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optIndex] = value;
          return { ...q, options: newOpts };
        }
        return q;
      }),
    );
  };

  /* ================= VALIDATION ================= */
  const canProceed = () => {
    if (activeStep === 0) {
      if (!values.examName || !values.duration || !values.liveDate || !values.deadDate)
        return false;
      if (audienceType === 'specific' && targetEmails.length === 0) return false;
      return true;
    }

    if (activeStep === 1) {
      for (const q of questions) {
        if (!q.questionText) return false;
        if (q.section === 'coding') {
          if (!q.description || q.testCases.length === 0) return false;
          if (q.testCases.some((tc) => !tc.input || !tc.output)) return false;
        } else {
          if (q.options.some((opt) => !opt.trim())) return false;
        }
      }
      return true;
    }
    return true;
  };

  const next = () => {
    if (!canProceed()) return toast.error('Please fill all required fields correctly.');
    setActiveStep((s) => s + 1);
  };

  const back = () => setActiveStep((s) => s - 1);

  /* ================= SUBMISSION ================= */
 const handleFinalSubmit = async (e) => {
  e.preventDefault();

  try {

    /* ================= CREATE EXAM PAYLOAD ================= */

    const examPayload = {
      examName: values.examName.trim(),
      totalQuestions: questions.length,
      duration: Number(values.duration),
      liveDate: values.liveDate,
      deadDate: values.deadDate,
      bannerImage: values.bannerImage || "",
      targetAudience: audienceType,
      targetEmails: audienceType === "specific" ? targetEmails : [],
    };

    console.log("Creating exam:", examPayload);

    /* ================= CREATE EXAM ================= */

    const examRes = await createExam(examPayload).unwrap();

    console.log("Exam API response:", examRes);

    /* ================= GET EXAM ID SAFELY ================= */

    const examId =
      examRes?.examId ||
      examRes?.data?.examId ||
      examRes?.exam?.examId;

    if (!examId) {
      toast.error("Exam ID not returned from server");
      console.error("Invalid exam response:", examRes);
      return;
    }

    /* ================= CREATE QUESTIONS ================= */

   for (const q of questions) {

  const isCoding = q.section === "coding";

  const cleanedTestCases = q.testCases.filter(
    (tc) => tc.input && tc.output
  );

  const questionPayload = {
    examId,
    section: q.section,
    question: q.questionText,
    description: q.description || "",
    image: q.image || "",
    testCases: isCoding ? cleanedTestCases : [],
    options: !isCoding ? q.options.map(o => o.trim()) : [],
    correctAnswer: !isCoding ? q.correctOptionIndex : null,
  };

      console.log("Creating question:", questionPayload);

      await createQuestion(questionPayload).unwrap();
    }

    /* ================= SUCCESS ================= */

    toast.success(
      `🎉 Exam deployed successfully! ${
        audienceType === "all"
          ? "Visible to all students."
          : `Invitations sent to ${targetEmails.length} students.`
      }`
    );

    /* ================= RESET FORM ================= */

    setActiveStep(0);
    setTargetEmails([]);

    setQuestions([
      {
        id: Date.now(),
        section: "coding",
        questionText: "",
        description: "",
        image: "",
        testCases: [{ input: "", output: "", isHidden: false }],
        options: ["", "", "", ""],
        correctOptionIndex: 0,
      },
    ]);

  } catch (err) {

    console.error("Exam creation error:", err);

    const errorMessage =
      err?.data?.message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create exam";

    toast.error(errorMessage);
  }
};

  /* ================= COMMON STYLES ================= */
  const purpleButtonStyle = {
    bgcolor: isDark ? '#8B5CF6' : '#7C3AED',
    color: 'white',
    py: 1.8,
    borderRadius: 2,
    fontWeight: 'bold',
    textTransform: 'none',
    fontSize: '1rem',
    boxShadow: isDark ? '0 4px 14px rgba(139, 92, 246, 0.4)' : '0 4px 14px rgba(124, 58, 237, 0.4)',
    '&:hover': { bgcolor: isDark ? '#7C3AED' : '#6D28D9', boxShadow: isDark ? '0 6px 20px rgba(139, 92, 246, 0.6)' : '0 6px 20px rgba(124, 58, 237, 0.6)' },
    '&.Mui-disabled': { bgcolor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#C4B5FD', color: isDark ? 'rgba(255,255,255,0.5)' : 'white' },
  };

  const customInputStyle = {
    '& .MuiOutlinedInput-root': {
      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      color: isDark ? '#F8FAFC' : 'inherit',
      borderRadius: 2,
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.23)' },
      '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.87)' },
    },
    '& .MuiInputLabel-root': { color: isDark ? '#94A3B8' : 'inherit' }
  };

  /* ================= UI RENDER ================= */
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', py: 4 }}>
      <Box component="form" onSubmit={handleFinalSubmit} sx={{ width: '100%', maxWidth: 850 }}>
        {/* STEPPER */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 6,
            '& .MuiStepIcon-root.Mui-active': { color: isDark ? '#A78BFA' : '#7C3AED' },
            '& .MuiStepIcon-root.Mui-completed': { color: isDark ? '#8B5CF6' : '#7C3AED' },
            '& .MuiStepLabel-label': { color: isDark ? '#94A3B8' : 'inherit' },
            '& .MuiStepLabel-label.Mui-active': { color: isDark ? '#F8FAFC' : 'inherit' },
            '& .MuiStepLabel-label.Mui-completed': { color: isDark ? '#E2E8F0' : 'inherit' },
            '& .MuiStepIcon-text': { fill: isDark ? '#000' : '#fff' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <AnimatePresence mode="wait">
          <MotionPaper
            key={activeStep}
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              border: isDark ? 'none' : '1px solid #E2E8F0',
              boxShadow: isDark ? 'none' : '0px 10px 40px rgba(0,0,0,0.04)',
              bgcolor: isDark ? 'transparent' : 'white',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
            variants={pageAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ================= STEP 1: EXAM & AUDIENCE ================= */}
            {activeStep === 0 && (
              <Stack spacing={0}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                  sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}
                >
                  ✨ Exam Configuration
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : 'textSecondary', mb: 4 }}>
                  Set the core details, duration, and target audience for your new assessment.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <CustomTextField
                      label="Exam Name"
                      name="examName"
                      placeholder="e.g., Mid-Term Advanced JavaScript"
                      value={values.examName}
                      onChange={handleChange}
                      fullWidth
                      sx={customInputStyle}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CustomTextField
                      label="Duration (minutes)"
                      type="number"
                      name="duration"
                      placeholder="60"
                      value={values.duration}
                      onChange={handleChange}
                      fullWidth
                      sx={customInputStyle}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CustomTextField
                      type="datetime-local"
                      label="Live Date"
                      name="liveDate"
                      value={values.liveDate}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={customInputStyle}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CustomTextField
                      type="datetime-local"
                      label="Dead Date"
                      name="deadDate"
                      value={values.deadDate}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={customInputStyle}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <CustomTextField
                      label="Exam Banner Image URL (Optional)"
                      placeholder="Paste image URL here..."
                      name="bannerImage"
                      value={values.bannerImage}
                      onChange={handleChange}
                      fullWidth
                      sx={customInputStyle}
                    />
                  </Grid>
                </Grid>

                {/* AUDIENCE SELECTOR */}
                <Box mt={4}>
                  <Typography variant="subtitle2" fontWeight="bold" mb={2} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                    Target Audience
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={audienceType}
                      onChange={(e) => setAudienceType(e.target.value)}
                    >
                      <FormControlLabel
                        value="all"
                        control={
                          <Radio sx={{ color: isDark ? '#A78BFA' : '#7C3AED', '&.Mui-checked': { color: isDark ? '#A78BFA' : '#7C3AED' } }} />
                        }
                        label={<Typography sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>All Registered Students</Typography>}
                      />
                      <FormControlLabel
                        value="specific"
                        control={
                          <Radio sx={{ color: isDark ? '#A78BFA' : '#7C3AED', '&.Mui-checked': { color: isDark ? '#A78BFA' : '#7C3AED' } }} />
                        }
                        label={<Typography sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>Specific Emails</Typography>}
                      />
                    </RadioGroup>
                  </FormControl>

                  <AnimatePresence>
                    {audienceType === 'specific' && (
                      <MotionBox
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CustomTextField
                          fullWidth
                          placeholder="Type email and press Enter..."
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={handleAddEmail}
                          sx={{ mt: 2, mb: 2, ...customInputStyle }}
                        />
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {targetEmails.map((email, idx) => (
                            <Chip
                              key={idx}
                              label={email}
                              onDelete={() => handleRemoveEmail(email)}
                              sx={{
                                bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF',
                                color: isDark ? '#C4B5FD' : '#7C3AED',
                                border: isDark ? '1px solid rgba(124, 58, 237, 0.5)' : '1px solid #E9D5FF',
                                '& .MuiChip-deleteIcon': { color: isDark ? '#A78BFA' : '#7C3AED' }
                              }}
                            />
                          ))}
                        </Box>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Box>

                <Box mt={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={next}
                    disabled={!canProceed()}
                    sx={purpleButtonStyle}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Continue to Questions
                  </Button>
                </Box>

                <TipsBox
                  isDark={isDark}
                  title="Tips for exam creation:"
                  tips={[
                    'Ensure the duration accurately reflects the difficulty of the questions.',
                    'Provide a clear, descriptive exam name so students know what to expect.',
                    'If selecting specific emails, double-check spelling before deploying.',
                  ]}
                />
              </Stack>
            )}

            {/* ================= STEP 2: DYNAMIC QUESTIONS BUILDER ================= */}
            {activeStep === 1 && (
              <Stack spacing={0}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}
                    >
                      📝 Build Questions
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : 'textSecondary', mb: 4 }}>
                      Add multiple-choice or coding questions to your assessment.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addQuestion}
                    sx={{
                      color: isDark ? '#A78BFA' : '#7C3AED',
                      borderColor: isDark ? 'rgba(167, 139, 250, 0.5)' : '#7C3AED',
                      '&:hover': { 
                        bgcolor: isDark ? 'rgba(167, 139, 250, 0.1)' : '#F5F3FF', 
                        borderColor: isDark ? '#A78BFA' : '#6D28D9' 
                      },
                    }}
                  >
                    Add Question
                  </Button>
                </Box>

                <AnimatePresence>
                  {questions.map((q, qIndex) => (
                    <MotionPaper
                      key={q.id}
                      variants={itemAnimation}
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" mb={3} alignItems="center">
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isDark ? '#CBD5E1' : '#475569' }}>
                          Question {qIndex + 1}
                        </Typography>
                        <IconButton color="error" size="small" onClick={() => removeQuestion(q.id)}>
                          <DeleteOutlineIcon sx={{ color: isDark ? '#FCA5A5' : 'error.main' }} />
                        </IconButton>
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ color: isDark ? '#94A3B8' : 'inherit' }}>Section Type</InputLabel>
                            <Select
                              value={q.section}
                              label="Section Type"
                              onChange={(e) => updateQuestion(q.id, 'section', e.target.value)}
                              MenuProps={{
                                PaperProps: {
                                  sx: { bgcolor: isDark ? '#1E293B' : '#fff', color: isDark ? '#fff' : '#000' }
                                }
                              }}
                              sx={{ 
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                color: isDark ? '#F8FAFC' : 'inherit',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.23)' },
                                '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : 'inherit' }
                              }}
                            >
                              <MenuItem value="aptitude">Aptitude (MCQ)</MenuItem>
                              <MenuItem value="verbal">Verbal (MCQ)</MenuItem>
                              <MenuItem value="coding">Coding (Logic)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                          <CustomTextField
                            fullWidth
                            label="Question Title"
                            placeholder="Enter the main question text..."
                            value={q.questionText}
                            onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                            sx={customInputStyle}
                          />
                        </Grid>

                        {/* Image Upload for all question types */}
                        <Grid item xs={12}>
                          <CustomTextField
                            fullWidth
                            label="Image URL (Optional)"
                            placeholder="Paste image URL here for diagram-based questions..."
                            value={q.image}
                            onChange={(e) => updateQuestion(q.id, 'image', e.target.value)}
                            sx={customInputStyle}
                          />
                          {q.image && (
                            <Box
                              mt={2}
                              textAlign="center"
                              p={2}
                              bgcolor={isDark ? 'rgba(0,0,0,0.3)' : 'white'}
                              borderRadius={2}
                              border={isDark ? '1px dashed rgba(255,255,255,0.2)' : '1px dashed #E2E8F0'}
                            >
                              <img
                                src={q.image}
                                alt="Preview"
                                style={{ maxHeight: 150, borderRadius: 8 }}
                              />
                            </Box>
                          )}
                        </Grid>

                        {/* --- CODING SPECIFIC FIELDS --- */}
                        {q.section === 'coding' && (
                          <>
                            <Grid item xs={12}>
                              <CustomTextField
                                multiline
                                rows={4}
                                fullWidth
                                label="Problem Description"
                                placeholder="Provide detailed instructions, constraints, and examples..."
                                value={q.description}
                                onChange={(e) =>
                                  updateQuestion(q.id, 'description', e.target.value)
                                }
                                sx={customInputStyle}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" fontWeight="bold" mb={2} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                                Test Cases
                              </Typography>
                              {q.testCases.map((tc, tcIndex) => (
                                <Box
                                  key={tcIndex}
                                  display="flex"
                                  gap={2}
                                  mb={2}
                                  alignItems="center"
                                  bgcolor={isDark ? 'rgba(255,255,255,0.02)' : 'white'}
                                  p={2}
                                  borderRadius={2}
                                  border={isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'}
                                >
                                  <CustomTextField
                                    label="Input"
                                    size="small"
                                    fullWidth
                                    value={tc.input}
                                    onChange={(e) =>
                                      updateTestCase(q.id, tcIndex, 'input', e.target.value)
                                    }
                                    sx={customInputStyle}
                                  />
                                  <CustomTextField
                                    label="Expected Output"
                                    size="small"
                                    fullWidth
                                    value={tc.output}
                                    onChange={(e) =>
                                      updateTestCase(q.id, tcIndex, 'output', e.target.value)
                                    }
                                    sx={customInputStyle}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={tc.isHidden}
                                        onChange={(e) =>
                                          updateTestCase(
                                            q.id,
                                            tcIndex,
                                            'isHidden',
                                            e.target.checked,
                                          )
                                        }
                                        color="secondary"
                                      />
                                    }
                                    label={<Typography sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>Hidden</Typography>}
                                  />
                                  <IconButton
                                    color="error"
                                    onClick={() => {
                                      const newTcs = q.testCases.filter((_, i) => i !== tcIndex);
                                      updateQuestion(q.id, 'testCases', newTcs);
                                    }}
                                  >
                                    <DeleteOutlineIcon sx={{ color: isDark ? '#FCA5A5' : 'inherit' }} />
                                  </IconButton>
                                </Box>
                              ))}
                              <Button
                                size="small"
                                sx={{ color: isDark ? '#A78BFA' : '#7C3AED' }}
                                onClick={() =>
                                  updateQuestion(q.id, 'testCases', [
                                    ...q.testCases,
                                    { input: '', output: '', isHidden: false },
                                  ])
                                }
                              >
                                + Add Test Case
                              </Button>
                            </Grid>
                          </>
                        )}

                        {/* --- MCQ SPECIFIC FIELDS (Aptitude/Verbal) --- */}
                        {q.section !== 'coding' && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight="bold" mb={2} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                              Multiple Choice Options
                            </Typography>
                            <RadioGroup
                              value={q.correctOptionIndex}
                              onChange={(e) =>
                                updateQuestion(q.id, 'correctOptionIndex', parseInt(e.target.value))
                              }
                            >
                              {q.options.map((opt, optIndex) => {
                                const isCorrect = q.correctOptionIndex === optIndex;
                                return (
                                  <Box
                                    key={optIndex}
                                    display="flex"
                                    gap={2}
                                    mb={2}
                                    alignItems="center"
                                    p={1} pl={2} borderRadius={2} border="2px solid"
                                    borderColor={isCorrect ? '#10B981' : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0')}
                                    bgcolor={isCorrect 
                                      ? (isDark ? 'rgba(22, 101, 52, 0.2)' : '#F0FDF4') 
                                      : (isDark ? 'rgba(255,255,255,0.02)' : '#ffffff')}
                                    sx={{ transition: 'all 0.2s ease' }}
                                  >
                                    <Radio
                                      value={optIndex}
                                      sx={{ color: isDark ? '#A78BFA' : '#7C3AED', '&.Mui-checked': { color: isDark ? '#A78BFA' : '#7C3AED' } }}
                                    />
                                    <CustomTextField
                                      size="small"
                                      fullWidth
                                      placeholder={`Option ${optIndex + 1}`}
                                      value={opt}
                                      onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                                      InputProps={{ disableUnderline: true }}
                                      sx={{
                                        bgcolor: 'transparent',
                                        '& input': {
                                          py: 1,
                                          color: isCorrect ? (isDark ? '#34D399' : '#065F46') : (isDark ? '#E2E8F0' : 'inherit'),
                                          fontWeight: isCorrect ? 'bold' : 'normal',
                                        },
                                        '& fieldset': { border: 'none' } // Remove internal border for seamless look
                                      }}
                                    />
                                  </Box>
                                );
                              })}
                            </RadioGroup>
                            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}>
                              * Select the radio button next to the correct answer.
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </MotionPaper>
                  ))}
                </AnimatePresence>

                <Box mt={2} display="flex" gap={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={back}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2, 
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E2E8F0', 
                      color: isDark ? '#F8FAFC' : 'text.primary',
                      '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.4)' : '#CBD5E1' }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={next}
                    disabled={!canProceed()}
                    sx={purpleButtonStyle}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Review Deployment
                  </Button>
                </Box>

                <TipsBox
                  isDark={isDark}
                  title="Tips for writing questions:"
                  tips={[
                    'For coding questions, provide at least one hidden test case to prevent hardcoding.',
                    'Ensure MCQ options are clear and unambiguous.',
                    'Use images to clarify complex architectural or mathematical problems.',
                  ]}
                />
              </Stack>
            )}

            {/* ================= STEP 3: REVIEW & DEPLOY ================= */}
            {activeStep === 2 && (
              <Stack spacing={0}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                  sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}
                >
                  🚀 Review & Deploy
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : 'textSecondary', mb: 4 }}>
                  Verify your exam details before sending out the invites.
                </Typography>

                <Box 
                  bgcolor={isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC'} 
                  p={3} borderRadius={3} 
                  border={isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0'} 
                  mb={4}
                >
                  <Typography variant="h6" sx={{ color: isDark ? '#A78BFA' : '#7C3AED', fontWeight: 'bold', mb: 2 }}>
                    {values.examName}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                        <b style={{ color: isDark ? '#94A3B8' : 'inherit' }}>Duration:</b> {values.duration} mins
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                        <b style={{ color: isDark ? '#94A3B8' : 'inherit' }}>Total Questions:</b> {questions.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                        <b style={{ color: isDark ? '#94A3B8' : 'inherit' }}>Live Window:</b> {new Date(values.liveDate).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                        <b style={{ color: isDark ? '#94A3B8' : 'inherit' }}>Audience:</b>{' '}
                        {audienceType === 'all'
                          ? 'All Students'
                          : `${targetEmails.length} Specific Emails`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: isDark ? '#E2E8F0' : 'inherit' }}>
                  Question Breakdown
                </Typography>
                <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1, mb: 4, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', borderRadius: 3 } }}>
                  {questions.map((q, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: isDark ? '#F8FAFC' : 'inherit' }}>
                          Q{i + 1}: {q.questionText || 'Untitled'}
                        </Typography>
                        <Typography
                          variant="caption"
                          textTransform="capitalize"
                          sx={{ color: isDark ? '#94A3B8' : 'textSecondary' }}
                        >
                          Section: {q.section}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={
                          q.section === 'coding'
                            ? `${q.testCases.length} Test Cases`
                            : 'Multiple Choice'
                        }
                        sx={{
                          bgcolor: q.section === 'coding' ? (isDark ? 'rgba(124, 58, 237, 0.2)' : '#F3E8FF') : (isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE'),
                          color: q.section === 'coding' ? (isDark ? '#C4B5FD' : '#7C3AED') : (isDark ? '#7DD3FC' : '#0369A1'),
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  ))}
                </Box>

                <Box display="flex" gap={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={back}
                    sx={{ py: 1.5, borderRadius: 2, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E2E8F0', color: isDark ? '#F8FAFC' : 'text.primary', '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.4)' : '#CBD5E1' } }}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={creatingExam || creatingQuestion}
                    startIcon={
                      creatingExam || creatingQuestion ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : null
                    }
                    endIcon={!(creatingExam || creatingQuestion) ? <SendIcon /> : null}
                    sx={purpleButtonStyle}
                  >
                    {creatingExam || creatingQuestion ? 'Deploying...' : 'Deploy Assessment'}
                  </Button>
                </Box>

                <TipsBox
                  isDark={isDark}
                  title="What happens next?"
                  tips={[
                    "Once deployed, the exam will be locked in until the 'Dead Date'.",
                    audienceType === 'specific'
                      ? 'Emails will be immediately dispatched to your target audience.'
                      : 'The exam will appear on the dashboard for all registered students.',
                    'Ensure you monitor the proctoring logs once the exam goes live.',
                  ]}
                />
              </Stack>
            )}
          </MotionPaper>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ExamForm;