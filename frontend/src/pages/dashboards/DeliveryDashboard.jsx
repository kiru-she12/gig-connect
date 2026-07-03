import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Truck, List, BarChart2, Settings, MapPin, Package, Clock, CheckCircle, X, Lock } from 'lucide-react';

const DeliveryDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Routes>
        <Route path="active" element={<ActiveDeliveriesTab />} />
        <Route path="history" element={<PlaceholderTab title="Delivery History" icon={List} message="View your completed deliveries." />} />
        <Route path="earnings" element={<PlaceholderTab title="Your Earnings" icon={BarChart2} message="Track your payout history and bonuses." />} />
        <Route path="profile" element={<PlaceholderTab title="Delivery Profile" icon={Settings} message="Manage your vehicle info and availability." />} />
        <Route path="*" element={<ActiveDeliveriesTab />} />
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

const ActiveDeliveriesTab = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDel, setSelectedDel] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
        if (data.deliveries.length > 0 && !selectedDel) {
          setSelectedDel(data.deliveries[0]);
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
        
        // Refresh and reset selected
        const token2 = localStorage.getItem('token');
        const res2 = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/get_my_deliveries.php`, {
          headers: { 'Authorization': `Bearer ${token2}` }
        });
        const d2 = await res2.json();
        if (d2.success && Array.isArray(d2.deliveries)) {
          setDeliveries(d2.deliveries);
          const stillExists = d2.deliveries.find(d => d.delivery_ID === delivery_ID);
          if (stillExists) {
            setSelectedDel(stillExists);
          } else if (d2.deliveries.length > 0) {
            setSelectedDel(d2.deliveries[0]);
          } else {
            setSelectedDel(null);
          }
        }
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

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">My Deliveries</h1>
          <p className="text-text-secondary mt-1">Assignments and routes for today.</p>
        </div>
        <button 
          onClick={fetchMyDeliveries}
          className="btn-secondary py-2 px-4 text-xs font-bold"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2 text-sm font-medium">Loading assigned deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card p-20 text-center">
          <Truck size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold">No active deliveries</h3>
          <p className="text-text-secondary">When admin assigns you a gig, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel: list of deliveries */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Assigned Gigs ({deliveries.length})</h3>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {deliveries.map((del) => (
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
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      del.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {del.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{del.job_title}</h4>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold">{del.student_name}</span>
                    <span className="text-xs font-black text-emerald-600">LKR {parseFloat(del.delivery_fee || (del.distance * 30) || 0).toLocaleString()}</span>
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
                    <p className="text-lg font-black text-emerald-600">LKR {parseFloat(selectedDel.delivery_fee || (selectedDel.distance * 30) || 0).toLocaleString()}</p>
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
  );
};

export default DeliveryDashboard;
