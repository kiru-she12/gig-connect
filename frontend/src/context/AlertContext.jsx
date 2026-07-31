import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info',
  });
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);

  const showAlert = (message, type = 'info') => {
    // Clear any existing auto-close timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    setAlertState({
      isOpen: true,
      message,
      type,
    });

    // Auto-close success or info alerts after 2.5 seconds
    if (type === 'success' || type === 'info') {
      const timer = setTimeout(() => {
        closeAlert();
      }, 2500);
      setAutoCloseTimer(timer);
    }
  };

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
  };

  // Intercept the browser's default window.alert
  useEffect(() => {
    window.alert = (message) => {
      let type = 'info';
      const msgLower = String(message).toLowerCase();
      
      if (
        msgLower.includes('fail') || 
        msgLower.includes('error') || 
        msgLower.includes('invalid') || 
        msgLower.includes('missed') || 
        msgLower.includes('not match') ||
        msgLower.includes('required')
      ) {
        type = 'error';
      } else if (
        msgLower.includes('success') || 
        msgLower.includes('completed') || 
        msgLower.includes('saved') ||
        msgLower.includes('sent')
      ) {
        type = 'success';
      } else if (
        msgLower.includes('warning') || 
        msgLower.includes('please') ||
        msgLower.includes('attention')
      ) {
        type = 'warning';
      }
      
      showAlert(message, type);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center overflow-hidden z-50 flex flex-col items-center gap-4"
            >
              {/* Close Button top-right */}
              <button
                onClick={closeAlert}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              >
                <X size={16} />
              </button>

              {/* Icon based on type */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mt-2 ${
                alertState.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                alertState.type === 'error' ? 'bg-rose-50 text-rose-600' :
                alertState.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {alertState.type === 'success' && <CheckCircle size={28} />}
                {alertState.type === 'error' && <AlertCircle size={28} />}
                {alertState.type === 'warning' && <AlertCircle size={28} />}
                {alertState.type === 'info' && <Info size={28} />}
              </div>
              
              <div className="space-y-1.5 px-2">
                <h3 className="font-heading font-black text-slate-800 text-lg uppercase tracking-wider">
                  {alertState.type === 'success' ? 'Success' :
                   alertState.type === 'error' ? 'Oops!' :
                   alertState.type === 'warning' ? 'Attention' :
                   'Message'}
                </h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  {alertState.message}
                </p>
              </div>
              
              <button
                onClick={closeAlert}
                className="mt-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
