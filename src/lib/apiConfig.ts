export const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (envUrl && !envUrl.includes('workflowsaura-backend.onrender.com')) {
    return envUrl.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8000';
  }
  return 'https://workflowsaura-app.onrender.com';
};
