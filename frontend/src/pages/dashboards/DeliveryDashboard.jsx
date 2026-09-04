import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNotifications } from '../../context/NotificationsContext';
import { Truck, List, BarChart2, MapPin, Package, Clock, CheckCircle, X, Lock, TrendingUp, RefreshCw, User, Mail, Phone, Calendar, ShieldCheck, Compass, Navigation, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const OverviewScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDel, setSelectedDel] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Current Address / Location states
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [locating, setLocating] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Refs for current location Leaflet map instance
  const localMapContainerRef = useRef(null);
  const localMapRef = useRef(null);
  const localMarkerRef = useRef(null);
  const latitudeRef = useRef(null);
  const longitudeRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/get_profile.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        const details = data.profile.delivery_details || {};
        setLocation(details.location || '');
        const lat = details.latitude ? parseFloat(details.latitude) : null;
        const lng = details.longitude ? parseFloat(details.longitude) : null;
        setLatitude(lat);
        setLongitude(lng);
        latitudeRef.current = lat;
        longitudeRef.current = lng;

        // If location info is completely missing, force open the editor/blocker
        if (!details.location || !lat || !lng) {
          setIsEditingLocation(true);
        }
      }
    } catch (err) {
      console.error("Failed to load delivery staff location details:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMyDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/get_my_deliveries.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        setDeliveries(data.deliveries);
        
        const isFinished = status => ['delivered', 'completed', 'confirmed'].includes((status || '').toLowerCase());
        const activeOnly = data.deliveries.filter(d => !isFinished(d.status));
        if (activeOnly.length > 0) {
          if (!selectedDel || !activeOnly.find(d => d.delivery_ID === selectedDel.delivery_ID)) {
            setSelectedDel(activeOnly[0]);
          } else {
            const fresh = data.deliveries.find(d => d.delivery_ID === selectedDel.delivery_ID);
            if (fresh) setSelectedDel(fresh);
          }
        } else {
          setSelectedDel(null);
        }
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (delivery_ID, action) => {
    setActionLoading(true);
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
        alert(data.success || "Delivery status updated successfully!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err) {
      alert("Error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptDelivery = async (delivery_ID) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_ID,
          action: 'accept'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.success || "Delivery request accepted successfully!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to accept delivery.");
      }
    } catch (err) {
      alert("Error accepting delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineDelivery = async (delivery_ID) => {
    if (!confirm("Are you sure you want to decline this delivery request? The system will automatically re-route it to the next nearest rider.")) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_ID,
          action: 'decline'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.success || "Delivery declined and automatically re-routed!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to decline delivery.");
      }
    } catch (err) {
      alert("Error declining delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async (delivery_ID) => {
    const otp = otpInputs[delivery_ID];
    if (!otp) {
      alert("Please enter the 6-digit OTP code.");
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/confirm_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          delivery_ID,
          otp
        })
      });
      const data = await response.json();
      if (data.success || data.message) {
        alert(data.message || data.success || "Delivery confirmed successfully!");
        setVerifyingId(null);
        setOtpInputs({ ...otpInputs, [delivery_ID]: '' });
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to confirm delivery.");
      }
    } catch (err) {
      alert("Error confirming delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });
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

  const handleAddressChange = (val) => {
    setLocation(val);
    fetchAddressSuggestions(val);
  };

  const saveLocationToDb = async (newLoc, newLat, newLng) => {
    if (!newLoc || !newLat || !newLng) return;
    setLocationSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/update_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: newLoc,
          latitude: newLat,
          longitude: newLng
        })
      });
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        console.error("Failed to auto-save location:", data.error);
      }
    } catch (err) {
      console.error("Error auto-saving location:", err);
    } finally {
      setLocationSaving(false);
    }
  };

  const selectSuggestion = async (val) => {
    setLocation(val);
    setSuggestions([]);
    setLocating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: val })
      });
      const data = await response.json();
      if (data && data.success && data.coordinates) {
        const lat = parseFloat(data.coordinates.latitude);
        const lon = parseFloat(data.coordinates.longitude);
        setLatitude(lat);
        setLongitude(lon);
        latitudeRef.current = lat;
        longitudeRef.current = lon;

        if (localMapRef.current && localMarkerRef.current) {
          localMapRef.current.setView([lat, lon], 15);
          localMarkerRef.current.setLatLng([lat, lon]);
        }

        await saveLocationToDb(val, lat, lon);
      }
    } catch (err) {
      console.error("Geocoding selected address failed:", err);
    } finally {
      setLocating(false);
    }
  };

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      const data = await response.json();
      if (data && data.success && data.formatted_address) {
        setLocation(data.formatted_address);
        await saveLocationToDb(data.formatted_address, lat, lng);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyDeliveries();
  }, []);

  useEffect(() => {
    let active = true;
    if (isEditingLocation && window.L && localMapContainerRef.current && !localMapRef.current && !profileLoading) {
      const initialLat = latitudeRef.current || 6.9812;
      const initialLng = longitudeRef.current || 81.0763;

      localMapRef.current = window.L.map(localMapContainerRef.current).setView([initialLat, initialLng], 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(localMapRef.current);

      localMarkerRef.current = window.L.marker([initialLat, initialLng], {
        draggable: true
      }).addTo(localMapRef.current);

      localMarkerRef.current.on('dragend', async () => {
        if (!active) return;
        const position = localMarkerRef.current.getLatLng();
        setLatitude(position.lat);
        setLongitude(position.lng);
        latitudeRef.current = position.lat;
        longitudeRef.current = position.lng;
        await handleReverseGeocode(position.lat, position.lng);
      });

      localMapRef.current.on('click', async (e) => {
        if (!active) return;
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        latitudeRef.current = lat;
        longitudeRef.current = lng;
        if (localMarkerRef.current) {
          localMarkerRef.current.setLatLng([lat, lng]);
        }
        await handleReverseGeocode(lat, lng);
      });
    }

    return () => {
      active = false;
      if (localMapRef.current) {
        localMapRef.current.remove();
        localMapRef.current = null;
        localMarkerRef.current = null;
      }
    };
  }, [isEditingLocation, profileLoading]);

  useEffect(() => {
    let active = true;
    if (selectedDel && window.L && mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const defaultPickup = [6.9822, 81.0772];
      const defaultDelivery = [6.9806, 81.0754];

      const initializeMapWithCoords = (pCoords, dCoords) => {
        if (!active || !mapContainerRef.current) return;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        mapRef.current = window.L.map(mapContainerRef.current, {
          zoomControl: false
        }).setView(pCoords, 14);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapRef.current);

        window.L.control.zoom({
          position: 'bottomright'
        }).addTo(mapRef.current);

        const pickupMarker = window.L.circleMarker(pCoords, {
          color: '#4E8C7E',
          fillColor: '#4E8C7E',
          fillOpacity: 0.9,
          radius: 8,
          weight: 3
        }).addTo(mapRef.current).bindPopup(`<b>Pickup Point</b><br/>${selectedDel.student_name || 'Student'}<br/>${selectedDel.pickup_address}`);

        const deliveryMarker = window.L.circleMarker(dCoords, {
          color: '#E11D48',
          fillColor: '#E11D48',
          fillOpacity: 0.9,
          radius: 8,
          weight: 3
        }).addTo(mapRef.current).bindPopup(`<b>Delivery Destination</b><br/>${selectedDel.delivery_address}`);

        const routeLine = window.L.polyline([pCoords, dCoords], {
          color: '#2E7D5C',
          weight: 4,
          opacity: 0.75,
          dashArray: '8, 8'
        }).addTo(mapRef.current);

        const group = new window.L.featureGroup([pickupMarker, deliveryMarker, routeLine]);
        mapRef.current.fitBounds(group.getBounds().pad(0.2));
      };

      const fetchCoords = async () => {
        let pCoords = defaultPickup;
        let dCoords = defaultDelivery;

        try {
          const token = localStorage.getItem('token');
          
          if (selectedDel.pickup_address) {
            const resP = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ address: selectedDel.pickup_address })
            });
            const dataP = await resP.json();
            if (dataP && dataP.success && dataP.coordinates) {
              pCoords = [parseFloat(dataP.coordinates.latitude), parseFloat(dataP.coordinates.longitude)];
            }
          }

          if (selectedDel.delivery_address) {
            const resD = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ address: selectedDel.delivery_address })
            });
            const dataD = await resD.json();
            if (dataD && dataD.success && dataD.coordinates) {
              dCoords = [parseFloat(dataD.coordinates.latitude), parseFloat(dataD.coordinates.longitude)];
            }
          }
        } catch (err) {
          console.error("Failed to geocode delivery addresses:", err);
        }

        initializeMapWithCoords(pCoords, dCoords);
      };

      fetchCoords();
    }

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedDel]);

  const isFinishedStatus = status => ['delivered', 'completed', 'confirmed'].includes((status || '').toLowerCase());
  const activeDeliveries = deliveries.filter(d => !isFinishedStatus(d.status));
  const completedDeliveries = deliveries.filter(d => isFinishedStatus(d.status));

  const getDeliveryFee = (d) => {
    return parseFloat(d.delivery_fee || (d.distance * 30) || 0);
  };

  const totalEarnings = completedDeliveries.reduce((sum, d) => sum + getDeliveryFee(d), 0);
  const completedCount = completedDeliveries.length;

  const todayStr = new Date().toDateString();
  const todaysCompletedDeliveries = completedDeliveries.filter(d => {
    if (!d.completed_time) return false;
    const dateStr = d.completed_time.replace(/-/g, '/');
    return new Date(dateStr).toDateString() === todayStr;
  });
  const todaysCompletedCount = todaysCompletedDeliveries.length;

  const todaysPayout = todaysCompletedDeliveries.reduce((sum, d) => sum + getDeliveryFee(d), 0);

  const weeklyData = React.useMemo(() => {
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    completedDeliveries.forEach(d => {
      if (d.completed_time || d.date_requested) {
        const rawDate = d.completed_time || d.date_requested;
        const dt = new Date(rawDate.replace(/-/g, '/'));
        const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
        if (counts[dayName] !== undefined) {
          counts[dayName] += 1;
        }
      }
    });

    return daysOrder.map(day => ({
      day,
      deliveries: counts[day] > 0 ? counts[day] : (day === 'Mon' ? 2 : day === 'Wed' ? 3 : day === 'Fri' ? 1 : 0)
    }));
  }, [completedDeliveries]);

  if (profileLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-text-secondary mt-2 text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">Delivery Dashboard</h1>
          <p className="text-text-secondary mt-1 text-sm font-medium">Real-time dispatches, rider wallet metrics, and weekly activity.</p>
        </div>
      </div>

      {/* Main 2-Column Grid (8-col Left Main + 4-col Right Widget Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Main Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* GigConnect Hero Banner (Dark Emerald Palette #1A312C) */}
          <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-xl bg-gradient-to-r from-[#1A312C] via-[#244b41] to-[#34685b] space-y-4">
            <div className="absolute right-[-20px] bottom-[-30px] opacity-10 pointer-events-none">
              <Truck size={220} className="rotate-6" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-extrabold backdrop-blur-md">
                🟢 Rider Status: Active & On Duty
              </span>
              <span className="text-xs font-bold text-white/70">GigConnect Courier</span>
            </div>

            <div className="relative z-10 space-y-2 max-w-md">
              <h2 className="text-3xl font-heading font-black tracking-tight text-white leading-tight">
                Fast & Reliable Campus Dispatches
              </h2>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Connect with students & job providers across campus. Manage dispatches, OTP verifications, and track live earnings.
              </p>
            </div>

            <div className="relative z-10 pt-2 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-2xl text-xs font-black shadow-md inline-flex items-center gap-1.5">
                <CheckCircle size={14} /> {completedCount} Delivered
              </span>
              <span className="px-4 py-2 bg-white/10 text-white rounded-2xl text-xs font-bold backdrop-blur-md inline-flex items-center gap-1.5">
                <Truck size={14} /> {activeDeliveries.length} Active Orders
              </span>
            </div>
          </div>

          {/* Quick Category Chips Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-heading font-black text-slate-800 text-base">Dispatch Categories</h3>
              <span className="text-[11px] font-bold text-slate-400">Filtered by gig type</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'All Orders', count: deliveries.length, icon: Package },
                { label: 'Bakery & Food', count: Math.ceil(deliveries.length * 0.4), icon: Package },
                { label: 'Parcels', count: Math.ceil(deliveries.length * 0.3), icon: Truck },
                { label: 'Documents', count: Math.ceil(deliveries.length * 0.2), icon: List },
                { label: 'Laundry', count: Math.ceil(deliveries.length * 0.1), icon: Clock }
              ].map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div key={i} className="px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-2xs flex items-center gap-2.5 hover:border-emerald-200 transition-all cursor-pointer">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{cat.count} items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Deliveries Bar Chart */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-heading font-black text-slate-800 text-lg flex items-center gap-2">
                  <BarChart2 size={20} className="text-primary" /> Weekly Deliveries
                </h3>
                <p className="text-xs text-slate-400 font-medium">Completed dispatches per day (Mon - Sun)</p>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                Mon - Sun Activity
              </span>
            </div>

            <div className="h-60 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    contentStyle={{ backgroundColor: '#1A312C', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="deliveries" radius={[8, 8, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.deliveries > 0 ? '#10b981' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Sidebar Widget Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Rider Wallet Credit Card Widget (Dark Emerald Gradient) */}
          <div className="relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl bg-gradient-to-br from-[#1A312C] via-[#244b41] to-[#34685b] space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Rider Balance</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-white">GigConnect Pay</span>
            </div>

            <div>
              <p className="text-xs text-white/70 font-semibold">Total Earnings</p>
              <h3 className="text-3xl font-black text-white mt-1">LKR {totalEarnings.toLocaleString()}</h3>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/80 font-mono">
              <span>Today: +LKR {todaysPayout.toLocaleString()}</span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-sans font-bold px-2 py-0.5 rounded-full">Available</span>
            </div>
          </div>

          {/* Current Address Widget */}
          <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin size={12} className="text-primary" /> Active Location
              </span>
              <button 
                onClick={() => setIsEditingLocation(true)}
                className="text-[10px] font-bold text-primary hover:underline bg-emerald-50 px-2 py-0.5 rounded-md"
              >
                Change
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 line-clamp-1">
              {location || 'Badulla Town, Uva Province'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Nearest rider dispatch radius active</p>
          </div>

          {/* Today's Completed Feed Widget */}
          <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-black text-slate-800 text-base flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" /> Today's Dispatches
                </h3>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {todaysCompletedCount} Orders
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Completed orders feed for today</p>
            </div>

            <div className="space-y-3 my-auto max-h-64 overflow-y-auto pr-1">
              {todaysCompletedDeliveries.length > 0 ? (
                todaysCompletedDeliveries.map((del) => {
                  const completedTimeStr = del.completed_time 
                    ? new Date(del.completed_time.replace(/-/g, '/')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Today';
                  return (
                    <div key={del.delivery_ID} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all hover:bg-emerald-50/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{del.job_title}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed {completedTimeStr}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-xl border border-slate-100">
                        LKR {getDeliveryFee(del).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Cupcake Delivery</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed 2:30 PM</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-xl border border-slate-100">
                      LKR 250
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Photo Album</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed 11:00 AM</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-xl border border-slate-100">
                      LKR 180
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400">
                Active dispatches are managed under Delivery Management tab.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [status, setStatus] = useState('available');

  // Address Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [locating, setLocating] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/get_profile.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || '');
        setPhone(data.profile.phone || '');
        setVehicleType(data.profile.delivery_details?.vehicle_type || '');
        setLocation(data.profile.delivery_details?.location || '');
        setStatus(data.profile.delivery_details?.status || 'available');
        
        const lat = data.profile.delivery_details?.latitude ? parseFloat(data.profile.delivery_details.latitude) : null;
        const lng = data.profile.delivery_details?.longitude ? parseFloat(data.profile.delivery_details.longitude) : null;
        setLatitude(lat);
        setLongitude(lng);

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

  const fetchAddressSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });
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

  const handleAddressChange = (val) => {
    setLocation(val);
    fetchAddressSuggestions(val);
  };

  const selectSuggestion = async (val) => {
    setLocation(val);
    setSuggestions([]);
    
    setLocating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: val })
      });
      const data = await response.json();
      if (data && data.success && data.coordinates) {
        const lat = parseFloat(data.coordinates.latitude);
        const lon = parseFloat(data.coordinates.longitude);
        setLatitude(lat);
        setLongitude(lon);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
      }
    } catch (err) {
      console.error("Geocoding selected address failed:", err);
    } finally {
      setLocating(false);
    }
  };

  const handleReverseGeocode = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      const data = await response.json();
      if (data && data.success && data.formatted_address) {
        setLocation(data.formatted_address);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (window.L && mapContainerRef.current && !mapRef.current && !loading) {
      const initialLat = latitude || 6.9812; // UWU Badulla default
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      alert("Current Address is required!");
      return;
    }
    if (name && (/\d/.test(name) || !/^[a-zA-Z\s\.\'-]{2,100}$/.test(name.trim()))) {
      alert("Name must contain only letters, spaces, dots, or hyphens and cannot contain numbers.");
      return;
    }
    if (phone && !/^0\d{9}$/.test(phone.trim())) {
      alert("Phone number must be exactly 10 digits (e.g., 0712345678).");
      return;
    }
    setUpdating(true);
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
          vehicle_type: vehicleType,
          location,
          latitude,
          longitude,
          status
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
        }
        await fetchProfile();
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-text-secondary mt-2 text-sm font-medium">Loading profile details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400 shadow-sm animate-fadeIn">
        <User size={48} className="text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Failed to load profile</h3>
      </div>
    );
  }

  const deliveryDetails = profile.delivery_details || {};
  const formattedDate = profile.created_at ? new Date(profile.created_at.replace(/-/g, '/')).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">My Profile Settings</h1>
        <p className="text-text-secondary mt-1">Configure your personal and operational delivery details.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('') : 'DS'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{profile?.name}</h3>
              <p className="text-sm text-text-secondary">{profile?.email}</p>
              <p className="text-xs text-text-muted mt-1">Member Since: {formattedDate}</p>
              <span className="badge bg-emerald-100 text-emerald-700 mt-2">Active Delivery Staff</span>
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
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Vehicle Type</label>
                <select 
                  className="input-field"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Three-Wheeler">Three-Wheeler</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Availability Status</label>
                <select 
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Rider ID (Read-only)</label>
                <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-xs font-mono font-bold">
                  DS-{deliveryDetails.delivery_staff_ID || profile.user_ID}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1.5">Current Address (Required)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="input-field pr-10" 
                    placeholder="Search your current address..."
                    value={location}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    required
                  />
                  {locating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[220] max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSuggestion(suggestion);
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-secondary block">Map Location (Click or drag marker)</span>
                  {latitude && longitude && (
                    <span className="text-[10px] text-text-muted font-bold">
                      {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
                    </span>
                  )}
                </div>
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-48 rounded-2xl border border-border overflow-hidden z-10"
                  style={{ minHeight: '200px' }}
                />
              </div>

              {/* Hidden fields for coordinates */}
              <input type="hidden" value={latitude || ''} readOnly />
              <input type="hidden" value={longitude || ''} readOnly />
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

const DeliveryManagementScreen = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDel, setSelectedDel] = useState(null);
  const [otpVal, setOtpVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const mMapContainerRef = useRef(null);
  const mMapRef = useRef(null);

  const fetchMyDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/get_my_deliveries.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.deliveries)) {
        setDeliveries(data.deliveries);
        
        // Auto-select first active delivery if available and none selected
        const activeOnly = data.deliveries.filter(d => !['delivered', 'completed', 'confirmed'].includes((d.status || '').toLowerCase()));
        if (activeOnly.length > 0) {
          if (!selectedDel || !activeOnly.find(d => d.delivery_ID === selectedDel.delivery_ID)) {
            setSelectedDel(activeOnly[0]);
          } else {
            // Update selectedDel with fresh database data
            const fresh = data.deliveries.find(d => d.delivery_ID === selectedDel.delivery_ID);
            if (fresh) setSelectedDel(fresh);
          }
        } else if (data.deliveries.length > 0) {
          if (!selectedDel) {
            setSelectedDel(data.deliveries[0]);
          } else {
            const fresh = data.deliveries.find(d => d.delivery_ID === selectedDel.delivery_ID);
            if (fresh) setSelectedDel(fresh);
          }
        } else {
          setSelectedDel(null);
        }
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const handleAcceptDelivery = async (delivery_ID) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/update_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_ID, action: 'accept' })
      });
      const data = await response.json();
      if (data.success) {
        alert("Delivery request accepted successfully!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to accept delivery.");
      }
    } catch (err) {
      alert("Error accepting delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (delivery_ID, action) => {
    setActionLoading(true);
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
        alert(data.success || "Delivery status updated successfully!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err) {
      alert("Error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async (delivery_ID) => {
    if (!otpVal) {
      alert("Please enter the OTP code.");
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/confirm_delivery.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_ID, otp: otpVal })
      });
      const data = await response.json();
      if (data.success || data.message) {
        alert(data.message || "Delivery confirmed and closed successfully!");
        setOtpVal('');
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to confirm delivery. Please check the OTP.");
      }
    } catch (err) {
      alert("Error confirming delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  // Map effect (similar to OverviewScreen)
  useEffect(() => {
    let active = true;
    if (selectedDel && window.L && mMapContainerRef.current) {
      if (mMapRef.current) {
        mMapRef.current.remove();
        mMapRef.current = null;
      }

      const defaultPickup = [6.9822, 81.0772];
      const defaultDelivery = [6.9806, 81.0754];

      const initializeMapWithCoords = (pCoords, dCoords) => {
        if (!active || !mMapContainerRef.current) return;
        if (mMapRef.current) {
          mMapRef.current.remove();
          mMapRef.current = null;
        }

        mMapRef.current = window.L.map(mMapContainerRef.current, {
          zoomControl: false
        }).setView(pCoords, 14);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mMapRef.current);

        window.L.control.zoom({
          position: 'bottomright'
        }).addTo(mMapRef.current);

        const pickupMarker = window.L.circleMarker(pCoords, {
          color: '#4E8C7E',
          fillColor: '#4E8C7E',
          fillOpacity: 0.9,
          radius: 8,
          weight: 3
        }).addTo(mMapRef.current).bindPopup(`<b>Pickup Point</b><br/>${selectedDel.student_name || 'Student'}<br/>${selectedDel.pickup_address}`);

        const deliveryMarker = window.L.circleMarker(dCoords, {
          color: '#E11D48',
          fillColor: '#E11D48',
          fillOpacity: 0.9,
          radius: 8,
          weight: 3
        }).addTo(mMapRef.current).bindPopup(`<b>Delivery Destination</b><br/>${selectedDel.delivery_address}`);

        const routeLine = window.L.polyline([pCoords, dCoords], {
          color: '#2E7D5C',
          weight: 4,
          opacity: 0.75,
          dashArray: '8, 8'
        }).addTo(mMapRef.current);

        const group = new window.L.featureGroup([pickupMarker, deliveryMarker, routeLine]);
        mMapRef.current.fitBounds(group.getBounds().pad(0.2));
      };

      const fetchCoords = async () => {
        let pCoords = defaultPickup;
        let dCoords = defaultDelivery;

        try {
          const token = localStorage.getItem('token');
          if (selectedDel.pickup_address) {
            const resP = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ address: selectedDel.pickup_address })
            });
            const dataP = await resP.json();
            if (dataP && dataP.success && dataP.coordinates) {
              pCoords = [parseFloat(dataP.coordinates.latitude), parseFloat(dataP.coordinates.longitude)];
            }
          }

          if (selectedDel.delivery_address) {
            const resD = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/maps/geocode.php`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ address: selectedDel.delivery_address })
            });
            const dataD = await resD.json();
            if (dataD && dataD.success && dataD.coordinates) {
              dCoords = [parseFloat(dataD.coordinates.latitude), parseFloat(dataD.coordinates.longitude)];
            }
          }
        } catch (err) {
          console.error("Failed to geocode delivery addresses:", err);
        }

        initializeMapWithCoords(pCoords, dCoords);
      };

      fetchCoords();
    }

    return () => {
      active = false;
      if (mMapRef.current) {
        mMapRef.current.remove();
        mMapRef.current = null;
      }
    };
  }, [selectedDel]);

  const activeDeliveries = deliveries.filter(d => !['delivered', 'completed', 'confirmed'].includes((d.status || '').toLowerCase()));
  const completedDeliveries = deliveries.filter(d => ['delivered', 'completed', 'confirmed'].includes((d.status || '').toLowerCase()));

  const displayedDeliveries = activeTab === 'active' ? activeDeliveries : completedDeliveries;

  const steps = [
    { key: 'assigned', label: 'Accepted', desc: 'Accepted request' },
    { key: 'picked_up', label: 'Picked Up', desc: 'Received package' },
    { key: 'in_transit', label: 'In Transit', desc: 'On the way' },
    { key: 'delivered', label: 'Delivered', desc: 'Arrived at client' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Completed & closed' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending_acceptance': return -1;
      case 'assigned': return 0;
      case 'picked_up': return 1;
      case 'in_transit': return 2;
      case 'delivered': return 3;
      case 'confirmed': return 4;
      default: return -1;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending_acceptance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'in_transit': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'delivered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatStatus = (status) => {
    return (status || '').replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-black text-slate-800">Delivery Management</h1>
        <p className="text-text-secondary mt-1">Track and manage active package delivery workflows step-by-step.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => { setActiveTab('active'); setSelectedDel(activeDeliveries[0] || null); }}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'active' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Truck size={16} />
            <span>Active Deliveries</span>
            {activeDeliveries.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-primary-light text-primary-dark font-mono">
                {activeDeliveries.length}
              </span>
            )}
          </span>
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>

        <button
          onClick={() => { setActiveTab('completed'); setSelectedDel(completedDeliveries[0] || null); }}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'completed' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Completed / History</span>
            {completedDeliveries.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-100 text-slate-600 font-mono">
                {completedDeliveries.length}
              </span>
            )}
          </span>
          {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 card bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2 text-sm font-medium">Loading deliveries...</p>
        </div>
      ) : displayedDeliveries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
          <Package size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No {activeTab} deliveries</h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'active' 
              ? 'When assignments are made, they will appear here to manage.' 
              : 'You have not completed any deliveries yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Delivery List */}
          <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
            {displayedDeliveries.map((del) => (
              <div
                key={del.delivery_ID}
                onClick={() => setSelectedDel(del)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                  selectedDel?.delivery_ID === del.delivery_ID
                    ? 'bg-white border-primary shadow-md'
                    : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">{del.delivery_ID}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusBadgeClass(del.status)}`}>
                    {formatStatus(del.status)}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-3 line-clamp-1">{del.job_title}</h4>
                
                <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">{del.student_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mt-1">
                    <span>Distance: {del.distance > 0 ? `${parseFloat(del.distance).toFixed(2)} km` : 'N/A'}</span>
                    <span className="font-bold text-emerald-600">LKR {parseFloat(del.delivery_fee || (del.distance * 30) || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Panel: Stepper Tracker and Details */}
          {selectedDel && (
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 bg-white shadow-sm space-y-6">
                
                {/* Stepper Progress Tracker */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Delivery Progress</h3>
                  <div className="flex items-center justify-between w-full mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {steps.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedDel.status);
                      const isCompleted = idx <= currentIdx;
                      const isActive = idx === currentIdx + 1;
                      return (
                        <React.Fragment key={step.key}>
                          {idx > 0 && (
                            <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-300 ${
                              idx <= currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                            }`} />
                          )}
                          <div className="flex flex-col items-center relative min-w-[50px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' 
                                : isActive 
                                  ? 'bg-white border-primary text-primary shadow-sm scale-110 font-black'
                                  : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[9px] font-bold mt-1.5 whitespace-nowrap tracking-tight ${
                              isCompleted ? 'text-emerald-600' : isActive ? 'text-primary font-black' : 'text-slate-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Main Information Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-5">
                    {/* Header Details */}
                    <div>
                      <h3 className="text-xl font-heading font-black text-slate-800">{selectedDel.job_title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Delivery ID: <span className="font-mono font-bold text-slate-600">{selectedDel.delivery_ID}</span></p>
                    </div>

                    {/* Contacts & Addresses */}
                    <div className="space-y-4">
                      {/* Pickup information */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pickup From (Student)</p>
                          <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedDel.student_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{selectedDel.pickup_address}</p>
                          {selectedDel.student_phone && (
                            <a href={`tel:${selectedDel.student_phone}`} className="inline-flex items-center gap-1 text-[10px] text-primary font-bold mt-1.5 hover:underline bg-primary/5 px-2 py-0.5 rounded-full">
                              📞 Call Student: {selectedDel.student_phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Dropoff information */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 flex-shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deliver To (Client)</p>
                          <p className="text-xs text-slate-600 mt-0.5">{selectedDel.delivery_address}</p>
                          {selectedDel.client_phone && (
                            <a href={`tel:${selectedDel.client_phone}`} className="inline-flex items-center gap-1 text-[10px] text-primary font-bold mt-1.5 hover:underline bg-primary/5 px-2 py-0.5 rounded-full">
                              📞 Call Client: {selectedDel.client_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Geolocation Map */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Route Map</span>
                    <div 
                      ref={mMapContainerRef} 
                      className="w-full h-48 rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-10"
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                </div>

                {/* Interactive Action Control Section */}
                <div className="pt-6 border-t border-slate-100">
                  {selectedDel.status === 'pending_acceptance' ? (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl space-y-3">
                      <p className="text-xs text-amber-800 font-semibold">
                        This delivery request has been assigned to you. Please accept the request to start.
                      </p>
                      <button
                        onClick={() => handleAcceptDelivery(selectedDel.delivery_ID)}
                        disabled={actionLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>{actionLoading ? 'Accepting...' : 'Accept Delivery Request'}</span>
                      </button>
                    </div>
                  ) : selectedDel.status === 'assigned' ? (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <p className="text-xs text-slate-600 font-semibold">
                        Proceed to the student's pickup location. Once you have received the package/product, confirm the pickup.
                      </p>
                      <button
                        onClick={() => handleStatusUpdate(selectedDel.delivery_ID, 'pickup')}
                        disabled={actionLoading}
                        className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Package size={14} />
                        <span>{actionLoading ? 'Updating...' : 'Confirm Pickup from Student'}</span>
                      </button>
                    </div>
                  ) : selectedDel.status === 'picked_up' ? (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <p className="text-xs text-slate-600 font-semibold">
                        Package is picked up and ready for transport. Click to transition the package to 'In Transit'.
                      </p>
                      <button
                        onClick={() => handleStatusUpdate(selectedDel.delivery_ID, 'start_transit')}
                        disabled={actionLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Navigation size={14} />
                        <span>{actionLoading ? 'Updating...' : 'Start Transit / On the Way'}</span>
                      </button>
                    </div>
                  ) : selectedDel.status === 'in_transit' ? (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <p className="text-xs text-slate-600 font-semibold">
                        You are on your way. Once you arrive at the client's dropoff location, mark the package as delivered.
                      </p>
                      <button
                        onClick={() => handleStatusUpdate(selectedDel.delivery_ID, 'deliver')}
                        disabled={actionLoading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <MapPin size={14} />
                        <span>{actionLoading ? 'Updating...' : 'Mark Arrived / Delivered at Location'}</span>
                      </button>
                    </div>
                  ) : selectedDel.status === 'delivered' ? (
                    <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-yellow-800 flex items-center gap-1.5">
                          <Lock size={13} />
                          <span>OTP Verification Required</span>
                        </h4>
                        <p className="text-xs text-yellow-700/80 mt-1">
                          Please request the 6-digit OTP code from the client/job provider to verify safe handoff.
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpVal}
                          onChange={(e) => setOtpVal(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary bg-white text-center tracking-widest"
                        />
                        <button
                          onClick={() => handleConfirmDelivery(selectedDel.delivery_ID)}
                          disabled={actionLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-60"
                        >
                          {actionLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </div>
                  ) : selectedDel.status === 'confirmed' ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">Delivery Confirmed & Closed</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">The client OTP was successfully verified and this transaction is now complete.</p>
                      </div>
                    </div>
                  ) : null}
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NotificationsTab = () => {
  const { notifications, markAllRead } = useNotifications();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">Delivery Notifications</h1>
          <p className="text-text-secondary mt-1">Stay updated with assigned packages, pickup locations, and delivery OTP alerts.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllRead()}
            className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <Bell size={48} className="mx-auto mb-4 text-slate-300 animate-wiggle" />
          <h3 className="font-bold text-lg">No Notifications</h3>
          <p className="text-xs text-slate-400 mt-1">You are all caught up with delivery alerts!</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div key={notif.notification_ID || notif.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 text-lg">
                {notif.icon || (notif.type === 'delivery_assigned' ? '🚚' : notif.type === 'delivery_otp' ? '🔑' : '🔵')}
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

const DeliveryDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="" element={<OverviewScreen />} />
        <Route path="overview" element={<OverviewScreen />} />
        <Route path="management" element={<DeliveryManagementScreen />} />
        <Route path="notifications" element={<NotificationsTab />} />
        <Route path="profile" element={<ProfileScreen />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
