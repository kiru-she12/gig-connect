import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { getLinksByRole } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, ChevronRight } from 'lucide-react';
import logoImage from '../../assets/logo/logo.png';

/* ── Role label & colour helpers ── */
const ROLE_META = {
  student:       { label: 'Student',        color: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' },
  client:        { label: 'Job Provider',    color: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white' },
  job_provider:  { label: 'Job Provider',    color: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white' },
  admin:         { label: 'Admin',           color: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white' },
  manager:       { label: 'Manager',         color: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white' },
  delivery_staff:{ label: 'Delivery Staff',  color: 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-bold' },
};

const Avatar = ({ name = '', profilePic }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (profilePic && !imgError) {
    const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend';
    const finalUrl = profilePic.startsWith('http') || profilePic.startsWith('/') 
      ? profilePic 
      : `${backendBase}/uploads/profile_pics/${profilePic}`;
    return (
      <img 
        src={finalUrl} 
        alt={name} 
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0 border-2 border-teal-500/30 transition-transform duration-300 hover:scale-105"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-[13px] font-black shadow-lg flex-shrink-0 border border-teal-400/20 transition-transform duration-300 hover:scale-105">
      {initials || '?'}
    </div>
  );
};

/* ── Shared link list ── */
const LinkList = ({ links, onClose, handleLinkClick }) => (
  <div className="flex flex-col gap-1">
    {links.map((link) => {
      if (link.to === '#logout') {
        return (
          <button
            key={link.to}
            onClick={(e) => handleLinkClick(e, link)}
            className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 w-full text-left"
          >
            <link.icon size={18} className="flex-shrink-0" />
            <span className="text-[13.5px] font-semibold">{link.label}</span>
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
            `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/20 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <link.icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
              <span className={`text-[13.5px] flex-1 ${isActive ? 'text-white font-semibold' : ''}`}>{link.label}</span>
              {isActive && <ChevronRight size={14} className="text-white/80 opacity-90" />}
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
  const roleMeta = ROLE_META[role] || { label: role, color: 'bg-slate-700 text-white' };

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
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800/80">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800/80">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="font-heading font-black text-white text-lg tracking-tight block leading-tight">GigConnect</span>
          <img 
            src={logoImage} 
            alt="GigConnect Logo" 
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </Link>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-5 space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3.5 mb-2.5 flex items-center justify-between">
            <span>{roleMeta.label} Navigation</span>
          </p>
          <LinkList links={links} onClose={onClose} handleLinkClick={handleLinkClick} />
        </div>
      </div>

      {/* User card at bottom */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div className="relative group flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 shadow-md transition-all duration-300 hover:border-slate-600 hover:bg-slate-800">
          <Avatar name={user?.name || ''} profilePic={user?.profile_pic} />
          
          <div className="flex-1 min-w-0 z-10">
            <p className="text-[13px] font-bold text-slate-100 group-hover:text-white transition-colors truncate">
              {user?.name || 'User'}
            </p>
            <span className={`inline-flex items-center text-[9.5px] font-black px-2 py-0.5 rounded-full mt-1 tracking-wider uppercase ${roleMeta.color} shadow-sm`}>
              {roleMeta.label}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            title="Logout"
            className="relative z-10 p-2 rounded-xl bg-slate-700/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/40 hover:border-rose-500/30 transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 hidden lg:flex flex-col sticky top-0 h-screen z-30 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] flex">
          <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-64 max-w-[80vw] h-full flex flex-col shadow-2xl animate-slideRight">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all z-10"
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

