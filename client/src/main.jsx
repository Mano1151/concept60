import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { initAllOptimizations } from './utils/performance';
import './index.css';

// Initialize performance optimizations
initAllOptimizations();

const savedSettings = localStorage.getItem('concept60_accessibility_settings');
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    if (parsed.theme) {
      document.documentElement.dataset.theme = parsed.theme;
    }
    if (parsed.font) {
      document.documentElement.dataset.font = parsed.font;
    }
  } catch (error) {
    // ignore invalid theme storage values
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
