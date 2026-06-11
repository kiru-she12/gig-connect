import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, ArrowLeft, ArrowRight, Loader2, Check, Building, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILLS_LIST } from '../../data/mockData';

const RegisterModal = ({ isOpen, onClose }) => {
  const [role, setRole] = useState('student');
  const [step, setStep] = useState(0); // 0: Role Selection, 1: Basic Info, 2: OTP, 3: Specifics, 4: Password, 5: Success
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    skills: [], availability: [], businessName: '', jobType: 'Both', nic: '', businessReg: '', terms: false, emailOtp: '', phoneOtp: ''
  });
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [error, setError] = useState('');
  const { register, loading, setIsLoginModalOpen } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelection = (r) => {
    setRole(r);
    setStep(1);
    setError('');
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setError('Please fill in all basic information');
        return;
      }
      setIsSendingOtp(true);
      setTimeout(() => {
        setIsSendingOtp(false);
        setError('');
        setStep(2);
      }, 1000);
      return;
    }
    if (step === 2) {
      if (formData.emailOtp?.length !== 6 || formData.phoneOtp?.length !== 6) {
        setError('Please enter both 6-digit codes sent to your email and phone');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({ ...formData, role });
      setStep(5); // Show success screen instead of navigating
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[900px] h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all z-50">
            <X size={20} />
          </button>

          {/* Left Pane (Branded) */}
          <div className="hidden md:flex flex-col w-[45%] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden text-white pt-12 px-10">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>

            <h2 className="text-3xl font-bold mb-8 tracking-tight relative z-10">Welcome to<br/>GigConnect</h2>
            
            <div className="space-y-6 mb-10 relative z-10">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-white/10 mt-0.5">
                  <Check size={16} className="text-blue-200" />
                </div>
                <span className="text-lg font-medium text-blue-50">Exclusive student opportunities</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-white/10 mt-0.5">
                  <Check size={16} className="text-blue-200" />
                </div>
                <span className="text-lg font-medium text-blue-50">Build a real-world portfolio</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-white/10 mt-0.5">
                  <Check size={16} className="text-blue-200" />
                </div>
                <span className="text-lg font-medium text-blue-50 leading-snug">Connect with leading businesses</span>
              </div>
            </div>

            {/* Bottom Image */}
            <div className="absolute bottom-0 left-0 right-0 h-[45%] z-0 border-t border-white/10">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80" 
                alt="Working" 
                className="w-full h-full object-cover object-top opacity-90"
              />
            </div>
          </div>

          {/* Right Pane (Form) */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 relative flex flex-col bg-sky-50/50">
            
            {step > 0 && step < 5 && (
              <button onClick={prevStep} className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors mb-6 self-start">
                <ArrowLeft size={18} /> Back
              </button>
            )}

            {step === 0 ? (
              <div className="mb-8 text-center mt-4">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Join GigConnect</h2>
                <p className="text-slate-600">
                  Which describes you best?
                </p>
              </div>
            ) : step < 5 ? (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your {role === 'student' ? 'Student' : 'Business'} account</h2>
                <p className="text-sm text-slate-500">
                  Additional verification may be required at a later stage
                </p>
              </div>
            ) : null}

            {error && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg flex items-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 flex-1">
              <AnimatePresence mode="wait">
                
                {/* Step 0: Role Selection */}
                {step === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="space-y-4 mt-2">
                      <button 
                        type="button" 
                        onClick={() => handleRoleSelection('client')} 
                        className="w-full group flex items-center gap-5 border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-600 hover:shadow-lg hover:bg-blue-50/50 transition-all text-left bg-white"
                      >
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 transition-transform group-hover:scale-110 group-hover:bg-emerald-200">
                           <Building size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 flex items-center justify-between">
                            Client
                            <ArrowRight size={18} className="text-blue-600 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 font-medium">Post jobs and hire</p>
                        </div>
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleRoleSelection('student')} 
                        className="w-full group flex items-center gap-5 border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-600 hover:shadow-lg hover:bg-blue-50/50 transition-all text-left bg-white"
                      >
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 transition-transform group-hover:scale-110 group-hover:bg-blue-200">
                           <Monitor size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900 flex items-center justify-between">
                            Student
                            <ArrowRight size={18} className="text-blue-600 opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 font-medium">Work and get paid</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    
                    {/* Social Logins */}
                    <div className="space-y-3">
                      <button type="button" className="w-full flex items-center justify-between px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        <span className="font-semibold text-slate-700 text-sm flex-1 text-center pr-5">Continue with Google</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Full Name</label>
                      <input type="text" required placeholder="John Doe" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">{role === 'student' ? 'University Email' : 'Business Email'}</label>
                      <input type="email" required placeholder={role === 'student' ? "name@std.uwu.ac.lk" : "name@email.com"} className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Phone Number</label>
                      <input type="tel" required placeholder="+94 7X XXX XXXX" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <button type="button" onClick={nextStep} disabled={!formData.email || !formData.fullName || isSendingOtp} className="w-full bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all mt-4 shadow-md shadow-blue-600/20">
                      {isSendingOtp ? <Loader2 className="animate-spin" size={16} /> : 'Continue'}
                    </button>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <motion.div key="step2-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Verify your Contact Info</h3>
                      <p className="text-sm text-slate-500 mt-2">
                        We've sent 6-digit verification codes to <br/>
                        <span className="font-semibold text-slate-800">{formData.email}</span> and <span className="font-semibold text-slate-800">{formData.phone}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-slate-800 mb-1">Email Code</label>
                        <input 
                          type="text" 
                          maxLength="6" 
                          required 
                          placeholder="000000" 
                          className="w-full text-center tracking-[0.5em] text-xl bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-300" 
                          value={formData.emailOtp} 
                          onChange={(e) => setFormData({ ...formData, emailOtp: e.target.value.replace(/\D/g, '') })} 
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-800 mb-1">Phone Code</label>
                        <input 
                          type="text" 
                          maxLength="6" 
                          required 
                          placeholder="000000" 
                          className="w-full text-center tracking-[0.5em] text-xl bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-blue-500 transition-all font-bold placeholder:text-slate-300" 
                          value={formData.phoneOtp} 
                          onChange={(e) => setFormData({ ...formData, phoneOtp: e.target.value.replace(/\D/g, '') })} 
                        />
                      </div>
                    </div>
                    
                    <button type="button" onClick={nextStep} disabled={formData.emailOtp?.length !== 6 || formData.phoneOtp?.length !== 6} className="w-full bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all mt-4 shadow-md shadow-blue-600/20">
                      Verify & Continue
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm font-semibold text-slate-600">
                        Didn't receive the codes? <button type="button" className="text-blue-600 hover:underline">Resend</button>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Specifics */}
                {step === 3 && role === 'student' && (
                  <motion.div key="step2-student" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Your Expertise</label>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_LIST.map((skill) => (
                          <button key={skill} type="button" onClick={() => handleSkillToggle(skill)} className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${formData.skills.includes(skill) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Availability</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Weekdays', 'Weekends', 'Evenings'].map((item) => (
                          <button key={item} type="button" onClick={() => handleAvailabilityToggle(item)} className={`p-3 rounded-lg border text-center transition-all ${formData.availability.includes(item) ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-sm' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                            <span className="text-xs">{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" onClick={nextStep} disabled={formData.skills.length === 0} className="w-full bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all mt-4 shadow-md shadow-blue-600/20">
                      Continue
                    </button>
                  </motion.div>
                )}

                {step === 3 && role === 'client' && (
                  <motion.div key="step2-client" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">NIC Number</label>
                      <input type="text" required placeholder="NIC Number" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.nic} onChange={(e) => setFormData({ ...formData, nic: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Business Registration (if any)</label>
                      <input type="text" placeholder="BR Number" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.businessReg} onChange={(e) => setFormData({ ...formData, businessReg: e.target.value })} />
                    </div>
                    <button type="button" onClick={nextStep} disabled={!formData.nic} className="w-full bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-blue-700 text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all mt-4 shadow-md shadow-blue-600/20">
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Step 4: Password */}
                {step === 4 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Password</label>
                      <input type="password" required placeholder="Password" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">Confirm Password</label>
                      <input type="password" required placeholder="Confirm Password" className="w-full bg-white border border-slate-300 rounded-lg py-3 px-4 outline-none focus:border-slate-900 transition-all text-sm font-medium placeholder:text-slate-400" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>

                    <div className="space-y-2 mt-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Check size={16} className={formData.password.length >= 8 ? 'text-green-600' : 'text-slate-300'} />
                        <span className={`text-sm ${formData.password.length >= 8 ? 'text-slate-700' : ''}`}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-300'} />
                        <span className={`text-sm ${/[A-Z]/.test(formData.password) ? 'text-slate-700' : ''}`}>At least 1 uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-300'} />
                        <span className={`text-sm ${/[a-z]/.test(formData.password) ? 'text-slate-700' : ''}`}>At least 1 lowercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={16} className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-300'} />
                        <span className={`text-sm ${/[0-9]/.test(formData.password) ? 'text-slate-700' : ''}`}>At least 1 number</span>
                      </div>
                    </div>

                    <button type="submit" disabled={loading || !formData.password || formData.password !== formData.confirmPassword} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-4 shadow-md shadow-blue-600/20">
                      {loading ? <Loader2 className="animate-spin" size={16} /> : 'Complete Registration'}
                    </button>
                  </motion.div>
                )}

                {/* Step 5: Success & Verification Wait */}
                {step === 5 && (
                  <motion.div key="step5-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-8 space-y-6">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check size={48} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Registration Successful!</h2>
                    <p className="text-slate-600 text-base max-w-[320px] leading-relaxed">
                      Your account has been created and is currently <span className="font-bold text-slate-900">waiting for verification</span>.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 w-full text-left">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div></div>
                        <p className="text-sm text-blue-900 font-medium leading-relaxed">
                          You will receive an email confirmation once your account is fully approved by our team.
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center transition-all mt-4">
                      Return to Home
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {step < 5 && (
              <div className="mt-8 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  By joining, you agree to the GigConnect <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and to occasionally receive emails from us. Please read our <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a> to learn how we use your personal data.
                </p>
                
                {step === 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Already have an account? <button type="button" onClick={() => { onClose(); setIsLoginModalOpen(true); }} className="text-blue-600 hover:underline">Sign In</button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RegisterModal;
