import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import { CATEGORIES, SKILLS_LIST } from '../../data/mockData';
import ChatTab from '../../components/shared/ChatTab';
import { 
  PlusCircle, List, Users, MessageSquare, MapPin, Star, Settings, 
  ChevronRight, ChevronLeft, CreditCard, CheckCircle, Clock, DollarSign,
  Plus, Truck
} from 'lucide-react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { jobs, applications, addJob, updateApplicationStatus, refreshJobs } = useJobs();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  // Payment Modal States
  const [paymentJob, setPaymentJob] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Delivery States
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const fetchDeliveries = async () => {
    setDeliveriesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/delivery/get_deliveries.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        setDeliveries(data.deliveries);
      }
    } catch (err) {
      console.error("Failed to load client deliveries:", err);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentJob) return;
    
    setPaymentLoading(true);
    
    // 1. Validate Card Number (Luhn's Algorithm)
    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length !== 16) {
      alert("Invalid Card Number: Card number must be exactly 16 digits.");
      setPaymentLoading(false);
      return;
    }

    let sum = 0;
    let shouldDouble = false;
    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCard.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    if (sum % 10 !== 0) {
      alert("Invalid Card Number: The card number failed the Luhn algorithm validation check.");
      setPaymentLoading(false);
      return;
    }

    // 2. Validate Expiry Date (MM / YY)
    const expiryMatch = expiryDate.trim().match(/^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/);
    if (!expiryMatch) {
      alert("Invalid Expiry Date format: Must be MM / YY.");
      setPaymentLoading(false);
      return;
    }

    const expMonth = parseInt(expiryMatch[1], 10);
    const expYear = parseInt("20" + expiryMatch[2], 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      alert("Invalid Expiry Date: This credit card has expired.");
      setPaymentLoading(false);
      return;
    }

    // 3. Validate CVV
    const cleanCvv = cvv.replace(/\D/g, '');
    if (cleanCvv.length !== 3 && cleanCvv.length !== 4) {
      alert("Invalid CVV: CVV must be 3 or 4 digits.");
      setPaymentLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/jobs/update_payment_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: paymentJob.id,
          payment_status: 'paid',
          card_number: cleanCard,
          expiry_date: expiryDate.trim(),
          cvv: cleanCvv
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      alert("Payment successful! The job is now fully paid.");
      setPaymentJob(null);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      
      if (refreshJobs) {
        await refreshJobs();
      }
    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

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
      }
    } catch (err) {
      console.error("Failed to fetch profile in dashboard:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchDeliveries();
    if (refreshJobs) {
      refreshJobs();
    }
  }, []);

  const clientJobs = jobs.filter(j => j.clientId === user.id);
  const clientApps = applications.filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return job?.clientId === user.id;
  });

  return (
    <DashboardLayout>
      <Routes>
        <Route path="home" element={<HomeTab user={user} clientJobs={clientJobs} clientApps={clientApps} />} />
        <Route path="post" element={<PostJobTab addJob={addJob} profile={profile} />} />
        <Route path="listings" element={<ListingsTab clientJobs={clientJobs} clientApps={clientApps} onPayJob={setPaymentJob} />} />
        <Route path="applicants" element={<ApplicantsTab clientJobs={clientJobs} updateStatus={updateApplicationStatus} onPayJob={setPaymentJob} />} />
        <Route path="messages" element={<ChatTab />} />
        <Route path="delivery" element={
          <DeliveryTab 
            deliveries={deliveries} 
            loading={deliveriesLoading}
            refreshDeliveries={fetchDeliveries}
          />
        } />
        <Route path="ratings" element={<PlaceholderTab title="Your Ratings" icon={Star} message="View feedback from students you've hired." />} />
        <Route path="settings" element={<SettingsTab user={user} onProfileUpdate={fetchProfile} />} />
        <Route path="*" element={<HomeTab user={user} clientJobs={clientJobs} clientApps={clientApps} />} />
      </Routes>

      {/* Payment Modal */}
      {paymentJob && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-border/80 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary-light/30 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                  💳
                </div>
                <div>
                  <h3 className="font-bold text-lg text-text-primary">Job Payment</h3>
                  <p className="text-xs text-text-muted">{paymentJob.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setPaymentJob(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary hover:bg-slate-200 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-5 rounded-2xl border border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary font-medium">Job Value</span>
                    <span className="font-bold text-text-primary">LKR {paymentJob.pay || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary font-medium">Platform Commission (5%)</span>
                    <span className="font-bold text-primary">LKR {(paymentJob.pay * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between font-bold">
                    <span className="text-text-primary">Total to Pay Now</span>
                    <span className="text-xl text-primary">LKR {(paymentJob.pay * 0.05).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                      <input 
                        type="text" 
                        required
                        className="input-field pl-10 text-sm" 
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expiry Date</label>
                      <input 
                        type="text" 
                        required
                        className="input-field text-sm" 
                        placeholder="MM / YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">CVV</label>
                      <input 
                        type="password" 
                        required
                        className="input-field text-sm" 
                        placeholder="***"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-slate-50 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setPaymentJob(null)}
                  className="btn-secondary py-2 px-4 text-sm font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={paymentLoading}
                  className="btn-primary py-2 px-6 text-sm font-bold flex items-center gap-2"
                >
                  {paymentLoading ? 'Processing...' : 'Pay & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
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

const SettingsTab = ({ user, onProfileUpdate }) => {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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
        setPhone(data.profile.phone || '');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      const data = await response.json();
      if (data && data.success && data.formatted_address) {
        setAddress(data.formatted_address);
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: address })
      });
      const data = await response.json();
      if (data && data.success && data.coordinates) {
        const lat = parseFloat(data.coordinates.latitude);
        const lon = parseFloat(data.coordinates.longitude);
        setLatitude(lat);
        setLongitude(lon);
        if (data.formatted_address) {
          setAddress(data.formatted_address);
        }

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
          phone,
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
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = name;
          localStorage.setItem('user', JSON.stringify(parsed));
          setUser(parsed);
        }
        await fetchProfile();
        if (onProfileUpdate) {
          onProfileUpdate();
        }
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
              {profile?.phone && <p className="text-xs text-text-muted mt-1">📞 {profile.phone}</p>}
              <span className="badge bg-emerald-100 text-emerald-700 mt-2">Verified Job Provider</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
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

const HomeTab = ({ user, clientJobs, clientApps }) => {
  const totalSpent = clientJobs
    .filter(j => j.payment_status === 'paid')
    .reduce((sum, j) => sum + (Number(j.pay) * 0.05), 0);

  return (
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
          { label: 'Amount Spent', value: `LKR ${totalSpent.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
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
};

const PostJobTab = ({ addJob, profile }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    type: 'Remote',
    address: '',
    description: '',
    skills: [],
    duration: 'Few Hours',
    pay: '',
    business_reg_no: '',
    latitude: null,
    longitude: null,
    seekers_needed: 1,
    is_product_based: 0
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [onsiteDurationType, setOnsiteDurationType] = useState('one_day');
  const [workDate, setWorkDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [fromDate, setFromDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toDate, setToDate] = useState('');
  const [toTime, setToTime] = useState('');

  const [remoteDeadlineDate, setRemoteDeadlineDate] = useState('');
  const [remoteDeadlineTime, setRemoteDeadlineTime] = useState('');

  const [customSkill, setCustomSkill] = useState('');

  const handleAddCustomSkill = (e) => {
    if (e) e.preventDefault();
    if (!customSkill.trim()) return;
    const trimmed = customSkill.trim();
    if (!formData.skills.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
    }
    setCustomSkill('');
  };

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (profile?.provider_details) {
      setFormData(prev => ({
        ...prev,
        business_reg_no: profile.provider_details.business_reg_no || prev.business_reg_no,
        address: profile.provider_details.address || prev.address,
        latitude: profile.provider_details.latitude ? parseFloat(profile.provider_details.latitude) : prev.latitude,
        longitude: profile.provider_details.longitude ? parseFloat(profile.provider_details.longitude) : prev.longitude
      }));
    }
  }, [profile]);

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      const data = await response.json();
      if (data && data.success && data.formatted_address) {
        setFormData(prev => ({
          ...prev,
          address: data.formatted_address,
          latitude: lat,
          longitude: lng
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address.trim()) return;
    setLocating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: formData.address })
      });
      const data = await response.json();
      if (data && data.success && data.coordinates) {
        const lat = parseFloat(data.coordinates.latitude);
        const lon = parseFloat(data.coordinates.longitude);
        setFormData(prev => ({
          ...prev,
          address: data.formatted_address || prev.address,
          latitude: lat,
          longitude: lon
        }));

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

  useEffect(() => {
    if (formData.type === 'On-site' && window.L && mapContainerRef.current) {
      const timer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }

        const initialLat = formData.latitude || 6.9812;
        const initialLng = formData.longitude || 81.0763;

        mapRef.current = window.L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapRef.current);

        markerRef.current = window.L.marker([initialLat, initialLng], {
          draggable: true
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', async () => {
          const position = markerRef.current.getLatLng();
          setFormData(prev => ({
            ...prev,
            latitude: position.lat,
            longitude: position.lng
          }));
          await handleReverseGeocode(position.lat, position.lng);
        });

        mapRef.current.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          markerRef.current.setLatLng([lat, lng]);
          await handleReverseGeocode(lat, lng);
        });

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 200);
      }, 100);

      return () => {
        clearTimeout(timer);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, [formData.type]);

  const handleNext = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a job title.");
      return;
    }
    if (formData.type === 'On-site') {
      if (!formData.business_reg_no || !formData.business_reg_no.trim()) {
        alert("Business Registration Number is required for On-site jobs.");
        return;
      }
      if (!formData.address.trim()) {
        alert("Address is required for On-site jobs.");
        return;
      }
      
      if (onsiteDurationType === 'one_day') {
        if (!workDate) { alert("Please select the work date."); return; }
        if (!startTime) { alert("Please select the start time."); return; }
        if (!endTime) { alert("Please select the end time."); return; }
      } else {
        if (!fromDate) { alert("Please select the starting date."); return; }
        if (!fromTime) { alert("Please select the starting time."); return; }
        if (!toDate) { alert("Please select the ending date."); return; }
        if (!toTime) { alert("Please select the ending time."); return; }
        
        const start = new Date(fromDate);
        const end = new Date(toDate);
        if (end < start) {
          alert("Ending date must be on or after starting date.");
          return;
        }
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 7) {
          alert("Maximum work days allowed is 7 days.");
          return;
        }
      }
    } else {
      // Remote job
      if (!remoteDeadlineDate) { alert("Please select the deadline date."); return; }
      if (!remoteDeadlineTime) { alert("Please select the deadline time."); return; }
    }
    
    if (!formData.description.trim()) {
      alert("Please enter a job description.");
      return;
    }
    if (!formData.pay || parseFloat(formData.pay) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    
    await handleSubmit();
  };
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalJobData = { ...formData };
      
      if (formData.type === 'On-site') {
        if (onsiteDurationType === 'one_day') {
          finalJobData.job_date = workDate;
          finalJobData.start_time = startTime;
          finalJobData.end_time = endTime;
          finalJobData.deadline = `${workDate} ${startTime}`;
          finalJobData.duration = "1 Day";
        } else {
          finalJobData.job_date = `${fromDate} to ${toDate}`;
          finalJobData.start_time = fromTime;
          finalJobData.end_time = toTime;
          finalJobData.deadline = `${fromDate} ${fromTime}`;
          
          const start = new Date(fromDate);
          const end = new Date(toDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          finalJobData.duration = `${diffDays} Days`;
        }
      } else {
        // Remote job
        finalJobData.job_date = null;
        finalJobData.start_time = null;
        finalJobData.end_time = null;
        finalJobData.deadline = `${remoteDeadlineDate} ${remoteDeadlineTime}`;
        finalJobData.duration = "Remote";
      }

      await addJob(finalJobData);
      setStep(2);
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
          {['Job Details', 'Confirmation'].map((s, i) => (
            <span key={i} className={`text-xs font-bold uppercase tracking-widest ${step === i + 1 ? 'text-primary' : 'text-text-muted'}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((step - 1) / 1) * 100}%` }}></div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Job Seekers Needed</label>
                  <input 
                    type="number"
                    min="1"
                    className="input-field"
                    value={formData.seekers_needed}
                    onChange={(e) => setFormData({ ...formData, seekers_needed: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
              </div>

              {formData.type === 'Remote' && (
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between animate-fadeIn">
                  <div>
                    <label className="block text-sm font-bold text-text-primary">Product-Based Job?</label>
                    <span className="text-xs text-text-muted">Select if this job involves creating a physical product that needs delivery</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.is_product_based === 1}
                      onChange={(e) => setFormData({ ...formData, is_product_based: e.target.checked ? 1 : 0 })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              )}

              {/* Business Registration Number Field */}
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">
                  Business Registration Number {formData.type === 'On-site' && <span className="text-red-500 font-bold">*</span>}
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. BR-12345"
                  value={formData.business_reg_no}
                  onChange={(e) => setFormData({ ...formData, business_reg_no: e.target.value })}
                />
                {formData.business_reg_no && formData.business_reg_no.trim().length > 0 && (
                  <p className="text-xs text-primary mt-1.5 font-medium animate-fadeIn">
                    We will verify your business registration number, and then your job post will be approved.
                  </p>
                )}
              </div>

              {formData.type === 'On-site' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">Address</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="input-field pr-10" 
                        placeholder="Enter full address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                      {formData.address && formData.address.trim().length > 0 && (
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
                      <span className="text-xs font-bold text-text-secondary block">Location Map (Drag marker to refine)</span>
                    </div>
                    <div 
                      ref={mapContainerRef} 
                      className="w-full h-48 rounded-2xl border border-border overflow-hidden z-10"
                      style={{ minHeight: '180px' }}
                    />
                  </div>
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
                
                {/* 2 rows of predefined skills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {SKILLS_LIST.slice(0, 10).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSkillToggle(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.skills.includes(s) ? 'bg-primary text-white border-primary' : 'bg-white border-border text-text-secondary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Extra skills input */}
                <div className="flex gap-2 max-w-md mb-4">
                  <input 
                    type="text" 
                    placeholder="Add extra skill (e.g. Photoshop)" 
                    className="input-field py-1.5 text-xs"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill(e);
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="btn-secondary py-1.5 px-4 text-xs font-bold whitespace-nowrap"
                  >
                    + Add Skill
                  </button>
                </div>

                {/* Selected/Custom added skills */}
                {formData.skills.filter(s => !SKILLS_LIST.slice(0, 10).includes(s)).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Extra Skills Added:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.filter(s => !SKILLS_LIST.slice(0, 10).includes(s)).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSkillToggle(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-primary text-white border-primary flex items-center gap-1.5 transition-all hover:bg-danger hover:border-danger"
                          title="Click to remove"
                        >
                          {s} <span className="text-[10px] opacity-70">✕</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
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

              {/* Dynamic Job Date and Time Schedule Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                
                {formData.type === 'On-site' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5">On-site Job Duration</label>
                      <div className="flex gap-6 mt-1">
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-text-secondary">
                          <input 
                            type="radio" 
                            name="onsiteDurationType" 
                            checked={onsiteDurationType === 'one_day'} 
                            onChange={() => setOnsiteDurationType('one_day')} 
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          One Day Work
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-text-secondary">
                          <input 
                            type="radio" 
                            name="onsiteDurationType" 
                            checked={onsiteDurationType === 'multi_day'} 
                            onChange={() => setOnsiteDurationType('multi_day')} 
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          More than 1 Day Work (Max 7 Days)
                        </label>
                      </div>
                    </div>

                    {onsiteDurationType === 'one_day' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Work Date</label>
                          <input 
                            type="date" 
                            className="input-field" 
                            value={workDate}
                            onChange={(e) => setWorkDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">Start Time</label>
                          <input 
                            type="time" 
                            className="input-field" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">End Time</label>
                          <input 
                            type="time" 
                            className="input-field" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-text-secondary">From Date & Time</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="date" 
                              className="input-field" 
                              value={fromDate}
                              onChange={(e) => setFromDate(e.target.value)}
                            />
                            <input 
                              type="time" 
                              className="input-field" 
                              value={fromTime}
                              onChange={(e) => setFromTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-text-secondary">To Date & Time</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="date" 
                              className="input-field" 
                              value={toDate}
                              onChange={(e) => setToDate(e.target.value)}
                            />
                            <input 
                              type="time" 
                              className="input-field" 
                              value={toTime}
                              onChange={(e) => setToTime(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-text-secondary">Application Deadline (Date & Time)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Deadline Date</label>
                        <input 
                          type="date" 
                          className="input-field" 
                          value={remoteDeadlineDate}
                          onChange={(e) => setRemoteDeadlineDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Deadline Time</label>
                        <input 
                          type="time" 
                          className="input-field" 
                          value={remoteDeadlineTime}
                          onChange={(e) => setRemoteDeadlineTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleNext} disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
              {loading ? 'Posting...' : 'Post Job'} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
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

const ListingsTab = ({ clientJobs, clientApps, onPayJob }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-heading font-bold text-text-primary">My Job Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clientJobs.map(job => {
          const selectedCount = clientApps.filter(app => app.jobId === job.id && (app.status === 'accepted' || app.status === 'Accepted' || app.status === 'pending_payment')).length;
          const hiredCount = clientApps.filter(app => app.jobId === job.id && (app.status === 'accepted' || app.status === 'Accepted')).length;
          const seekersNeeded = job.seekers_needed || 1;
          const isFullySelected = selectedCount >= seekersNeeded;
          const hasPendingPayment = clientApps.some(app => app.jobId === job.id && app.status === 'pending_payment');
          const isPaid = job.payment_status === 'paid';

          return (
            <div key={job.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{job.title}</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`badge ${
                      job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                      job.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-primary-light text-primary-dark font-bold'
                    }`}>
                      {job.status === 'Active' ? 'Approved' : job.status}
                    </span>
                    {isFullySelected && (
                      <span className={`badge ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'} text-[10px] font-bold`}>
                        {isPaid ? '✓ Paid' : '⚠️ Unpaid'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-text-secondary mb-6 flex-wrap">
                  <span className="flex items-center gap-1"><Clock size={14}/> {job.duration}</span>
                  <span className="flex items-center gap-1 font-bold text-text-primary">LKR {job.pay}</span>
                  {job.seekers_needed && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold flex-wrap">
                      👥 Hired: {hiredCount} / {seekersNeeded}
                      {selectedCount > hiredCount && (
                        <span className="text-amber-600 text-xs ml-1 font-bold">({selectedCount - hiredCount} Selected, Pending Payment)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-auto">
                <button 
                  onClick={() => navigate('/dashboard/client/applicants', { state: { jobId: job.id } })}
                  className="w-full btn-primary text-sm py-2"
                >
                  View Applicants
                </button>
                {!isPaid && (hasPendingPayment || isFullySelected) && (
                  <button 
                    onClick={() => onPayJob(job)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm animate-pulse"
                  >
                    💳 Pay Platform Commission (LKR {(job.pay * 0.05).toFixed(2)})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ApplicantsTab = ({ clientJobs, updateStatus, onPayJob }) => {
  const location = useLocation();
  const [selectedJobId, setSelectedJobId] = useState(location.state?.jobId || clientJobs[0]?.id || '');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (location.state?.jobId) {
      setSelectedJobId(location.state.jobId);
    }
  }, [location.state?.jobId]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // States for Provider rating and reviewing student
  const [selectedAppForReview, setSelectedAppForReview] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleOpenReview = (app) => {
    setSelectedAppForReview({
      job_ID: app.job_ID,
      student_user_ID: app.student_user_ID,
      student_name: app.name || 'Student'
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
          given_to: selectedAppForReview.student_user_ID,
          score: ratingScore,
          review: reviewText
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Review submitted successfully!');
        handleCloseReview();
        fetchApplicants(selectedJobId);
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

  const fetchApplicants = async (jobId) => {
    if (!jobId) return [];
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
          return data.applicants;
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
    return [];
  };

  const selectedJob = clientJobs.find(j => j.id === selectedJobId);
  const paymentStatus = selectedJob?.payment_status;

  useEffect(() => {
    fetchApplicants(selectedJobId);
  }, [selectedJobId, paymentStatus]);

  const handleUpdateStatus = async (appId, action) => {
    await updateStatus(appId, action);
    const updatedApplicants = await fetchApplicants(selectedJobId);

    if (action === 'Accepted' || action === 'accept') {
      const currentJob = clientJobs.find(j => j.id === selectedJobId);
      if (currentJob && currentJob.payment_status !== 'paid') {
        const seekersNeeded = currentJob.seekers_needed || 1;
        const hiredCount = updatedApplicants.filter(app => app.status === 'accepted' || app.status === 'Accepted' || app.status === 'pending_payment').length;
        if (hiredCount >= seekersNeeded) {
          if (onPayJob) {
            onPayJob(currentJob);
          }
        }
      }
    }
  };

  const filteredApplicants = applicants.filter((app) => {
    if (activeTab === 'All') return true;
    const status = app.status.toLowerCase();
    const tabKey = activeTab.toLowerCase().replace(' ', '_');
    return status === tabKey;
  });

  const statusColors = {
    'applied': 'bg-blue-100 text-blue-700 border border-blue-200',
    'shortlisted': 'bg-amber-100 text-amber-700 border border-amber-200',
    'pending_payment': 'bg-amber-50 text-amber-600 border border-amber-200',
    'accepted': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'completed': 'bg-purple-100 text-purple-700 border border-purple-200',
    'delivered': 'bg-orange-100 text-orange-700 border border-orange-200',
    'rejected': 'bg-rose-100 text-rose-700 border border-rose-200'
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto scrollbar-none">
        {['All', 'Applied', 'Shortlisted', 'Pending Payment', 'Accepted', 'Completed', 'Delivered', 'Rejected'].map((tab) => (
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2 text-sm font-medium">Loading applicants...</p>
        </div>
      ) : filteredApplicants.length > 0 ? (
        <div className="space-y-4">
          {filteredApplicants.map(app => (
            <div key={app.application_ID} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-bold text-xl uppercase">
                  {app.name ? app.name[0] : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{app.name || 'Student Applicant'}</h4>
                    <span className={`badge ${statusColors[app.status.toLowerCase()] || 'bg-slate-100 text-slate-700'} text-[10px]`}>
                      {app.status.toUpperCase()}
                    </span>
                    {app.match_score !== undefined && (
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        🎯 {app.match_score}% Match
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                    {parseFloat(app.rating || 0) === 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">New User</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={14} fill="currentColor"/> {parseFloat(app.rating).toFixed(1)}
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-xs">{app.email}</span>
                  </div>
                  <button
                    onClick={() => setSelectedProfile(app)}
                    className="mt-3 text-xs text-primary font-bold hover:underline flex items-center gap-1.5 bg-primary-light/50 px-3 py-1.5 rounded-lg border border-primary/20 w-fit transition-all hover:bg-primary-light"
                  >
                    👤 View Profile
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {app.status.toLowerCase() === 'completed' ? (
                  parseInt(app.is_product_based) === 1 ? (
                    <span className="badge bg-purple-100 text-purple-700 font-bold py-2 px-4 flex items-center gap-1.5">
                      ⏳ Completed (OTP Verification Pending)
                    </span>
                  ) : parseInt(app.provider_reviewed) > 0 ? (
                    <span className="badge bg-emerald-100 text-emerald-700 font-bold py-2 px-4 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Completed & Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenReview(app)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 animate-pulse"
                    >
                      <CheckCircle size={14} /> Confirm Completion & Rate Student
                    </button>
                  )
                ) : app.status.toLowerCase() === 'accepted' ? (
                  <span className="badge bg-emerald-100 text-emerald-700 font-bold py-2 px-4 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Hired
                  </span>
                ) : app.status.toLowerCase() === 'rejected' ? (
                  <span className="badge bg-red-100 text-red-700 font-bold py-2 px-4">
                    Rejected
                  </span>
                ) : app.status.toLowerCase() === 'pending_payment' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="badge bg-amber-100 text-amber-700 font-bold py-2 px-4 flex items-center gap-1.5">
                      ⏳ Selected (Pending Payment)
                    </span>
                    <button 
                      onClick={() => {
                        const targetJob = clientJobs.find(j => j.id === app.job_ID || j.id === selectedJobId);
                        if (targetJob) onPayJob(targetJob);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    >
                      💳 Pay Commission
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(app.application_ID, 'Rejected')}
                      className="px-4 py-2 text-danger font-bold text-sm hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    {app.status.toLowerCase() === 'applied' && (
                      <button 
                        onClick={() => handleUpdateStatus(app.application_ID, 'shortlist')}
                        className="px-4 py-2 text-amber-600 font-bold text-sm hover:bg-amber-50 rounded-lg transition-colors"
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
          <h3 className="text-xl font-bold">No applicants found</h3>
          <p className="text-text-secondary">No candidates are currently under this status filter.</p>
        </div>
      )}

      {/* Review Modal for Job Provider to review Student */}
      {selectedAppForReview && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleCloseReview} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-text-primary text-lg">Rate & Review Student</h3>
                <p className="text-xs text-text-muted mt-0.5">For {selectedAppForReview.student_name}</p>
              </div>
              <button onClick={handleCloseReview} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-2">Rating Score</label>
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
                <label className="block text-xs font-bold text-text-muted uppercase mb-1.5">Review Message</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all h-24 resize-none"
                  placeholder="Describe the student's work performance and quality..."
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
                {submittingReview ? 'Submitting Review...' : 'Confirm Completion & Submit'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Profile Modal */}
      {selectedProfile && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-border/80 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary-light/30 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-lg uppercase">
                  {selectedProfile.name ? selectedProfile.name[0] : 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-text-primary">{selectedProfile.name}</h3>
                  <p className="text-xs text-text-muted">{selectedProfile.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary hover:bg-slate-200 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Academic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Gender</span>
                  <span className="text-sm font-semibold text-text-secondary">
                    {selectedProfile.gender || 'Not Specified'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Degree / Course</span>
                  <span className="text-sm font-semibold text-text-secondary whitespace-normal break-words block">
                    {selectedProfile.degree || 'Not Specified'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Academic Year</span>
                  <span className="text-sm font-semibold text-text-secondary">
                    {selectedProfile.year || 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Bio & Languages */}
              {selectedProfile.bio && (
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Student Bio</span>
                  <p className="text-sm text-text-secondary bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    "{selectedProfile.bio}"
                  </p>
                </div>
              )}

              {/* Skills */}
              <div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Expertise Skills</span>
                {selectedProfile.skills ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.skills.split(', ').map((skill, index) => (
                      <span key={index} className="text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-lg border border-primary/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-text-muted">No skills listed.</p>
                )}
              </div>

              {/* Languages */}
              {selectedProfile.languages && (
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Languages</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.languages.split(',').map((lang, index) => (
                      <span key={index} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-border/40">
                        {lang.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Job History */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Completed Gig History</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {selectedProfile.completed_jobs_count || 0} completed
                  </span>
                </div>
                {selectedProfile.completed_jobs_list ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedProfile.completed_jobs_list.split(', ').map((title, i) => (
                      <div key={i} className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-text-secondary flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{title}</span>
                        <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100">Success ✓</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-text-muted py-2">This student has not completed any gigs yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedProfile(null)}
                className="btn-secondary py-2 px-6 text-sm font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const DeliveryTab = ({ deliveries, loading, refreshDeliveries }) => {
  const [updating, setUpdating] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});

  const handleVerifyOtp = async (delivery_ID) => {
    const otp = otpInputs[delivery_ID];
    if (!otp || otp.trim().length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/delivery/verify_otp.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_ID, otp: otp.trim() })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.success || 'OTP verified successfully! Job completed.');
        refreshDeliveries();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-2">
            <Truck size={28} className="text-primary" /> Delivery Orders
          </h1>
          <p className="text-text-secondary mt-1">Track deliveries for your product-based gigs.</p>
        </div>
        <button 
          onClick={refreshDeliveries}
          className="btn-secondary py-2 px-4 text-xs font-bold"
        >
          Refresh Deliveries
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2 text-sm font-medium">Loading deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card p-20 text-center">
          <Truck size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold">No product deliveries yet</h3>
          <p className="text-text-secondary">Physical orders requiring self or platform delivery will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveries.map((del) => {
            const isSelf = del.delivery_type === 'self';
            return (
              <div key={del.delivery_ID} className="card p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary-light px-2.5 py-1 rounded-md">
                      {del.delivery_ID}
                    </span>
                    <h3 className="font-bold text-text-primary text-base mt-2">{del.job_title}</h3>
                    <span className={`badge ${
                      del.status === 'delivered'  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      del.status === 'picked_up'  ? 'bg-primary-light text-primary' :
                      del.status === 'assigned'   ? 'bg-primary-light text-primary' :
                      'bg-amber-100 text-amber-700 border border-amber-100'
                    } text-xs font-bold uppercase px-3 py-1 rounded-full mt-1.5 inline-block`}>
                      {del.status === 'pending'   ? '🕐 Preparing / Awaiting Action'
                      : del.status === 'assigned'  ? '🚴 Rider Assigned'
                      : del.status === 'picked_up' ? '📦 Verification Pending / In Transit'
                      : '✅ Delivered'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pl-2 text-xs py-3 border-t border-b border-border">
                  <div>
                    <p className="text-text-muted font-bold uppercase text-[9px] tracking-wider">Pickup Address</p>
                    <p className="font-semibold text-text-secondary mt-0.5">{del.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-text-muted font-bold uppercase text-[9px] tracking-wider">Delivery Destination</p>
                    <p className="font-semibold text-text-secondary mt-0.5">{del.delivery_address}</p>
                  </div>
                </div>

                <div className="pl-2 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-bold">Delivery Mode:</span>
                    <span className="font-bold text-text-secondary capitalize">{del.delivery_type === 'self' ? 'Self Delivery (Student)' : 'Platform Rider'}</span>
                  </div>

                  {del.delivery_type === 'platform' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted font-bold">Rider Staff:</span>
                      <span className="font-bold text-text-secondary">{del.delivery_staff_name || 'Awaiting Admin Assignment'}</span>
                    </div>
                  )}

                  {del.distance && (
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted font-bold">Distance:</span>
                      <span className="font-bold text-text-secondary">{parseFloat(del.distance).toFixed(1)} km</span>
                    </div>
                  )}
                </div>

                {/* Delivery Action Panel for Job Provider */}
                <div className="pt-2 pl-2 border-t border-border">
                  {del.status === 'delivered' ? (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Job and delivery completed successfully.
                    </p>
                  ) : isSelf ? (
                    /* Self Delivery OTP Verification for Job Provider */
                    del.status === 'picked_up' ? (
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-border">
                        <p className="text-[11px] font-bold text-text-secondary">
                          Enter the 6-digit OTP code received by email from the student to complete verification:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInputs[del.delivery_ID] || ''}
                            onChange={(e) => setOtpInputs({ ...otpInputs, [del.delivery_ID]: e.target.value })}
                            className="flex-1 px-3 py-2 bg-white border border-border rounded-xl text-center font-bold tracking-widest text-sm focus:border-primary outline-none"
                          />
                          <button
                            onClick={() => handleVerifyOtp(del.delivery_ID)}
                            disabled={updating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition-all"
                          >
                            Verify & Complete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        ⏳ Awaiting student to mark the job done and generate the OTP.
                      </p>
                    )
                  ) : (
                    /* Platform Delivery Status updates */
                    del.status === 'pending' ? (
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        ⏳ Student is currently preparing the product. Once completed, they will mark it ready.
                      </p>
                    ) : del.status === 'assigned' ? (
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        🚴 Rider assigned. Product is being picked up.
                      </p>
                    ) : del.status === 'picked_up' ? (
                      <p className="text-xs text-primary font-bold bg-primary-light border border-primary/20 rounded-xl px-3 py-2">
                        🚴 Rider is currently delivering the product to your destination.
                      </p>
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
