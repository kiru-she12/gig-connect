import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black pt-20 pb-10 relative overflow-hidden text-white w-full mt-auto">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#89D7B7]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-heading font-black text-white tracking-tight">GigConnect</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-light">
              Empowering university students to build their careers, gain real-world experience, and connect with top businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/#about" className="hover:text-white transition-colors">Our Heritage</Link></li>
              <li><Link to="/jobs" className="hover:text-white transition-colors">Opportunities</Link></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-white font-black mb-6 tracking-wide">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400 font-light">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="mailto:gigconnectsystem@gmail.com" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
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
