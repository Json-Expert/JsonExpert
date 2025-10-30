import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { setupGlobalErrorHandler } from './lib/error-handler';
import './index.css';

// Setup global error handlers for uncaught errors and unhandled promise rejections
setupGlobalErrorHandler();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);