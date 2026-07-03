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
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
