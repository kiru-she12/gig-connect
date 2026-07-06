import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { getLinksByRole } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, Zap, ChevronRight } from 'lucide-react';

/* ── Role label & colour helpers ── */
const ROLE_META = {
  student:       { label: 'Student',        color: 'bg-primary' },
  client:        { label: 'Job Provider',    color: 'bg-[#4E8C7E]' },
  job_provider:  { label: 'Job Provider',    color: 'bg-[#4E8C7E]' },
  admin:         { label: 'Admin',           color: 'bg-primary' },
  manager:       { label: 'Manager',         color: 'bg-[#4E8C7E]' },
  delivery_staff:{ label: 'Delivery Staff',  color: 'bg-[#89D7B7] text-[#1A312C]' },
};

const Avatar = ({ name = '', profilePic }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (profilePic && !imgError) {
    const finalUrl = profilePic.startsWith('http') || profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
    return (
      <img 
        src={finalUrl} 
        alt={name} 
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0 border-2 border-white/20 transition-transform duration-300 hover:scale-105"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white text-[13px] font-black shadow-lg flex-shrink-0 border border-white/10 transition-transform duration-300 hover:scale-105">
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
              <link.icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-light' : ''}`} />
              <span className={`text-[13px] font-semibold flex-1 ${isActive ? 'text-white' : ''}`}>{link.label}</span>
              {isActive && <ChevronRight size={13} className="text-primary-light opacity-70" />}
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
        <div className="leading-none">
          <span className="font-heading font-black text-white text-lg tracking-tight">GigConnect</span>
          <span className="block text-[10px] font-bold text-primary-light uppercase tracking-widest mt-0.5">
            {role === 'delivery_staff' ? 'Delivery Staff Dashboard' : 'UWU Student Hub'}
          </span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
        {/* Section label */}
        <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            {roleMeta.label} Menu
          </p>
          <LinkList links={links} onClose={onClose} handleLinkClick={handleLinkClick} />
        </div>
      </div>

      {/* User card at bottom */}
      <div className="p-3.5 border-t border-white/10 bg-black/15">
        <div className="relative group flex items-center gap-3 px-3 py-3 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 shadow-lg transition-all duration-300 hover:from-white/[0.07] hover:to-white/[0.02] hover:border-white/20 hover:-translate-y-0.5">
          {/* Gentle hover backdrop glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md pointer-events-none" />
          
          <Avatar name={user?.name || ''} profilePic={user?.profile_pic} />
          
          <div className="flex-1 min-w-0 z-10">
            <p className="text-[13px] font-bold text-slate-100 group-hover:text-white transition-colors truncate">
              {user?.name || 'User'}
            </p>
            <span className={`inline-flex items-center text-[9px] font-extrabold text-white px-2 py-0.5 rounded-full mt-1.5 tracking-wider uppercase ${roleMeta.color} shadow-sm`}>
              {roleMeta.label}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            title="Logout"
            className="relative z-10 p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all duration-300 active:scale-95 flex-shrink-0"
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
        style={{ background: 'linear-gradient(160deg, #1A312C 0%, #24443E 50%, #1A312C 100%)' }}
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
            style={{ background: 'linear-gradient(160deg, #1A312C 0%, #24443E 50%, #1A312C 100%)' }}
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
