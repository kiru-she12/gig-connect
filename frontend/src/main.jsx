import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Configure Axios to always send credentials (cookies) in cross-origin requests
axios.defaults.withCredentials = true;

// Intercept Axios requests to inject/sanitize Authorization header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!config.headers) {
    config.headers = {};
  }
  if (!config.headers.Authorization && token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization === 'Bearer null' || config.headers.Authorization === 'Bearer undefined') {
    delete config.headers.Authorization;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept Axios responses to auto-logout on auth failures
axios.interceptors.response.use((response) => {
  if (response.data && (response.data.error === 'Invalid token!' || response.data.error === 'Token not provided!')) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

// Configure global Fetch to always send credentials (cookies) and inject/sanitize Authorization header
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  options.credentials = options.credentials || 'include';
  
  const token = localStorage.getItem('token');
  if (!options.headers) {
    options.headers = {};
  }
  
  if (options.headers instanceof Headers) {
    const auth = options.headers.get('Authorization');
    if (!auth && token) {
      options.headers.set('Authorization', `Bearer ${token}`);
    } else if (auth === 'Bearer null' || auth === 'Bearer undefined') {
      options.headers.delete('Authorization');
    }
  } else if (typeof options.headers === 'object') {
    const auth = options.headers['Authorization'] || options.headers['authorization'];
    if (!auth && token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    } else if (auth === 'Bearer null' || auth === 'Bearer undefined') {
      delete options.headers['Authorization'];
      delete options.headers['authorization'];
    }
  }
  
  const response = await originalFetch(url, options);
  
  // Intercept authentication errors (invalid/expired tokens) to force a clean logout
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && (data.error === 'Invalid token!' || data.error === 'Token not provided!')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      // Ignore cloning/parsing failures
    }
  }
  
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
