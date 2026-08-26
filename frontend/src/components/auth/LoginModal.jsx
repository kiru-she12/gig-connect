import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, X, ArrowLeft, Check, Loader2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Password Reset Flow States
  const [view, setView] = useState('login'); // 'login', 'forgot-password', 'otp-verification', 'reset-success'
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, forgotPassword, resetPassword, loading, setIsRegisterModalOpen } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await login(email, password);
      onClose();
      if (userData.role === 'student') {
        navigate('/dashboard/student');
      } else if (userData.role === 'admin' || userData.role === 'manager') {
        navigate('/dashboard/admin');
      } else if (userData.role === 'client') {
        navigate('/dashboard/client/home');
      } else if (userData.role === 'delivery_staff') {
        navigate('/dashboard/delivery/overview');
      } else {
        navigate(`/dashboard/${userData.role}`);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Please enter your email.');
      return;
    }
    try {
      await forgotPassword(resetEmail);
      setView('otp-verification');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(resetEmail, otpCode, newPassword, confirmPassword);
      setView('reset-success');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify your OTP.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[800px] h-auto md:h-[520px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button - Outside the layout flow, pinned to top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all z-50"
          >
            <X size={20} />
          </button>

          {/* Left Pane (Branded) */}
          <div className="hidden md:flex flex-col w-[45%] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden text-white justify-center items-center p-8 text-center">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"></div>

            <h2 className="text-3xl font-bold mb-8 tracking-tight relative z-10 text-center">Welcome to<br/>GigConnect</h2>
            
            <div className="space-y-6 relative z-10 w-full max-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-white/10 shrink-0">
                  <Check size={16} className="text-emerald-200" />
                </div>
                <span className="text-lg font-medium text-emerald-50 text-left leading-snug">Exclusive student opportunities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-white/10 shrink-0">
                  <Check size={16} className="text-emerald-200" />
                </div>
                <span className="text-lg font-medium text-emerald-50 text-left leading-snug">Build your reputation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-white/10 shrink-0">
                  <Check size={16} className="text-emerald-200" />
                </div>
                <span className="text-lg font-medium text-emerald-50 text-left leading-snug">Connect with local job providers</span>
              </div>
            </div>
          </div>

          {/* Right Pane (Form) */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 relative flex flex-col">
            <button 
              type="button"
              onClick={() => {
                if (view === 'login') {
                  onClose();
                } else if (view === 'forgot-password') {
                  setView('login');
                  setError('');
                } else if (view === 'otp-verification') {
                  setView('forgot-password');
                  setError('');
                } else {
                  setView('login');
                  setError('');
                }
              }} 
              className="flex items-center gap-2 text-slate-800 font-medium hover:text-slate-900 transition-colors mb-6 self-start text-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {view === 'login' && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Continue with your email or<br/>username</h2>
                  <p className="text-slate-500 text-[13px]">
                    Additional verification may be required at a later stage
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded flex items-center font-medium animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5 flex-1">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">Email or username</label>
                    <input 
                      type="text" 
                      required
                      className="w-full border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        className="w-full border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <Eye size={18} strokeWidth={1.5} /> : <EyeOff size={18} strokeWidth={1.5} />}
                      </button>
                    </div>
                    <div className="text-right mt-2">
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot-password'); setError(''); }} 
                        className="text-[13px] text-slate-600 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>



                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading || !email || !password}
                      className="w-full bg-primary disabled:bg-[#e4e5e7] disabled:text-[#b5b6ba] hover:bg-primary-dark text-white py-2.5 rounded font-bold text-sm flex items-center justify-center transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
                    </button>
                  </div>
                </form>

                <div className="mt-8">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    By joining, you agree to the GigConnect <a href="#" className="text-[#1dbf73] hover:underline">Terms of Service</a> and to occasionally receive emails from us. Please read our <a href="#" className="text-[#1dbf73] hover:underline">Privacy Policy</a> to learn how we use your personal data.
                  </p>
                </div>
              </>
            )}

            {view === 'forgot-password' && (
              <div className="flex-1 flex flex-col justify-center animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Reset Password</h2>
                  <p className="text-slate-500 text-[13px]">
                    Enter your email address to receive a 6-digit OTP verification code.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded flex items-center font-medium animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      className="w-full border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-sm"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading || !resetEmail}
                      className="w-full bg-primary disabled:bg-[#e4e5e7] disabled:text-[#b5b6ba] hover:bg-primary-dark text-white py-2.5 rounded font-bold text-sm flex items-center justify-center transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {view === 'otp-verification' && (
              <div className="flex-1 flex flex-col justify-center animate-fadeIn">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Verify OTP & Reset</h2>
                  <p className="text-slate-500 text-[13px]">
                    We have sent a 6-digit verification code to <span className="font-semibold text-slate-900">{resetEmail}</span>.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded flex items-center font-medium animate-fadeIn">
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">6-Digit OTP</label>
                    <input 
                      type="text" 
                      required
                      maxLength="6"
                      placeholder="000000"
                      className="w-full text-center tracking-[0.3em] font-bold border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-lg"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full border border-slate-300 rounded py-2 px-3 outline-none focus:border-slate-500 transition-all text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading || otpCode.length !== 6 || !newPassword || !confirmPassword}
                      className="w-full bg-primary disabled:bg-[#e4e5e7] disabled:text-[#b5b6ba] hover:bg-primary-dark text-white py-2.5 rounded font-bold text-sm flex items-center justify-center transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {view === 'reset-success' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-fadeIn space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful!</h2>
                  <p className="text-slate-500 text-sm">
                    You can now sign in using your new password.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }} 
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded font-bold text-sm transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;
