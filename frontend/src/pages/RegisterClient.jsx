import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Mail, Phone, Lock, FileText, Loader2, X, ShieldCheck, ArrowLeft, ArrowRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo/logo.png';
import Footer from '../components/layout/Footer';

const RegisterClient = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    nic: '',
    businessReg: '',
    password: '',
    confirmPassword: '',
    jobType: 'Both',
    terms: false
  });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, verifyOtp, forgotPassword, loading, setIsLoginModalOpen } = useAuth();
  const navigate = useNavigate();

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setError('Please complete the essential contact information');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Security keys do not match');
      return;
    }

    if (formData.jobType !== 'Remote' && !formData.businessReg) {
      setError('Registration Number is mandatory for on-site or hybrid collaboration');
      return;
    }

    if (!formData.terms) {
      setError('Agreement to terms and conditions is required');
      return;
    }

    try {
      await register({ ...formData, role: 'client' });
      setOtpSent(true);
      setError('');
      setStep(4);
    } catch (err) {
      setError(err.message || 'Submission failed. Our team has been notified.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const otp = formData.otpCode;
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    try {
      await verifyOtp(formData.email, otp);
      setSuccess(true);
      setError('');
      setStep(5);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    }
  };

  const progress = Math.min((step / 4) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/10 selection:text-primary flex flex-col">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 bg-white shadow-lg shadow-slate-200/50 rounded-xl flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
            <img src={logo} alt="GigConnect" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-heading font-black text-slate-900 tracking-tight">GigConnect</span>
        </Link>
        <button 
          onClick={() => setIsLoginModalOpen(true)}
          className="text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          Already have an account? <span className="text-primary">Login</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-24">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-1">Business Registration</h2>
              <p className="text-slate-500 font-medium">Stage {step > 3 ? step - 1 : step} of 3: {step === 1 ? 'Representative Info' : step === 2 ? 'Business Verification' : step === 3 ? 'Access Security' : step === 4 ? 'OTP Verification' : 'Success'}</p>
            </div>
            <span className="text-sm font-black text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-8 mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl flex items-center gap-3 font-semibold"
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="p-10 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Operation Model</label>
                    <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                      {['On-site', 'Remote', 'Both'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, jobType: type })}
                          className={`py-3.5 text-sm font-bold rounded-2xl transition-all ${
                            formData.jobType === type
                            ? 'bg-white text-primary shadow-md shadow-slate-200/50 scale-[1.02] ring-1 ring-slate-100'
                            : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="Representative Name"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name (Optional)</label>
                      <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          placeholder="Company or Brand"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="name@business.com"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="tel" 
                          required
                          placeholder="+94 XX XXX XXXX"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={nextStep}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 group"
                  >
                    Continue to Verification
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">National Identity Card (NIC)</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="NIC Number"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.nic}
                          onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Registration Number</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required={formData.jobType !== 'Remote'}
                          placeholder="BR Number"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.businessReg}
                          onChange={(e) => setFormData({ ...formData, businessReg: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-primary-light rounded-3xl border border-border flex gap-4 items-start">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Trust & Safety</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Verified businesses receive higher engagement from students. All registration data is processed securely and kept confidential.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 btn-secondary py-4">Back</button>
                    <button onClick={nextStep} className="flex-[2] bg-primary hover:bg-primary-dark text-white py-4 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 group">
                      Security Setup
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Access Key</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          className="input-field pl-12 focus:ring-primary/20 focus:border-primary"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-start gap-4 cursor-pointer group p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20"
                        checked={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                      />
                      <span className="text-xs text-slate-500 leading-relaxed font-medium">
                        I agree to the <Link to="#" className="text-primary font-bold hover:underline">Terms of Service</Link> and <Link to="#" className="text-primary font-bold hover:underline">Privacy Policy</Link> for business entities on GigConnect.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 btn-secondary py-4">Back</button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="flex-[2] bg-primary hover:bg-primary-dark text-white py-4 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-70 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Register Business'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Verify your Contact Info</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      We've sent a 6-digit OTP code to <span className="font-semibold text-slate-800">{formData.email}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">6-Digit OTP Code</label>
                      <input 
                        type="text" 
                        maxLength="6" 
                        required 
                        placeholder="000000"
                        className="w-full text-center tracking-[0.5em] text-xl bg-white border border-slate-300 rounded-[1.5rem] py-4 px-4 outline-none focus:border-primary transition-all font-bold placeholder:text-slate-200"
                        value={formData.otpCode || ''}
                        onChange={(e) => setFormData({ ...formData, otpCode: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          setError('');
                          await forgotPassword(formData.email);
                          alert('A new OTP has been sent to your email and phone.');
                        } catch (err) {
                          setError(err.message || 'Failed to resend OTP.');
                        }
                      }} 
                      className="flex-1 btn-secondary py-4"
                    >
                      Resend OTP
                    </button>
                    <button 
                      onClick={handleVerifyOtp} 
                      disabled={loading || formData.otpCode?.length !== 6}
                      className="flex-[2] bg-primary hover:bg-primary-dark text-white py-4 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify OTP'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                    Your account has been verified and is currently <span className="font-bold text-slate-800">waiting for admin approval</span>. You will receive an email once approved.
                  </p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-[1.5rem] font-black text-lg w-full mt-4"
                  >
                    Return to Home
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-12 text-center text-slate-400 text-xs font-medium max-w-sm mx-auto leading-relaxed">
          Trusted by over 200 businesses. GigConnect is the most reliable way to hire specialized student talent from UWU.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterClient;
