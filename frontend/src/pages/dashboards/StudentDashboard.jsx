import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import JobCard from '../../components/shared/JobCard';
import ChatTab from '../../components/shared/ChatTab';
import AnalyticsTab from './AnalyticsTab';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Briefcase, DollarSign, Star, Search, Clock, 
  CheckCircle2, MessageSquare, Truck, Settings, Bell, CheckCircle,
  AlertTriangle, Shield, Check, X, Award, ChevronRight, Send, ArrowRight,
  List, LogOut, Lock, User, PlusCircle, Plus, RefreshCw, Eye, Sparkles, MapPin, Package,
  ShieldAlert, Upload
} from 'lucide-react';

const PRODUCT_KEYWORDS = [
  'cake', 'crochet', 'bakery', 'bake', 'craft', 'knit', 'sew', 'tailor', 'food', 'pastry', 'cookie', 'snack', 'meal', 'lunch', 'box', 'parcel', 'package', 'jewelry', 'handmade', 'product', 'deliver', 'item',
  'bag', 'tote', 'canvas', 'paint', 'print', 'drawing', 'sketch', 'shirt', 'clothing', 'cup', 'mug', 'gift', 'art', 'decor', 'hand-paint', 'screen-print', 't-shirt', 'bottle', 'pottery', 'toy', 'woodwork', 'knitting', 'sewing', 'embroidery', 'sweet'
];

const isProductBased = (job) => {
  if (job.is_product_based === true || job.is_product_based == 1) return true;
  const combined = ((job.title || '') + ' ' + (job.description || '')).toLowerCase();
  return PRODUCT_KEYWORDS.some(kw => combined.includes(kw));
};

