import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    violations: [], 
    totalViolations: 0, 
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
    examTerminated: false,
    terminationReason: '',
    screenshots: [], 
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

      
      if (newLog.violations) {
        updatedLog.totalViolations = newLog.violations.length;
      }

      console.log('Updated cheating log:', updatedLog); 
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
    console.log('Reset cheating log:', resetLog); 
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
