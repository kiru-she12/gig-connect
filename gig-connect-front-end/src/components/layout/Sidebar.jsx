import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { getLinksByRole } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, Zap, ChevronRight } from 'lucide-react';

/* ── Role label & colour helpers ── */
const ROLE_META = {
  student:       { label: 'Student',        color: 'bg-indigo-500' },
  client:        { label: 'Job Provider',    color: 'bg-emerald-500' },
  job_provider:  { label: 'Job Provider',    color: 'bg-emerald-500' },
  admin:         { label: 'Admin',           color: 'bg-rose-500' },
  manager:       { label: 'Manager',         color: 'bg-amber-500' },
  delivery_staff:{ label: 'Delivery Staff',  color: 'bg-cyan-500' },
};

const Avatar = ({ name = '' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-900/40 flex-shrink-0">
      {initials || '?'}
    </div>
  );
};

/* ── Shared link list ── */
const LinkList = ({ links, onClose, handleLinkClick }) => (
  <div className="flex flex-col gap-0.5">
    {links.map((link) => {
      if (link.to === '#logout') {
        return (
          <button
            key={link.to}
            onClick={(e) => handleLinkClick(e, link)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 w-full text-left"
          >
            <link.icon size={18} className="flex-shrink-0" />
            <span className="text-[13px] font-semibold">{link.label}</span>
          </button>
        );
      }
      return (
        <NavLink
          key={link.to}
          to={link.to}
          onClick={(e) => handleLinkClick(e, link)}
          end={link.to === '/dashboard/student' || link.to === '/dashboard/admin' || link.to === '/dashboard/client'}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <link.icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-300' : ''}`} />
              <span className={`text-[13px] font-semibold flex-1 ${isActive ? 'text-white' : ''}`}>{link.label}</span>
              {isActive && <ChevronRight size={13} className="text-indigo-300 opacity-70" />}
            </>
          )}
        </NavLink>
      );
    })}
  </div>
);

const Sidebar = ({ role, isOpen, onClose }) => {
  const links = getLinksByRole(role);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleMeta = ROLE_META[role] || { label: role, color: 'bg-slate-500' };

  const handleLinkClick = (e, link) => {
    if (link.to === '#logout') {
      e.preventDefault();
      logout();
      navigate('/');
      if (onClose) onClose();
    } else {
      if (onClose) onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  /* ── Sidebar inner content (shared between desktop & mobile) ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Zap size={18} className="text-white" fill="currentColor" />
        </div>
        <div className="leading-none">
          <span className="font-heading font-black text-white text-lg tracking-tight">GigConnect</span>
          <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">UWU Student Hub</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Section label */}
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            {roleMeta.label} Menu
          </p>
          <LinkList links={links} onClose={onClose} handleLinkClick={handleLinkClick} />
        </div>
      </div>

      {/* User card at bottom */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-2xl bg-white/5 border border-white/10">
          <Avatar name={user?.name || ''} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
            <span className={`inline-block text-[9px] font-black text-white px-1.5 py-0.5 rounded-full mt-0.5 ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-all flex-shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="w-60 hidden lg:flex flex-col sticky top-0 h-screen z-30 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #1a1144 50%, #0f0c29 100%)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <div
            className="relative w-64 max-w-[80vw] h-full flex flex-col shadow-2xl animate-slideRight"
            style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #1a1144 50%, #0f0c29 100%)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all z-10"
            >
              <X size={18} />
            </button>

            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
