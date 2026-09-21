import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeSlash, ArrowLeft, Check, Spinner, Envelope, Lock, ShieldCheck } from '@phosphor-icons/react';
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

  const { user, login, forgotPassword, resetPassword, loading, setIsRegisterModalOpen } = useAuth();
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
      setError('Please enter your email address.');
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
      setError('Please enter a valid 6-digit OTP.');
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
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-teal-500/20 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[980px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]"
      >
        {/* Left Pane (Branded Gradient Sidebar) */}
        <div className="hidden md:flex flex-col w-[42%] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 relative overflow-hidden text-white justify-between p-10 lg:p-12 text-left border-r border-slate-800">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 no-underline self-start group z-10">
            <img 
              src={logo} 
              alt="GigConnect Logo" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <div>
              <span className="text-xl font-heading font-black text-white tracking-tight block leading-none">GigConnect</span>
              <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">UWU Campus Hub</span>
            </div>
          </Link>

          {/* Value Prop Copy */}
          <div className="my-auto space-y-6 max-w-[300px] z-10">

            <h2 className="text-3xl font-black leading-tight text-white font-heading">
              Empowering Student Freelancers & Local Businesses.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              Access curated campus micro-jobs, verified delivery tasks, and seamless payments at Uva Wellassa University.
            </p>
            
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-teal-500/20 text-teal-400 shrink-0 border border-teal-500/30">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-xs font-bold text-slate-200">Verified UWU Student Accounts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
                  <Check size={16} />
                </div>
                <span className="text-xs font-bold text-slate-200">Real-Time Task & Delivery Tracking</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest z-10">
            © 2026 GigConnect Platform
          </div>
        </div>

        {/* Right Pane (Forms Container) */}
        <div className="flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-center relative bg-white">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-700 transition-colors mb-6 self-start text-xs uppercase tracking-wider group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
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
                  <h2 className="text-3xl font-black text-slate-900 leading-tight font-heading">Welcome Back</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Sign in to access your customized student, client, or admin workspace.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5">Email or Username</label>
                    <div className="relative group">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="yourname@std.uwu.ac.lk"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all text-sm font-semibold text-slate-800"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-0.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot-password'); setError(''); }} 
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all text-sm font-semibold text-slate-800"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <Eye size={18} /> : <EyeSlash size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !email || !password}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-teal-600/25 active:scale-[0.98] mt-2"
                  >
                    {loading ? <Spinner className="animate-spin mr-2" size={18} /> : 'Sign In to Account'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-500 font-medium pt-2">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (setIsRegisterModalOpen) setIsRegisterModalOpen(true);
                      navigate('/');
                    }}
                    className="font-bold text-teal-600 hover:underline"
                  >
                    Register as Student or Client
                  </button>
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
                  <h2 className="text-2xl font-black text-slate-900 leading-tight font-heading">Reset Password</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Enter your registered email address to receive a 6-digit OTP code.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5">Email Address</label>
                    <div className="relative group">
                      <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="name@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all text-sm font-semibold text-slate-800"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setView('login'); setError(''); }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !resetEmail}
                      className="flex-[2] py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:from-slate-200 disabled:to-slate-200 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-teal-600/20"
                    >
                      {loading ? <Spinner className="animate-spin mr-2" size={18} /> : 'Send OTP'}
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
                  <h2 className="text-2xl font-black text-slate-900 leading-tight font-heading">Verify OTP</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    We've sent a 6-digit code to <span className="font-bold text-slate-800">{resetEmail}</span>.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-3 animate-fadeIn">
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5 text-center block">6-Digit OTP Code</label>
                    <input 
                      type="text" 
                      required
                      maxLength="6"
                      placeholder="000000"
                      className="w-full text-center tracking-[0.4em] font-black border border-slate-200 bg-slate-50 rounded-xl py-3 px-4 outline-none focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10 transition-all text-lg text-slate-900"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5">New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-teal-600 focus:bg-white transition-all text-sm font-semibold text-slate-800"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-0.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-teal-600 focus:bg-white transition-all text-sm font-semibold text-slate-800"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setView('forgot-password'); setError(''); }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || otpCode.length !== 6 || !newPassword || !confirmPassword}
                      className="flex-[2] py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:from-slate-200 disabled:to-slate-200 text-white rounded-xl font-bold text-sm flex items-center justify-center transition-all shadow-lg shadow-teal-600/20"
                    >
                      {loading ? <Spinner className="animate-spin mr-2" size={18} /> : 'Reset Password'}
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
                className="text-center space-y-6 flex flex-col items-center py-4"
              >
                <div className="w-16 h-16 bg-teal-50 text-teal-600 border border-teal-200 rounded-2xl flex items-center justify-center shadow-md">
                  <Check size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight font-heading">Password Reset Complete!</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    Your password has been changed successfully. You can now log in with your new credentials.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }} 
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-600/20"
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

