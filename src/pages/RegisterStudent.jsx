import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, CheckCircle, Loader2, X, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILLS_LIST } from '../data/mockData';
import logo from '../logo.svg';

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
    terms: false
  });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { register, loading, setIsLoginModalOpen } = useAuth();
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
    return email.endsWith('@std.uwu.ac.lk');
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setError('Please fill in all basic information');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Please use your official university email (@std.uwu.ac.lk)');
        return;
      }
    }
    if (step === 2) {
      if (formData.skills.length === 0) {
        setError('Please select at least one core skill');
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
      setError('Passwords do not match');
      return;
    }

    if (!formData.terms) {
      setError('You must accept the terms of service');
      return;
    }

    try {
      await register({ ...formData, role: 'student' });
      navigate('/dashboard/student');
    } catch (err) {
      setError('Registration failed. Please try again or contact support.');
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/10">
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
              <p className="text-slate-500 font-medium">Step {step} of 3: {step === 1 ? 'Personal Profile' : step === 2 ? 'Skills & Portfolio' : 'Security'}</p>
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
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Student Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="cst23XXX@std.uwu.ac.lk"
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
                        placeholder="+94 7X XXX XXXX"
                        className="input-field pl-12"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  </div>

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
                      {loading ? <Loader2 className="animate-spin" /> : 'Join the Network'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-12 text-center text-slate-400 text-xs font-medium max-w-sm mx-auto leading-relaxed">
          Your data is protected by enterprise-grade encryption. By joining, you become part of an elite student professional community.
        </p>
      </div>
    </div>
  );
};

export default RegisterStudent;
