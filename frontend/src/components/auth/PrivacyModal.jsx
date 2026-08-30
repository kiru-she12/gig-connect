import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const PRIVACY_LIST = [
  "We collect information such as your name, contact details, profile information, skills, job applications, and account details to provide GigConnect services.",
  "Location information may be used for delivery services, distance calculation, and related platform features.",
  "Your information is used to provide, maintain, and improve GigConnect services.",
  "We may send important notifications through email, SMS, or in-platform notifications.",
  "We do not allow users to access or misuse another user's personal information.",
  "We apply appropriate security measures to protect user information and accounts.",
  "Users should not share sensitive personal information unnecessarily through job posts, applications, reviews, or other public areas.",
  "Information may be processed by trusted third-party services required for features such as mapping, geocoding, email, SMS, and payment-related services.",
  "By using GigConnect, you agree to the collection and use of information as described in this Privacy Policy."
];

const PrivacyModal = () => {
  const { isPrivacyModalOpen, setIsPrivacyModalOpen } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPrivacyModalOpen) {
        setIsPrivacyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrivacyModalOpen, setIsPrivacyModalOpen]);

  if (!isPrivacyModalOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsPrivacyModalOpen(false)}
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
                <ShieldCheck size={22} weight="bold" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-white">Privacy Policy</h2>
                <p className="text-emerald-200/80 text-xs mt-0.5">GigConnect Data Protection & Privacy</p>
              </div>
            </div>

            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              GigConnect respects your privacy and is committed to protecting the information you provide when using our platform.
            </p>

            <ul className="space-y-3 pt-1">
              {PRIVACY_LIST.map((item, index) => (
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
              onClick={() => setIsPrivacyModalOpen(false)}
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

export default PrivacyModal;
