import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Truck, List, BarChart2, MapPin, Package, Clock, CheckCircle, X, Lock, TrendingUp, RefreshCw, User, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

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
        const activeOnly = data.deliveries.filter(d => d.status !== 'delivered');
        if (activeOnly.length > 0) {
          // If selectedDel is not in the active list anymore, update it
          if (!selectedDel || !activeOnly.find(d => d.delivery_ID === selectedDel.delivery_ID)) {
            setSelectedDel(activeOnly[0]);
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

  const handleStartPickup = async (delivery_ID) => {
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
          action: 'pickup'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Pickup started successfully!");
        fetchMyDeliveries();
      } else {
        alert(data.error || "Failed to start pickup.");
      }
    } catch (err) {
      alert("Error starting pickup.");
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
        
        // Refresh deliveries and update selected
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

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  // Map box / Leaflet handler
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

  // Compute metrics
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');

  const getDeliveryFee = (d) => {
    return parseFloat(d.delivery_fee || (d.distance * 30) || 0);
  };

  const totalEarnings = completedDeliveries.reduce((sum, d) => sum + getDeliveryFee(d), 0);
  const completedCount = completedDeliveries.length;

  const todayStr = new Date().toDateString();
  const todaysPayout = completedDeliveries
    .filter(d => {
      if (!d.completed_time) return false;
      const dateStr = d.completed_time.replace(/-/g, '/');
      return new Date(dateStr).toDateString() === todayStr;
    })
    .reduce((sum, d) => sum + getDeliveryFee(d), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">Delivery Overview</h1>
          <p className="text-text-secondary mt-1">Assignments, statistics, and payouts.</p>
        </div>
        <button 
          onClick={fetchMyDeliveries}
          className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Today's Payout */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br from-emerald-500 to-teal-700">
          <div className="absolute right-[-10px] bottom-[-20px] text-white/10 pointer-events-none">
            <TrendingUp size={120} className="opacity-15 rotate-12" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Today's Payout</p>
          <h3 className="text-3xl font-black mt-3">LKR {todaysPayout.toLocaleString()}</h3>
          <span className="inline-block mt-4 text-[10px] bg-emerald-400/20 px-2 py-1 rounded-full font-bold">Earned Today</span>
        </div>

        {/* Card 2: Total Earnings */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br from-[#1A312C] to-[#2E5C51]">
          <div className="absolute right-[-10px] bottom-[-20px] text-white/10 pointer-events-none">
            <BarChart2 size={120} className="opacity-15 -rotate-12" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100/70">Total Earnings</p>
          <h3 className="text-3xl font-black mt-3">LKR {totalEarnings.toLocaleString()}</h3>
          <span className="inline-block mt-4 text-[10px] bg-white/10 px-2 py-1 rounded-full font-bold">All-time Income</span>
        </div>

        {/* Card 3: Completed Deliveries */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-white border border-slate-100 shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Deliveries</p>
            <h3 className="text-3xl font-black text-slate-800">{completedCount}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-2">Successful Dropoffs</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 gap-6 mt-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'active'
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Truck size={16} />
            <span>Active Deliveries</span>
            {activeDeliveries.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-primary-light text-primary-dark">
                {activeDeliveries.length}
              </span>
            )}
          </span>
          {activeTab === 'active' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'history'
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock size={16} />
            <span>Delivery History</span>
            {completedDeliveries.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-100 text-slate-600">
                {completedDeliveries.length}
              </span>
            )}
          </span>
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'active' ? (
        <div className="space-y-4 animate-fadeIn">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-secondary mt-2 text-sm font-medium">Loading assigned deliveries...</p>
            </div>
          ) : activeDeliveries.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400 shadow-sm">
              <Truck size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No active deliveries</h3>
              <p className="text-xs text-slate-500 mt-1">When admin assigns you a delivery, it will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left panel: list of deliveries */}
              <div className="lg:col-span-1 space-y-4">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {activeDeliveries.map((del) => (
                    <div
                      key={del.delivery_ID}
                      onClick={() => setSelectedDel(del)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        selectedDel?.delivery_ID === del.delivery_ID
                          ? 'bg-white border-primary shadow-md'
                          : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{del.delivery_ID}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          {del.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{del.job_title}</h4>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-semibold">{del.student_name}</span>
                        <span className="text-xs font-black text-emerald-600">LKR {getDeliveryFee(del).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel: Details of selected delivery */}
              {selectedDel && (
                <div className="lg:col-span-2 space-y-6">
                  <div className="card p-6 border-l-4 border-l-primary bg-white shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="badge bg-primary-light text-primary-dark font-black uppercase tracking-wider text-[10px]">
                          {selectedDel.status.toUpperCase()}
                        </span>
                        <h3 className="text-xl font-heading font-black text-slate-800 mt-2">{selectedDel.job_title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Delivery Payment</p>
                        <p className="text-lg font-black text-emerald-600">LKR {getDeliveryFee(selectedDel).toLocaleString()}</p>
                        {selectedDel.distance > 0 && (
                          <p className="text-[9px] text-slate-400 font-semibold">({parseFloat(selectedDel.distance).toFixed(2)} km)</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                            <Package size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pickup From</p>
                            <p className="font-bold text-slate-800 text-xs mt-0.5">{selectedDel.student_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{selectedDel.pickup_address}</p>
                            {selectedDel.student_phone && (
                              <p className="text-[10px] text-primary font-bold mt-1">📞 {selectedDel.student_phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-rose-500 flex-shrink-0">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deliver To</p>
                            <p className="text-xs text-slate-600 mt-0.5">{selectedDel.delivery_address}</p>
                            {selectedDel.client_phone && (
                              <p className="text-[10px] text-primary font-bold mt-1">📞 Client Phone: {selectedDel.client_phone}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Map Container */}
                      <div 
                        ref={mapContainerRef} 
                        className="w-full h-56 rounded-2xl border border-slate-200 overflow-hidden z-10"
                        style={{ minHeight: '200px' }}
                      />
                    </div>

                    {/* OTP Verification form for Rider */}
                    <div className="pt-4 border-t border-slate-100">
                      {selectedDel.status === 'delivered' ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                           <CheckCircle size={14} className="text-emerald-600" />
                           <span>Delivery verified and completed successfully!</span>
                        </div>
                      ) : selectedDel.status === 'assigned' ? (
                        <button
                          onClick={() => handleStartPickup(selectedDel.delivery_ID)}
                          disabled={actionLoading}
                          className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Truck size={14} />
                          <span>{actionLoading ? 'Starting Pickup...' : 'Start Pickup'}</span>
                        </button>
                      ) : (selectedDel.status === 'picked_up' && verifyingId !== selectedDel.delivery_ID) ? (
                        <button
                          onClick={() => setVerifyingId(selectedDel.delivery_ID)}
                          className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Lock size={14} />
                          <span>Mark as Delivered</span>
                        </button>
                      ) : verifyingId === selectedDel.delivery_ID ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fadeIn">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Enter 6-Digit OTP Code from Client/Student
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 123456"
                              value={otpInputs[selectedDel.delivery_ID] || ''}
                              onChange={(e) => setOtpInputs({ ...otpInputs, [selectedDel.delivery_ID]: e.target.value })}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-primary bg-white text-center tracking-widest"
                            />
                            <button
                              onClick={() => handleConfirmDelivery(selectedDel.delivery_ID)}
                              disabled={actionLoading}
                              className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary-dark transition-all disabled:opacity-60"
                            >
                              {actionLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                              onClick={() => setVerifyingId(null)}
                              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100"
                            >
                              <X size={14} />
                            </button>
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
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {completedDeliveries.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
              <Clock size={36} className="mx-auto mb-3 text-slate-300 animate-pulse" />
              <p className="text-xs font-bold text-slate-600">No completed deliveries yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Your delivered orders will be documented here.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Delivery ID</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Job Title</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sender (Student)</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Distance</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payout</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {completedDeliveries.map((del) => (
                      <tr key={del.delivery_ID} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">{del.delivery_ID}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{del.job_title}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{del.student_name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {del.distance > 0 ? `${parseFloat(del.distance).toFixed(2)} km` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-emerald-600">LKR {getDeliveryFee(del).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            <CheckCircle size={10} />
                            Delivered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/get_profile.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
        <h1 className="text-3xl font-heading font-black text-slate-800">My Profile</h1>
        <p className="text-text-secondary mt-1">Your registered delivery staff credentials and details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Account Information */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-800">Personal Information</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Identity Details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold">
                {profile.name}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>{profile.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>{profile.phone || deliveryDetails.phone || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Member Since</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Delivery Details */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-800">Operational Details</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Rider Profile</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff ID</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-mono font-bold">
                DS-{deliveryDetails.delivery_staff_ID || profile.user_ID}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle Type</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold">
                {deliveryDetails.vehicle_type || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Location / Area</label>
              <div className="mt-1.5 px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-slate-700 text-sm font-semibold flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>{deliveryDetails.location || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Status</label>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl">
                  <ShieldCheck size={12} />
                  <span>{deliveryDetails.status || profile.status || 'Active'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<OverviewScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
