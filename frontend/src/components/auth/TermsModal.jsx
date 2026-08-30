import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const TERMS_LIST = [
  "Provide accurate and truthful information during registration.",
  "Use GigConnect only for legitimate job-related activities.",
  "Students and job providers are responsible for completing their agreed responsibilities.",
  "Do not post fraudulent jobs, provide false information, or misuse other users' accounts.",
  "Respect other users and do not engage in harassment, abuse, or inappropriate activities.",
  "GigConnect may use your profile, job, application, and location information to provide platform services.",
  "Smart recommendations and applicant rankings are provided as assistance and do not guarantee job selection or employment.",
  "Accounts that violate the platform rules may be suspended or terminated."
];

const TermsModal = () => {
  const { isTermsModalOpen, setIsTermsModalOpen } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTermsModalOpen) {
        setIsTermsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTermsModalOpen, setIsTermsModalOpen]);

  if (!isTermsModalOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsTermsModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 border border-slate-100 max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#1A312C] via-[#23423B] to-[#1A312C] px-6 sm:px-8 py-5 sm:py-6 text-white relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#89D7B7] shadow-inner">
                <FileText size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-white">Terms of Service</h2>
                <p className="text-emerald-200/80 text-xs mt-0.5">GigConnect Platform Agreement</p>
              </div>
            </div>

            <button
              onClick={() => setIsTermsModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              Before creating your GigConnect account, please read and agree to the following:
            </p>

            <ul className="space-y-3 pt-1">
              {TERMS_LIST.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer with Close Button */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#1A312C] hover:bg-[#142622] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              I Understand & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default TermsModal;
