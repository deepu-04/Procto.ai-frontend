import React from "react";
import { TextField, Box, Typography } from "@mui/material";

const CodingQuestionForm = ({ formik }) => {

  const questionError =
    formik.touched?.codingQuestion?.question &&
    formik.errors?.codingQuestion?.question;

  const descriptionError =
    formik.touched?.codingQuestion?.description &&
    formik.errors?.codingQuestion?.description;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Coding Question
      </Typography>

      {/* Question Field */}

      <TextField
        fullWidth
        name="codingQuestion.question"
        label="Question"
        multiline
        rows={3}
        value={formik.values.codingQuestion.question}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(questionError)}
        helperText={questionError}
        sx={{ mb: 2 }}
      />

      {/* Description Field */}

      <TextField
        fullWidth
        name="codingQuestion.description"
        label="Description / Instructions"
        multiline
        rows={4}
        value={formik.values.codingQuestion.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(descriptionError)}
        helperText={descriptionError}
        sx={{ mb: 3 }}
      />
    </Box>
  );
};

export default CodingQuestionForm;