import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Truck, List, BarChart2, Settings, MapPin, Package, Clock, CheckCircle } from 'lucide-react';

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

const ActiveDeliveriesTab = () => (
  <div className="space-y-8 animate-fadeIn">
    <div>
      <h1 className="text-3xl font-heading font-bold text-text-primary">My Deliveries</h1>
      <p className="text-text-secondary mt-1">Assignments and routes for today.</p>
    </div>

    <div className="card p-6 border-l-4 border-l-primary">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="badge bg-blue-100 text-blue-700 mb-2">In Transit</span>
          <h3 className="text-xl font-bold">Order #DG-8821</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted uppercase font-bold">Estimated Fee</p>
          <p className="text-lg font-bold text-emerald-600">LKR 450.00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-primary flex-shrink-0">
              <Package size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase">Pickup From</p>
              <p className="font-medium">Kirushika Thavanesan</p>
              <p className="text-sm text-text-secondary">Hostel C, Room 204, UWU</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-accent flex-shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase">Deliver To</p>
              <p className="font-medium">Uva Creatives Office</p>
              <p className="text-sm text-text-secondary">Main Admin Building, Block B</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-xl overflow-hidden h-32 flex items-center justify-center border border-border">
          <span className="text-xs text-text-muted font-medium flex items-center gap-2">
            <MapPin size={14} /> Map Visualization Placeholder
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
          Mark as Delivered <CheckCircle size={18} />
        </button>
        <button className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
          View Details
        </button>
      </div>
    </div>
  </div>
);

export default DeliveryDashboard;
