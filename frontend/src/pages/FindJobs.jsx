import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, MapPin, DollarSign, ArrowRight, Sparkles, ChevronDown, X, Briefcase, CheckCircle, Package, Truck, User } from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── helpers ── */
const PRODUCT_KEYWORDS = ['cake', 'crochet', 'bakery', 'bake', 'craft', 'knit', 'sew', 'tailor', 'food', 'pastry', 'cookie', 'snack', 'meal', 'lunch', 'box', 'parcel', 'package', 'jewelry', 'handmade', 'product', 'deliver', 'item'];

const isProductBased = (job) => {
  if (job.is_product_based === true || job.is_product_based === 1) return true;
  const combined = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
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

    // Validate delivery for product-based jobs
    if (productJob) {
      if (!pickupAddress.trim() || !deliveryAddress.trim()) {
        alert('Please fill in both pickup and delivery addresses.');
        return;
      }
    }

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const body = {
        job_ID: applyModalJob.id,
        ...(productJob ? {
          delivery_preference: deliveryType,
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress
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

  // Filter Jobs
  const activeJobs = jobs.filter(job => job.status === 'Active' || job.status === 'active');
  
  // Sort by skills matching relevance first, then by boosted status
  const sortedJobs = [...activeJobs].sort((a, b) => {
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
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // More matching skills come first
    }
    
    const aBoosted = a.isBoosted || a.is_boosted || 0;
    const bBoosted = b.isBoosted || b.is_boosted || 0;
    return bBoosted - aBoosted;
  });

  const filteredJobs = sortedJobs.filter(job => {
    const matchesSearch = searchTerm.trim() === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || job.category === categoryFilter;
    const matchesType = typeFilter === '' || job.type.toLowerCase().replace('-', '') === typeFilter.toLowerCase().replace('-', '');
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] pt-20">
      <Navbar />

      {/* Banner matching layout in screenshot */}
      <section className="bg-primary text-white py-16 px-6 sm:px-10 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
          {/* Left Text and Search */}
          <div className="flex-1 space-y-8 w-full">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/20 text-[#89D7B7] border border-primary/30 px-3.5 py-1 text-xs font-bold rounded-2xl">
                <Sparkles size={12} className="animate-pulse" />
                Find Your Opportunity
              </span>
              <h1 className="text-4xl sm:text-5xl font-heading font-black tracking-tight leading-none uppercase">
                Find Your Dream <br className="hidden sm:block" />
                <span className="text-[#89D7B7] font-serif italic font-normal">Job Here</span>
              </h1>
            </div>

            {/* Pill Search Bar */}
            <div className="bg-white rounded-2xl md:rounded-full p-2 flex flex-col md:flex-row items-center shadow-2xl border border-slate-800/20 w-full max-w-3xl gap-2">
              <div className="flex items-center gap-3 px-4 py-3 w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200">
                <Search className="text-slate-400 shrink-0" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Job title or keyword..."
                  className="w-full bg-transparent outline-none text-slate-800 text-xs font-bold placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 w-full md:w-1/2">
                <MapPin className="text-slate-400 shrink-0" size={18} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-700 text-xs font-black cursor-pointer"
                >
                  <option value="">Location Type (Any)</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <button
                className="w-full md:w-auto bg-[#1A312C] hover:bg-[#4E8C7E] text-white px-8 py-3.5 rounded-full text-xs font-extrabold shadow-md hover:shadow-lg transition-all shrink-0"
              >
                Search
              </button>
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

            {/* Filter: Job Type */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Type</h4>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'On-site', value: 'On-site' },
                  { label: 'Remote', value: 'Remote' },
                ].map((typeOption) => (
                  <label key={typeOption.value} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={typeFilter === typeOption.value}
                      onChange={() => setTypeFilter(typeFilter === typeOption.value ? '' : typeOption.value)}
                      className="w-4 h-4 rounded text-[#1A312C] focus:ring-[#1A312C] border-slate-300 transition-all cursor-pointer"
                    />
                    <span className="group-hover:text-[#1A312C] transition-colors">{typeOption.label}</span>
                  </label>
                ))}
              </div>
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
                
                const isBoosted = job.isBoosted || job.is_boosted || 0;

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-[2rem] p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                      isBoosted
                        ? 'border-primary/40 bg-gradient-to-br from-white via-primary-light/5 to-primary-light/10 shadow-md'
                        : 'border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Bookmark (heart) */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                          {isProductBased(job) ? <Package size={18} /> : <Briefcase size={18} />}
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
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                          <span>{job.clientName || 'GigConnect Partner'}</span>
                          <span>•</span>
                          <span>5-10 Applicants</span>
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
      {applyModalJob && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setApplyModalJob(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-800">Apply for Gig</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{applyModalJob.title}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApplication} className="space-y-4">
              {/* Job Summary */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                <Briefcase size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  By applying, you commit to fulfilling this job to the best of your ability.
                  {applyModalJob._isProduct && (
                    <span className="block mt-1.5 text-amber-600 font-bold flex items-center gap-1">
                      <Package size={12} className="inline" /> This is a <strong>product-based gig</strong> — delivery is required.
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Section — shown ONLY for product-based jobs */}
              {applyModalJob._isProduct && (
                <div className="p-4 bg-gradient-to-br from-primary-light/50 to-slate-50 border border-primary/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={16} className="text-primary" />
                    <span className="text-xs font-black text-primary-dark uppercase tracking-wider">Delivery Method</span>
                    <span className="text-[10px] font-bold text-rose-500 ml-auto">Required</span>
                  </div>

                  {/* Delivery type selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('self')}
                      className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        deliveryType === 'self'
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <User size={20} />
                      <span>Deliver Myself</span>
                      <span className={`text-[9px] font-normal ${deliveryType === 'self' ? 'text-slate-300' : 'text-slate-400'}`}>Free</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('platform')}
                      className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        deliveryType === 'platform'
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Truck size={20} />
                      <span>Platform Rider</span>
                      <span className={`text-[9px] font-normal ${deliveryType === 'platform' ? 'text-primary-light' : 'text-slate-400'}`}>Staff assigned</span>
                    </button>
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pickup Location</label>
                      <input
                        type="text"
                        placeholder="e.g. UWU Hostel Block A"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Delivery Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Client Office, Badulla"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-medium"
                      />
                    </div>
                  </div>

                  {deliveryType === 'platform' && (
                    <p className="text-[10px] text-primary font-bold bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
                      ✓ A GigConnect rider will be assigned once your application is accepted.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={applying}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {applying ? 'Submitting...' : 'Confirm Application & Send'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default FindJobs;
