import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import { CATEGORIES, SKILLS_LIST } from '../../data/mockData';
import ComplaintsTab from '../../components/shared/ComplaintsTab';
import ChatTab from '../../components/shared/ChatTab';
import { 
  PlusCircle, List, Users, MessageSquare, MapPin, Star, Settings, 
  ChevronRight, ChevronLeft, CreditCard, CheckCircle, Clock, DollarSign,
  Plus
} from 'lucide-react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { jobs, applications, addJob, updateApplicationStatus } = useJobs();
  const navigate = useNavigate();

  const clientJobs = jobs.filter(j => j.clientId === user.id);
  const clientApps = applications.filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return job?.clientId === user.id;
  });

  return (
    <DashboardLayout>
      <Routes>
        <Route path="home" element={<HomeTab user={user} clientJobs={clientJobs} clientApps={clientApps} />} />
        <Route path="post" element={<PostJobTab addJob={addJob} />} />
        <Route path="listings" element={<ListingsTab clientJobs={clientJobs} />} />
        <Route path="applicants" element={<ApplicantsTab clientJobs={clientJobs} updateStatus={updateApplicationStatus} />} />
        <Route path="messages" element={<ChatTab />} />
        <Route path="delivery" element={<PlaceholderTab title="Delivery Tracking" icon={MapPin} message="Track your deliveries in real-time." />} />
        <Route path="ratings" element={<PlaceholderTab title="Your Ratings" icon={Star} message="View feedback from students you've hired." />} />
        <Route path="complaints" element={<ComplaintsTab />} />
        <Route path="settings" element={<SettingsTab user={user} />} />
        <Route path="*" element={<HomeTab user={user} clientJobs={clientJobs} clientApps={clientApps} />} />
      </Routes>
    </DashboardLayout>
  );
};

const PlaceholderTab = ({ title, icon: Icon, message }) => (
  <div className="space-y-8 animate-fadeIn">
    <h1 className="text-3xl font-heading font-bold text-text-primary">{title}</h1>
    <div className="card p-20 text-center">
      <Icon size={48} className="text-text-muted mx-auto mb-4" />
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-text-secondary">{message}</p>
    </div>
  </div>
);

