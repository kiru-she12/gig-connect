import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import JobCard from '../../components/shared/JobCard';
import ChatTab from '../../components/shared/ChatTab';
import AnalyticsTab from './AnalyticsTab';
import { 
  TrendingUp, Briefcase, DollarSign, Star, Search, Clock, 
  CheckCircle2, MessageSquare, Truck, Settings, Bell, CheckCircle,
  AlertTriangle, Shield, Check, X, Award, ChevronRight, Send, ArrowRight,
  List, LogOut, Lock, User, PlusCircle, RefreshCw, Eye, Sparkles, MapPin
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { applyForJob } = useJobs();
  const location = useLocation();
  const navigate = useNavigate();

  // Core API State
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsMetadata, setRecsMetadata] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Application Modal state
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [isDeliveryJob, setIsDeliveryJob] = useState(false);
  const [deliveryType, setDeliveryType] = useState('self');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [applying, setApplying] = useState(false);

  // Warning Timer states
  const [timeLeft, setTimeLeft] = useState(25);
  const [timerActive, setTimerActive] = useState(true);
  const [timerAlertTriggered, setTimerAlertTriggered] = useState(false);

  // Fetch all data from real backend endpoints
  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Profile
      const profileRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/get_profile.php`, { headers });
      const profileData = await profileRes.json();
      
      // 2. Fetch Applications
      const appsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/my_applications.php`, { headers });
      const appsData = await appsRes.json();
      
      // 3. Fetch Recommendations
      const recsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/recommendations.php`, { 
        method: 'POST', 
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const recsData = await recsRes.json();
      
      // 4. Fetch All Jobs
      const jobsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_jobs.php`);
      const jobsData = await jobsRes.json();
      
      // 5. Fetch Notifications
      const notifsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/get_notifications.php`, { headers });
      const notifsData = await notifsRes.json();

      // 6. Fetch Deliveries
      const deliveryRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/get_deliveries.php`, { headers });
      const deliveryData = await deliveryRes.json();

      // 7. Fetch Reviews (Received & Given)
      let recReviews = [];
      let givReviews = [];
      if (profileData?.profile?.user_ID) {
        const recRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/get_reviews.php?user_ID=${profileData.profile.user_ID}&type=received`);
        const recData = await recRes.json();
        if (recData.success) recReviews = recData.reviews;

        const givRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/get_reviews.php?user_ID=${profileData.profile.user_ID}&type=given`);
        const givData = await givRes.json();
        if (givData.success) givReviews = givData.reviews;
      }

      if (profileData?.success) setProfile(profileData.profile);
      if (appsData?.success) setApplications(appsData.applications);
      if (recsData?.success) {
        setRecommendations(recsData.recommendations);
        setRecsMetadata(recsData.meta || null);
      }
      if (jobsData?.success) setAllJobs(jobsData.jobs);
      if (notifsData?.success) setNotifications(notifsData.notifications);
      if (deliveryData?.success) setDeliveries(deliveryData.deliveries);
      setReceivedReviews(recReviews);
      setGivenReviews(givReviews);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle click on job card "Apply" button
  const handleApplyClick = (job) => {
    setApplyModalJob(job);
    setIsDeliveryJob(false);
    setDeliveryType('self');
    setPickupAddress('');
    setDeliveryAddress('');
  };

  // Submit job application along with delivery details if enabled
  const handleConfirmApplication = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. Submit Application
      const applyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/apply_jobs.php`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ job_ID: applyModalJob.id })
      });
      const applyData = await applyRes.json();

      if (!applyData || applyData.error) {
        alert(applyData?.error || 'Failed to submit application.');
        setApplying(false);
        return;
      }

      // 2. If it is a product delivery job, create delivery record
      if (isDeliveryJob) {
        const deliveryRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/create_delivery.php`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            job_ID: applyModalJob.id,
            delivery_type: deliveryType,
            pickup_address: pickupAddress,
            delivery_address: deliveryAddress
          })
        });
        const deliveryData = await deliveryRes.json();
        if (deliveryData.error) {
          alert(`Application submitted but delivery setup failed: ${deliveryData.error}`);
        } else {
          alert('Application and Delivery setup submitted successfully!');
        }
      } else {
        alert('Application submitted successfully!');
      }

      setApplyModalJob(null);
      fetchDashboardData(true);
    } catch (err) {
      alert('Failed to process application request.');
    } finally {
      setApplying(false);
    }
  };

  // Find accepted applications that are not completed
  const activeApps = applications.filter(app => 
    (app.status === 'accepted' || app.status === 'Accepted') && 
    (app.job_status !== 'completed' && app.job_status !== 'closed')
  );

  const triggerGracePeriodAlert = async (app) => {
    const jobTitle = app.job_title || 'Active Gig';
    
    // 1. Alert user with SMS simulated toast
    alert(`[SMS Sent to ${profile?.phone || user?.phone || '+94771234567'}]: GigConnect Alert: You have missed the completion deadline for "${jobTitle}". Please complete it immediately to avoid penalties.`);
    
    // 2. Post to complaints table in backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/complaints.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create',
          complainer: 'System On-Site Scheduler (Alert)',
          about: profile?.email || user?.email,
          reason: 'On-Site Completion Timeout',
          text: `Student ${profile?.name || user?.name} (${profile?.email || user?.email}) went to the scheduled on-site job "${jobTitle}" but did not click "Job Completed" within the timeframe. SMS reminder sent to student. Escalated alert to admin/manager dashboard.`
        })
      });
      setTimerAlertTriggered(true);
    } catch (err) {
      console.error('Failed to create system alert:', err);
    }
  };

  const handleMarkAsComplete = async (appId) => {
    setTimerActive(false);
    try {
      const token = localStorage.getItem('token');
      const app = applications.find(a => a.application_ID === appId);
      if (!app) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_ID: app.job_ID,
          action: 'deliver'
        })
      });
      
      alert('Great work! Job marked as completed.');
      fetchDashboardData(true);
    } catch (err) {
      console.error('Error marking complete:', err);
      alert('Job marked as completed.');
      fetchDashboardData(true);
    }
  };

  useEffect(() => {
    if (activeApps.length === 0 || !timerActive || timerAlertTriggered) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          triggerGracePeriodAlert(activeApps[0]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeApps.length, timerActive, timerAlertTriggered]);

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium animate-pulse">Loading dashboard portal...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">


      {/* Manual Refresh Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <Routes>
        <Route path="" element={
          <AnalyticsTab
            profile={profile}
            applications={applications}
            receivedReviews={receivedReviews}
          />
        } />
        <Route path="analytics" element={
          <AnalyticsTab
            profile={profile}
            applications={applications}
            receivedReviews={receivedReviews}
          />
        } />
        <Route path="applications" element={
          <ApplicationsTab 
            applications={applications}
            fetchDashboardData={fetchDashboardData}
          />
        } />
        <Route path="past-history" element={
          <PastHistoryTab 
            applications={applications}
            profile={profile}
            fetchDashboardData={fetchDashboardData}
          />
        } />
        <Route path="delivery" element={
          <DeliveryTab 
            profile={profile}
            deliveries={deliveries}
            fetchDashboardData={fetchDashboardData}
          />
        } />
        <Route path="messages" element={
          <MessagesTab 
            profile={profile}
          />
        } />
        <Route path="notifications" element={
          <NotificationsTab 
            notifications={notifications}
          />
        } />
        <Route path="reviews" element={
          <ReviewsTab 
            profile={profile}
            receivedReviews={receivedReviews}
            givenReviews={givenReviews}
          />
        } />
        <Route path="settings" element={
          <SettingsTab 
            profile={profile}
            fetchDashboardData={fetchDashboardData}
          />
        } />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>

      {/* Application and Delivery Setup Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setApplyModalJob(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn space-y-5 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-800">Apply for Job</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{applyModalJob.title}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApplication} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  By applying, you agree to do your best to fulfill the job requirements. Please check if this gig involves delivery of physical products.
                </div>
              </div>

              {/* Delivery Toggle Checkbox */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-800">Product-Based Delivery Gig?</label>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Check this if you need to transport/deliver a product</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDeliveryJob}
                  onChange={(e) => setIsDeliveryJob(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              {/* Delivery Sub-Form */}
              {isDeliveryJob && (
                <div className="p-4 bg-primary/[0.02] border border-primary/10 rounded-2xl space-y-4 animate-slideDown">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Delivery Handler</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('self')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                          deliveryType === 'self'
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <User size={16} />
                        <span>Deliver Myself</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('platform')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                          deliveryType === 'platform'
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Truck size={16} />
                        <span>Rider Staff (Platform)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Location</label>
                      <input
                        type="text"
                        placeholder="e.g. UWU Library Canteen"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        required={isDeliveryJob}
                        className="input-field text-xs py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Delivery Destination</label>
                      <input
                        type="text"
                        placeholder="e.g. Hostel block C"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required={isDeliveryJob}
                        className="input-field text-xs py-2.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={applying}
                className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                {applying ? 'Submitting Application...' : 'Confirm Application & Send'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

/* ==========================================================================
   SUB-PAGES & TAB COMPONENTS
   ========================================================================== */

/* 1. HOME TAB (CONSOLIDATED DISCOVERY HUB) */
const HomeTab = ({ profile, applications, recommendations, allJobs, notifications, onApply }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculations for stats
  const activeAppsCount = applications.filter(app => 
    app.status === 'applied' || app.status === 'shortlisted' || app.status === 'accepted'
  ).length;

  const completedCount = applications.filter(app => 
    app.status === 'Completed' || app.status === 'completed' || app.job_status === 'completed'
  ).length;

  const unreadNotifsCount = notifications.filter(n => n.status === 'unread' || n.status === 'pending').length;
  const ratingVal = parseFloat(profile?.student_details?.rating || 0);

  // Filter jobs dynamically
  const activeJobs = allJobs.filter(job => job.status === 'active');
  
  // Sort Boosted jobs first
  const sortedJobs = [...activeJobs].sort((a, b) => b.is_boosted - a.is_boosted);

  const filteredJobs = sortedJobs.filter(job => {
    const matchesSearch = searchTerm.trim() === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (job.skills && job.skills.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === '' || job.category === categoryFilter;
    const matchesType = typeFilter === '' || job.job_type === typeFilter;
    const matchesMin = minPay === '' || parseFloat(job.payment) >= parseFloat(minPay);
    const matchesMax = maxPay === '' || parseFloat(job.payment) <= parseFloat(maxPay);

    return matchesSearch && matchesCategory && matchesType && matchesMin && matchesMax;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-primary-dark to-slate-900 text-white p-8 md:p-10 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">
              Welcome back, {profile?.name ? profile.name.split(' ')[0] : 'Student'}! 👋
            </h1>
            <p className="text-primary-light/80 mt-1.5 text-sm md:text-base font-medium">
              Here's what's happening with your gigs today.
            </p>
          </div>
          <span className="badge bg-white/10 text-white border border-white/20 px-4 py-2 text-xs font-bold rounded-2xl backdrop-blur-md">
            Student Account
          </span>
        </div>

        {/* Welcome Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          {[
            { label: 'Active Apps', value: activeAppsCount, color: 'text-emerald-300' },
            { label: 'Completed Gigs', value: completedCount, color: 'text-emerald-300' },
            { 
              label: 'Rating', 
              value: ratingVal === 0 ? (
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">New</span>
              ) : (
                <span className="flex items-center gap-1">
                  {ratingVal.toFixed(1)} <Star size={14} className="fill-amber-300 text-amber-300 inline" />
                </span>
              ),
              color: 'text-amber-300' 
            },
            { label: 'Unread Notifications', value: unreadNotifsCount, color: 'text-rose-300' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <span className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-xl md:text-2xl font-heading font-black ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery, Search & Advanced Filter Section */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search size={18} className="text-primary" /> Discover & Browse Jobs
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search jobs by title or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm font-medium"
            />
          </div>
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm font-bold cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Design">Design</option>
              <option value="Data Entry">Data Entry</option>
              <option value="Photography">Photography</option>
              <option value="Web Dev">Web Dev</option>
              <option value="Translation">Translation</option>
              <option value="Academic & Tutoring">Academic & Tutoring</option>
              <option value="Local Services">Local Services</option>
            </select>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 animate-slideDown">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Job Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">Any Type</option>
                <option value="onsite">Onsite</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Min Pay (LKR)</label>
              <input
                type="number"
                placeholder="0"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Max Pay (LKR)</label>
              <input
                type="number"
                placeholder="Any"
                value={maxPay}
                onChange={(e) => setMaxPay(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* Recommended For You Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-black text-slate-800 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500 fill-amber-500 animate-pulse" /> Personal Recommendations
        </h2>

        {!profile?.student_details?.skills ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
            <p className="font-semibold text-sm">Add your skills in Profile Settings to get personalized recommendations</p>
            <Link to="/dashboard/student/settings" className="btn-primary inline-flex items-center gap-2 mt-3 text-xs py-2 px-4">
              Go to Settings <ChevronRight size={14} />
            </Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs">
            No recommendations matching your skills found. Try adding more skills in settings.
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
            {recommendations.slice(0, 8).map((job) => {
              const formattedJob = {
                id: job.job_ID,
                title: job.title,
                category: job.category || 'General',
                type: job.job_type,
                clientName: job.provider_name || 'GigConnect Partner',
                clientEmail: job.provider_email || '',
                skills: job.skills ? job.skills.split(', ') : [],
                pay: job.payment,
                duration: job.job_date ? `${job.job_date} @ ${job.start_time} - ${job.end_time}` : 'Short Term',
                description: job.description,
                job_date: job.job_date || null,
                start_time: job.start_time || null,
                end_time: job.end_time || null
              };
              return (
                <div key={job.job_ID} className="min-w-[280px] md:min-w-[350px] max-w-[400px] shrink-0">
                  <JobCard 
                    job={formattedJob}
                    onApply={() => onApply(formattedJob)}
                    applied={applications.some(a => a.job_ID === job.job_ID)}
                    matchScore={job.match_score}
                    isRecommended={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* General Opportunities Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-black text-slate-800">Browse Available Opportunities</h2>
        
        {filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500">
            <Briefcase size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-bold">No opportunities found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const formattedJob = {
                id: job.job_ID,
                title: job.title,
                category: job.category || 'General',
                type: job.job_type,
                clientName: job.provider_name || 'GigConnect Partner',
                clientEmail: job.provider_email || '',
                skills: job.skills ? job.skills.split(', ') : [],
                pay: job.payment,
                duration: job.job_date ? `${job.job_date} @ ${job.start_time} - ${job.end_time}` : 'Short Term',
                description: job.description,
                job_date: job.job_date || null,
                start_time: job.start_time || null,
                end_time: job.end_time || null
              };
              return (
                <JobCard 
                  key={job.job_ID}
                  job={formattedJob}
                  onApply={() => onApply(formattedJob)}
                  applied={applications.some(a => a.job_ID === job.job_ID)}
                  isRecommended={job.is_boosted == 1}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
        <h2 className="text-xl font-heading font-black text-slate-800 text-center mb-8">How GigConnect Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Create your profile', desc: 'Register with UWU email, add your skills and availability.', icon: User, color: 'bg-primary-light text-primary' },
            { step: '2', title: 'Get matched', desc: 'Our smart system recommends jobs based on your skills and ratings.', icon: Award, color: 'bg-primary-light text-primary' },
            { step: '3', title: 'Apply & get hired', desc: 'Apply with one click, communicate with clients securely.', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
            { step: '4', title: 'Get paid & rated', desc: 'Complete the job, receive payment, and build your rating.', icon: DollarSign, color: 'bg-amber-100 text-amber-700' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center font-bold text-lg mb-4`}>
                <item.icon size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-800 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* 2. APPLICATIONS TAB */
const ApplicationsTab = ({ applications, fetchDashboardData }) => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredApps = applications.filter((app) => {
    if (activeTab === 'All') return true;
    return app.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">My Applications</h1>
        <p className="text-text-secondary mt-1">Track and monitor your application stages.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto scrollbar-none">
        {['All', 'Applied', 'Shortlisted', 'Accepted', 'Rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-secondary hover:text-primary/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredApps.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <Briefcase size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-lg">No Applications</h3>
          <p className="text-xs text-slate-400 mt-1">You don't have any applications under this status tab.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Job Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const statusColors = {
                    'applied': 'bg-primary-light text-primary border border-primary/20',
                    'shortlisted': 'bg-amber-100 text-amber-700 border border-amber-200',
                    'accepted': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                    'rejected': 'bg-rose-100 text-rose-700 border border-rose-200'
                  };
                  return (
                    <tr key={app.application_ID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 text-sm">{app.job_title}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{app.client_name || 'Partner Client'}</td>
                      <td className="px-6 py-4 font-black text-slate-800 text-sm">LKR {parseFloat(app.job_payment).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${statusColors[app.status.toLowerCase()] || 'bg-slate-100 text-slate-700'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                        {new Date(app.applied_date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* 3. PAST HISTORY TAB */
const PastHistoryTab = ({ applications, profile, fetchDashboardData }) => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Completed apps filter
  const completedJobs = applications.filter((app) => 
    app.status.toLowerCase() === 'completed' || app.job_status === 'completed'
  );

  const totalEarned = completedJobs.reduce((sum, app) => sum + parseFloat(app.job_payment), 0);
  const averageRating = parseFloat(profile?.student_details?.rating || 0);

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setRatingScore(5);
    setReviewText('');
  };

  const handleCloseReview = () => {
    setSelectedApp(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/submit_review.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: selectedApp.job_ID,
          given_to: selectedApp.client_user_ID,
          score: ratingScore,
          review: reviewText
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Review submitted successfully!');
        handleCloseReview();
        fetchDashboardData(true);
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Past Job History</h1>
        <p className="text-text-secondary mt-1">Review your completed tasks and achievements.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Jobs Completed', value: completedJobs.length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Earnings', value: `LKR ${totalEarned.toLocaleString()}`, icon: DollarSign, color: 'bg-primary-light text-primary' },
          { 
            label: 'Average Client Rating', 
            value: averageRating === 0 ? 'New' : `${averageRating.toFixed(1)} Stars`, 
            icon: Star, 
            color: 'bg-amber-50 text-amber-600' 
          }
        ].map((stat, i) => (
          <div key={i} className="card p-6 flex items-center gap-4 bg-white border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-heading font-black text-slate-800 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Completed Jobs Table */}
      {completedJobs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <Clock size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-lg">No Completed Jobs</h3>
          <p className="text-xs text-slate-400 mt-1">Your past job history will appear here once you finish your first gig!</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Job Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedJobs.map((app) => (
                  <tr key={app.application_ID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{app.job_title}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{app.client_name || 'Partner Client'}</td>
                    <td className="px-6 py-4 font-black text-slate-800 text-sm">LKR {parseFloat(app.job_payment).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                      {new Date(app.applied_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all"
                      >
                        Leave a review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseReview} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-bold text-slate-800">Leave a Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">For {selectedApp.client_name}</p>
              </div>
              <button onClick={handleCloseReview} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rating Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="text-amber-400 transition-all hover:scale-110"
                    >
                      <Star size={28} className={star <= ratingScore ? 'fill-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Review Message</label>
                <textarea
                  className="input-field h-24 text-sm py-2 resize-none"
                  placeholder="Describe your experience working with this client..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-md"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* 4. DELIVERIES TAB */
const DeliveryTab = ({ profile, deliveries, fetchDashboardData }) => {
  const [updating, setUpdating] = useState(false);

  const handleUpdateDeliveryStatus = async (delivery_ID, action) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_ID, action })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Delivery marked as ${action === 'pickup' ? 'Picked Up' : 'Delivered'}!`);
        fetchDashboardData(true);
      } else {
        alert(data.error || 'Failed to update delivery status.');
      }
    } catch (err) {
      alert('Error communicating with backend.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800 flex items-center gap-2">
          <Truck size={28} className="text-primary" /> On-Campus Deliveries
        </h1>
        <p className="text-text-secondary mt-1">Track your product-based delivery gigs and assignments.</p>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 shadow-sm max-w-2xl mx-auto">
          <Truck size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-lg text-slate-700">No Product Deliveries Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            This section shows deliveries for <strong>product-based gigs</strong> only — like cakes, crochet, crafts, or physical goods. When you apply for such a job, you'll choose to deliver yourself or request a platform rider.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveries.map((del) => {
            const isSelf = del.delivery_type === 'self';
            return (
              <div key={del.delivery_ID} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-md">
                      {del.delivery_ID}
                    </span>
                    <h3 className="font-bold text-slate-800 text-base mt-2">{del.job_title}</h3>
                    <span className={`badge ${
                      del.status === 'delivered'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      del.status === 'picked_up'  ? 'bg-primary-light text-primary border border-primary/20' :
                      del.status === 'assigned'   ? 'bg-primary-light text-primary border border-primary/20' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    } text-xs font-bold uppercase px-3 py-1 rounded-full`}>
                      {del.status === 'pending'   ? '🕐 Awaiting Pickup'
                      : del.status === 'assigned'  ? '🚴 Rider Assigned'
                      : del.status === 'picked_up' ? '📦 Picked Up'
                      : '✅ Delivered'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pl-2 text-xs py-3 border-t border-b border-slate-50">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Pickup Address</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{del.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Delivery Destination</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{del.delivery_address}</p>
                  </div>
                </div>

                <div className="pl-2 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Delivery Mode:</span>
                    <span className="font-bold text-slate-700 capitalize">{del.delivery_type === 'self' ? 'Self Delivery (Student)' : 'Platform Rider'}</span>
                  </div>

                  {del.delivery_type === 'platform' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Rider Staff:</span>
                      <span className="font-bold text-slate-700">{del.delivery_staff_name || 'Awaiting Admin Assignment'}</span>
                    </div>
                  )}

                  {del.distance && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">Distance:</span>
                      <span className="font-bold text-slate-700">{parseFloat(del.distance).toFixed(1)} km</span>
                    </div>
                  )}

                  {del.otp && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">OTP Code: {del.otp}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Share with Rider to confirm delivery completion</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Self Delivery Actions */}
                {isSelf && del.status !== 'delivered' && (
                  <div className="pt-2 pl-2">
                    {del.status === 'pending' || del.status === 'assigned' ? (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(del.delivery_ID, 'pickup')}
                        disabled={updating}
                        className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold shadow"
                      >
                        Mark as Picked Up
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(del.delivery_ID, 'deliver')}
                        disabled={updating}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* 5. MESSAGES TAB */
const MessagesTab = ({ profile }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [systemWarning, setSystemWarning] = useState('');
  
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_conversations.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async (convId, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_messages.php?conversation_id=${convId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError('');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.conversation_id);

      // Poll messages every 3 seconds
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        fetchMessages(activeConv.conversation_id, true);
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    setSending(true);
    setSystemWarning('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/send_message.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: activeConv.conversation_id,
          receiver_id: activeConv.partner_user_ID,
          content: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(activeConv.conversation_id, true);
        if (data.message && data.message.flagged == 1) {
          setSystemWarning(data.message.flagged_reason || 'Warning: Potential off-platform communication detected.');
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Connection error. Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn h-[650px] flex flex-col">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Messages</h1>
        <p className="text-text-secondary mt-1">Chat and align details securely with matched clients.</p>
      </div>

      {/* Safety Banner */}
      <div className="bg-primary border border-primary-dark/30 text-slate-100 p-4 rounded-2xl flex items-start gap-3 shadow-md">
        <Shield size={20} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Important Message Safety Guidelines</p>
          <p className="text-slate-400">
            Messages are monitored by admin for your safety. Please keep all communication and payment transactions strictly on the platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="md:col-span-4 bg-white border border-slate-100 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto shadow-sm">
          <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest px-1">Inbox Conversations</h3>
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => { setActiveConv(conv); setError(''); setSystemWarning(''); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    activeConv?.conversation_id === conv.conversation_id
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeConv?.conversation_id === conv.conversation_id ? 'text-emerald-400' : 'text-primary'}`}>
                    {conv.job_title}
                  </span>
                  <div>
                    <p className="text-xs font-bold">{conv.partner_name}</p>
                    <p className="text-[10px] opacity-75 mt-0.5 truncate">{conv.last_message || 'No messages yet'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-4">
              <MessageSquare size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-bold">No Messages Yet</p>
              <p className="text-[10px] mt-1">Messages with clients will appear here once you're shortlisted for a job.</p>
            </div>
          )}
        </div>

        {/* Messaging Box */}
        <div className="md:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between overflow-hidden shadow-sm">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{activeConv.partner_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Job: {activeConv.job_title}</p>
                </div>
              </div>

              {/* Warnings */}
              {systemWarning && (
                <div className="mx-2 mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{systemWarning}</span>
                </div>
              )}

              {error && (
                <div className="mx-2 mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium shrink-0 animate-fadeIn">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Messages Viewport */}
              <div className="flex-1 overflow-y-auto my-4 p-4 bg-slate-50/50 rounded-2xl space-y-4">
                {loading ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading messages...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_ID === profile?.user_ID;
                    return (
                      <div key={i} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        {msg.flagged == 1 && (
                          <span className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle size={10} /> Flagged by System
                          </span>
                        )}
                        <span className="text-[8px] text-slate-400 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-slate-400 py-12">No messages. Type below to start the conversation!</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your secure message..."
                  disabled={sending}
                  className="flex-1 bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare size={48} className="mb-3 opacity-25" />
              <p className="font-bold text-sm">Select a Conversation</p>
              <p className="text-xs max-w-xs mt-1 font-medium">Choose a matched thread on the left side panel to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* 6. NOTIFICATIONS TAB */
const NotificationsTab = ({ notifications }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Notifications</h1>
        <p className="text-text-secondary mt-1">Stay updated with messages, offers, and task assignments.</p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <Bell size={48} className="mx-auto mb-4 text-slate-300 animate-wiggle" />
          <h3 className="font-bold text-lg">No Notifications</h3>
          <p className="text-xs text-slate-400 mt-1">You are all caught up!</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div key={notif.notification_ID} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Bell size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-700 font-medium">{notif.message}</p>
                <div className="flex items-center gap-2">
                  <span className="badge bg-slate-100 text-slate-600 text-[10px] capitalize">
                    {notif.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* 7. REVIEWS TAB (RECEIVED & GIVEN BOTH INCLUDED) */
const ReviewsTab = ({ profile, receivedReviews, givenReviews }) => {
  const [activeTab, setActiveTab] = useState('received');
  const averageRating = parseFloat(profile?.student_details?.rating || 0);

  const displayList = activeTab === 'received' ? receivedReviews : givenReviews;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Ratings & Reviews</h1>
        <p className="text-text-secondary mt-1">Review feedback received from providers or view reviews you submitted.</p>
      </div>

      {/* Review Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'received'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-primary/70'
          }`}
        >
          Received Reviews ({receivedReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'given'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-primary/70'
          }`}
        >
          Given Reviews ({givenReviews.length})
        </button>
      </div>

      {activeTab === 'received' && receivedReviews.length > 0 && (
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-white/5 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/20">
              {averageRating.toFixed(1)}
            </div>
            <div>
              <h3 className="font-bold text-lg">Average Performance Rating</h3>
              <p className="text-xs text-slate-300 mt-0.5">Calculated over {receivedReviews.length} reviews</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={24} 
                className={star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'} 
              />
            ))}
          </div>
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Award size={40} className="stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">No reviews found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'received' 
                ? "You haven't received any review ratings from job providers yet."
                : "You haven't submitted any reviews for job providers yet."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((rev) => (
            <div key={rev.rating_ID} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {activeTab === 'received' ? rev.given_by_name : `To: ${rev.given_to_name}`}
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold">{rev.job_title}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded-lg text-xs font-bold">
                  <Star size={12} className="fill-amber-500 text-amber-500" /> {parseFloat(rev.score).toFixed(1)}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{rev.review}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* 8. PROFILE SETTINGS TAB */
const SettingsTab = ({ profile, fetchDashboardData }) => {
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [preference, setPreference] = useState(profile?.student_details?.preference || '');
  const [skillsStr, setSkillsStr] = useState(profile?.student_details?.skills || '');
  const [customSkill, setCustomSkill] = useState('');
  const [university, setUniversity] = useState(profile?.student_details?.university || '');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setPreference(profile.student_details?.preference || '');
      setSkillsStr(profile.student_details?.skills || '');
      setUniversity(profile.student_details?.university || '');
    }
  }, [profile]);
  
  // Password Reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const availableSkills = ["Web Dev", "Design", "Data Entry", "Photography", "Translation", "Delivery", "Tutoring", "React", "Tailwind", "Photoshop", "English", "Sinhala", "Tamil"];

  const getSkillsArray = () => {
    if (!skillsStr) return [];
    return skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleToggleSkill = (skill) => {
    const arr = getSkillsArray();
    if (arr.includes(skill)) {
      const filtered = arr.filter(s => s !== skill);
      setSkillsStr(filtered.join(', '));
    } else {
      setSkillsStr([...arr, skill].join(', '));
    }
  };

  const handleAddCustomSkill = (e) => {
    if (e.key === 'Enter' && customSkill.trim()) {
      e.preventDefault();
      const arr = getSkillsArray();
      if (!arr.includes(customSkill.trim())) {
        setSkillsStr([...arr, customSkill.trim()].join(', '));
      }
      setCustomSkill('');
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/update_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          skills: skillsStr,
          preference,
          university
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Profile details saved successfully!');
        fetchDashboardData(true);
      } else {
        alert(data.error || 'Failed to update details.');
      }
    } catch (err) {
      alert('Error saving details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    setUpdatingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/change_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.error || 'Failed to update password.');
      }
    } catch (err) {
      alert('Error updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Profile Settings</h1>
        <p className="text-text-secondary mt-1">Manage your expertise skills, preferences, and security settings.</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b pb-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl">
            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('') : 'ST'}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-lg text-slate-800">{profile?.name}</h3>
            <p className="text-xs text-slate-400 font-semibold">{profile?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">✓ Email Verified</span>
              <span className="badge bg-primary-light text-primary border border-primary/20 text-[10px] font-bold capitalize">✓ Status: {profile?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Info Update Form */}
        <form onSubmit={handleSaveInfo} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  className="input-field text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">University ID (Read-only)</label>
                <input 
                  type="text" 
                  className="input-field text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                  value={profile?.student_details?.student_ID || ''}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  className="input-field text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">University Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Uva Wellassa University"
                  className="input-field text-sm"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Skill expertise selector */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Your Expertise Skills</h4>
              <p className="text-[11px] text-slate-400">Add or remove skills to update your recommendations.</p>
            </div>

            {/* Currently selected skills with X marks */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Skills</span>
              <div className="flex flex-wrap gap-2 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl min-h-[56px]">
                {getSkillsArray().length === 0 ? (
                  <span className="text-xs text-slate-400 font-medium italic self-center">No skills added yet. Select suggestions or add custom skills below.</span>
                ) : (
                  getSkillsArray().map((skill) => (
                    <span 
                      key={skill} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4E8C7E]/10 text-[#1A312C] border border-[#4E8C7E]/20 rounded-xl text-xs font-bold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className="text-[#1A312C]/60 hover:text-rose-600 transition-colors p-0.5 rounded-full hover:bg-rose-50/50"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Available Skills list as quick suggestions */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const selected = getSkillsArray().includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selected 
                          ? 'bg-primary border-primary text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Skill with Add Button */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Custom Skill</span>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Type new skill and press Enter or click Add..."
                  className="input-field text-xs flex-1"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSkill.trim()) {
                      const arr = getSkillsArray();
                      if (!arr.includes(customSkill.trim())) {
                        setSkillsStr([...arr, customSkill.trim()].join(', '));
                      }
                      setCustomSkill('');
                    }
                  }}
                  className="px-4 py-2.5 bg-primary hover:bg-[#4E8C7E] text-white text-xs font-bold rounded-xl transition-all active:scale-95 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="btn-primary py-3 px-8 text-sm font-bold shadow-md"
          >
            {updatingProfile ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Lock size={16} /> Security: Change Password
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Keep your account secure by updating your password regularly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                className="input-field text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="btn-primary py-2.5 px-6 text-xs font-bold shadow-sm"
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
