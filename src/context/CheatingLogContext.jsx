import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    violations: [], // Array to store violation events
    totalViolations: 0, // Computed from violations array length
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
    examTerminated: false,
    terminationReason: '',
    screenshots: [], // For evidence
  });

  useEffect(() => {
    if (userInfo) {
      setCheatingLog((prev) => ({
        ...prev,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  const updateCheatingLog = (newLog) => {
    setCheatingLog((prev) => {
      const updatedLog = { ...prev, ...newLog };

      // If violations are being added, update totalViolations
      if (newLog.violations) {
        updatedLog.totalViolations = newLog.violations.length;
      }

      console.log('Updated cheating log:', updatedLog); // Debug log
      return updatedLog;
    });
  };

  const resetCheatingLog = (examId) => {
    const resetLog = {
      violations: [],
      totalViolations: 0,
      examId: examId,
      username: userInfo?.name || '',
      email: userInfo?.email || '',
      examTerminated: false,
      terminationReason: '',
      screenshots: [],
    };
    console.log('Reset cheating log:', resetLog); // Debug log
    setCheatingLog(resetLog);
  };

  return (
    <CheatingLogContext.Provider value={{ cheatingLog, updateCheatingLog, resetCheatingLog }}>
      {children}
    </CheatingLogContext.Provider>
  );
};

export const useCheatingLog = () => {
  const context = useContext(CheatingLogContext);
  if (!context) {
    throw new Error('useCheatingLog must be used within a CheatingLogProvider');
  }
  return context;
};
