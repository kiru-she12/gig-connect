import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, X, ArrowLeft, Check, Loader2, KeyRound, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo/logo.png';

const Login = () => {
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

  const { user, login, forgotPassword, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        navigate('/dashboard/student');
      } else if (user.role === 'admin' || user.role === 'manager') {
        navigate('/dashboard/admin');
      } else if (user.role === 'client') {
        navigate('/dashboard/client/home');
      } else if (user.role === 'delivery_staff') {
        navigate('/dashboard/delivery/overview');
      } else {
        navigate(`/dashboard/${user.role}`);
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userData = await login(email, password);
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#4E8C7E]/10 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-[500px] h-[500px] rounded-full bg-[#89D7B7]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] rounded-full bg-[#4E8C7E]/10 blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[950px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[580px]"
      >
        {/* Left Pane (Branded Sidebar) */}
        <div className="hidden md:flex flex-col w-[42%] bg-gradient-to-br from-[#1A312C] via-[#244b41] to-[#34685b] relative overflow-hidden text-white justify-between p-12 text-left">
          {/* Decorative shapes inside left panel */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#89D7B7]/10 blur-3xl"></div>

          {/* Logo & Branding */}
          <Link to="/" className="flex items-center gap-3 no-underline self-start group">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-2 group-hover:scale-105 transition-transform backdrop-blur-md">
              <img src={logo} alt="GigConnect" className="w-full h-full object-contain filter invert" />
            </div>
            <span className="text-xl font-heading font-black text-white tracking-tight">GigConnect</span>
          </Link>

          {/* Branding Content */}
          <div className="my-auto space-y-6 max-w-[280px]">
            <h2 className="text-3xl font-black leading-tight text-white">
              Connect to your next opportunity.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed font-medium">
              Join the student network at Uva Wellassa University of Sri Lanka and work with trusted local job providers.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-white/10 shrink-0">
                  <Check size={14} className="text-[#89D7B7]" />
                </div>
                <span className="text-sm font-bold text-white/95 leading-snug">Verify & Apply Securely</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-full bg-white/10 shrink-0">
                  <Check size={14} className="text-[#89D7B7]" />
                </div>
                <span className="text-sm font-bold text-white/95 leading-snug">Track Your Tasks & Delivery</span>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
            © 2026 GigConnect Network
          </div>
        </div>

        {/* Right Pane (Dynamic Forms) */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-8 self-start text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Home
          </Link>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">Welcome Back</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Sign in to access your customized student or provider dashboard.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Username</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4E8C7E] transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="yourname@std.uwu.ac.lk"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-sm font-bold text-slate-800"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot-password'); setError(''); }} 
                        className="text-xs font-bold text-[#4E8C7E] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4E8C7E] transition-colors" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-sm font-bold text-slate-800"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !email || !password}
                    className="w-full py-4 bg-[#4E8C7E] hover:bg-[#1A312C] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-md hover:scale-[1.01]"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-500 font-medium">
                  Don't have an account?{' '}
                  <span className="font-bold text-[#4E8C7E] hover:underline cursor-pointer">
                    Join as a Student or Job Provider
                  </span>
                </p>
              </motion.div>
            )}

            {view === 'forgot-password' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Reset Password</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Enter your registered email address to receive a 6-digit OTP code.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4E8C7E] transition-colors" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="name@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-sm font-bold text-slate-800"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => { setView('login'); setError(''); }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !resetEmail}
                      className="flex-[2] py-4 bg-[#4E8C7E] hover:bg-[#1A312C] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-md"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Send OTP'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {view === 'otp-verification' && (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Verify OTP</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    We've sent a 6-digit verification code to <span className="font-bold text-slate-800">{resetEmail}</span>.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">6-Digit OTP</label>
                    <input 
                      type="text" 
                      required
                      maxLength="6"
                      placeholder="000000"
                      className="w-full text-center tracking-[0.3em] font-bold border border-slate-200 bg-slate-50 rounded-2xl py-3.5 px-4 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-lg text-slate-800"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-sm font-bold text-slate-800"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:border-[#4E8C7E] focus:bg-white transition-all text-sm font-bold text-slate-800"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setView('forgot-password'); setError(''); }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || otpCode.length !== 6 || !newPassword || !confirmPassword}
                      className="flex-[2] py-4 bg-[#4E8C7E] hover:bg-[#1A312C] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl font-bold text-sm flex items-center justify-center transition-all shadow-md"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {view === 'reset-success' && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-[#89D7B7]/20 text-[#4E8C7E] rounded-full flex items-center justify-center shadow-inner">
                  <Check size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Password Reset Successful!</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Your password has been changed. You can now log in with your new password.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }} 
                  className="w-full py-4 bg-[#4E8C7E] hover:bg-[#1A312C] text-white rounded-2xl font-bold text-sm transition-all shadow-md"
                >
                  Return to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
