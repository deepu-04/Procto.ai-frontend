import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProctoApp() {
  // If a user hits /candidate/procto-interview, send them to dashboard
  return <Navigate to="/candidate/procto-interview/dashboard" replace />;
}
