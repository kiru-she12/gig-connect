import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Configure Axios to always send credentials (cookies) in cross-origin requests
axios.defaults.withCredentials = true;

// Intercept Axios requests to strip out Bearer null/undefined authorization headers
axios.interceptors.request.use((config) => {
  if (config.headers && config.headers.Authorization) {
    const authHeader = config.headers.Authorization;
    if (authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
      delete config.headers.Authorization;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Configure global Fetch to always send credentials (cookies) and strip out null/undefined auth headers
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  options.credentials = options.credentials || 'include';
  
  if (options.headers) {
    if (options.headers instanceof Headers) {
      const auth = options.headers.get('Authorization');
      if (auth === 'Bearer null' || auth === 'Bearer undefined') {
        options.headers.delete('Authorization');
      }
    } else if (typeof options.headers === 'object') {
      const auth = options.headers['Authorization'] || options.headers['authorization'];
      if (auth === 'Bearer null' || auth === 'Bearer undefined') {
        delete options.headers['Authorization'];
        delete options.headers['authorization'];
      }
    }
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
