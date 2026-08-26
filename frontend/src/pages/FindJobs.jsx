import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Clock, MapPin, DollarSign, ArrowRight, ChevronDown, X, Briefcase, CheckCircle, Package, Truck, User } from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── helpers ── */
const PRODUCT_KEYWORDS = [
  'cake', 'crochet', 'bakery', 'bake', 'craft', 'knit', 'sew', 'tailor', 'food', 'pastry', 'cookie', 'snack', 'meal', 'lunch', 'box', 'parcel', 'package', 'jewelry', 'handmade', 'product', 'deliver', 'item',
  'bag', 'tote', 'canvas', 'paint', 'print', 'drawing', 'sketch', 'shirt', 'clothing', 'dress', 'garment', 'costume', 'outfit', 'cup', 'mug', 'gift', 'art', 'decor', 'hand-paint', 'screen-print', 't-shirt', 'bottle', 'pottery', 'toy', 'woodwork', 'knitting', 'sewing', 'embroidery', 'sweet', 'candle', 'card', 'dessert', 'cupcake', 'cushion', 'pillow', 'mat'
];

const isProductBased = (job) => {
  if (!job) return false;
  if (job.is_product_based === true || job.is_product_based == 1 || job.is_product_based === '1' || job._isProduct) return true;
  const combined = ((job.title || '') + ' ' + (job.description || '') + ' ' + (job.category || '')).toLowerCase();
  return PRODUCT_KEYWORDS.some(kw => combined.includes(kw));
};

