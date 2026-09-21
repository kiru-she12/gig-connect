import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, PaperPlaneRight } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const ContactModal = () => {
  const { isContactModalOpen, setIsContactModalOpen } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isContactModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending email/message
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1200);
  };

  const handleClose = () => {
    setIsContactModalOpen(false);
    // Reset submission state shortly after closing
    setTimeout(() => setIsSubmitted(false), 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 border border-slate-100 max-h-[90vh]"
        >
          {/* Close button */}
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-50"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 px-8 py-6 text-white relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
            <h2 className="text-2xl font-bold font-heading tracking-tight">Contact Us</h2>
            <p className="text-emerald-100/80 text-sm mt-1">We'd love to hear from you. Please fill out the form below.</p>
          </div>

          {/* Body Content */}
          <div className="p-8 overflow-y-auto flex-1">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center flex flex-col items-center justify-center"
              >
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                  Thank you for reaching out. We have received your query and our team will get back to you shortly.
                </p>
                <button 
                  onClick={handleClose}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md"
                >
                  Close Window
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="example@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone No field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone No</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+94 77 XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>

                  {/* Subject field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Message field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Enter Your Message</label>
                  <textarea 
                    required 
                    rows={4}
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400 resize-none"
                  />
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-300 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PaperPlaneRight size={16} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContactModal;