const SettingsTab = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [businessRegNo, setBusinessRegNo] = useState('');
  const [type, setType] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locating, setLocating] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/profile/get_profile.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || '');
        setBusinessRegNo(data.profile.provider_details?.business_reg_no || '');
        setType(data.profile.provider_details?.type || '');
        setAddress(data.profile.provider_details?.address || '');
        
        const lat = data.profile.provider_details?.latitude ? parseFloat(data.profile.provider_details.latitude) : null;
        const lng = data.profile.provider_details?.longitude ? parseFloat(data.profile.provider_details.longitude) : null;
        setLatitude(lat);
        setLongitude(lng);

        // Update map if it is already initialized
        if (mapRef.current && markerRef.current && lat && lng) {
          mapRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    } catch (err) {
      console.error("Failed to load profile details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  // Initialize map when container and coordinates are available
  useEffect(() => {
    if (window.L && mapContainerRef.current && !mapRef.current && !loading) {
      const initialLat = latitude || 6.9812; // default UWU Badulla
      const initialLng = longitude || 81.0763;

      mapRef.current = window.L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current);

      markerRef.current = window.L.marker([initialLat, initialLng], {
        draggable: true
      }).addTo(mapRef.current);

      markerRef.current.on('dragend', async () => {
        const position = markerRef.current.getLatLng();
        setLatitude(position.lat);
        setLongitude(position.lng);
        await handleReverseGeocode(position.lat, position.lng);
      });

      mapRef.current.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        markerRef.current.setLatLng([lat, lng]);
        await handleReverseGeocode(lat, lng);
      });
    }
  }, [loading]);

  const handleGeocodeAddress = async () => {
    if (!address.trim()) return;
    setLocating(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
      } else {
        alert("Address not found on map. Try searching for a nearby town or landmark.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/profile/update_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          business_reg_no: businessRegNo,
          type,
          address,
          latitude,
          longitude
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Profile details saved successfully!");
      } else {
        alert(data.error || "Failed to update profile details.");
      }
    } catch (err) {
      alert("Error saving profile details.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <h1 className="text-3xl font-heading font-bold text-text-primary">Profile Settings</h1>
      <div className="card p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('') : 'JP'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{profile?.name}</h3>
              <p className="text-sm text-text-secondary">{profile?.email}</p>
              <span className="badge bg-emerald-100 text-emerald-700 mt-2">Verified Client</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Registration No.</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={businessRegNo} 
                  onChange={(e) => setBusinessRegNo(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Type</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Retail, Software"
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="input-field pr-10" 
                    placeholder="Enter business address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                  {address.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleGeocodeAddress}
                      disabled={locating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-[#1A312C] transition-all flex items-center justify-center shadow-sm"
                      title="Fetch address on map"
                    >
                      {locating ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Map Container */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-secondary block">Location Coordinates (Drag marker to refine)</span>
                  {latitude && longitude && (
                    <span className="text-[10px] text-text-muted font-bold">
                      {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                    </span>
                  )}
                </div>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-48 rounded-2xl border border-border overflow-hidden z-10"
                  style={{ minHeight: '180px' }}
                />
              </div>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={updating} 
            className="btn-primary py-3 px-8 text-sm font-bold shadow-md"
          >
            {updating ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

const HomeTab = ({ user, clientJobs, clientApps }) => (
  <div className="space-y-8 animate-fadeIn">
    <div>
      <h1 className="text-3xl font-heading font-bold text-text-primary">Welcome, {user.name.split(' ')[0]}!</h1>
      <p className="text-text-secondary mt-1">Manage your job listings and find the best talent.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Jobs Posted', value: clientJobs.length, icon: List, color: 'text-primary', bg: 'bg-primary-light' },
        { label: 'Active Jobs', value: clientJobs.filter(j => j.status === 'Active').length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Applicants', value: clientApps.filter(a => a.status === 'Applied').length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Amount Spent', value: 'LKR 12.5k', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
      ].map((stat, i) => (
        <div key={i} className="card p-6 flex flex-col gap-1">
          <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
            <stat.icon size={20} />
          </div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
          <p className="text-2xl font-heading font-bold text-text-primary">{stat.value}</p>
        </div>
      ))}
    </div>

    <div className="flex gap-4">
      <Link to="/dashboard/client/post" className="btn-primary py-3 px-6 flex items-center gap-2">
        <PlusCircle size={20} /> Post New Job
      </Link>
      <Link to="/dashboard/client/applicants" className="btn-secondary py-3 px-6 flex items-center gap-2">
        <Users size={20} /> View Applicants
      </Link>
    </div>
  </div>
);

const PostJobTab = ({ addJob }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    type: 'Remote',
    address: '',
    description: '',
    skills: [],
    duration: 'Few Hours',
    pay: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addJob(formData);
      setStep(3);
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill) => {
    if (formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
    } else {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-2">
          {['Job Details', 'Payment', 'Confirmation'].map((s, i) => (
            <span key={i} className={`text-xs font-bold uppercase tracking-widest ${step === i + 1 ? 'text-primary' : 'text-text-muted'}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        </div>
      </div>

      <div className="card p-8 md:p-10">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-heading font-bold text-text-primary">Step 1: Job Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Job Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Logo Design for Tech Shop"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Category</label>
                  <select 
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Type</label>
                  <select 
                    className="input-field"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
              {formData.type === 'On-site' && (
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Address</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Job Description</label>
                <textarea 
                  className="input-field h-32 resize-none" 
                  placeholder="Describe the task in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-3">Required Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSkillToggle(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.skills.includes(s) ? 'bg-primary text-white border-primary' : 'bg-white border-border text-text-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Duration</label>
                  <select 
                    className="input-field"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  >
                    <option>Few Hours</option>
                    <option>1 Day</option>
                    <option>2-3 Days</option>
                    <option>1 Week</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Payment (LKR)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="e.g. 5000"
                    value={formData.pay}
                    onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
              Continue to Payment <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-heading font-bold text-text-primary">Step 2: Payment</h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Job Value</span>
                <span className="font-bold">LKR {formData.pay || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Commission (5%)</span>
                <span className="font-bold text-primary">LKR {(formData.pay * 0.05).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between font-bold">
                <span>Total to Pay Now</span>
                <span className="text-xl">LKR {(formData.pay * 0.05).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input type="text" className="input-field pl-10" placeholder="0000 0000 0000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Expiry Date</label>
                  <input type="text" className="input-field" placeholder="MM / YY" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">CVV</label>
                  <input type="password" className="input-field" placeholder="***" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleBack} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2">
                {loading ? 'Processing...' : `Pay & Post Job`}
              </button>
            </div>
            <p className="text-center text-xs text-text-muted italic">Your job will go live after admin approval.</p>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-text-primary mb-2">Job Submitted!</h2>
            <p className="text-text-secondary mb-10 max-w-sm mx-auto">Your job post is now pending approval. We'll notify you once it goes live.</p>
            <button onClick={() => navigate('/dashboard/client/listings')} className="btn-primary py-3 px-8">
              View My Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ListingsTab = ({ clientJobs }) => (
  <div className="space-y-8 animate-fadeIn">
    <h1 className="text-3xl font-heading font-bold text-text-primary">My Job Listings</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {clientJobs.map(job => (
        <div key={job.id} className="card p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg">{job.title}</h3>
            <span className={`badge ${
              job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
              job.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-primary-light text-primary-dark font-bold'
            }`}>
              {job.status}
            </span>
          </div>
          <div className="flex gap-4 text-sm text-text-secondary mb-6">
            <span className="flex items-center gap-1"><Clock size={14}/> {job.duration}</span>
            <span className="flex items-center gap-1 font-bold text-text-primary">LKR {job.pay}</span>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 btn-secondary text-sm py-2">Edit</button>
            <button className="flex-1 btn-primary text-sm py-2">View Applicants</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ApplicantsTab = ({ clientJobs, updateStatus }) => {
  const [selectedJobId, setSelectedJobId] = useState(clientJobs[0]?.id || '');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApplicants = async (jobId) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_applicants.php?job_ID=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.applicants)) {
          setApplicants(data.applicants);
        } else {
          setApplicants([]);
        }
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error("Error fetching applicants:", err);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants(selectedJobId);
  }, [selectedJobId]);

  const handleUpdateStatus = async (appId, action) => {
    await updateStatus(appId, action);
    fetchApplicants(selectedJobId);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Review Applicants</h1>
        <select 
          className="input-field max-w-xs"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          {clientJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2 text-sm font-medium">Loading applicants...</p>
        </div>
      ) : applicants.length > 0 ? (
        <div className="space-y-4">
          {applicants.map(app => (
            <div key={app.application_ID} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-bold text-xl uppercase">
                  {app.name ? app.name[0] : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{app.name || 'Student Applicant'}</h4>
                    <span className="badge bg-primary-light text-primary text-[10px]">Active Member</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-bold"><Star size={14} fill="currentColor"/> {app.rating || '5.0'}</span>
                    <span>•</span>
                    <span className="text-xs">{app.email}</span>
                  </div>
                  {app.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.skills.split(', ').map((skill, index) => (
                        <span key={index} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {app.status === 'accepted' ? (
                  <span className="badge bg-emerald-100 text-emerald-700 font-bold py-2 px-4 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Hired
                  </span>
                ) : app.status === 'rejected' ? (
                  <span className="badge bg-red-100 text-red-700 font-bold py-2 px-4">
                    Rejected
                  </span>
                ) : (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(app.application_ID, 'Rejected')}
                      className="px-4 py-2 text-danger font-bold text-sm hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    {app.status !== 'shortlisted' && (
                      <button 
                        onClick={() => handleUpdateStatus(app.application_ID, 'Shortlisted')}
                        className="px-4 py-2 text-amber-600 font-bold text-sm bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Shortlist
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(app.application_ID, 'Accepted')}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Hire Student
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-20 text-center">
          <Users size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold">No applicants yet</h3>
          <p className="text-text-secondary">Share your job post to attract more talent.</p>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
