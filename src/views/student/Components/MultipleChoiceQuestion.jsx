import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';

export default function MultipleChoiceQuestion({ questions = [], saveUserTestScore, submitTest }) {
  const navigate = useNavigate();
  const { examId } = useParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState(new Map());

  // ---------------- 🔐 SAFETY: NO MCQ CASE ----------------
  useEffect(() => {
    if (!questions || questions.length === 0) {
      toast.info('No MCQ questions found. Redirecting to coding round...');
      navigate(`/exam/${examId}/codedetails`);
    }
  }, [questions, examId, navigate]);

  // If questions not ready yet
  if (!questions || questions.length === 0 || !questions[currentQuestion]) {
    return <Typography>Loading questions...</Typography>;
  }

  const currentQuestionData = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleNextQuestion = async () => {
    let isCorrect = false;

    const correctOption = currentQuestionData.options?.find((option) => option.isCorrect);

    if (correctOption && selectedOption) {
      isCorrect = correctOption._id === selectedOption;
    }

    // Save answer
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestionData._id, selectedOption);
      return newAnswers;
    });

    if (isCorrect && saveUserTestScore) {
      saveUserTestScore();
    }

    // ---------------- LAST QUESTION ----------------
    if (isLastQuestion) {
      try {
        const answersObject = Object.fromEntries(answers);

        if (selectedOption) {
          answersObject[currentQuestionData._id] = selectedOption;
        }

        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
          },
          { withCredentials: true },
        );

        submitTest(); // proceed to coding / submit
        return;
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save MCQ results');
      }
    }

    // Move to next question
    setSelectedOption(null);
    setCurrentQuestion((prev) => prev + 1);
  };

  // ---------------- UI ----------------
  return (
    <Card sx={{ width: '60%', boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" mb={2}>
          Question {currentQuestion + 1}
        </Typography>

        <Typography variant="body1" mb={3}>
          {currentQuestionData.question}
        </Typography>

        <FormControl>
          <RadioGroup value={selectedOption} onChange={handleOptionChange}>
            {currentQuestionData.options?.map((option) => (
              <FormControlLabel
                key={option._id}
                value={option._id}
                control={<Radio />}
                label={option.optionText}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <Button variant="contained" onClick={handleNextQuestion} disabled={!selectedOption}>
            {isLastQuestion ? 'Proceed to Coding' : 'Next'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
