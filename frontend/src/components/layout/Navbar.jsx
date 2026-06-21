import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, ChevronDown, Search, ArrowRight, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getLinksByRole } from '../../data/navigation';

const Navbar = ({ dashboard = false }) => {
  const { user, logout, isLoginModalOpen, setIsLoginModalOpen, setIsRegisterModalOpen } = useAuth();
  const { notifications, markAllRead, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRegisterDropdown, setShowRegisterDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (e, id) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/' + id);
      return;
    }
    const element = id ? document.getElementById(id.replace('#', '')) : null;
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setShowMobileMenu(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dashboardLinks = getLinksByRole(user?.role);
  const unreadCount = notifications.filter(n => !n.read).length;
  const showScrolledStyle = isScrolled || dashboard || (user !== null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        showScrolledStyle 
          ? 'py-2 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-md' 
          : 'py-5 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between items-center h-10">
          
          {/* Logo Area */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-shrink-0 flex items-center"
          >
            <Link to="/" onClick={(e) => scrollToSection(e, '')} className="flex items-center gap-2.5 group">
              <span className={`font-heading font-black tracking-tight transition-all duration-300 ${
                user?.role === 'student'
                  ? 'text-xl md:text-2xl text-slate-900'
                  : showScrolledStyle ? 'text-xl md:text-2xl text-slate-800' : 'text-2xl md:text-3xl text-white drop-shadow-md'
              }`}>
                GigConnect
              </span>
            </Link>
          </motion.div>

          {/* Centered Navigation Links Removed - Tata uses Right aligned */}
          <div className="flex-1"></div>

          {/* Right Action Area & Navigation */}
          <div className="flex items-center gap-6">
            {!dashboard && (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                  }
                }}
                className="hidden lg:flex items-center space-x-6 mr-4"
              >
                {(user?.role === 'student' ? [
                  { name: 'Home', id: '#home' },
                  { name: 'Communication', to: '/dashboard/student/messages' },
                  { name: 'Find Gigs', to: '/jobs' },
                  { name: 'How It Works', id: '#how-it-works' },
                  { name: 'Contact', email: 'gigconnectsystem@gmail.com' }
                ] : [
                  { name: 'Home', id: '#home' },
                  { name: 'About', id: '#about' },
                  { name: 'Find Gigs', to: '/jobs' },
                  { name: 'Contact', email: 'gigconnectsystem@gmail.com' }
                ]).map((link) => 
                  link.to ? (
                    <Link
                      key={link.name}
                      to={link.to}
                      className={`group relative transition-all duration-300 flex items-center gap-1 ${
                        user?.role === 'student'
                          ? 'text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:text-accent'
                          : showScrolledStyle 
                            ? 'text-sm lg:text-base text-slate-600 hover:text-primary' 
                            : 'text-base lg:text-lg text-white hover:text-white/80 drop-shadow-sm'
                      }`}
                    >
                      {link.name}
                      <span className={`absolute -bottom-1 left-0 w-0 h-[2px] rounded-full transition-all duration-300 group-hover:w-full ${
                        user?.role === 'student' ? 'bg-accent' : showScrolledStyle ? 'bg-primary' : 'bg-white'
                      }`}></span>
                    </Link>
                  ) : (
                    <motion.a 
                      variants={{
                        hidden: { opacity: 0, y: -20 },
                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      key={link.name}
                      href={link.email ? 'mailto:' + link.email : link.id || '/'}
                      onClick={(e) => {
                        if (link.email) return;
                        scrollToSection(e, link.id);
                      }}
                      className={`group relative transition-all duration-300 flex items-center gap-1 ${
                        user?.role === 'student'
                          ? 'text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-900 hover:text-accent'
                          : showScrolledStyle 
                            ? 'text-sm lg:text-base text-slate-600 hover:text-primary' 
                            : 'text-base lg:text-lg text-white hover:text-white/80 drop-shadow-sm'
                      }`}
                    >
                      {link.name}
                      <span className={`absolute -bottom-1 left-0 w-0 h-[2px] rounded-full transition-all duration-300 group-hover:w-full ${
                        user?.role === 'student' ? 'bg-accent' : showScrolledStyle ? 'bg-primary' : 'bg-white'
                      }`}></span>
                    </motion.a>
                  )
                )}
              </motion.div>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-full relative transition-all duration-300 ${
                      user?.role === 'student'
                        ? 'text-slate-800 hover:text-accent hover:bg-slate-100'
                        : showScrolledStyle ? 'text-text-secondary hover:bg-slate-100' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse"></span>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right overflow-hidden"
                        >
                          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                              <p className="text-sm font-bold text-slate-800">Notifications</p>
                              <p className="text-xs text-slate-500">{unreadCount} unread</p>
                            </div>
                            {unreadCount > 0 && (
                              <button 
                                onClick={() => {
                                  markAllRead();
                                }}
                                className="text-xs font-bold text-primary hover:underline"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>

                          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-slate-400 text-xs font-semibold">
                                No notifications found
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div 
                                  key={notif.id}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setShowNotifications(false);
                                    if (user.role === 'admin' || user.role === 'manager') {
                                      navigate('/dashboard/admin/complaints');
                                    }
                                  }}
                                  className={`px-4 py-3 hover:bg-slate-50 transition-all cursor-pointer flex gap-3 items-start ${!notif.read ? 'bg-primary-light/30' : ''}`}
                                >
                                  <span className="text-lg mt-0.5">{notif.icon || '🔵'}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <p className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {notif.title}
                                      </p>
                                      {!notif.read && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 self-center animate-pulse" />
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{notif.time}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 p-1 rounded-full transition-all border ${
                      user?.role === 'student'
                        ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'
                        : showScrolledStyle 
                          ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md' 
                          : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                      user?.role === 'student' ? 'bg-accent' : 'bg-primary'
                    }`}>
                      {user.name[0]}
                    </div>
                    <ChevronDown size={14} className={user?.role === 'student' || showScrolledStyle ? 'text-text-secondary' : 'text-white'} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowUserMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 origin-top-right overflow-hidden"
                        >
                          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                            <span className="inline-block mt-1 text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {user.role === 'client' ? 'Job Provider' : user.role.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="p-1">
                            {!dashboard && (
                              <Link
                                to={
                                  user.role === 'admin' || user.role === 'manager' ? '/dashboard/admin/overview' :
                                  user.role === 'student' ? '/dashboard/student/applications' :
                                  user.role === 'client' ? '/dashboard/client/home' :
                                  user.role === 'delivery_staff' ? '/dashboard/delivery/overview' : '/'
                                }
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                              >
                                <User size={16} />
                                <span>My Dashboard</span>
                              </Link>
                            )}

                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                            >
                              <LogOut size={16} />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                className="hidden md:flex items-center gap-4"
              >
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`px-6 rounded-full font-semibold transition-all duration-300 ${
                    showScrolledStyle 
                      ? 'py-2 text-sm text-slate-600 hover:text-primary bg-slate-100/50 hover:bg-slate-100' 
                      : 'py-2.5 text-base text-white/90 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md'
                  }`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className={`group pl-6 pr-2 rounded-full font-semibold flex items-center gap-3 transition-all duration-300 active:scale-95 ${
                    showScrolledStyle
                      ? 'py-1.5 text-sm bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5'
                      : 'py-2.5 text-base bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-0.5'
                  }`}
                >
                  <span>Sign Up</span>
                  <div className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                    showScrolledStyle 
                      ? 'w-7 h-7 bg-white/20 group-hover:bg-white/30 group-hover:translate-x-1' 
                      : 'w-8 h-8 bg-slate-100 group-hover:bg-slate-200 group-hover:translate-x-1'
                  }`}>
                    <ArrowRight size={14} className={showScrolledStyle ? 'text-white' : 'text-slate-900'} />
                  </div>
                </button>
              </motion.div>
            )}

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                user?.role === 'student'
                  ? 'text-slate-900 hover:bg-slate-100'
                  : showScrolledStyle ? 'text-text-secondary hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-2xl p-6 flex flex-col gap-4"
          >
            <div className="space-y-1">
              {(user?.role === 'student' ? [
                { name: 'Home', id: '#home' },
                { name: 'Communication', to: '/dashboard/student/messages' },
                { name: 'Find Gigs', to: '/jobs' },
                { name: 'How It Works', id: '#how-it-works' },
                { name: 'Contact', email: 'gigconnectsystem@gmail.com' }
              ] : [
                { name: 'Home', id: '#home' },
                { name: 'About', id: '#about' },
                { name: 'Find Gigs', to: '/jobs' },
                { name: 'Contact', email: 'gigconnectsystem@gmail.com' }
              ]).map((item) => 
                item.to ? (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="block px-4 py-3 text-lg font-medium text-text-primary hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a 
                    key={item.name}
                    href={item.email ? 'mailto:' + item.email : item.id}
                    className="block px-4 py-3 text-lg font-medium text-text-primary hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={(e) => {
                      if (item.email) return;
                      scrollToSection(e, item.id);
                    }}
                  >
                    {item.name}
                  </a>
                )
              )}
            </div>
            {!user ? (
              <div className="pt-4 flex flex-col gap-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-3.5 text-center font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl"
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setIsRegisterModalOpen(true); setShowMobileMenu(false); }}
                  className="group w-full py-3 pl-6 pr-3 font-semibold text-white bg-primary rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-between transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98]"
                >
                  <span>Sign Up</span>
                  <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:bg-white/30 group-hover:translate-x-[-2px]">
                    <ArrowRight size={18} className="text-white" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="pt-4 flex flex-col gap-3 border-t border-slate-100">
                <div className="px-4 py-2 bg-slate-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                {!dashboard && (
                  <Link 
                    to={
                      user.role === 'admin' || user.role === 'manager' ? '/dashboard/admin/overview' :
                      user.role === 'student' ? '/dashboard/student/applications' :
                      user.role === 'client' ? '/dashboard/client/home' :
                      user.role === 'delivery_staff' ? '/dashboard/delivery/overview' : '/'
                    }
                    className="w-full py-3 px-4 text-left font-semibold text-slate-700 hover:bg-slate-50 transition-colors rounded-2xl flex items-center gap-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User size={18} />
                    <span>My Dashboard</span>
                  </Link>
                )}
                <button 
                  onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                  className="w-full py-3 px-4 text-left font-semibold text-rose-600 hover:bg-rose-50 transition-colors rounded-2xl flex items-center gap-2"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
