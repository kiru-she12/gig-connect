import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Search, X, CheckCheck, Home, Info, Package, Truck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── Notification icon by type ── */
const NotifIcon = ({ type }) => {
  const icons = {
    delivery_request: <Truck size={13} className="text-primary" />,
    application:      <Package size={13} className="text-emerald-500" />,
    info:             <Info size={13} className="text-primary-dark" />,
    alert:            <AlertCircle size={13} className="text-amber-500" />,
  };
  return (
    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
      {icons[type] || <Bell size={13} className="text-slate-400" />}
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f8' }}>
      {/* Dark Sidebar */}
      <Sidebar
        role={user?.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Right column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ── Header Bar ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center gap-3 px-4 lg:px-6">

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Title */}
          <div className="hidden lg:block">
            <p className="font-heading font-black text-slate-800 text-sm leading-none">
              {user?.name?.split(' ')[0]}'s Dashboard
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
              {(user?.role || '').replace('_', ' ')} Portal
            </p>
          </div>



          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Home shortcut */}
            <button
              onClick={() => navigate('/?no_redirect=true')}
              title="Landing Page"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
            >
              <Home size={17} />
            </button>

            {/* ── Bell ── */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-primary transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-white text-[8px] font-black rounded-full ring-2 ring-white flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell size={13} className="text-primary" />
                      <span className="text-sm font-black text-slate-800">Notifications</span>
                    </div>
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <CheckCheck size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-400">All caught up!</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">No notifications yet.</p>
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
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${n.status === 'unread' ? 'bg-primary-light/30' : ''}`}
                        >
                          <NotifIcon type={n.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium mt-1">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                          {n.status === 'unread' && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
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
                      className="text-[10px] font-black text-primary hover:text-primary-dark uppercase tracking-wider block w-full text-center"
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Avatar → Landing Page ── */}
            <button
              onClick={() => navigate('/?no_redirect=true')}
              title="Go to landing page"
              className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 hover:opacity-80 transition-opacity"
            >
              {user?.profile_pic && !avatarError ? (
                <img 
                  src={user.profile_pic.startsWith('http') || user.profile_pic.startsWith('/') ? user.profile_pic : `/${user.profile_pic}`}
                  alt={user?.name || ''} 
                  onError={() => setAvatarError(true)}
                  className="w-8 h-8 rounded-xl object-cover shadow-sm border border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xs font-black shadow-sm">
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-bold text-slate-800">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{(user?.role || '').replace('_', ' ')}</p>
              </div>
            </button>

          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
