import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Envelope, Phone, Lock, CheckCircle, Spinner, X, ArrowLeft, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILLS_LIST } from '../data/mockData';
import logo from '../assets/logo/logo.png';
import Footer from '../components/layout/Footer';

const RegisterStudent = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skills: [],
    availability: [],
    year: '1st Year',
    degree: '',
    languages: '',
    bio: '',
    terms: false
  });
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState('');
  const { register, verifyOtp, forgotPassword, loading, setIsLoginModalOpen } = useAuth();
  const navigate = useNavigate();

  const handleSkillToggle = (skill) => {
    if (formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
    } else {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
  };

  const handleAvailabilityToggle = (item) => {
    if (formData.availability.includes(item)) {
      setFormData({ ...formData, availability: formData.availability.filter(a => a !== item) });
    } else {
      setFormData({ ...formData, availability: [...formData.availability, item] });
    }
  };

  const validateEmail = (email) => {
    return /^[a-z0-9]+@std\.uwu\.ac\.lk$/i.test(email.trim());
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError('Please fill in all basic information');
        return;
      }
      if (/\d/.test(formData.fullName) || !/^[a-zA-Z\s\.\'-]{2,100}$/.test(formData.fullName.trim())) {
        setError('Full Name must only contain letters, spaces, dots, or hyphens and cannot contain numbers');
        return;
      }
      if (!/^0\d{9}$/.test(formData.phone.trim())) {
        setError('Phone number must be exactly 10 digits (e.g., 0712345678)');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Please use your official university email (e.g., cst20001@std.uwu.ac.lk)');
        return;
      }
    }
    if (step === 2) {
      if (formData.skills.length === 0) {
        setError('Please select or add at least one skill/expertise');
        return;
      }
      if (!formData.year) {
        setError('Please select your university year');
        return;
      }
      if (!formData.degree.trim()) {
        setError('Please specify your degree program');
        return;
      }
      if (!formData.languages.trim()) {
        setError('Please specify the languages you know');
        return;
      }
      if (!formData.bio.trim()) {
        setError('Please write a short description (bio)');
        return;
      }
      const wordCount = formData.bio.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 100) {
        setError(`Your short description must be at least 100 words. (Currently: ${wordCount} words)`);
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

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all basic information');
      return;
    }

    if (/\d/.test(formData.fullName) || !/^[a-zA-Z\s\.\'-]{2,100}$/.test(formData.fullName.trim())) {
      setError('Full Name must only contain letters, spaces, dots, or hyphens and cannot contain numbers');
      return;
    }

    if (!/^0\d{9}$/.test(formData.phone.trim())) {
      setError('Phone number must be exactly 10 digits (e.g., 0712345678)');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please use your official university email (e.g., cst20001@std.uwu.ac.lk)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.terms) {
      setError('You must accept the terms of service');
      return;
    }

    try {
      const res = await register({ ...formData, role: 'student' });
      if (res && res.otp) {
        setReceivedOtp(res.otp);
      }
      setOtpSent(true);
      setError('');
      setStep(4);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again or contact support.');
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
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/10 flex flex-col">
      {/* Top Navigation */}
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
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-1">Student Application</h2>
              <p className="text-slate-500 font-medium">Step {step > 3 ? step - 1 : step} of 3: {step === 1 ? 'Personal Profile' : step === 2 ? 'Skills & Portfolio' : step === 3 ? 'Security' : step === 4 ? 'OTP Verification' : 'Success'}</p>
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

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Chamara Perera"
                          className="input-field pl-12"
                          value={formData.fullName}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[0-9]/g, '');
                            setFormData({ ...formData, fullName: cleaned });
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Student Email</label>
                      <div className="relative group">
                        <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="e.g. cst23001@std.uwu.ac.lk or iit22045@std.uwu.ac.lk"
                          className="input-field pl-12"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input 
                        type="tel" 
                        required
                        maxLength={10}
                        placeholder="07XXXXXXXX (10 digits)"
                        className="input-field pl-12"
                        value={formData.phone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: cleaned });
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4 items-start">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Verification Required</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">By providing your official university email, you verify your student status. You may be asked to provide your Student ID during profile completion.</p>
                    </div>
                  </div>

                  <button 
                    onClick={nextStep}
                    className="w-full btn-primary py-4 group"
                  >
                    Continue to Skills
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
                  {/* Skill / Expertise Selection */}
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Select Your Expertise (Min. 1)</label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS_LIST.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillToggle(skill)}
                          className={`px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-200 ${
                            formData.skills.includes(skill)
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/40'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                    {/* Add Custom Skill */}
                    <div className="flex gap-2 mt-4">
                      <input 
                        type="text" 
                        placeholder="Add other custom expertise..." 
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        className="input-field flex-1"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
                            setFormData({ ...formData, skills: [...formData.skills, customSkill.trim()] });
                            setCustomSkill('');
                          }
                        }}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-2xl transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Academic Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">University Year</label>
                      <select
                        className="input-field bg-white cursor-pointer"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree Program</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Sc. in Computer Science & Technology"
                        className="input-field"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Languages (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. English, Sinhala, Tamil"
                      className="input-field"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    />
                  </div>

                  {/* Short Bio (Min 100 words) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Short Description / Bio (Min. 100 words)</label>
                      <span className={`text-[10px] font-bold ${
                        formData.bio.trim().split(/\s+/).filter(Boolean).length >= 100 
                          ? 'text-[#4E8C7E]' 
                          : 'text-slate-400'
                      }`}>
                        Word count: {formData.bio.trim().split(/\s+/).filter(Boolean).length} / 100
                      </span>
                    </div>
                    <textarea
                      placeholder="Share a brief introduction about your background, skills, and experience..."
                      className="input-field min-h-[120px] py-3 resize-y leading-relaxed"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
 
                  {/* Preferred Availability */}
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Preferred Availability</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Weekdays', 'Weekends', 'Evenings'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAvailabilityToggle(item)}
                          className={`p-4 rounded-2xl border text-center transition-all ${
                            formData.availability.includes(item)
                            ? 'bg-primary/5 border-primary text-primary ring-1 ring-primary/20'
                            : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          <p className="text-sm font-bold">{item}</p>
                        </button>
                      ))}
                    </div>
                  </div>
 
                  <div className="flex gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 btn-secondary py-4">Back</button>
                    <button onClick={nextStep} className="flex-[2] btn-primary py-4 group">
                      Next Step
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
                          className="input-field pl-12"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Security Key</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          className="input-field pl-12"
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
                        I hereby acknowledge that I have read and agree to the <Link to="#" className="text-primary font-bold hover:underline">Code of Conduct</Link> and <Link to="#" className="text-primary font-bold hover:underline">Membership Agreement</Link> of GigConnect.
                      </span>
                    </label>
                  </div>
 
                  <div className="flex gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 btn-secondary py-4">Back</button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="flex-[2] btn-primary py-4"
                    >
                      {loading ? <Spinner className="animate-spin" size={20} /> : 'Join the Network'}
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
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Verify your Student Email</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      We've sent a 6-digit OTP code to <span className="font-semibold text-slate-800">{formData.email}</span>
                    </p>
                    {receivedOtp && (
                      <div className="mt-4 p-3.5 bg-primary-light border border-border text-primary rounded-2xl text-xs font-bold animate-fadeIn">
                        🔑 Development Verification OTP: <span className="text-sm font-black underline tracking-wider">{receivedOtp}</span>
                      </div>
                    )}
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
                          const res = await forgotPassword(formData.email);
                          if (res && res.otp) {
                            setReceivedOtp(res.otp);
                          }
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
                      className="flex-[2] btn-primary py-4"
                    >
                      {loading ? <Spinner className="animate-spin" size={20} /> : 'Verify OTP'}
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
                    className="w-full btn-primary py-4 mt-4"
                  >
                    Return to Home
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-12 text-center text-slate-400 text-xs font-medium max-w-sm mx-auto leading-relaxed">
          Your data is protected by enterprise-grade encryption. By joining, you become part of an elite student professional community.
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterStudent;