const StudentDashboard = () => {
  const { user, setUser, logout } = useAuth();
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

  // Warning Timer states - disabled by default to prevent spamming system complaints
  const [timeLeft, setTimeLeft] = useState(25);
  const [timerActive, setTimerActive] = useState(false);
  const [timerAlertTriggered, setTimerAlertTriggered] = useState(true);

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
      
      // Update local storage and AuthContext user details if profile_pic exists/changed
      if (profileData.success && profileData.profile) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.profile_pic !== profileData.profile.profile_pic) {
            parsed.profile_pic = profileData.profile.profile_pic;
            localStorage.setItem('user', JSON.stringify(parsed));
            setUser(parsed);
          }
        }
      }
      
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
      if (deliveryData?.success) setDeliveries(deliveryData.deliveries || []);
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
    const productJob = isProductBased(job);
    setApplyModalJob({ ...job, _isProduct: productJob });
    setIsDeliveryJob(productJob);
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

      // Submit Application — addresses are collected AFTER job completion for platform delivery
      const applyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/apply_jobs.php`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          job_ID: applyModalJob.id,
          delivery_needed: applyModalJob._isProduct ? (deliveryType === 'platform' ? 1 : 0) : null
        })
      });
      const applyData = await applyRes.json();

      if (!applyData || applyData.error) {
        alert(applyData?.error || 'Failed to submit application.');
        setApplying(false);
        return;
      }

      alert('Application submitted successfully!');
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
        <Route path="" element={<Navigate to="applications" replace />} />
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
            profile={profile}
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
        <Route path="*" element={<Navigate to="applications" replace />} />
      </Routes>

      {/* Application and Delivery Setup Modal */}
      {applyModalJob && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setApplyModalJob(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col z-[210]">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-800">Apply for Gig</h3>
                <p className="text-sm text-slate-500 font-black mt-0.5">{applyModalJob.title}</p>
                <div className="text-[10px] text-slate-500 mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-1">
                    <span className="font-black text-slate-400 uppercase tracking-wider text-[8px] w-20 inline-block">Provider:</span>
                    <strong className="text-slate-700">{applyModalJob.clientName}</strong>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="font-black text-slate-400 uppercase tracking-wider text-[8px] w-20 inline-block">Rating:</span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                      ⭐ {applyModalJob.provider_rating ? `${applyModalJob.provider_rating} / 5.0` : 'No reviews yet'}
                    </span>
                  </p>
                  {applyModalJob.clientBusinessRegNo && (
                    <p className="flex items-center gap-1">
                      <span className="font-black text-slate-400 uppercase tracking-wider text-[8px] w-20 inline-block">Reg No:</span>
                      <strong className="text-slate-700">{applyModalJob.clientBusinessRegNo}</strong>
                      <span className="text-[9px] text-slate-400 font-medium">({applyModalJob.clientBusinessType})</span>
                    </p>
                  )}
                  {(applyModalJob.jobAddress || applyModalJob.clientAddress) && (
                    <p className="flex items-start gap-1">
                      <span className="font-black text-slate-400 uppercase tracking-wider text-[8px] w-20 inline-block shrink-0 mt-0.5">Address:</span>
                      <span className="text-slate-700 font-semibold">{applyModalJob.jobAddress || applyModalJob.clientAddress}</span>
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all shrink-0">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApplication} className="flex-1 flex flex-col overflow-hidden mt-4">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck size={16} className="text-primary" />
                        <span className="text-xs font-black text-primary-dark uppercase tracking-wider">
                          Delivery staff needed?
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 ml-auto">Required</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryType('platform');
                          }}
                          className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                            deliveryType === 'platform'
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">YES - I need delivery staff</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryType('self');
                          }}
                          className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                            deliveryType === 'self'
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">NO - I will deliver myself</span>
                        </button>
                      </div>

                      {deliveryType === 'platform' ? (
                        <p className="text-[10px] text-primary font-bold bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
                          ✓ A GigConnect rider will be assigned once your application is accepted. You will provide pickup &amp; delivery details after the job is complete.
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          ✓ You will deliver the product yourself. An OTP will be shared with you and the job provider upon completion.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={applying}
                className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                {applying ? 'Submitting Application...' : 'Confirm Application & Send'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

/* ==========================================================================
   SUB-PAGES & TAB COMPONENTS
   ========================================================================== */



/* 2. APPLICATIONS TAB */
/* 2. APPLICATIONS TAB */
const ApplicationsTab = ({ applications, profile, fetchDashboardData }) => {
  const [activeTab, setActiveTab] = useState('All');
  
  // State for Mark as Completed form/modal
  const [completionModalJob, setCompletionModalJob] = useState(null);
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Map Geocoding states and refs for Completion Modal
  const [activeAddressField, setActiveAddressField] = useState('pickup');
  const [locatingPickup, setLocatingPickup] = useState(false);
  const [locatingDelivery, setLocatingDelivery] = useState(false);

  const modalMapContainerRef = useRef(null);
  const modalMapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const activeFieldRef = useRef('pickup');
  
  // Mapbox autocomplete specific states and token
  const MAPBOX_TOKEN = "pk.eyJ1Ijoia2lydS1zaGUxMiIsImEiOiJjbXE2YWMxMzYwMDJvMnNzNXE3ODViZTl2In0.gc5SwlhXKWX9RgR4ZzskMw";
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  // Keep the ref in sync
  activeFieldRef.current = activeAddressField;

  const fetchAddressSuggestions = async (query, setSuggestions) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gig-connect-main/backend'}/api/maps/geocode.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query })
        }
      );
      const data = await response.json();
      if (data && data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching Mapbox suggestions:", err);
      setSuggestions([]);
    }
  };

  const handleAddressChange = (val, field) => {
    if (field === 'pickup') {
      setPickupAddress(val);
      fetchAddressSuggestions(val, setPickupSuggestions);
    } else {
      setDropoffAddress(val);
      fetchAddressSuggestions(val, setDropoffSuggestions);
    }
  };

  const selectSuggestion = (val, field) => {
    if (field === 'pickup') {
      setPickupAddress(val);
      setPickupSuggestions([]);
      if (completionModalJob?.delivery_needed == 1) {
        handleModalGeocode('pickup', val);
      }
    } else {
      setDropoffAddress(val);
      setDropoffSuggestions([]);
      if (completionModalJob?.delivery_needed == 1) {
        handleModalGeocode('delivery', val);
      }
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  };

  const handleModalReverseGeocode = async (lat, lng, field) => {
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gig-connect-main/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      const data = await response.json();
      if (data && data.success && data.formatted_address) {
        if (field === 'pickup') {
          setPickupAddress(data.formatted_address);
        } else {
          setDropoffAddress(data.formatted_address);
        }
      }
    } catch (err) {
      console.error("Modal Reverse geocoding failed:", err);
    }
  };

  const handleModalGeocode = async (field, addressValue = null) => {
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    const address = addressValue !== null ? addressValue : (field === 'pickup' ? pickupAddress : dropoffAddress);
    if (!address || !address.trim()) return;
    
    if (field === 'pickup') setLocatingPickup(true);
    else setLocatingDelivery(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gig-connect-main/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address })
      });
      const data = await response.json();
      if (data && data.success && data.coordinates) {
        const lat = parseFloat(data.coordinates.latitude);
        const lon = parseFloat(data.coordinates.longitude);
        
        if (field === 'pickup') {
          setPickupAddress(data.formatted_address || address);
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setLatLng([lat, lon]);
          }
        } else {
          setDropoffAddress(data.formatted_address || address);
          if (deliveryMarkerRef.current) {
            deliveryMarkerRef.current.setLatLng([lat, lon]);
          }
        }

        if (modalMapRef.current) {
          modalMapRef.current.setView([lat, lon], 15);
        }
      } else {
        alert("Address not found on map. Try searching for a nearby town or landmark.");
      }
    } catch (err) {
      console.error("Modal Geocoding failed:", err);
    } finally {
      if (field === 'pickup') setLocatingPickup(false);
      else setLocatingDelivery(false);
    }
  };

  useEffect(() => {
    if (completionModalJob && (completionModalJob.is_product_based == 1 || completionModalJob.is_product_based === true) && window.L && modalMapContainerRef.current) {
      const timer = setTimeout(() => {
        if (!modalMapContainerRef.current) return;

        if (modalMapRef.current) {
          modalMapRef.current.remove();
          modalMapRef.current = null;
          pickupMarkerRef.current = null;
          deliveryMarkerRef.current = null;
        }

        const initialLat = 6.9812;
        const initialLng = 81.0763;

        modalMapRef.current = window.L.map(modalMapContainerRef.current).setView([initialLat, initialLng], 13);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(modalMapRef.current);

        const greenIcon = new window.L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const redIcon = new window.L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        pickupMarkerRef.current = window.L.marker([initialLat, initialLng - 0.005], {
          draggable: true,
          icon: greenIcon
        }).addTo(modalMapRef.current).bindPopup('Pickup Location');

        deliveryMarkerRef.current = window.L.marker([initialLat, initialLng + 0.005], {
          draggable: true,
          icon: redIcon
        }).addTo(modalMapRef.current).bindPopup('Delivery Destination');

        pickupMarkerRef.current.on('dragend', async () => {
          const position = pickupMarkerRef.current.getLatLng();
          await handleModalReverseGeocode(position.lat, position.lng, 'pickup');
        });

        deliveryMarkerRef.current.on('dragend', async () => {
          const position = deliveryMarkerRef.current.getLatLng();
          await handleModalReverseGeocode(position.lat, position.lng, 'delivery');
        });

        modalMapRef.current.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          if (activeFieldRef.current === 'pickup') {
            pickupMarkerRef.current.setLatLng([lat, lng]);
            await handleModalReverseGeocode(lat, lng, 'pickup');
          } else {
            deliveryMarkerRef.current.setLatLng([lat, lng]);
            await handleModalReverseGeocode(lat, lng, 'delivery');
          }
        });

        setTimeout(() => {
          if (modalMapRef.current) {
            modalMapRef.current.invalidateSize();
          }
        }, 300);
      }, 100);

      return () => {
        if (modalMapRef.current) {
          modalMapRef.current.remove();
          modalMapRef.current = null;
          pickupMarkerRef.current = null;
          deliveryMarkerRef.current = null;
        }
      };
    }
  }, [completionModalJob]);

  // State for OTP entry
  const [otpVerifyApp, setOtpVerifyApp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // State for Complaint modal
  const [selectedAppForComplaint, setSelectedAppForComplaint] = useState(null);
  const [complaintType, setComplaintType] = useState('Fraud / Scam');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const handleOpenComplaint = (app) => {
    setSelectedAppForComplaint(app);
    setComplaintType('Fraud / Scam');
    setComplaintTitle('');
    setComplaintDescription('');
    setEvidenceImage(null);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!selectedAppForComplaint) return;
    if (!complaintDescription.trim()) {
      alert("Please enter a description for your complaint.");
      return;
    }

    setSubmittingComplaint(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Your session has expired. Please refresh the page or log in again.');
        return;
      }

      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost/gig-connect-main/backend').replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/api/admin/complaints.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'create',
          complainant_name: profile?.name || user?.name || 'Student',
          against_user: selectedAppForComplaint.client_name || selectedAppForComplaint.job_provider_name || 'Job Provider',
          complaint_type: complaintType,
          title: complaintTitle || complaintType,
          description: complaintDescription,
          evidence_image: evidenceImage,
          job_ID: selectedAppForComplaint.job_ID,
          complainant_role: 'student'
        })
      });

      const textRes = await response.text();
      let data = null;
      try {
        data = JSON.parse(textRes);
      } catch (pErr) {
        console.error("Non-JSON response from server:", textRes);
      }

      if (data && data.success) {
        alert('Complaint filed successfully! System administrators and managers have been notified.');
        setSelectedAppForComplaint(null);
        if (fetchDashboardData) fetchDashboardData(true);
      } else {
        alert(data?.error || 'Failed to submit complaint. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert(err?.message ? `Submission Error: ${err.message}` : 'Failed to submit complaint. Please check your network connection.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // State for Review modal (for non-product-based jobs)
  const [selectedAppForReview, setSelectedAppForReview] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleOpenReview = (app, clientUserId) => {
    setSelectedAppForReview({
      job_ID: app.job_ID,
      client_user_ID: clientUserId,
      client_name: app.client_name || 'Job Provider'
    });
    setRatingScore(5);
    setReviewText('');
  };

  const handleCloseReview = () => {
    setSelectedAppForReview(null);
  };



  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedAppForReview) return;

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/submit_review.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: selectedAppForReview.job_ID,
          given_to: selectedAppForReview.client_user_ID,
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
      console.error(err);
      alert('Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStudentFacingStatus = (dbStatus) => {
    const s = (dbStatus || '').toLowerCase();
    if (s === 'applied' || s === 'shortlisted' || s === 'pending_payment') {
      return 'applied';
    }
    return s; // 'accepted', 'completed', 'delivered', 'rejected'
  };

  const filteredApps = applications.filter((app) => {
    const facingStatus = getStudentFacingStatus(app.status);
    if (activeTab === 'All') return true;
    return facingStatus === activeTab.toLowerCase();
  });

  const handleOpenCompletion = (app) => {
    setCompletionModalJob(app);
    setPhone(profile?.phone || '');
    setPickupAddress('');
    setDropoffAddress('');
    setClientPhone('');
    setPickupSuggestions([]);
    setDropoffSuggestions([]);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completionModalJob) return;

    setSubmittingCompletion(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/complete_job.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          application_ID: completionModalJob.application_ID,
          job_ID: completionModalJob.job_ID,
          phone,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          client_phone: clientPhone
        })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        const prevJob = completionModalJob;
        setCompletionModalJob(null);
        setPhone('');
        setPickupAddress('');
        setDropoffAddress('');
        setClientPhone('');
        alert(data.message || 'Job marked as completed successfully!');
        fetchDashboardData(true);
        if (data.is_product_based === false) {
          handleOpenReview(prevJob, data.provider_user_ID);
        } else {
          setActiveTab('Completed');
          if (prevJob.delivery_needed == 0) {
            setOtpVerifyApp(prevJob);
            setEnteredOtp('');
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to complete job.');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleVerifyOtp = async (app) => {
    if (!enteredOtp) return;
    setVerifyingOtp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/confirm_delivery.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delivery_ID: app.delivery_ID,
          otp: enteredOtp
        })
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message || 'OTP verified and delivery confirmed successfully!');
        setOtpVerifyApp(null);
        setEnteredOtp('');
        fetchDashboardData(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to verify OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const statusBadges = {
    'applied': 'bg-blue-100 text-blue-800 border border-blue-200',
    'accepted': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'completed': 'bg-purple-100 text-purple-800 border border-purple-200',
    'delivered': 'bg-orange-100 text-orange-800 border border-orange-200',
    'rejected': 'bg-rose-100 text-rose-800 border border-rose-200'
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">My Applications</h1>
        <p className="text-text-secondary mt-1">Track and monitor your application stages.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto scrollbar-none">
        {['All', 'Applied', 'Accepted', 'Completed', 'Delivered', 'Rejected'].map((tab) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredApps.map((app) => {
            const facingStatus = getStudentFacingStatus(app.status);
            const isProduct = app.is_product_based == 1;

            return (
              <div 
                key={app.application_ID} 
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadges[facingStatus] || 'bg-slate-100 text-slate-700'}`}>
                      {facingStatus.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Applied: {new Date(app.applied_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-lg text-slate-800 mt-3">
                    {app.job_title}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                    <span className="font-bold text-slate-600">{app.client_name || 'Partner Client'}</span>
                    <span>•</span>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      ⭐ {app.provider_rating ? `${app.provider_rating} / 5.0` : 'No reviews yet'}
                    </span>
                  </div>

                  {app.provider_address && (
                    <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      <span>{app.provider_address}</span>
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Payment:</span>
                    <span className="font-black text-slate-800 text-sm">LKR {parseFloat(app.job_payment).toLocaleString()}</span>
                  </div>

                  {isProduct && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                      <Package size={12} />
                      <span>Product-Based Gig ({app.delivery_needed == 1 ? 'Platform Delivery' : 'Self Delivery'})</span>
                    </div>
                  )}
                </div>

                {/* Status-specific action panels */}
                <div className="pt-2 border-t border-slate-100/80 space-y-3">
                  {facingStatus === 'accepted' && (
                    <button
                      onClick={() => handleOpenCompletion(app)}
                      className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      <span>Mark as Completed</span>
                    </button>
                  )}

                  {facingStatus === 'completed' && (
                    isProduct ? (
                      <div className="bg-purple-50/50 border border-purple-100/50 rounded-2xl p-4 space-y-3">
                        {app.delivery_needed == 1 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-purple-700">Verification OTP:</span>
                            <code className="bg-purple-100 text-purple-800 font-mono font-black text-sm px-2 py-0.5 rounded-lg select-all">
                              {app.delivery_otp || 'Generating...'}
                            </code>
                          </div>
                        )}
                        
                        {app.delivery_needed == 1 ? (
                          <div className="text-xs text-slate-500 font-medium">
                            <p className="flex items-center gap-1 text-primary font-bold">
                              <Truck size={12} />
                              <span>Platform Rider Status:</span>
                            </p>
                            <p className="mt-1 pl-4 font-semibold text-slate-700">
                              {app.delivery_status === 'pending_assignment' 
                                ? 'Waiting for admin to assign delivery rider.' 
                                : `Assigned: ${app.delivery_staff_name || 'Rider'} (${app.delivery_staff_phone || 'N/A'})`}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              Please physically deliver the product to the client. Enter OTP below once delivered to finalize, or client can confirm.
                            </p>
                            {otpVerifyApp?.application_ID === app.application_ID ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  value={enteredOtp}
                                  onChange={(e) => setEnteredOtp(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary"
                                />
                                <button
                                  onClick={() => handleVerifyOtp(app)}
                                  disabled={verifyingOtp}
                                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary-dark transition-all disabled:opacity-60"
                                >
                                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                                </button>
                                <button
                                  onClick={() => setOtpVerifyApp(null)}
                                  className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setOtpVerifyApp(app);
                                  setEnteredOtp('');
                                }}
                                className="w-full bg-purple-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-purple-700 transition-all flex items-center justify-center gap-1"
                              >
                                <Lock size={12} />
                                <span>Verify Delivery OTP</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      parseInt(app.student_reviewed) > 0 ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-700 font-bold flex items-center gap-1.5 justify-center">
                          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                          <span>Completed & Reviewed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(app, app.client_user_ID)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 animate-pulse"
                        >
                          <Star size={14} className="fill-white" />
                          <span>Rate & Review Job Provider</span>
                        </button>
                      )
                    )
                  )}

                  {facingStatus === 'delivered' && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-orange-700 font-bold flex items-center gap-1.5 justify-center">
                        <CheckCircle2 size={14} className="text-orange-600 shrink-0" />
                        <span>Delivered successfully! Provider has received the product.</span>
                      </div>
                      {parseInt(app.student_reviewed) > 0 ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-700 font-bold flex items-center gap-1.5 justify-center">
                          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                          <span>Completed & Reviewed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(app, app.client_user_ID)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 animate-pulse"
                        >
                          <Star size={14} className="fill-white" />
                          <span>Rate & Review Job Provider</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {facingStatus === 'rejected' && (
                    <p className="text-xs text-rose-500 font-medium italic">
                      This application was rejected by the provider.
                    </p>
                  )}
                  <button
                    onClick={() => handleOpenComplaint(app)}
                    className="w-full mt-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert size={14} className="text-rose-500" />
                    <span>Report Issue / File Complaint</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File a Complaint Modal */}
      {selectedAppForComplaint && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setSelectedAppForComplaint(null)} />
          <div className="relative bg-white rounded-[2rem] max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-800">File a Complaint</h3>
                  <p className="text-xs text-slate-500">Report an issue with {selectedAppForComplaint.client_name || selectedAppForComplaint.job_provider_name || 'Job Provider'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppForComplaint(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Readonly Details Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Against User:</span>
                <span className="text-slate-800 font-black">{selectedAppForComplaint.client_name || selectedAppForComplaint.job_provider_name || 'Keerthanan'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Related Job:</span>
                <span className="text-slate-800 font-black">{selectedAppForComplaint.job_title || 'Gig'}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  COMPLAINT TYPE <span className="text-rose-500">*</span>
                </label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                  required
                >
                  <option value="Fraud / Scam">Fraud / Scam</option>
                  <option value="Non-Payment">Non-Payment</option>
                  <option value="Unprofessional Behavior">Unprofessional Behavior</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Safety / Risk">Safety / Risk</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  TITLE <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue (e.g. Client refused payment)"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    DESCRIPTION <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {complaintDescription.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe what happened in detail. Include dates, specific messages, and incidents..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  EVIDENCE SCREENSHOT (OPTIONAL)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const maxDim = 800;
                            if (width > height && width > maxDim) {
                              height = Math.round((height * maxDim) / width);
                              width = maxDim;
                            } else if (height > maxDim) {
                              width = Math.round((width * maxDim) / height);
                              height = maxDim;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            setEvidenceImage(canvas.toDataURL('image/jpeg', 0.7));
                          };
                          img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {evidenceImage ? (
                    <div className="space-y-2">
                      <img src={evidenceImage} alt="Evidence" className="h-20 mx-auto rounded-lg object-cover border" />
                      <p className="text-[10px] text-emerald-600 font-bold">Image loaded successfully!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="mx-auto text-slate-400" size={20} />
                      <p className="text-xs text-slate-500 font-bold">Upload screenshot or image evidence (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForComplaint(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint || !complaintDescription.trim()}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Completion Details Modal */}
      {completionModalJob && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setCompletionModalJob(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100/80 flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <CheckCircle size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-800">
                    {parseInt(completionModalJob.is_product_based) === 1 && completionModalJob.delivery_needed == 0
                      ? 'Self Delivery Details'
                      : 'Complete Gig'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{completionModalJob.job_title}</p>
                </div>
              </div>
              <button 
                onClick={() => setCompletionModalJob(null)} 
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-none">
              {parseInt(completionModalJob.is_product_based) === 1 ? (
                completionModalJob.delivery_needed == 1 ? (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-blue-50/60 border border-blue-100/50 rounded-2xl flex gap-3 items-start">
                      <Truck className="text-primary shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-primary-dark leading-relaxed font-semibold">
                        Please provide pickup and dropoff details for the delivery rider.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Your Phone Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0771234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pickup Address</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Where should the rider collect the product?"
                            value={pickupAddress}
                            onChange={(e) => handleAddressChange(e.target.value, 'pickup')}
                            onFocus={() => setActiveAddressField('pickup')}
                            onBlur={() => setTimeout(() => setPickupSuggestions([]), 200)}
                            className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleModalGeocode('pickup')}
                            disabled={locatingPickup}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 hover:bg-primary/20 disabled:bg-slate-100 text-primary hover:text-primary-dark rounded-lg transition-all flex items-center justify-center z-10"
                            title="Locate address on map"
                          >
                            {locatingPickup ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <Plus size={14} />
                            )}
                          </button>
                          {pickupSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[220] max-h-48 overflow-y-auto">
                              {pickupSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectSuggestion(suggestion, 'pickup');
                                  }}
                                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Delivery Destination Address</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Where should the rider deliver the product?"
                            value={dropoffAddress}
                            onChange={(e) => handleAddressChange(e.target.value, 'delivery')}
                            onFocus={() => setActiveAddressField('delivery')}
                            onBlur={() => setTimeout(() => setDropoffSuggestions([]), 200)}
                            className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleModalGeocode('delivery')}
                            disabled={locatingDelivery}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 hover:bg-primary/20 disabled:bg-slate-100 text-primary hover:text-primary-dark rounded-lg transition-all flex items-center justify-center z-10"
                            title="Locate address on map"
                          >
                            {locatingDelivery ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <Plus size={14} />
                            )}
                          </button>
                          {dropoffSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[220] max-h-48 overflow-y-auto">
                              {dropoffSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectSuggestion(suggestion, 'delivery');
                                  }}
                                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Map Container */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Interactive Map
                          </label>
                          <span className="text-[9px] text-primary font-bold uppercase">
                            Editing: {activeAddressField === 'pickup' ? '🟢 Pickup' : '🔴 Delivery'}
                          </span>
                        </div>
                        <div 
                          ref={modalMapContainerRef} 
                          className="w-full h-40 rounded-xl border border-slate-200 overflow-hidden z-10"
                          style={{ minHeight: '160px' }}
                        />
                        <p className="text-[9px] text-slate-400 leading-normal">
                          * Click the <b>+</b> button to place a marker from typed address, or click/drag markers on the map to set locations directly.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Client Contact Phone (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 0779876543"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-purple-50/60 border border-purple-100/50 rounded-2xl flex gap-3 items-start">
                      <Truck className="text-purple-600 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-purple-700 leading-relaxed font-semibold">
                        Please provide self delivery details. The client will receive an OTP along with your phone number to coordinate contact.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Your Phone Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0771234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pickup Address</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Enter pickup address"
                            value={pickupAddress}
                            onChange={(e) => handleAddressChange(e.target.value, 'pickup')}
                            onBlur={() => setTimeout(() => setPickupSuggestions([]), 200)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                          />
                          {pickupSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[220] max-h-48 overflow-y-auto">
                              {pickupSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectSuggestion(suggestion, 'pickup');
                                  }}
                                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Drop-off Destination Address</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Enter drop-off destination address"
                            value={dropoffAddress}
                            onChange={(e) => handleAddressChange(e.target.value, 'delivery')}
                            onBlur={() => setTimeout(() => setDropoffSuggestions([]), 200)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                          />
                          {dropoffSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[220] max-h-48 overflow-y-auto">
                              {dropoffSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectSuggestion(suggestion, 'delivery');
                                  }}
                                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
                                >
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Client Contact Phone (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 0779876543"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 bg-purple-50/70 border border-purple-100/50 rounded-2xl flex gap-3 items-start">
                  <Star className="text-purple-600 shrink-0 mt-0.5 fill-purple-200" size={16} />
                  <p className="text-xs text-purple-700 leading-relaxed font-semibold">
                    This job will be marked as completed immediately. After confirming, you will be prompted to leave a rating and review for the job provider.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingCompletion}
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-2xl font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle size={14} />
                <span>{submittingCompletion ? 'Marking as Completed...' : 'Confirm Job Completed'}</span>
              </button>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Review Modal */}
      {selectedAppForReview && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleCloseReview} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h3 className="font-bold text-slate-800">Leave a Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">For {selectedAppForReview.client_name}</p>
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
                      <Star size={ star <= ratingScore ? 28 : 28 } className={star <= ratingScore ? 'fill-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Review Message</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all h-24 resize-none"
                  placeholder="Describe your experience working with this client..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs shadow-md hover:bg-primary-dark transition-all disabled:opacity-60"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>,
        document.body
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Total Jobs Completed', value: completedJobs.length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleCloseReview} />
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
  const [otpInputs, setOtpInputs] = useState({});
  // Modal state for collecting platform delivery details
  const [deliveryDetailModal, setDeliveryDetailModal] = useState(null); // delivery object
  const [ddPickup, setDdPickup] = useState('');
  const [ddDestination, setDdDestination] = useState('');
  const [ddPhone, setDdPhone] = useState('');
  const [ddSubmitting, setDdSubmitting] = useState(false);
  const [ddPickupSuggestions, setDdPickupSuggestions] = useState([]);
  const [ddDropoffSuggestions, setDdDropoffSuggestions] = useState([]);

  const openDeliveryDetailModal = (del) => {
    setDeliveryDetailModal(del);
    setDdPickup(del.pickup_address || '');
    setDdDestination(del.delivery_address || '');
    setDdPhone(profile?.phone || '');
    setDdPickupSuggestions([]);
    setDdDropoffSuggestions([]);
  };

  const fetchAddressSuggestions = async (query, setSuggestions) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/maps/geocode.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query })
        }
      );
      const data = await response.json();
      if (data && data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching Mapbox suggestions:", err);
      setSuggestions([]);
    }
  };

  const handleDdPickupChange = (val) => {
    setDdPickup(val);
    fetchAddressSuggestions(val, setDdPickupSuggestions);
  };

  const handleDdDestinationChange = (val) => {
    setDdDestination(val);
    fetchAddressSuggestions(val, setDdDropoffSuggestions);
  };

  const handleSubmitDeliveryDetails = async (e) => {
    e.preventDefault();
    if (!ddPickup.trim() || !ddDestination.trim() || !ddPhone.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setDdSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          delivery_ID: deliveryDetailModal.delivery_ID,
          action: 'ready_for_pickup',
          pickup_address: ddPickup,
          delivery_address: ddDestination,
          phone: ddPhone
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.success);
        setDeliveryDetailModal(null);
        fetchDashboardData(true);
      } else {
        alert(data.error || 'Failed to submit delivery details.');
      }
    } catch (err) {
      alert('Error communicating with backend.');
    } finally {
      setDdSubmitting(false);
    }
  };

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
        alert(data.success || `Delivery updated successfully!`);
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

  const handleVerifyOtp = async (delivery_ID) => {
    const otp = otpInputs[delivery_ID];
    if (!otp || otp.trim().length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/verify_otp.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_ID, otp: otp.trim() })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.success || 'OTP verified successfully!');
        fetchDashboardData(true);
      } else {
        alert(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      alert('Error verifying OTP.');
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
                      {del.status === 'pending'   ? '🕐 Awaiting Action'
                      : del.status === 'assigned'  ? '🚴 Rider Assigned'
                      : del.status === 'picked_up' ? '📦 Verification Pending / In Transit'
                      : '✅ Delivered / Completed'}
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
                </div>

                {/* Delivery Action Panel */}
                <div className="pt-2 pl-2 border-t border-slate-50">
                  {del.status === 'delivered' ? (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Job and delivery completed successfully.
                    </p>
                  ) : isSelf ? (
                    /* Self Delivery Flows */
                    del.status === 'pending' ? (
                      <button
                        onClick={() => handleUpdateDeliveryStatus(del.delivery_ID, 'complete_self_delivery')}
                        disabled={updating}
                        className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
                      >
                        🚀 Mark Job Done & Send OTP
                      </button>
                    ) : del.status === 'picked_up' ? (
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-500">
                          Enter the 6-digit OTP code received by email to complete:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInputs[del.delivery_ID] || ''}
                            onChange={(e) => setOtpInputs({ ...otpInputs, [del.delivery_ID]: e.target.value })}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold tracking-widest text-sm focus:border-primary outline-none"
                          />
                          <button
                            onClick={() => handleVerifyOtp(del.delivery_ID)}
                            disabled={updating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition-all"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    /* Platform Delivery Flows */
                    del.status === 'pending' ? (
                      <button
                        onClick={() => openDeliveryDetailModal(del)}
                        disabled={updating}
                        className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold shadow"
                      >
                        ✓ Mark Product Ready for Rider Pickup
                      </button>
                    ) : del.status === 'assigned' ? (
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        ⏳ Rider {del.delivery_staff_name} has been assigned and is on the way to pick up the product.
                      </p>
                    ) : del.status === 'picked_up' ? (
                      <p className="text-xs text-primary font-bold bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
                        🚴 Rider is currently delivering the product.
                      </p>
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Details Modal — collects address + phone for platform delivery */}
      {deliveryDetailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeliveryDetailModal(null)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-800">Delivery Details</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{deliveryDetailModal.job_title}</p>
              </div>
              <button onClick={() => setDeliveryDetailModal(null)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>
            <p className="text-xs text-primary font-bold bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
              📦 Please provide delivery information so a GigConnect rider can be assigned.
            </p>
            <form onSubmit={handleSubmitDeliveryDetails} className="space-y-4">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pickup Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UWU Hostel Block A, Room 204"
                  value={ddPickup}
                  onChange={(e) => handleDdPickupChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-medium"
                />
                {ddPickupSuggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {ddPickupSuggestions.map((sug, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          setDdPickup(sug);
                          setDdPickupSuggestions([]);
                        }}
                        className="px-3 py-2 text-xs hover:bg-primary-light hover:text-primary cursor-pointer transition-colors"
                      >
                        📍 {sug}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Delivery Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Office, Badulla"
                  value={ddDestination}
                  onChange={(e) => handleDdDestinationChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-medium"
                />
                {ddDropoffSuggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {ddDropoffSuggestions.map((sug, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          setDdDestination(sug);
                          setDdDropoffSuggestions([]);
                        }}
                        className="px-3 py-2 text-xs hover:bg-primary-light hover:text-primary cursor-pointer transition-colors"
                      >
                        📍 {sug}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Your Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0771234567"
                  value={ddPhone}
                  onChange={(e) => setDdPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary text-xs font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={ddSubmitting}
                className="w-full btn-primary py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                {ddSubmitting ? 'Submitting...' : '✓ Confirm & Notify Admin'}
              </button>
            </form>
          </div>
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
            <div key={notif.notification_ID || notif.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 text-lg">
                {notif.icon || (notif.type === 'job_accepted' ? '🎉' : notif.type?.includes('delivery') ? '🚚' : '🔵')}
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-bold text-slate-800">{notif.title || (notif.type ? notif.type.replace('_', ' ').toUpperCase() : 'Notification')}</h4>
                <p className="text-xs text-slate-600 font-medium">{notif.message}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="badge bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                    {notif.type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : (notif.time || '')}
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
  const [degree, setDegree] = useState(profile?.student_details?.degree || '');
  const [year, setYear] = useState(profile?.student_details?.year || '');
  const [gender, setGender] = useState(profile?.student_details?.gender || '');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setPreference(profile.student_details?.preference || '');
      setSkillsStr(profile.student_details?.skills || '');
      setDegree(profile.student_details?.degree || '');
      setYear(profile.student_details?.year || '');
      setGender(profile.student_details?.gender || '');
    }
  }, [profile]);
  
  // Password Reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [settingsAvatarError, setSettingsAvatarError] = useState(false);

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
          degree,
          year,
          gender
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
          {profile?.profile_pic && !settingsAvatarError ? (
            <img 
              src={profile.profile_pic.startsWith('http') || profile.profile_pic.startsWith('/') ? profile.profile_pic : `/${profile.profile_pic}`}
              alt={profile.name}
              onError={() => setSettingsAvatarError(true)}
              className="w-20 h-20 rounded-2xl object-cover shadow-md border border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-2xl">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('') : 'ST'}
            </div>
          )}
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
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Gender</label>
                <select 
                  className="input-field text-sm"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Course Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science"
                  className="input-field text-sm"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Academic Year</label>
                <select 
                  className="input-field text-sm"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">Select Academic Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Other">Other</option>
                </select>
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
