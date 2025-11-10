import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  // React DevTools profiler
  if (window.performance && window.performance.mark) {
    window.performance.mark('app-init-start');
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if (import.meta.env.DEV) {
  if (window.performance && window.performance.mark) {
    window.performance.mark('app-init-end');
    window.performance.measure('app-init', 'app-init-start', 'app-init-end');
  }
}

