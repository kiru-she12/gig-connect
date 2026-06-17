import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, MapPin, DollarSign, ArrowRight, Sparkles, ChevronDown, X, Briefcase, CheckCircle, Package, Truck, User } from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';

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

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('');
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
  
  // Sort Boosted/Featured first
  const sortedJobs = [...activeJobs].sort((a, b) => {
    const aBoosted = a.isBoosted || a.is_boosted || 0;
    const bBoosted = b.isBoosted || b.is_boosted || 0;
    return bBoosted - aBoosted;
  });

  const filteredJobs = sortedJobs.filter(job => {
    const matchesSearch = searchTerm.trim() === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || job.category === categoryFilter;
    const matchesType = typeFilter === '' || job.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesMin = minPay === '' || parseFloat(job.pay) >= parseFloat(minPay);
    const matchesMax = maxPay === '' || parseFloat(job.pay) <= parseFloat(maxPay);
    
    const matchesSkill = skillFilter.trim() === '' || 
      (job.skills && job.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())));

    return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax && matchesSkill;
  });

  const categories = ['All', 'Design', 'Data Entry', 'Photography', 'Web Dev', 'Translation', 'Academic & Tutoring', 'Local Services'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pt-20">
      <Navbar />

      {/* Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-6 sm:px-10 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-1.5 text-xs font-bold rounded-2xl">
            Explore Opportunities
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-black tracking-tight leading-none">
            Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 font-serif italic font-normal">Gig</span>
          </h1>
          <p className="text-slate-300 text-base max-w-xl mx-auto font-light">
            Search and apply for student-friendly jobs around Uva Wellassa University. Filter by category, duration, and pay.
          </p>
        </div>
      </section>

      {/* Search & Category pills Section */}
      <section className="py-6 bg-white border-b border-slate-200 sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-96 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search gigs by title or keywords..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white transition-all text-xs font-medium text-slate-800"
                />
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                  showAdvancedFilters || typeFilter || minPay || maxPay || skillFilter
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-slate-100 mt-4 pt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Job Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="">Any Type</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Skill Needed</label>
                    <input
                      type="text"
                      placeholder="e.g. Photoshop, PHP..."
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white text-xs font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Min Pay (LKR)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPay}
                      onChange={(e) => setMinPay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white text-xs font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Max Pay (LKR)</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={maxPay}
                      onChange={(e) => setMaxPay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/50 focus:bg-white text-xs font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setTypeFilter('');
                      setMinPay('');
                      setMaxPay('');
                      setSkillFilter('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Reset Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Main List */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 flex-1 w-full">
        {warningMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-between text-sm font-medium">
            <span>{warningMessage}</span>
            <button onClick={() => setWarningMessage(null)} className="p-1 hover:bg-amber-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600" />
            <span>Available Opportunities ({filteredJobs.length})</span>
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-sm max-w-2xl mx-auto">
            <Briefcase size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Gigs Match Your Search</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Try removing some filters, changing the search query, or selecting a different category.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredJobs.map((job) => {
              const hasApplied = myApplications.some(app => app.job_ID === job.id) ||
                (user && user.role === 'student' && job.applications && Array.isArray(job.applications) && job.applications.includes(user.id));
              
              const isBoosted = job.isBoosted || job.is_boosted || 0;

              return (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-2xl p-6 md:p-8 border shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                    isBoosted 
                      ? 'border-indigo-200 bg-gradient-to-r from-white via-indigo-50/10 to-indigo-50/20 shadow-md shadow-indigo-100/50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-indigo-600 transition-opacity ${
                    isBoosted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}></div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400">
                      <span>Posted recently</span>
                      <span>•</span>
                      <span>Proposals: 5-10</span>
                      
                      {isBoosted === 1 && (
                        <span className="ml-auto md:ml-0 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-200/55 flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                          Featured
                        </span>
                      )}
                      {isProductBased(job) && (
                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 flex items-center gap-1.5">
                          <Package size={10} />
                          Product Delivery
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-heading font-black text-2xl text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1.5">
                        <span className="text-indigo-600 font-extrabold uppercase tracking-wider">{job.category}</span>
                        <span>•</span>
                        <span>{job.type}</span>
                        <span>•</span>
                        <span>Est. Budget: LKR {parseFloat(job.pay).toLocaleString()}</span>
                        <span>•</span>
                        <span>{job.duration || 'Short Term'}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl line-clamp-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {job.skills && job.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200/70">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 max-w-2xl">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <CheckCircle size={14} />
                        <span>Payment Verified</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <span>★★★★★</span>
                        <span className="text-slate-600 text-[11px] font-medium ml-1">4.9 rating</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Client: <strong>{job.clientName || 'GigConnect Partner'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex-shrink-0">
                    <button
                      onClick={() => handleApplyClick(job)}
                      disabled={hasApplied}
                      className={`w-full md:w-48 py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        hasApplied 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {hasApplied ? (
                        'Application Sent'
                      ) : (
                        <>
                          Apply Now
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
                <Briefcase size={20} className="text-indigo-500 shrink-0 mt-0.5" />
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
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={16} className="text-indigo-600" />
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Delivery Method</span>
                    <span className="text-[10px] font-bold text-rose-500 ml-auto">Required</span>
                  </div>

                  {/* Delivery type selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('self')}
                      className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                        deliveryType === 'self'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
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
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <Truck size={20} />
                      <span>Platform Rider</span>
                      <span className={`text-[9px] font-normal ${deliveryType === 'platform' ? 'text-indigo-200' : 'text-slate-400'}`}>Staff assigned</span>
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-medium"
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {deliveryType === 'platform' && (
                    <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                      ✓ A GigConnect rider will be assigned once your application is accepted.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={applying}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                {applying ? 'Submitting...' : 'Confirm Application & Send'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FindJobs;
