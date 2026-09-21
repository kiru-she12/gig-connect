import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Envelope, Phone, FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
  const { setIsContactModalOpen, setIsTermsModalOpen, setIsPrivacyModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (target === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else if (target === 'about') {
      if (location.pathname === '/') {
        const el = document.getElementById('about');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 600, behavior: 'smooth' });
        }
      } else {
        navigate('/#about');
      }
    }
  };
  
  return (
    <footer className="bg-black pt-20 pb-10 relative overflow-hidden text-white w-full mt-auto">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#89D7B7]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-heading font-black text-white tracking-tight">GigConnect</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-light">
              Empowering university students to build their careers, gain real-world experience, and connect with top businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li>
                <a 
                  href="/" 
                  onClick={(e) => handleNavClick(e, 'home')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/#about" 
                  onClick={(e) => handleNavClick(e, 'about')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About
                </a>
              </li>
              <li>
                <Link 
                  to="/jobs" 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Find Jobs
                </Link>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => setIsContactModalOpen(true)} 
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-white font-black mb-6 tracking-wide">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li>
                <button 
                  type="button" 
                  onClick={() => setIsPrivacyModalOpen(true)} 
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => setIsTermsModalOpen(true)} 
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsContactModalOpen(true)} 
                  className="hover:text-white transition-colors text-left"
                >
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-6">
            <div>
              <h4 className="text-white font-black mb-6 tracking-wide">Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li className="flex items-center gap-2.5">
                  <Envelope size={16} className="text-[#89D7B7]" />
                  <a href="mailto:gigconnectsystem@gmail.com" className="hover:text-white transition-colors">
                    gigconnectsystem@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone size={16} className="text-[#89D7B7]" />
                  <a href="tel:+94774252261" className="hover:text-white transition-colors">
                    +94 774252261
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="pt-2">
              <div className="flex gap-4">
                <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#89D7B7] transition-all text-slate-400">
                  <FacebookLogo size={18} />
                </a>
                <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#89D7B7] transition-all text-slate-400">
                  <TwitterLogo size={18} />
                </a>
                <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#89D7B7] transition-all text-slate-400">
                  <InstagramLogo size={18} />
                </a>
                <a href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 hover:text-[#89D7B7] transition-all text-slate-400">
                  <LinkedinLogo size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm font-light">
            &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
