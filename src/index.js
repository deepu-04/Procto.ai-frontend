import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
// import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense>
    <>
      <App />
    </>
  </Suspense>,
);
// 🔕 Silence ResizeObserver loop error (Monaco issue)
const resizeObserverErr = window.console.error;
window.console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed')) {
    return;
  }
  resizeObserverErr(...args);
};
