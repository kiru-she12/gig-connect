import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { List, Bell, X, Checks, House, Info, Package, Truck, WarningCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

/* ── Notification icon by type ── */
const NotifIcon = ({ type }) => {
  const icons = {
    delivery_request: <Truck size={14} className="text-teal-600" />,
    application:      <Package size={14} className="text-emerald-600" />,
    info:             <Info size={14} className="text-slate-600" />,
    alert:            <WarningCircle size={14} className="text-amber-500" />,
  };
  return (
    <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
      {icons[type] || <Bell size={14} className="text-teal-600" />}
    </div>
  );
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [avatarError, setAvatarError]     = useState(false);
  const notifRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Fetch notifications on mount */
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/get_notifications.php`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => n.status === 'unread').length);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleBellClick = () => {
    setShowNotifs(v => !v);
    setUnreadCount(0);
  };

  const initials = (user?.name || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const formatRole = (role) => {
    if (!role) return '';
    const r = role.toLowerCase();
    if (r === 'client' || r === 'job_provider') return 'Job Provider';
    if (r === 'delivery_staff') return 'Delivery Staff';
    return r.replace('_', ' ');
  };

  return (
    <div className="flex min-h-screen bg-slate-50/80 font-sans">
      {/* Sidebar */}
      <Sidebar
        role={user?.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Right Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">

          {/* Left Area: Mobile hamburger & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
            >
              <List size={20} />
            </button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <p className="font-heading font-extrabold text-slate-900 text-sm leading-tight">
                  Welcome back, {user?.name?.split(' ')[0]}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-medium capitalize">
                {formatRole(user?.role)} Control Center
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Home shortcut */}
            <button
              onClick={() => navigate('/?no_redirect=true')}
              title="Return to Landing Page"
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition-all border border-transparent hover:border-slate-200 active:scale-95"
            >
              <House size={18} />
            </button>

            {/* Bell Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-teal-600 transition-all border border-transparent hover:border-slate-200 active:scale-95"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-4 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-50 animate-fadeIn">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-sm font-bold text-slate-800">Notifications</span>
                    </div>
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center px-4">
                        <Checks size={32} className="mx-auto text-teal-500/40 mb-2" />
                        <p className="text-xs font-bold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No new notifications at the moment.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.notification_ID}
                          onClick={() => {
                            setShowNotifs(false);
                            if (n.target_url) {
                              navigate(n.target_url);
                            } else if (user?.role === 'client' || user?.role === 'job_provider') {
                              navigate('/dashboard/client/notifications');
                            } else if (user?.role === 'student') {
                              navigate('/dashboard/student/notifications');
                            }
                          }}
                          className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${n.status === 'unread' ? 'bg-teal-50/40' : ''}`}
                        >
                          <NotifIcon type={n.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-slate-800 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                          {n.status === 'unread' && (
                            <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 text-center">
                    <button
                      onClick={() => {
                        setShowNotifs(false);
                        if (user?.role === 'student') {
                          navigate('/dashboard/student/notifications');
                        } else if (user?.role === 'client' || user?.role === 'job_provider') {
                          navigate('/dashboard/client/notifications');
                        } else if (user?.role === 'admin' || user?.role === 'manager') {
                          navigate('/dashboard/admin/notifications');
                        } else if (user?.role === 'delivery_staff') {
                          navigate('/dashboard/delivery/notifications');
                        } else {
                          navigate('/dashboard/student/notifications');
                        }
                      }}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider block w-full text-center py-0.5"
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <button
              onClick={() => navigate('/?no_redirect=true')}
              title="View Profile"
              className="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200 hover:opacity-90 transition-opacity"
            >
              {user?.profile_pic && !avatarError ? (
                <img 
                  src={user.profile_pic.startsWith('http') || user.profile_pic.startsWith('/') 
                    ? user.profile_pic 
                    : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/uploads/profile_pics/${user.profile_pic}`}
                  alt={user?.name || ''} 
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-xl object-cover shadow-sm border border-teal-500/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white text-xs font-black shadow-sm border border-slate-700">
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-extrabold text-slate-900">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-[10px] font-semibold text-slate-400 capitalize">{formatRole(user?.role)}</p>
              </div>
            </button>

          </div>
        </header>

        {/* Main Body View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

