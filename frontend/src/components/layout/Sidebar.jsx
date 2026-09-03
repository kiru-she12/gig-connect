import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { getLinksByRole } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { X, LogOut, ChevronRight } from 'lucide-react';
import logoImage from '../../assets/logo/logo.png';

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
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-5">
        <LinkList links={links} onClose={onClose} handleLinkClick={handleLinkClick} />
      </div>

      {/* Glassmorphic Logout Button at bottom */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70">
        <button
          onClick={handleLogout}
          title="Log Out"
          className="group relative w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-rose-500/15 active:bg-rose-500/25 border border-white/10 hover:border-rose-500/40 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden"
        >
          {/* Subtle gradient shimmer overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 group-hover:border-rose-400/30 group-hover:bg-rose-500/20 text-slate-400 group-hover:text-rose-400 transition-all duration-300 flex items-center justify-center">
            <LogOut size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
          </div>
          <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors tracking-wide">
            Log Out
          </span>
        </button>
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

