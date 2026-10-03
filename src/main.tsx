import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent noisy unhandled WebSocket rejection logs in dev iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (reasonStr.toLowerCase().includes('websocket')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