const FindJobs = () => {
  const { jobs, applyForJob, refreshJobs } = useJobs();
  const { user, setIsLoginModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState(() => {
    if (location.state && typeof location.state.search === 'string') {
      return location.state.search;
    }
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });

  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (location.state && typeof location.state.category === 'string') {
      return location.state.category;
    }
    const params = new URLSearchParams(location.search);
    return params.get('category') || 'All';
  });

  const [typeFilter, setTypeFilter] = useState(() => {
    if (location.state && typeof location.state.type === 'string') {
      return location.state.type;
    }
    const params = new URLSearchParams(location.search);
    return params.get('type') || '';
  });

  const [minPay, setMinPay] = useState(() => {
    if (location.state && (typeof location.state.minPay === 'string' || typeof location.state.minPay === 'number')) {
      return String(location.state.minPay);
    }
    const params = new URLSearchParams(location.search);
    return params.get('minPay') || '';
  });

  const [maxPay, setMaxPay] = useState(() => {
    if (location.state && (typeof location.state.maxPay === 'string' || typeof location.state.maxPay === 'number')) {
      return String(location.state.maxPay);
    }
    const params = new URLSearchParams(location.search);
    return params.get('maxPay') || '';
  });

  const [skillFilter, setSkillFilter] = useState(() => {
    if (location.state && typeof location.state.skill === 'string') {
      return location.state.skill;
    }
    const params = new URLSearchParams(location.search);
    return params.get('skill') || '';
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    if (location.state && (location.state.type || location.state.minPay || location.state.maxPay || location.state.skill)) {
      return true;
    }
    return false;
  });

  // Student specific applications state
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [deliveryType, setDeliveryType] = useState('self');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [applying, setApplying] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);

  // Fetch student applications if logged in
  const fetchMyApplications = async () => {
    if (!user || user.role !== 'student') return;
    setLoadingApps(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/my_applications.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.applications)) {
          setMyApplications(data.applications);
        }
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    refreshJobs();
    fetchMyApplications();
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'student') {
      if (user.role === 'client') {
        navigate('/dashboard/client/home');
      } else if (user.role === 'admin' || user.role === 'manager') {
        navigate('/dashboard/admin/overview');
      } else if (user.role === 'delivery_staff') {
        navigate('/dashboard/delivery/overview');
      }
    }
  }, [user, navigate]);

  // Handle Apply button click — auto-detect product-based
  const handleApplyClick = (job) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (user.role !== 'student') {
      setWarningMessage(`You are logged in as a ${user.role === 'client' ? 'Job Provider' : user.role}. Only students can apply for jobs.`);
      return;
    }
    const productJob = isProductBased(job);
    setApplyModalJob(job);
    setDeliveryType('self');
    setPickupAddress('');
    setDeliveryAddress('');
    // Store computed flag on job for modal usage
    setApplyModalJob({ ...job, _isProduct: productJob });
  };

  // Submit Application
  const handleConfirmApplication = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;

    const productJob = applyModalJob._isProduct;

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const body = {
        job_ID: applyModalJob.job_ID || applyModalJob.id,
        ...(productJob ? {
          delivery_needed: deliveryType === 'platform' ? 1 : 0
        } : {})
      };

      const applyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/apply_jobs.php`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const applyData = await applyRes.json();

      if (!applyData || applyData.error) {
        alert(applyData?.error || 'Failed to submit application.');
        setApplying(false);
        return;
      }

      alert('Application submitted successfully!' + (applyData.delivery_ID ? ` Delivery tracking ID: ${applyData.delivery_ID}` : ''));
      setApplyModalJob(null);
      fetchMyApplications();
    } catch (err) {
      alert('Failed to process application request.');
    } finally {
      setApplying(false);
    }
  };

  // Filter Jobs (Only future and non-expired active gigs)
  const isJobExpired = (job) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (job.job_date) {
      const jDate = new Date(job.job_date);
      jDate.setHours(0, 0, 0, 0);
      if (jDate < today) return true;
      if (jDate.getTime() === today.getTime() && job.end_time) {
        const nowTime = new Date().toTimeString().slice(0, 5);
        if (job.end_time < nowTime) return true;
      }
    } else if (job.deadline) {
      const dDate = new Date(job.deadline);
      dDate.setHours(0, 0, 0, 0);
      if (dDate < today) return true;
    }
    return false;
  };

  const activeJobs = jobs.filter(job => 
    (job.status === 'Active' || job.status === 'active') && !isJobExpired(job)
  );
  
  // Sort boosted jobs at top first, then by matching skills
  const sortedJobs = [...activeJobs].sort((a, b) => {
    const aBoosted = (a.isBoosted || a.is_boosted == 1) ? 1 : 0;
    const bBoosted = (b.isBoosted || b.is_boosted == 1) ? 1 : 0;
    if (aBoosted !== bBoosted) {
      return bBoosted - aBoosted; // Boosted jobs come first at top
    }

    const searchSkills = skillFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    let scoreA = 0;
    let scoreB = 0;
    if (searchSkills.length > 0) {
      if (a.skills) {
        scoreA = a.skills.filter(s => searchSkills.some(fs => s.toLowerCase().includes(fs))).length;
      }
      if (b.skills) {
        scoreB = b.skills.filter(s => searchSkills.some(fs => s.toLowerCase().includes(fs))).length;
      }
    }
    return scoreB - scoreA;
  });

  const filteredJobs = sortedJobs.filter(job => {
    const matchesSearch = searchTerm.trim() === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || job.category === categoryFilter;
    const matchesType = typeFilter === '' || (job.type || '').toLowerCase().replace('-', '') === typeFilter.toLowerCase().replace('-', '');
    const matchesMin = minPay === '' || parseFloat(job.pay) >= parseFloat(minPay);
    const matchesMax = maxPay === '' || parseFloat(job.pay) <= parseFloat(maxPay);
    
    const searchSkills = skillFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const matchesSkill = searchSkills.length === 0 || 
      (job.skills && job.skills.some(s => 
        searchSkills.some(fs => s.toLowerCase().includes(fs))
      ));

    return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesSkill;
  });

  const categories = ['All', 'Design', 'Data Entry', 'Photography', 'Web Dev', 'Translation', 'Academic & Tutoring', 'Local Services'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <Navbar />

      {/* Hero Banner styled after UI mockup with System Palette (#1A312C dark teal) */}
      <section className="px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="bg-[#1A312C] border border-emerald-900/50 rounded-[2.5rem] py-14 px-6 sm:px-12 relative overflow-hidden shadow-xl text-white">
          
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Floating avatar circles (Left side) */}
          <div className="hidden lg:block absolute left-8 top-10 pointer-events-none">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/30 absolute -bottom-1 -right-1 rounded-br-[18px]" />
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                alt="Student Profile"
                className="w-16 h-16 rounded-full object-cover relative z-10 border-2 border-emerald-400/40 shadow-md"
              />
            </div>
          </div>
          <div className="hidden lg:block absolute left-36 top-16 pointer-events-none">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-teal-500/30 absolute -bottom-1 -right-1" />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                alt="Student Profile"
                className="w-12 h-12 rounded-full object-cover relative z-10 border-2 border-emerald-400/40 shadow-md"
              />
            </div>
          </div>

          {/* Floating avatar circles (Right side) */}
          <div className="hidden lg:block absolute right-36 top-16 pointer-events-none">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-teal-500/30 absolute -bottom-1 -right-1" />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                alt="Student Profile"
                className="w-12 h-12 rounded-full object-cover relative z-10 border-2 border-emerald-400/40 shadow-md"
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-8 top-10 pointer-events-none">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-emerald-500/30 absolute -bottom-1 -right-1" />
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80"
                alt="Student Profile"
                className="w-16 h-16 rounded-full object-cover relative z-10 border-2 border-emerald-400/40 shadow-md"
              />
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-3xl mx-auto text-center relative z-10 space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-tight">
              Let's find you your dream job
            </h1>

            {/* Centered Pill Search Bar */}
            <div className="pt-6">
              <div className="bg-white rounded-full p-2 sm:p-2.5 shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto text-slate-800">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-2 w-full sm:flex-1">
                  <Search className="text-slate-400 shrink-0" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search job title or keyword..."
                    className="w-full bg-transparent outline-none text-slate-800 text-xs font-semibold placeholder:text-slate-400"
                  />
                </div>

                {/* Location / Type Filter */}
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-full border border-slate-200/70 w-full sm:w-auto">
                  <MapPin className="text-slate-400 shrink-0" size={16} />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-transparent outline-none text-slate-700 text-xs font-bold cursor-pointer pr-2"
                  >
                    <option value="">Add location (Any)</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {/* Search Button (Emerald Accent #10B981 / system emerald) */}
                <button
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-full text-xs font-black shadow-md transition-all shrink-0 active:scale-95"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content Layout */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-md space-y-8 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-heading font-black text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                <span>Filters</span>
              </h3>
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setTypeFilter('');
                  setMinPay('');
                  setMaxPay('');
                  setSkillFilter('');
                }}
                className="text-[10px] font-black text-[#4E8C7E] hover:text-[#1A312C] uppercase tracking-wider transition-colors"
              >
                Clear all
              </button>
            </div>

            {/* Filter: Budget Range */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Range (LKR)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Min Pay</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={minPay}
                    onChange={(e) => setMinPay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Max Pay</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={maxPay}
                    onChange={(e) => setMaxPay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Filter: Skill Needed */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills Required</h4>
              <input
                type="text"
                placeholder="e.g. Photoshop, PHP"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-semibold text-slate-700"
              />
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="lg:col-span-3 space-y-6">
          {warningMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-between text-sm font-medium shadow-sm">
              <span>{warningMessage}</span>
              <button onClick={() => setWarningMessage(null)} className="p-1 hover:bg-amber-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 tracking-tight">
                Recommended jobs
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Showing {filteredJobs.length} matching jobs</p>
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Job Cards Grid */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-sm max-w-2xl mx-auto">
              <Briefcase size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Gigs Match Your Search</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Try removing some filters, changing the search query, or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
              {filteredJobs.map((job) => {
                const hasApplied = myApplications.some(app => app.job_ID === job.id) ||
                  (user && user.role === 'student' && job.applications && Array.isArray(job.applications) && job.applications.includes(user.id));
                
                const isBoosted = Boolean(job.isBoosted || job.is_boosted == 1 || job.is_boosted === true || job.is_boosted === '1');
                const isRemote = job.type?.toLowerCase() === 'remote';

                return (
                  <div
                    key={job.id}
                    className={`rounded-[2rem] p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                      isBoosted
                        ? 'border-amber-400 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/60'
                        : 'bg-white border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-opacity ${
                      isBoosted ? 'bg-amber-400 opacity-100' : 'bg-primary opacity-0 group-hover:opacity-100'
                    }`}></div>

                    <div>
                      {/* Top Row: Icon + Featured Badge + Bookmark */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                            {isProductBased(job) ? <Package size={18} /> : <Briefcase size={18} />}
                          </div>
                          {isBoosted && (
                            <div className="bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-300 shadow-sm flex items-center gap-1">
                              <span>⚡</span>
                              <span>FEATURED BOOST</span>
                            </div>
                          )}
                        </div>
                        <button className="text-slate-300 hover:text-rose-500 transition-colors">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>
                      </div>

                      {/* Title & Client */}
                      <div className="space-y-1">
                        <h3 className="font-heading font-black text-base text-slate-800 leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                        <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-400">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-700 font-extrabold">{job.clientName || 'GigConnect Partner'}</span>
                            {job.clientIsVerified && (
                              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 border border-emerald-100">
                                Verified
                              </span>
                            )}
                            {job.provider_rating && (
                              <span className="text-amber-500 font-bold flex items-center gap-0.5 text-[10px]">
                                ⭐ {job.provider_rating}
                              </span>
                            )}
                          </div>
                          {(!isRemote || isProductBased(job)) && job.clientBusinessType && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Type: <span className="font-semibold text-slate-600">{job.clientBusinessType}</span>
                            </span>
                          )}
                          {(!isRemote || isProductBased(job)) && job.clientBusinessRegNo && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Reg No: <span className="font-semibold text-slate-600">{job.clientBusinessRegNo}</span>
                            </span>
                          )}
                          {(!isRemote || isProductBased(job)) && (job.jobAddress || job.clientAddress) && (
                            <span className="text-[10px] text-slate-500 font-medium truncate block">
                              Address: <span className="font-semibold text-slate-600">{job.jobAddress || job.clientAddress}</span>
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5 font-bold">
                            {job.seekers_needed ? `${job.seekers_needed} Seeker${job.seekers_needed > 1 ? 's' : ''} Needed` : '1 Seeker Needed'}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 my-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-purple-100">
                          {job.type}
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                          {job.category}
                        </span>
                        {isProductBased(job) && (
                          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-100">
                            Product
                          </span>
                        )}
                        {isBoosted === 1 && (
                          <span className="bg-primary-light text-primary px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-primary/20">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4">
                        {job.description}
                      </p>

                      {/* Skills Required */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {job.skills.map((skill, idx) => {
                            const searchSkills = skillFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                            const isMatched = searchSkills.some(fs => skill.toLowerCase().includes(fs));
                            return (
                              <span 
                                key={idx} 
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border transition-all ${
                                  isMatched 
                                    ? 'bg-primary/10 text-primary border-primary/30 scale-105 shadow-sm' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200/60'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer Area inside Card */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                      <div>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Est. Budget</p>
                        <p className="text-base font-black text-slate-900">LKR {parseFloat(job.pay).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleApplyClick(job)}
                        disabled={hasApplied}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                          hasApplied
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Application Modal */}
      {applyModalJob && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setApplyModalJob(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col z-10 my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Apply for Job</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[280px] mt-0.5">{applyModalJob.title}</p>
              </div>
              <button 
                onClick={() => setApplyModalJob(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmApplication} className="p-6 space-y-5">
              
              {/* Job Details Summary Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold text-slate-400">Budget / Pay:</span>
                  <span className="font-black text-slate-900">LKR {parseFloat(applyModalJob.payment || applyModalJob.pay || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800">{applyModalJob.category}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold text-slate-400">Location Type:</span>
                  <span className="font-semibold text-slate-800">{applyModalJob.job_type || applyModalJob.type || 'Remote'}</span>
                </div>
                {applyModalJob.clientName && (
                  <div className="flex justify-between text-slate-600">
                    <span className="font-bold text-slate-400">Provider:</span>
                    <span className="font-semibold text-slate-800">{applyModalJob.clientName}</span>
                  </div>
                )}
              </div>

              {/* Delivery Option for Product-based jobs */}
              {isProductBased(applyModalJob) && (
                <div className="space-y-4 bg-emerald-50/60 border border-emerald-200/70 p-4.5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Product Delivery Option
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                    Select how the finished product item will be delivered to the client upon completion:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('self')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        deliveryType === 'self'
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 text-slate-900 shadow-md scale-[1.02]'
                          : 'bg-white/70 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">Self Delivery</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">Hand-deliver directly</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('platform')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        deliveryType === 'platform'
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 text-slate-900 shadow-md scale-[1.02]'
                          : 'bg-white/70 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">Quick Rider Courier</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">GigConnect courier rider</span>
                    </button>
                  </div>

                  {deliveryType === 'platform' ? (
                    <p className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200/80 rounded-xl px-3 py-2 animate-fadeIn">
                      ✓ A GigConnect rider will be assigned once your application is accepted. You can provide pickup &amp; delivery details upon job completion.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600 font-bold bg-white border border-slate-200/80 rounded-xl px-3 py-2 animate-fadeIn">
                      ✓ You will deliver the product yourself. An OTP will be shared upon job completion.
                    </p>
                  )}
                </div>
              )}

              {/* Confirmation Notice */}
              <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <span className="text-base shrink-0">✅</span>
                <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                  By clicking confirm, your official student profile will be submitted directly to the job provider for review.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-2.5 bg-[#1A312C] hover:bg-[#244b41] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Confirm Application →'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <Footer />
    </div>
  );
};

export default FindJobs;
