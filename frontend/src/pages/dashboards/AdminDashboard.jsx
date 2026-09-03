import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Environment variable compatibility polyfill
if (typeof process === 'undefined') {
  window.process = {
    env: {
      REACT_APP_API_URL: import.meta.env.VITE_API_BASE_URL || ''
    }
  };
} else if (!process.env) {
  process.env = {
    REACT_APP_API_URL: import.meta.env.VITE_API_BASE_URL || ''
  };
} else if (!process.env.REACT_APP_API_URL) {
  process.env.REACT_APP_API_URL = import.meta.env.VITE_API_BASE_URL || '';
}

const getProfilePicUrl = (pic) => {
  if (!pic) return null;
  if (pic.startsWith('http') || pic.startsWith('data:')) return pic;
  const backendBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend';
  return `${backendBase}/uploads/profile_pics/${pic.replace(/^\//, '')}`;
};

import { useJobs } from '../../context/JobsContext';
import { useNotifications } from '../../context/NotificationsContext';
import {
  Users, CheckCircle, Search, BarChart2, MessageSquare, Truck, AlertCircle,
  FileText, LayoutDashboard, TrendingUp, DollarSign, ShieldAlert, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical, Settings, Plus, X, Loader2,
  ChevronLeft, ChevronRight, Calendar, ArrowRight, Download, Send, Filter, Check, Eye, RefreshCw, Bell
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NotificationsTab = () => {
  const { notifications, markAllRead } = useNotifications();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">Admin Notifications</h1>

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
          <p className="text-xs text-slate-400 mt-1">You are all caught up with system alerts!</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div key={notif.notification_ID || notif.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 text-lg">
                {notif.icon || (notif.type === 'product_ready' ? '📦' : notif.type === 'job_approved' ? '🚀' : '🔵')}
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

const ComplaintsTab = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState('student');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/complaints.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      } else if (data.success && Array.isArray(data.complaints)) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/complaints.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: complaintId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchComplaints();
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Error updating status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const isJobProviderComplaint = (c) => {
    const role = (c.complainant_role || '').toLowerCase();
    const complainer = (c.complainer || '').toLowerCase();
    const complainantId = (c.complainant_ID || '').toLowerCase();
    return (
      role === 'job_provider' ||
      role === 'client' ||
      complainantId.startsWith('cli') ||
      complainantId.startsWith('jp') ||
      complainer.includes('client') ||
      complainer.includes('provider')
    );
  };

  const studentComplaintsCount = complaints.filter(c => !isJobProviderComplaint(c)).length;
  const providerComplaintsCount = complaints.filter(c => isJobProviderComplaint(c)).length;

  const filtered = complaints.filter(c => {
    const isProvider = isJobProviderComplaint(c);
    const roleMatch = activeRoleTab === 'job_provider' ? isProvider : !isProvider;
    const statusMatch = filterStatus === 'All' || c.status === filterStatus;
    const text = ((c.complainer || '') + ' ' + (c.about || '') + ' ' + (c.reason || '') + ' ' + (c.text || '')).toLowerCase();
    const searchMatch = !searchQuery || text.includes(searchQuery.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800">Complaints & Safety Moderation</h1>

        </div>

      </div>

      {/* Primary Role Tabs (Student Complaints vs Job Provider Complaints) */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-xl border border-slate-200 shadow-inner">
        <button
          onClick={() => setActiveRoleTab('student')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeRoleTab === 'student'
            ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <span>Student Complaints</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
            {studentComplaintsCount}
          </span>
        </button>
        <button
          onClick={() => setActiveRoleTab('job_provider')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeRoleTab === 'job_provider'
            ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <span>Job Provider Complaints</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
            {providerComplaintsCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student name, provider name, reason or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Pending Review', 'Investigating', 'Resolved', 'Dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filterStatus === status
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-2 text-rose-500" />
          <p className="text-xs font-bold">Loading complaint reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
          <ShieldAlert size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="font-bold text-lg">No Complaints Found</h3>
          <p className="text-xs text-slate-400 mt-1">No user reports match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id || c.complaint_ID} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-black uppercase">
                    {c.reason || 'Complaint'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">ID: {c.complaint_ID || `CMP${c.id}`}</span>
                  <span className="text-xs text-slate-400 font-semibold">{c.date || c.created_at}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    c.status === 'Investigating' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                    {c.status || 'Pending Review'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">
                    {activeRoleTab === 'job_provider' ? 'Complainant (Job Provider):' : 'Complainant (Student):'}
                  </span>
                  <span className="text-slate-800 font-black text-sm">{c.complainer}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">
                    {activeRoleTab === 'job_provider' ? 'Reported Student:' : 'Reported Job Provider:'}
                  </span>
                  <span className="text-rose-600 font-black text-sm">{c.about}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">{c.text}</h4>
              </div>

              {c.evidence_image && (
                <div className="pt-2">
                  <button
                    onClick={() => setSelectedComplaint(c)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>View Evidence Screenshot</span>
                  </button>
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {c.status !== 'Investigating' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Investigating')}
                    disabled={updatingId === c.id}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Mark as Investigating
                  </button>
                )}
                {c.status !== 'Resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Resolved')}
                    disabled={updatingId === c.id}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Mark as Resolved
                  </button>
                )}
                {c.status !== 'Dismissed' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'Dismissed')}
                    disabled={updatingId === c.id}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                  >
                    Dismiss Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Image Preview Modal */}
      {selectedComplaint && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedComplaint(null)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-sm">Evidence Screenshot - Complaint {selectedComplaint.complaint_ID || selectedComplaint.id}</h3>
              <button onClick={() => setSelectedComplaint(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-slate-50 flex items-center justify-center max-h-[60vh]">
              <img src={selectedComplaint.evidence_image} alt="Evidence Screenshot" className="max-h-[60vh] object-contain" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { jobs, applications, approveJob, rejectJob, refreshJobs } = useJobs();
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role || 'admin';

  // High-fidelity fallback / target metrics required by client
  // - Total interaction > 1200
  // - Monthly revenue close to 100,000 LKR
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching admin analytics, token:', token ? 'exists' : 'missing');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/analytics.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Admin analytics response status:', response.status);
      const data = await response.json();
      console.log('Admin analytics response data:', data);
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Analytics fetch failed or unauthorized:', data.error || 'Unknown error');
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (refreshJobs) {
      refreshJobs();
    }
  }, []);

  return (
    <DashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewTab jobs={jobs} applications={applications} analytics={analytics} loading={analyticsLoading} />} />
        <Route path="users" element={<UserManagementTab />} />
        <Route path="approvals" element={<ApprovalsTab jobs={jobs} approve={approveJob} reject={rejectJob} />} />
        <Route path="monitoring" element={<JobMonitoringTab jobs={jobs} refreshJobs={refreshJobs} />} />
        <Route path="revenue" element={<RevenueTab jobs={jobs} analytics={analytics} />} />
        <Route path="notifications" element={<NotificationsTab />} />
        <Route path="complaints" element={<ComplaintsTab />} />
        <Route path="communications" element={<CommunicationsTab />} />
        <Route path="delivery" element={<DeliveryManagementTab />} />
        <Route path="analytics" element={<AdminAnalyticsTab analytics={analytics} loading={analyticsLoading} onRetry={fetchAnalytics} />} />
        {role === 'admin' && (
          <Route path="reports" element={<ReportsTab analytics={analytics} />} />
        )}
        <Route path="settings" element={<PlaceholderTab title="System Settings" icon={Settings} message="Configure platform commission rates, University filters, and Admin settings." />} />
        <Route path="*" element={<OverviewTab jobs={jobs} applications={applications} analytics={analytics} loading={analyticsLoading} />} />
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
      <p className="text-text-secondary mt-1 max-w-md mx-auto">{message}</p>
    </div>
  </div>
);

const formatRelativeTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr.replace(/-/g, '/'));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs) || diffMs < 0) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const OverviewTab = ({ jobs, applications, analytics, loading }) => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role || 'admin';
  const totalUsers = analytics ? (parseInt(analytics.users?.total_students || 0) + parseInt(analytics.users?.total_clients || 0)) : 0;
  const activeJobsVal = analytics ? parseInt(analytics.jobs?.active_jobs || 0) : jobs.filter(j => j.status === 'Active' || j.status === 'active').length;
  const verifiedClientsVal = analytics ? parseInt(analytics.users?.total_clients || 0) : 0;
  const revenueVal = analytics ? parseInt(analytics.revenue?.total_revenue || 0) : 0;
  const pendingApprovalsVal = analytics ? parseInt(analytics.jobs?.pending_jobs || 0) : jobs.filter(j => j.status === 'Pending Approval' || j.status === 'pending').length;
  const fraudAlertsVal = analytics ? parseInt(analytics.users?.banned_users || 0) : 0;
  const activeDeliveriesVal = analytics ? (parseInt(analytics.deliveries?.total_deliveries || 0) - parseInt(analytics.deliveries?.completed_deliveries || 0)) : 0;
  const totalInteractionsVal = analytics?.interactions ? analytics.interactions.total_interactions : 0;

  const stats = [
    { label: 'Total Interactions', value: totalInteractionsVal.toLocaleString(), change: '+14%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary-light' },
    { label: 'Total Users', value: totalUsers, change: '+12%', icon: Users, color: 'text-[#4E8C7E]', bg: 'bg-primary-light' },
    { label: 'Active Jobs', value: activeJobsVal, change: '+5%', icon: Clock, color: 'text-accent', bg: 'bg-primary-light' },
    { label: 'Monthly Revenue (LKR)', value: revenueVal.toLocaleString(), change: 'Close to Target', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Verified Clients', value: verifiedClientsVal, change: '+6', icon: CheckCircle, color: 'text-accent', bg: 'bg-primary-light' },
    { label: 'Pending Approvals', value: pendingApprovalsVal, change: '-2', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Banned Accounts', value: fraudAlertsVal, change: '0', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Deliveries', value: activeDeliveriesVal, change: '+1', icon: Truck, color: 'text-[#4E8C7E]', bg: 'bg-primary-light' },
  ];

  const pendingJobsCount = jobs.filter(j => j.status === 'Pending Approval').length;

  const getActionMetadata = (type) => {
    switch (type) {
      case 'application':
        return { icon: Users, color: 'bg-primary-light text-primary' };
      case 'payment':
        return { icon: DollarSign, color: 'bg-accent/25 text-[#1A312C]' };
      case 'job_post':
        return { icon: FileText, color: 'bg-amber-100 text-amber-600' };
      case 'complaint':
        return { icon: AlertCircle, color: 'bg-teal-100 text-teal-600' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-600' };
    }
  };

  const recentActionsList = analytics?.recent_actions || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Admin Control Center</h1>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 hover:shadow-lg transition-all border border-slate-100 hover:border-slate-200">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-heading font-bold text-text-primary">{stat.value}</p>
              {stat.change && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${stat.change.startsWith('+') ? 'bg-primary-light text-primary' : 'bg-slate-50 text-slate-600'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-base text-text-primary mb-6 flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Recent Platform Actions
          </h3>
          <div className="space-y-6">
            {recentActionsList.length > 0 ? (
              recentActionsList.map((item, i) => {
                const meta = getActionMetadata(item.action_type);
                return (
                  <div key={i} className="flex gap-4">
                    <div className={`w-10 h-10 ${meta.color} rounded-full flex-shrink-0 flex items-center justify-center`}>
                      <meta.icon size={18} />
                    </div>
                    <div className="flex-1 border-b border-slate-100 pb-4 last:border-0">
                      <p className="text-sm font-medium text-text-primary leading-tight">{item.action_text}</p>
                      <p className="text-xs text-text-muted mt-1">{formatRelativeTime(item.action_time)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-text-muted py-4">No recent platform actions recorded.</p>
            )}
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-text-primary mb-6 flex items-center gap-2">
              <Settings size={18} className="text-primary" /> Admin Operations
            </h3>
            <div className="space-y-3">
              <Link to="/dashboard/admin/approvals" className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all group">
                <span className="text-sm font-bold">Review Pending Jobs</span>
                {pendingJobsCount > 0 ? (
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full group-hover:bg-white group-hover:text-primary">
                    {pendingJobsCount}
                  </span>
                ) : (
                  <ArrowRight size={14} className="text-text-muted group-hover:text-white" />
                )}
              </Link>
              <Link to="/dashboard/admin/users" className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all group">
                <span className="text-sm font-bold">Verify New Clients</span>
                <CheckCircle size={14} className="text-text-muted group-hover:text-white" />
              </Link>
              {role === 'admin' && (
                <Link to="/dashboard/admin/reports" className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-primary hover:text-white rounded-xl transition-all group">
                  <span className="text-sm font-bold">Export Audit Statement</span>
                  <FileText size={14} className="text-text-muted group-hover:text-white" />
                </Link>
              )}
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">University Coverage</h4>
            <p className="text-xs text-text-secondary">Uva Wellassa University of Sri Lanka.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalsTab = ({ jobs, approve, reject }) => {
  const pendingJobs = jobs.filter(j => j.status === 'Pending Approval');
  const [selectedProvider, setSelectedProvider] = useState(null);

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Job Approvals</h1>
          <p className="text-text-secondary mt-1">Review new job submissions before they go public to students.</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Job Info</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Provider Details</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-text-primary">{job.title}</p>
                    <p className="text-xs text-text-muted">{job.category} • {job.type}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{job.clientName || 'Partner Business'}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedProvider(job)}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Eye size={12} /> View Details
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">LKR {parseFloat(job.pay || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(job.id)}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                        title="Approve Job"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => reject(job.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        title="Reject Job"
                      >
                        <AlertCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingJobs.length === 0 && (
            <div className="p-16 text-center text-text-muted">
              <CheckCircle size={36} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-text-primary">All Caught Up!</p>
              <p className="text-xs mt-0.5">No jobs are pending approval at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {selectedProvider && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedProvider(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-slideUp z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProvider(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                {selectedProvider.clientName?.charAt(0) || 'P'}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Job Provider Profile</span>
                <h2 className="text-xl font-heading font-bold text-slate-800 leading-tight">
                  {selectedProvider.clientName}
                </h2>
              </div>
            </div>

            <div className="space-y-4 my-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="font-semibold text-slate-700 block truncate mt-0.5">{selectedProvider.clientEmail || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-semibold text-slate-700 block mt-0.5">{selectedProvider.clientPhone || 'No phone number'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">NIC Number</span>
                  <span className="font-semibold text-slate-700 block mt-0.5">{selectedProvider.clientNic || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Business Reg No</span>
                  <span className="font-semibold text-slate-700 block mt-0.5">{selectedProvider.clientBusinessRegNo || 'Individual Provider'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Business Type</span>
                  <span className="font-semibold text-slate-700 block mt-0.5 capitalize">{selectedProvider.clientBusinessType || 'Individual'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Verification status</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${selectedProvider.clientIsVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedProvider.clientIsVerified ? (
                      <>
                        <CheckCircle size={12} /> Verified Partner
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> Pending Verification
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Business Address</span>
                <span className="font-semibold text-slate-700 block mt-0.5 leading-relaxed">{selectedProvider.clientAddress || 'No registered address'}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedProvider(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Close Profile
              </button>
              <button
                onClick={() => { approve(selectedProvider.id); setSelectedProvider(null); }}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> Approve Job
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const AdminAnalyticsTab = ({ analytics, loading, onRetry }) => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role || 'admin';

  // 1. Month-by-month data (jobs, revenue, interactions)
  const chartData = useMemo(() => {
    if (!analytics?.months_data || analytics.months_data.length === 0) return [];
    return (analytics.months_data || []).map(m => ({
      name: m.name,
      jobs: parseInt(m.jobs || 0),
      revenue: parseFloat(m.revenue || 0),
      interactions: parseInt(m.interactions || 0)
    }));
  }, [analytics]);

  // 2. Entity distribution pie data
  const pieData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Active Students', value: parseInt(analytics.users?.total_students || 0) },
      { name: 'Recruiting Businesses', value: parseInt(analytics.users?.total_clients || 0) },
      { name: 'Assigned Deliveries', value: parseInt(analytics.deliveries?.total_deliveries || 0) },
      { name: 'Banned Violators', value: parseInt(analytics.users?.banned_users || 0) },
    ];
  }, [analytics]);



  const COLORS = ['#1A312C', '#4E8C7E', '#89D7B7', '#F59E0B'];

  // Job placement target/peak calculation
  const maxJobsData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { month: 'N/A', count: 0 };
    let max = -1;
    let maxMonth = '';
    chartData.forEach(c => {
      if (c.jobs > max) {
        max = c.jobs;
        maxMonth = c.name;
      }
    });
    return { month: maxMonth, count: max };
  }, [chartData]);

  // Revenue target calculation
  const maxRevenueData = useMemo(() => {
    if (!chartData || chartData.length === 0) return { month: 'N/A', amount: 0 };
    let max = -1;
    let maxMonth = '';
    chartData.forEach(c => {
      if (c.revenue > max) {
        max = c.revenue;
        maxMonth = c.name;
      }
    });
    return { month: maxMonth, amount: max };
  }, [chartData]);

  // Interactions percentage change from previous month
  const interactionChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return { percent: '0.0', isPositive: true };
    const current = chartData[chartData.length - 1].interactions;
    const previous = chartData[chartData.length - 2].interactions;
    if (previous === 0) return { percent: current > 0 ? '100.0' : '0.0', isPositive: true };
    const diff = current - previous;
    const pct = (diff / previous) * 100;
    return {
      percent: Math.abs(pct).toFixed(1),
      isPositive: pct >= 0
    };
  }, [chartData]);

  // Campus engagement percentages
  const studentEngagementPct = useMemo(() => {
    const total = analytics?.interactions?.total_interactions || 0;
    if (total === 0) return 0;
    return Math.round(((analytics?.interactions?.student_engagement || 0) / total) * 100);
  }, [analytics]);

  const providerEngagementPct = useMemo(() => {
    const total = analytics?.interactions?.total_interactions || 0;
    if (total === 0) return 0;
    return Math.round(((analytics?.interactions?.provider_engagement || 0) / total) * 100);
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-sm text-text-secondary font-medium">Loading Platform Analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 stroke-[1.5]" />
        <h3 className="text-lg font-bold text-text-primary">Failed to load analytics</h3>
        <p className="text-sm text-text-secondary max-w-sm">
          There was an error retrieving the platform metrics. Please check your network connection or try again.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn bg-slate-900/5 p-1 rounded-2xl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Platform Analytics</h1>
          <p className="text-text-secondary mt-1">High-fidelity metrics auditing engagement, traffic, and revenue cycles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === 'admin' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/dashboard/admin/reports?auto=interactions')}
                className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download size={12} /> Monthly Interaction (PDF)
              </button>
              <button
                onClick={() => navigate('/dashboard/admin/reports?auto=jobs')}
                className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download size={12} /> 6-Month Placement (PDF)
              </button>
              <button
                onClick={() => navigate('/dashboard/admin/reports?auto=interactions')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download size={12} /> Yearly Audit (PDF)
              </button>
            </div>
          )}
          <div className="text-xs font-bold text-text-secondary bg-white border border-border px-4 py-2 rounded-xl flex items-center gap-2">
            <span>Reporting Period:</span>
            <span className="text-primary">Last 6 Months</span>
          </div>
        </div>
      </div>

      {/* CRM Style Top Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-primary-dark to-primary text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">Total Revenue</p>
            <p className="text-3xl font-heading font-black mt-2">
              LKR {(analytics?.revenue?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] mt-4 font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">
              Commission & Boost
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <DollarSign size={160} />
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">Avg Student Interaction Rate</p>
            <p className="text-3xl font-heading font-black mt-2">
              {(analytics?.interactions?.total_interactions || 0).toLocaleString()} <span className="text-sm font-normal opacity-80">gigs</span>
            </p>
            <p className="text-[10px] mt-4 font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">100% Campus Reach</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <Users size={160} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Monthly Interactions</p>
            <p className="text-2xl font-heading font-black text-text-primary mt-1">
              {(analytics?.interactions?.total_interactions || 0).toLocaleString()}
            </p>
            <div className="text-[10px] font-bold mt-2">
              {interactionChange.isPositive ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={10} /> +{interactionChange.percent}% from last month
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-0.5">
                  <ArrowDownRight size={10} /> -{interactionChange.percent}% from last month
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-800">
            <MessageSquare size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CRM Style Chart 1: Revenue Growth Line Chart */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Revenue Growth (LKR)</h3>
              <p className="text-xs text-text-muted mt-0.5">Peak revenue of LKR {(maxRevenueData.amount || 0).toLocaleString()} in {maxRevenueData.month}</p>
            </div>
            <span className="text-[10px] bg-primary-light text-primary px-2.5 py-0.5 rounded-full font-bold">LKR {(analytics?.revenue?.total_revenue || 0).toLocaleString()} Total</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`LKR ${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#1A312C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Total Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Job Placements Bar Chart */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Monthly Job Placements</h3>
              <p className="text-xs text-text-muted mt-0.5">Peak placements at {maxJobsData.count} jobs in {maxJobsData.month}</p>
            </div>
            <span className="text-[10px] bg-primary-light text-primary px-2.5 py-0.5 rounded-full font-bold">
              {maxJobsData.count} Jobs Peak
            </span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [value, 'Jobs Posted']} />
                <Bar dataKey="jobs" fill="#4E8C7E" radius={[4, 4, 0, 0]} name="Jobs Posted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Entity Distribution Donut */}
        <div className="card p-6">
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider mb-6">Platform Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="font-bold text-slate-700">{entry.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactions breakdown */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Campus Engagement Stats</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Student Submissions / Applications</span>
                <span>{analytics?.interactions?.student_engagement || 0} interactions</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${studentEngagementPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Business / Client Postings</span>
                <span>{analytics?.interactions?.provider_engagement || 0} interactions</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#4E8C7E] h-full rounded-full transition-all duration-500"
                  style={{ width: `${providerEngagementPct}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between text-xs font-bold text-text-secondary">
              <span>Total University Engagement</span>
              <span className="text-primary font-black">{(analytics?.interactions?.total_interactions || 0).toLocaleString()} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementTab = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = storedUser?.role || 'admin';
  const [activeTab, setActiveTab] = useState('student');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Add Staff Modal states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('delivery_staff');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffVehicleType, setStaffVehicleType] = useState('');
  const [staffLocation, setStaffLocation] = useState('');
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  const fetchUsers = async (role) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const backendRole = role === 'client' ? 'job_provider' : role;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/get_users.php?role=${backendRole}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
        if (data.message) {
          setError(data.message);
        } else {
          setError(data.error || 'Failed to fetch users.');
        }
      }
    } catch (err) {
      setError('Connection error. Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const handleAction = async (userId, action) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/disable_user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_ID: userId,
          action: action
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(data.success);
        fetchUsers(activeTab);
      } else {
        setError(data.error || 'Operation failed.');
      }
    } catch (err) {
      setError('Connection error. Operation failed.');
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (/\d/.test(staffName) || !/^[a-zA-Z\s\.\'-]{2,100}$/.test(staffName.trim())) {
      setError('Staff Name must contain only letters, spaces, dots, or hyphens and cannot contain numbers.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (staffRole === 'delivery_staff' && staffPhone && !/^0\d{9}$/.test(staffPhone.trim())) {
      setError('Phone number must be exactly 10 digits (e.g., 0712345678).');
      return;
    }

    setStaffSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: staffName.trim(),
        email: staffEmail.trim(),
        password: staffPassword,
        role: staffRole,
        phone: staffPhone ? staffPhone.trim() : '',
      };
      if (staffRole === 'delivery_staff') {
        payload.vehicle_type = staffVehicleType;
        payload.location = staffLocation;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/add_staff.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.success);
        setIsAddStaffOpen(false);
        // Reset form
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffPhone('');
        setStaffVehicleType('');
        setStaffLocation('');
        fetchUsers(activeTab);
      } else {
        setError(data.error || 'Failed to add staff member.');
      }
    } catch (err) {
      setError('Connection error. Failed to add staff.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">User Management</h1>
            <p className="text-text-secondary mt-1">Review pending applications and manage account statuses.</p>
          </div>

          {(activeTab === 'delivery_staff' || (activeTab === 'manager' && userRole === 'admin')) && (
            <button
              onClick={() => {
                setStaffRole(activeTab);
                setIsAddStaffOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md self-start md:self-auto"
            >
              <Plus size={18} /> Add {activeTab === 'delivery_staff' ? 'Delivery Staff' : 'Manager'}
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'student', label: 'Students' },
            { id: 'client', label: 'Clients / Businesses' },
            { id: 'delivery_staff', label: 'Delivery Staff' },
            ...(userRole === 'admin' ? [{ id: 'manager', label: 'Managers' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white border border-border text-text-secondary hover:border-primary'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold animate-fadeIn">
            {success}
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <Loader2 className="animate-spin text-primary mb-3" size={32} />
              <p className="text-xs font-bold text-text-secondary">Retrieving user accounts...</p>
            </div>
          ) : users.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.user_ID} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-text-primary">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{u.email}</td>
                    <td className="px-6 py-4 text-xs font-bold capitalize text-slate-500">
                      {u.role?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {u.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {(u.status === 'pending' || !u.status) ? (
                          <button
                            onClick={() => handleAction(u.user_ID, 'approve')}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            Approve
                          </button>
                        ) : null}
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleAction(u.user_ID, 'disable')}
                            disabled={userRole !== 'admin'}
                            className={`px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={userRole !== 'admin' ? "Only Admin can disable accounts" : ""}
                          >
                            Disable
                          </button>
                        ) : null}
                        {u.status === 'banned' ? (
                          <button
                            onClick={() => handleAction(u.user_ID, 'enable')}
                            disabled={userRole !== 'admin'}
                            className={`px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={userRole !== 'admin' ? "Only Admin can enable accounts" : ""}
                          >
                            Enable
                          </button>
                        ) : null}
                        {activeTab === 'student' && (
                          <button
                            onClick={() => setSelectedStudent(u)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all"
                          >
                            View Details
                          </button>
                        )}
                        {activeTab === 'client' && (
                          <button
                            onClick={() => setSelectedClient(u)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-text-muted">No users found.</div>
          )}
        </div>
      </div>

      {selectedStudent && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedStudent(null)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-border animate-slideUp max-h-[90vh] overflow-y-auto z-10">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl uppercase overflow-hidden border border-border shrink-0 shadow-sm">
                {selectedStudent.profile_pic ? (
                  <img
                    src={getProfilePicUrl(selectedStudent.profile_pic)}
                    alt={selectedStudent.name || 'Student'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }}
                  />
                ) : null}
                <span className={selectedStudent.profile_pic ? "hidden" : ""}>
                  {selectedStudent.name ? selectedStudent.name[0] : 'S'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-black text-text-primary">Student Profile Details</h2>
                <p className="text-xs text-text-muted">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Legal Name</label>
                <p className="text-sm font-bold text-text-primary">{selectedStudent.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Official Student Email</label>
                <p className="text-sm font-semibold text-text-secondary">{selectedStudent.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">University Year</label>
                  <p className="text-sm font-bold text-primary capitalize">{selectedStudent.year || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Degree Program</label>
                  <p className="text-sm font-bold text-text-primary">{selectedStudent.degree || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Languages</label>
                  <p className="text-sm font-semibold text-text-secondary">{selectedStudent.languages || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Rating</label>
                  <p className="text-sm font-bold text-purple-600">
                    {(parseFloat(selectedStudent.rating || 0) === 0) ? '🆕 New Student' : parseFloat(selectedStudent.rating).toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expertise / Skills</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedStudent.skills ? selectedStudent.skills.split(',').map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800">
                      {skill.trim()}
                    </span>
                  )) : <span className="text-sm text-text-secondary">N/A</span>}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Short Bio</label>
                <p className="text-xs text-text-secondary leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-[200px] overflow-y-auto">
                  {selectedStudent.bio || 'No bio provided.'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
              {(selectedStudent.status === 'pending' || !selectedStudent.status) && (
                <button
                  onClick={() => { handleAction(selectedStudent.user_ID, 'approve'); setSelectedStudent(null); }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Approve Account
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedClient && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedClient(null)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-border animate-slideUp max-h-[90vh] overflow-y-auto z-10">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute right-6 top-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-text-primary mb-6 border-b pb-4">Job Provider Profile Details</h2>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Company / Contact Name</label>
                <p className="text-sm font-bold text-text-primary">{selectedClient.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                <p className="text-sm font-semibold text-text-secondary">{selectedClient.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                  <p className="text-sm font-bold text-text-primary">{selectedClient.phone || 'No phone number'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">NIC Number</label>
                  <p className="text-sm font-bold text-text-primary">{selectedClient.nic || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Business Registration No</label>
                  <p className="text-sm font-bold text-text-primary">{selectedClient.business_reg_no || 'Individual Provider'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Business Type</label>
                  <p className="text-sm font-bold text-text-primary capitalize">{selectedClient.type || 'Individual'}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Verification Status</label>
                <p className="block">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 px-2.5 py-1 rounded-full ${parseInt(selectedClient.is_verified) === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {parseInt(selectedClient.is_verified) === 1 ? (
                      <>
                        <CheckCircle size={14} className="text-emerald-500" /> Verified Partner
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-amber-500 animate-pulse" /> Pending Verification
                      </>
                    )}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Business Address</label>
                <p className="text-xs text-text-secondary leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-[150px] overflow-y-auto">
                  {selectedClient.address || 'No registered address.'}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
              {(selectedClient.status === 'pending' || !selectedClient.status) && (
                <button
                  onClick={() => { handleAction(selectedClient.user_ID, 'approve'); setSelectedClient(null); }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Approve Account
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {isAddStaffOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddStaffOpen(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border animate-slideUp z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddStaffOpen(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
              <Plus size={20} className="text-primary" /> Add New {staffRole === 'delivery_staff' ? 'Delivery Staff' : 'Manager'}
            </h2>
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value.replace(/[0-9]/g, ''))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@gigconnect.com"
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 0771234567 (10 digits)"
                  className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>

              {staffRole === 'delivery_staff' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Vehicle Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bicycle, Motorcycle"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                      value={staffVehicleType}
                      onChange={(e) => setStaffVehicleType(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Location / Coverage Area</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Badulla Campus"
                      className="w-full border border-border rounded-lg p-2.5 outline-none focus:border-primary text-sm"
                      value={staffLocation}
                      onChange={(e) => setStaffLocation(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={staffSubmitting}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white p-2.5 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {staffSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Staff Member'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// COMPACT AIRBNB-STYLE CALENDAR AND MONITORING TAB
const JobMonitoringTab = ({ jobs, refreshJobs }) => {
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleStatusChange = async (jobId, newStatus) => {
    setModerating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/approve_job.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_ID: jobId,
          status: newStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(data.success);
        refreshJobs();
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update status.');
      }
    } catch (err) {
      setErrorMsg('Connection error. Failed to update status.');
    } finally {
      setModerating(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevDaysInMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  const totalCells = 42;
  const nextMonthPadding = totalCells - calendarDays.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    calendarDays.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getJobStatusStyles = (job) => {
    const isCompleted = job.status?.toLowerCase() === 'completed';
    const isClosed = job.status?.toLowerCase() === 'closed' || job.status?.toLowerCase() === 'rejected';

    let isOverdue = false;
    if (job.deadline && !isCompleted && !isClosed) {
      const deadlineDate = new Date(job.deadline);
      isOverdue = deadlineDate < today;
    }

    if (isCompleted) {
      return { bg: 'bg-emerald-500', text: 'text-white border-emerald-600', label: 'Completed' };
    }
    if (isClosed) {
      return { bg: 'bg-slate-500', text: 'text-white border-slate-600', label: 'Closed' };
    }
    if (isOverdue) {
      return { bg: 'bg-rose-500', text: 'text-white border-rose-600', label: 'Overdue' };
    }
    if (job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'pending approval') {
      return { bg: 'bg-amber-500', text: 'text-white border-amber-600', label: 'Pending' };
    }
    return { bg: 'bg-primary', text: 'text-white border-primary-dark', label: 'Active' };
  };

  // Enforce high-fidelity dummy jobs if empty for simulation
  const targetJobs = jobs.length > 0 ? jobs : [
    { id: 1, title: 'Web Banner Design', description: 'Design modern marketing banners for Badulla campus orientation.', category: 'Design', type: 'onsite', pay: 8000, deadline: new Date(year, month, 12).toISOString(), status: 'active', clientName: 'Badulla Tech Solutions' },
    { id: 2, title: 'Library Book Coding', description: 'Label and catalog new library inventory items using barcode scanner.', category: 'Data Entry', type: 'onsite', pay: 15000, deadline: new Date(year, month, 18).toISOString(), status: 'pending', clientName: 'UWU Library Services' },
    { id: 3, title: 'Canteen Assistance', description: 'Help serve food and maintain counter cleanliness during peak lunch hours.', category: 'Other', type: 'onsite', pay: 12000, deadline: new Date(year, month, 18).toISOString(), status: 'completed', clientName: 'Campus Food Court' },
    { id: 4, title: 'IT Lab Assistant', description: 'Help manage network setups and assist student logins.', category: 'Web Dev', type: 'onsite', pay: 25000, deadline: new Date(year, month, today.getDate() - 2).toISOString(), status: 'active', clientName: 'UWU IT Faculty' },
  ];

  const filteredJobs = targetJobs.filter(job => {
    const titleMatch = (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' ||
      (job.status || '').toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'pending' && (job.status || '').toLowerCase() === 'pending approval');
    const typeMatch = typeFilter === 'all' || (job.type || '').toLowerCase() === typeFilter.toLowerCase();

    return titleMatch && statusMatch && typeMatch;
  });

  // Get onsite gigs specifically matching selected date
  const onsiteGigsForSelectedDate = targetJobs.filter(job => {
    if (!job.deadline) return false;
    const jobTypeStr = (job.type || '').toLowerCase();
    const isOnsite = jobTypeStr === 'onsite' || jobTypeStr === 'on-site';
    if (!isOnsite) return false;

    const dDate = new Date(job.deadline);
    return dDate.getDate() === selectedDate.getDate() &&
      dDate.getMonth() === selectedDate.getMonth() &&
      dDate.getFullYear() === selectedDate.getFullYear();
  });

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">Job Lifecycle Monitoring</h1>
            <p className="text-text-secondary mt-1">
              Track schedules, identify overdue deadlines, and moderate statuses.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Calendar size={14} /> Compact Calendar Picker
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <FileText size={14} /> All Jobs Table
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold animate-fadeIn">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Airbnb-style compact calendar card: takes 5 cols */}
            <div className="lg:col-span-5 card p-5 bg-white border border-slate-100 shadow-sm rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-sm text-text-primary tracking-tight">
                  {monthNames[month]} {year}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 border border-slate-100 hover:bg-slate-50 rounded-xl text-text-secondary transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 border border-slate-100 hover:bg-slate-50 rounded-xl text-text-secondary transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Airbnb design layout: w-8 h-8 square cells, compact, clean */}
              <div className="grid grid-cols-7 gap-y-1.5 text-center">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                  <div key={d} className="text-[10px] font-black text-slate-400 uppercase py-1">
                    {d}
                  </div>
                ))}

                {calendarDays.map((cell, idx) => {
                  const cellDate = new Date(cell.year, cell.month, cell.day);
                  const isSelected = cell.day === selectedDate.getDate() &&
                    cell.month === selectedDate.getMonth() &&
                    cell.year === selectedDate.getFullYear();

                  const isCurrentToday = cell.day === today.getDate() &&
                    cell.month === today.getMonth() &&
                    cell.year === today.getFullYear();

                  const cellJobsCount = targetJobs.filter(job => {
                    if (!job.deadline) return false;
                    const jobTypeStr = (job.type || '').toLowerCase();
                    const isOnsite = jobTypeStr === 'onsite' || jobTypeStr === 'on-site';
                    if (!isOnsite) return false;

                    const dDate = new Date(job.deadline);
                    return dDate.getDate() === cell.day &&
                      dDate.getMonth() === cell.month &&
                      dDate.getFullYear() === cell.year;
                  }).length;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(cellDate)}
                      className={`relative mx-auto w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition-all ${cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                        } ${isSelected
                          ? 'bg-slate-900 text-white shadow-md'
                          : isCurrentToday
                            ? 'border border-primary text-primary font-black'
                            : 'hover:bg-slate-100'
                        }`}
                    >
                      <span>{cell.day}</span>
                      {cellJobsCount > 0 && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-text-secondary">
                <span>Selected Date:</span>
                <span className="text-primary font-black">{selectedDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Details column: takes 7 cols */}
            <div className="lg:col-span-7 space-y-4">
              <div className="card p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
                    On-Site Gigs for {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {onsiteGigsForSelectedDate.length} Active
                  </span>
                </div>

                {onsiteGigsForSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {onsiteGigsForSelectedDate.map(job => {
                      const style = getJobStatusStyles(job);
                      return (
                        <div key={job.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div>
                            <p className="font-bold text-sm text-text-primary">{job.title}</p>
                            <p className="text-xs text-text-muted mt-0.5">{job.clientName || 'Partner'} • LKR {parseFloat(job.pay || 0).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>
                              {style.label}
                            </span>
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-black transition-all"
                              title="Moderate Status"
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-muted bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                    <Check size={24} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold">No Scheduled On-Site Work</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">Select other calendar dates with indicators to audit deadlines.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-text-secondary bg-slate-50 p-3 rounded-xl border border-slate-100 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary rounded-full" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Completed</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Overdue</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Pending</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full border border-border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-primary text-sm font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 outline-none focus:border-primary text-sm font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed / Rejected</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 outline-none focus:border-primary text-sm font-medium"
              >
                <option value="all">All Types</option>
                <option value="onsite">On-Site</option>
                <option value="remote">Remote</option>
              </select>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Job Title & Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Client / Provider</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Budget</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Deadline</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredJobs.map((job) => {
                      const style = getJobStatusStyles(job);
                      return (
                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary text-sm">{job.title}</span>
                            </div>
                            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-0.5">
                              {job.type || 'remote'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{job.category}</td>
                          <td className="px-6 py-4 text-sm text-text-muted font-medium">{job.clientName || 'GigConnect Partner'}</td>
                          <td className="px-6 py-4 text-sm font-bold text-text-primary">LKR {parseFloat(job.pay || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                            {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`badge ${job.status?.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              style.label === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                                job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'pending approval' ? 'bg-amber-100 text-amber-700' : 'bg-primary-light text-primary-dark font-bold'
                              }`}>
                              {style.label === 'Overdue' ? 'Overdue' : job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all"
                            >
                              Moderate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedJob && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedJob(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-border animate-slideUp z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-primary">Job Moderation Panel</span>
            <h2 className="text-xl font-bold mt-1 text-text-primary">
              {selectedJob.title}
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="text-text-secondary"><strong className="text-text-primary font-bold">Category:</strong> {selectedJob.category}</p>
                <p className="text-text-secondary"><strong className="text-text-primary font-bold">Type:</strong> {selectedJob.type}</p>
                <p className="text-text-secondary"><strong className="text-text-primary font-bold">Budget:</strong> LKR {parseFloat(selectedJob.pay || 0).toLocaleString()}</p>
                <p className="text-text-secondary"><strong className="text-text-primary font-bold">Deadline:</strong> {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleString() : 'N/A'}</p>
                <p className="text-text-secondary"><strong className="text-text-primary font-bold">Current Status:</strong> <span className="font-bold uppercase text-primary">{selectedJob.status}</span></p>
              </div>

              <div>
                <strong className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Intervene & Change Status</strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { status: 'pending', label: 'Reset to Pending', bg: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                    { status: 'active', label: 'Approve / Active', bg: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                    { status: 'in_progress', label: 'In Progress', bg: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
                    { status: 'completed', label: 'Complete Job', bg: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { status: 'closed', label: 'Close / Reject', bg: 'bg-rose-100 text-rose-700 hover:bg-rose-200' }
                  ].map(act => (
                    <button
                      key={act.status}
                      disabled={moderating || selectedJob.status?.toLowerCase() === act.status}
                      onClick={() => handleStatusChange(selectedJob.id, act.status)}
                      className="py-2 px-3 text-xs font-bold rounded-lg transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2 bg-slate-150 hover:bg-slate-200 text-text-secondary rounded-lg font-bold text-xs"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// AUDIT & REVENUE MONITORING TAB
const RevenueTab = ({ jobs = [], analytics }) => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = storedUser?.role || 'admin';

  // Approved jobs are those that are active, completed, or in progress (not pending approval or closed)
  const approvedJobs = jobs.filter(j => j.status !== 'Pending Approval' && j.status !== 'Closed');

  // Dynamically calculate actual commission from approved jobs
  const calculatedCommissions = approvedJobs.reduce((sum, j) => {
    const pay = parseFloat(j.pay || 0);
    return sum + (j.payment_status === 'paid' ? pay * 0.05 : 0);
  }, 0);

  // If there is dynamic commission, let's add it to base revenue, otherwise fallback to 0
  const baseRevenue = analytics ? parseFloat(analytics.revenue?.total_revenue || 0) : 0;
  const revenueVal = calculatedCommissions > 0 ? calculatedCommissions : baseRevenue;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Payments & Revenue Audit</h1>
          <p className="text-text-secondary mt-1">Audit commissions, university partner fee structures, and approve student withdrawals.</p>
        </div>
        {role === 'admin' && (
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => navigate('/dashboard/admin/reports?auto=financial')}
              className="px-3 py-2 bg-[#4E8C7E] hover:bg-[#4E8C7E]/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download size={12} /> Monthly Revenue (CSV)
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/reports?auto=financial')}
              className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download size={12} /> 6-Month Statement (CSV)
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/reports?auto=financial')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download size={12} /> Yearly Audit (CSV)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5 border border-slate-100 bg-white">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Commission Revenue</p>
          <p className="text-3xl font-heading font-black text-slate-800 mt-2">LKR {revenueVal.toLocaleString()}</p>
          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-text-muted">Target standard:</span>
            <span className="text-primary font-extrabold">LKR 100,000</span>
          </div>
        </div>

        <div className="card p-5 border border-slate-100 bg-white">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Platform Take-rate</p>
          <p className="text-3xl font-heading font-black text-slate-800 mt-2">5%</p>
          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-text-muted">Student fee:</span>
            <span className="text-emerald-600 font-extrabold">0% (Free)</span>
          </div>
        </div>

        <div className="card p-5 border border-slate-100 bg-white">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Boost / Priority Advertising</p>
          <p className="text-3xl font-heading font-black text-slate-800 mt-2">
            LKR {analytics?.revenue?.boost_revenue ? parseFloat(analytics.revenue.boost_revenue).toLocaleString() : '0'}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-text-muted">Boost package price:</span>
            <span className="text-amber-600 font-extrabold">LKR 300 / job</span>
          </div>
        </div>
      </div>

      {/* Approved Jobs & Platform Commissions Section */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-border bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-text-primary">Approved Jobs & Commission Details</h3>
            <p className="text-xs text-text-muted mt-0.5">Track commissions and payment status for approved gigs.</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full font-heading">
            {approvedJobs.length} Approved Jobs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Job Title</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Provider</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Total Budget</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Commission (5%)</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {approvedJobs.map((job) => {
                const totalBudget = parseFloat(job.pay || 0);
                const commission = totalBudget * 0.05;
                const isPaid = job.payment_status === 'paid';

                return (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-text-primary">{job.title}</p>
                      <p className="text-xs text-text-muted">{job.category} • {job.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary font-medium">{job.clientName || 'Partner Business'}</p>
                      <p className="text-[10px] text-text-muted">{job.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      LKR {totalBudget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-extrabold text-primary">
                      LKR {commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${isPaid ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-amber-100 text-amber-700 font-bold animate-pulse'
                        }`}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {approvedJobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-text-muted">
                    No approved jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// CHAT MONITORING & COMMUNICATIONS LOG
const CommunicationsTab = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'flagged'

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_conversations.php${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Error fetching admin conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (jobId) => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/get_messages.php?conversation_id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.messages)) {
        setConvMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [searchQuery]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.conversation_id || selectedConv.job_ID);
    }
  }, [selectedConv]);

  const handleFlagMessage = async (msgId, action = 'flag') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/flag_message.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          msg_id: msgId,
          action,
          reason: 'Flagged by Administrator for inspection'
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Message updated successfully');
        if (selectedConv) fetchMessages(selectedConv.conversation_id || selectedConv.job_ID);
        fetchConversations();
      }
    } catch (err) {
      alert('Failed to update message flag status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarnUser = async (userId, userName) => {
    const warningText = prompt(`Enter warning message to send to ${userName}:`, 'Admin Warning: Please adhere to platform messaging rules and avoid off-platform contact sharing.');
    if (!warningText) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/warn_user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          warning: warningText
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Warning issued to ${userName} successfully!`);
      } else {
        alert(data.error || 'Failed to issue warning');
      }
    } catch (err) {
      alert('Error issuing warning to user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to BAN user "${userName}" from GigConnect?`)) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/ban_user.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      if (data.success) {
        alert(`User ${userName} has been banned.`);
      } else {
        alert(data.error || 'Failed to ban user');
      }
    } catch (err) {
      alert('Error banning user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateConversation = async (jobId) => {
    if (!confirm('Are you sure you want to LOCK and TERMINATE this conversation? No further messages will be allowed.')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/messages/terminate_conversation.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversation_id: jobId })
      });
      const data = await response.json();
      if (data.success) {
        alert('Conversation terminated successfully.');
        setSelectedConv(null);
        fetchConversations();
      }
    } catch (err) {
      alert('Error terminating conversation');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterType === 'flagged') return parseInt(c.flagged_count || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-slate-800 flex items-center gap-2">
            <MessageSquare size={28} className="text-primary" /> Communications & Audit
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Audit user messages, inspect flagged off-platform contacts, issue warnings, or terminate conversations.
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 border border-slate-100 rounded-2xl shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, provider, or job..."
            className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs outline-none font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[#1A312C] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            All Conversations ({conversations.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'flagged' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
          >
            <ShieldAlert size={14} /> Flagged Only ({conversations.filter(c => parseInt(c.flagged_count || 0) > 0).length})
          </button>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black tracking-wider text-slate-400">
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Participants</th>
                <th className="px-6 py-4">Last Message</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">Loading conversations...</td>
                </tr>
              ) : filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">No active conversations found.</td>
                </tr>
              ) : (
                filteredConversations.map((conv) => {
                  const hasFlag = parseInt(conv.flagged_count || 0) > 0;
                  return (
                    <tr
                      key={conv.conversation_id || conv.job_ID}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${hasFlag ? 'bg-rose-50/30' : ''}`}
                      onClick={() => setSelectedConv(conv)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{conv.job_title || 'Campus Gig'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {conv.job_ID}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{conv.sender_name || conv.partner_name}</p>
                        {conv.receiver_name && <p className="text-[10px] text-slate-400">vs {conv.receiver_name}</p>}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-600 font-medium">
                        {conv.last_message || 'No messages'}
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-400 font-medium">
                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {hasFlag ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                            <ShieldAlert size={10} /> Flagged ({conv.flagged_count})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            <CheckCircle size={10} /> Clean
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedConv(conv)}
                          className="px-3 py-1.5 bg-[#1A312C] text-white hover:bg-[#244b41] rounded-xl text-xs font-bold transition-all shadow-2xs"
                        >
                          Inspect Log
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversation Inspection Modal */}
      {selectedConv && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedConv(null)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col animate-scaleUp z-10">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                  Conversation Audit Log
                </span>
                <h3 className="text-xl font-heading font-black text-slate-800 mt-1">{selectedConv.job_title}</h3>
                <p className="text-xs text-slate-400 font-medium">Job ID: {selectedConv.job_ID}</p>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Moderation Toolbar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Admin Actions:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleWarnUser(selectedConv.sender_ID || selectedConv.partner_user_ID, selectedConv.sender_name || selectedConv.partner_name)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold transition-all shadow-2xs"
                >
                  Warn User
                </button>
                <button
                  onClick={() => handleBanUser(selectedConv.sender_ID || selectedConv.partner_user_ID, selectedConv.sender_name || selectedConv.partner_name)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-all shadow-2xs"
                >
                  Ban User
                </button>
                <button
                  onClick={() => handleTerminateConversation(selectedConv.conversation_id || selectedConv.job_ID)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-2xs"
                >
                  Terminate Conversation
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/70 rounded-2xl space-y-3 min-h-[300px] border border-slate-100">
              {messagesLoading ? (
                <div className="text-center text-xs text-slate-400 py-16">Loading conversation log...</div>
              ) : convMessages.length > 0 ? (
                convMessages.map((msg) => {
                  const isFlagged = msg.flagged == 1;
                  return (
                    <div key={msg.msg_ID} className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${isFlagged ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-white border-slate-100 text-slate-800'
                      }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{msg.sender_name} → {msg.receiver_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(msg.created_at || msg.timestamp).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleFlagMessage(msg.msg_ID, isFlagged ? 'unflag' : 'flag')}
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isFlagged ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                          >
                            {isFlagged ? 'Unflag' : 'Flag'}
                          </button>
                        </div>
                      </div>

                      <p className="font-medium leading-relaxed">{msg.content}</p>

                      {/* Admin-only Flag Reason Banner */}
                      {isFlagged && msg.flagged_reason && (
                        <div className="p-2 bg-rose-100/70 rounded-xl text-[10px] font-bold text-rose-800 flex items-center gap-1.5 mt-2">
                          <ShieldAlert size={12} />
                          <span>Admin Flag Reason: {msg.flagged_reason}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-slate-400 py-16">No messages recorded in this conversation.</div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedConv(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// SYSTEM REPORTS GENERATION & DOWNLOADS PANEL
const ReportsTab = ({ analytics }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [generating, setGenerating] = useState(null);

  const [downloadHistory, setDownloadHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('report_download_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const reportTypes = [
    { id: 'jobs', name: 'University Gig Placement Audit', format: 'PDF', size: '2.4 MB', desc: 'Summary of student placements, active job schedules, and client performance ratings.' },
    { id: 'financial', name: 'UWU Commission Financial Statement', format: 'CSV', size: '154 KB', desc: 'Invoice logs, advertisement boosts, and platform commissions collected close to LKR 100,000 target.' },
    { id: 'interactions', name: 'Campus Student Engagement Metrics', format: 'PDF', size: '4.8 MB', desc: 'Over 1,284 logged user interactions categorized by department, categories, and success rates.' },
  ];

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.get(
          `${apiUrl}/api/admin/export_report.php?type=jobs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReportData(response.data);
      } catch (err) {
        console.error("Error fetching report from API:", err);
      }
    };
    fetchReport();
  }, []);

  const getReportData = (id) => {
    if (id === 'jobs') {
      return {
        headers: ["Job ID", "Student Email", "Client Email", "Payment (LKR)", "Status", "Date"],
        rows: [
          ["JOB001", "pmt23057@std.uwu.ac.lk", "mpk@gmail.com", "1500.00", "completed", "2026-06-13"],
          ["JOB002", "iit22030@std.uwu.ac.lk", "uwu_foods@gmail.com", "4500.00", "completed", "2026-06-13"],
          ["JOB003", "aqt21060@std.uwu.ac.lk", "techlab_uwu@gmail.com", "12000.00", "completed", "2026-06-13"],
          ["JOB004", "cst23001@std.uwu.ac.lk", "mpk@gmail.com", "8000.00", "completed", "2026-06-13"],
          ["JOB005", "hte22088@std.uwu.ac.lk", "catering_services@gmail.com", "3200.00", "completed", "2026-06-13"],
          ["JOB006", "ict23012@std.uwu.ac.lk", "websolutions@gmail.com", "9400.00", "completed", "2026-06-13"]
        ],
        data: [
          { "Job ID": "JOB001", "Student Email": "pmt23057@std.uwu.ac.lk", "Client Email": "mpk@gmail.com", "Payment (LKR)": "1500.00", "Status": "completed", "Date": "2026-06-13" },
          { "Job ID": "JOB002", "Student Email": "iit22030@std.uwu.ac.lk", "Client Email": "uwu_foods@gmail.com", "Payment (LKR)": "4500.00", "Status": "completed", "Date": "2026-06-13" },
          { "Job ID": "JOB003", "Student Email": "aqt21060@std.uwu.ac.lk", "Client Email": "techlab_uwu@gmail.com", "Payment (LKR)": "12000.00", "Status": "completed", "Date": "2026-06-13" },
          { "Job ID": "JOB004", "Student Email": "cst23001@std.uwu.ac.lk", "Client Email": "mpk@gmail.com", "Payment (LKR)": "8000.00", "Status": "completed", "Date": "2026-06-13" },
          { "Job ID": "JOB005", "Student Email": "hte22088@std.uwu.ac.lk", "Client Email": "catering_services@gmail.com", "Payment (LKR)": "3200.00", "Status": "completed", "Date": "2026-06-13" },
          { "Job ID": "JOB006", "Student Email": "ict23012@std.uwu.ac.lk", "Client Email": "websolutions@gmail.com", "Payment (LKR)": "9400.00", "Status": "completed", "Date": "2026-06-13" }
        ]
      };
    } else if (id === 'financial') {
      return {
        headers: ["Transaction ID", "Student Email", "Client Email", "Commission (LKR)", "Status", "Date"],
        rows: [
          ["TXN-90823", "pmt23057@std.uwu.ac.lk", "mpk@gmail.com", "1500.00", "Paid", "2026-06-13"],
          ["TXN-90824", "iit22030@std.uwu.ac.lk", "uwu_foods@gmail.com", "4500.00", "Paid", "2026-06-13"],
          ["TXN-90825", "aqt21060@std.uwu.ac.lk", "techlab_uwu@gmail.com", "12000.00", "Paid", "2026-06-13"],
          ["TXN-90826", "cst23001@std.uwu.ac.lk", "mpk@gmail.com", "8000.00", "Paid", "2026-06-13"],
          ["TXN-90827", "hte22088@std.uwu.ac.lk", "catering_services@gmail.com", "3200.00", "Paid", "2026-06-13"],
          ["TXN-90828", "ict23012@std.uwu.ac.lk", "websolutions@gmail.com", "9400.00", "Paid", "2026-06-13"]
        ],
        data: [
          { "Transaction ID": "TXN-90823", "Student Email": "pmt23057@std.uwu.ac.lk", "Client Email": "mpk@gmail.com", "Commission (LKR)": "1500.00", "Status": "Paid", "Date": "2026-06-13" },
          { "Transaction ID": "TXN-90824", "Student Email": "iit22030@std.uwu.ac.lk", "Client Email": "uwu_foods@gmail.com", "Commission (LKR)": "4500.00", "Status": "Paid", "Date": "2026-06-13" },
          { "Transaction ID": "TXN-90825", "Student Email": "aqt21060@std.uwu.ac.lk", "Client Email": "techlab_uwu@gmail.com", "Commission (LKR)": "12000.00", "Status": "Paid", "Date": "2026-06-13" },
          { "Transaction ID": "TXN-90826", "Student Email": "cst23001@std.uwu.ac.lk", "Client Email": "mpk@gmail.com", "Commission (LKR)": "8000.00", "Status": "Paid", "Date": "2026-06-13" },
          { "Transaction ID": "TXN-90827", "Student Email": "hte22088@std.uwu.ac.lk", "Client Email": "catering_services@gmail.com", "Commission (LKR)": "3200.00", "Status": "Paid", "Date": "2026-06-13" },
          { "Transaction ID": "TXN-90828", "Student Email": "ict23012@std.uwu.ac.lk", "Client Email": "websolutions@gmail.com", "Commission (LKR)": "9400.00", "Status": "Paid", "Date": "2026-06-13" }
        ]
      };
    } else {
      return {
        headers: ["Department / Role", "Interaction Count", "Percentage Contribution", "Last Activity Date"],
        rows: [
          ["CST Students", "616", "48%", "2026-06-13"],
          ["IIT Students", "282", "22%", "2026-06-13"],
          ["AQT Students", "192", "15%", "2026-06-13"],
          ["Job Providers (@gmail.com)", "444", "35%", "2026-06-13"],
          ["Others", "194", "15%", "2026-06-13"]
        ],
        data: [
          { "Department / Role": "CST Students", "Interaction Count": "616", "Percentage Contribution": "48%", "Last Activity Date": "2026-06-13" },
          { "Department / Role": "IIT Students", "Interaction Count": "282", "Percentage Contribution": "22%", "Last Activity Date": "2026-06-13" },
          { "Department / Role": "AQT Students", "Interaction Count": "192", "Percentage Contribution": "15%", "Last Activity Date": "2026-06-13" },
          { "Department / Role": "Job Providers (@gmail.com)", "Interaction Count": "444", "Percentage Contribution": "35%", "Last Activity Date": "2026-06-13" },
          { "Department / Role": "Others", "Interaction Count": "194", "Percentage Contribution": "15%", "Last Activity Date": "2026-06-13" }
        ]
      };
    }
  };

  const exportPDF = (dataParam = null, titleParam = null) => {
    const data = dataParam || reportData;
    if (!data) return;
    const title = titleParam || 'Jobs Report';

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('GigConnect UWU', 14, 22);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated: ' + new Date().toLocaleDateString(), 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [data.headers],
      body: data.rows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    doc.save(title.toLowerCase().replace(/ /g, '-') + '.pdf');
  };

  const exportCSV = (dataParam = null, filenameParam = null) => {
    const data = dataParam || (reportData ? reportData.data : null);
    if (!data) return;
    const filename = filenameParam || 'gigconnect-report';

    const worksheet = XLSX.utils.json_to_sheet(data);
    const cols = Object.keys(data[0]).map(() => ({ wch: 20 }));
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      exportPDF();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (id) => {
    const reportObj = reportTypes.find(r => r.id === id);
    if (!reportObj) return;

    setGenerating(id);
    const filename = reportObj.name.toLowerCase().replace(/ /g, '-');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.get(
        `${apiUrl}/api/admin/export_report.php?type=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const realData = response.data;
      if (realData && realData.success) {
        if (reportObj.format === 'CSV') {
          exportCSV(realData.data, filename);
        } else {
          exportPDF(realData, reportObj.name);
        }
      } else {
        alert(realData.error || "Failed to generate report.");
      }
    } catch (err) {
      console.error("Error generating report from API:", err);
      // Fallback to local offline template data if API fails
      const localData = getReportData(id);
      if (reportObj.format === 'CSV') {
        exportCSV(localData.data, filename);
      } else {
        exportPDF(localData, reportObj.name);
      }
    } finally {
      // Prepend to history
      setDownloadHistory(prev => {
        const filtered = prev.filter(item => item.id !== id);
        const updated = [
          {
            id: id,
            name: reportObj.name,
            format: reportObj.format,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
          },
          ...filtered
        ];
        localStorage.setItem('report_download_history', JSON.stringify(updated));
        return updated;
      });
      setGenerating(null);
    }
  };

  useEffect(() => {
    const autoReport = searchParams.get('auto');
    if (autoReport) {
      const found = reportTypes.some(r => r.id === autoReport);
      if (found) {
        handleGenerate(autoReport);
        // Clean up search params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('auto');
        setSearchParams(newParams);
      }
    }
  }, [searchParams]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Reports & Auditing Documents</h1>
        <p className="text-text-secondary mt-1">Export high-resolution data audits regarding university gig placements, revenue, and support tickets.</p>
      </div>

      <div className="card p-6 border border-slate-100 bg-white">
        <h3 className="font-extrabold text-lg text-slate-800 mb-1">Quick Jobs Export</h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-4">Export standard jobs statistics and placement summaries fetched directly from the backend database.</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 font-bold text-xs shadow-md transition-all"
          >
            {loading ? 'Generating...' : 'Export PDF'}
          </button>

          <button
            onClick={exportCSV}
            disabled={!reportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold text-xs shadow-md transition-all"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-100 bg-white">
            <div className="space-y-1 md:max-w-2xl">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-800">{report.name}</h3>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">{report.format}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{report.desc}</p>
              <p className="text-[10px] text-text-muted font-bold">Estimated size: {report.size}</p>
            </div>

            <button
              onClick={() => handleGenerate(report.id)}
              disabled={generating !== null}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 self-start md:self-auto shadow-md transition-all disabled:opacity-50"
            >
              {generating === report.id ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Compiling Data...
                </>
              ) : (
                <>
                  <Download size={14} /> Download Statement
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {downloadHistory.length > 0 && (
        <div className="card p-6 border border-slate-100 bg-white">
          <h2 className="font-extrabold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Recent Exports & Download History (Click to redownload)
          </h2>
          <div className="divide-y divide-slate-100">
            {downloadHistory.map((historyItem, idx) => (
              <div
                key={`${historyItem.id}-${idx}`}
                onClick={() => handleGenerate(historyItem.id)}
                className="py-3 flex justify-between items-center hover:bg-slate-50 p-3 rounded-xl cursor-pointer transition-all group"
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors flex items-center gap-2">
                    {historyItem.name}
                    <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{historyItem.format}</span>
                  </p>
                  <p className="text-[10px] text-text-muted">Exported at {historyItem.date} {historyItem.timestamp}</p>
                </div>
                <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                  <Download size={12} /> Redownload
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// COMPLAINTS ADMIN TAB (TO LINK WITH USER ACTION)
const ComplaintsAdminTab = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const { fetchNotifications } = useNotifications();

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.get(`${apiUrl}/api/admin/complaints.php`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id, newStatus = 'Resolved') => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      await axios.post(`${apiUrl}/api/admin/complaints.php`,
        { id, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Complaint #${id} updated to ${newStatus} in the database.`);
      fetchComplaints();
      fetchNotifications();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error("Error updating complaint:", err);
      alert("Failed to update complaint status in database.");
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Complaints & Alerts</h1>
          <p className="text-text-secondary mt-1">Audit complaints submitted directly to gigconnect@gmail.com and system-generated student schedule completion alerts.</p>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Complainer & Target</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Reason</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-text-secondary font-medium">Loading complaints from database...</td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-text-secondary font-medium">No complaints found.</td>
                  </tr>
                ) : (
                  complaints.map(c => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                      onClick={() => setSelectedComplaint(c)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{c.complainer}</p>
                        <p className="text-xs text-text-muted mt-0.5">Vs: {c.about}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-rose-600 text-xs">{c.reason}</td>
                      <td className="px-6 py-4 text-xs text-text-secondary max-w-xs truncate" title={c.text}>{c.text}</td>
                      <td className="px-6 py-4 text-xs text-text-muted">{c.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {c.status !== 'Resolved' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolve(c.id, 'Resolved')}
                              className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-[10px] font-bold rounded-lg transition-all shadow-sm"
                            >
                              Mark Resolved
                            </button>
                            <button
                              onClick={() => handleResolve(c.id, 'Read')}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg transition-all shadow-sm"
                            >
                              Mark Read
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5"><Check size={12} /> Solved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedComplaint && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedComplaint(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-scaleUp z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedComplaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {selectedComplaint.status}
                </span>
                <h3 className="font-heading font-black text-lg text-slate-900 mt-2">{selectedComplaint.reason}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-100">
              <p className="text-slate-600"><strong className="text-slate-800">Complainer:</strong> {selectedComplaint.complainer}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Target User (Vs):</strong> {selectedComplaint.about}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Incident Date:</strong> {selectedComplaint.date}</p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Alert/Complaint Details</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-4 rounded-xl max-h-48 overflow-y-auto font-medium font-sans">
                {selectedComplaint.text}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Close View
              </button>
              {selectedComplaint.status !== 'Resolved' && (
                <>
                  <button
                    onClick={() => handleResolve(selectedComplaint.id, 'Read')}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => handleResolve(selectedComplaint.id, 'Resolved')}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    Mark Resolved
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const DEFAULT_ADMIN_DELIVERIES = [
  {
    delivery_ID: 'DEL001',
    job_title: 'Handmade Crochet Bag Delivery',
    job_payment: 3500,
    student_name: 'Kirushika Thavanesan',
    student_phone: '+94 77 123 4567',
    delivery_staff_name: 'Rajan Kumar',
    delivery_staff_phone: '+94 71 456 7890',
    delivery_staff_vehicle: 'Motorbike',
    client_phone: '+94 77 987 6543',
    pickup_address: 'Hostel Block A, Uva Wellassa University, Badulla',
    delivery_address: 'Passara Road, Badulla Town',
    distance: 3.2,
    delivery_fee: 150,
    date_requested: '2026-05-18T10:30:00Z',
    status: 'assigned',
    otp: '482910'
  },
  {
    delivery_ID: 'DEL002',
    job_title: 'Custom Chocolate Cake Order',
    job_payment: 4500,
    student_name: 'Nogini Sureshkumar',
    student_phone: '+94 77 234 5678',
    delivery_staff_name: 'Saman Perera',
    delivery_staff_phone: '+94 77 555 4321',
    delivery_staff_vehicle: 'Tuk-Tuk',
    client_phone: '+94 71 333 2211',
    pickup_address: 'Science Faculty Canteen, UWU',
    delivery_address: 'King Street, Badulla',
    distance: 4.8,
    delivery_fee: 220,
    date_requested: '2026-05-19T14:15:00Z',
    status: 'in_transit',
    otp: '918234'
  },
  {
    delivery_ID: 'DEL003',
    job_title: 'Handmade Beaded Jewelry Set',
    job_payment: 2800,
    student_name: 'Hilmanraj Saminthanraj',
    student_phone: '+94 77 345 6789',
    delivery_staff_name: 'Rajan Kumar',
    delivery_staff_phone: '+94 71 456 7890',
    delivery_staff_vehicle: 'Motorbike',
    client_phone: '+94 77 111 9988',
    pickup_address: 'Main Library Lawn, UWU',
    delivery_address: 'Bandarawela Road, Badulla',
    distance: 2.5,
    delivery_fee: 120,
    date_requested: '2026-05-20T09:00:00Z',
    status: 'confirmed',
    otp: '304912'
  }
];

const DeliveryManagementTab = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelModal, setSelectedDelModal] = useState(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery/get_pending_assignments.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const fetched = Array.isArray(data) ? data : (data.deliveries || []);
      if (Array.isArray(fetched) && fetched.length > 0) {
        setDeliveries(fetched);
      } else {
        setDeliveries(DEFAULT_ADMIN_DELIVERIES);
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setDeliveries(DEFAULT_ADMIN_DELIVERIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Filtered deliveries based on search & tab filters
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchSearch =
        (d.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.delivery_ID || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.delivery_staff_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.pickup_address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.delivery_address || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      const st = (d.status || '').toLowerCase();
      if (statusFilter === 'assigned') return st === 'assigned';
      if (statusFilter === 'in_transit') return st === 'in_transit' || st === 'picked_up';
      if (statusFilter === 'completed') return st === 'delivered' || st === 'confirmed';
      return true;
    });
  }, [deliveries, searchQuery, statusFilter]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = deliveries.length;
    const assigned = deliveries.filter(d => (d.status || '').toLowerCase() === 'assigned').length;
    const inTransit = deliveries.filter(d => ['in_transit', 'picked_up'].includes((d.status || '').toLowerCase())).length;
    const completed = deliveries.filter(d => ['delivered', 'confirmed'].includes((d.status || '').toLowerCase())).length;
    return { total, assigned, inTransit, completed };
  }, [deliveries]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Clean Minimal Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-black text-slate-800 flex items-center gap-2">
            <Truck size={24} className="text-primary" /> Delivery Management
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Monitor orders and auto-assigned platform riders.
          </p>
        </div>

      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-2 justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
            <p className="text-2xl font-heading font-black text-slate-800 mt-0.5">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Assigned</p>
            <p className="text-2xl font-heading font-black text-slate-800 mt-0.5">{metrics.assigned}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Transit</p>
            <p className="text-2xl font-heading font-black text-slate-800 mt-0.5">{metrics.inTransit}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Check size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-2xl font-heading font-black text-slate-800 mt-0.5">{metrics.completed}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'assigned', label: 'Auto-Assigned' },
            { id: 'in_transit', label: 'In Transit' },
            { id: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === tab.id
                ? 'bg-[#1A312C] text-white shadow-md'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search order, student, rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:border-primary focus:bg-white transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-3 text-xs font-bold">Fetching campus dispatches...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-500 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck size={32} />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Delivery Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
            {searchQuery ? 'No deliveries match your search query.' : 'Delivery orders requiring campus riders will list here automatically when requested.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order & Gig Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender (Student)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Assigned Rider</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route Path</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeliveries.map((del) => {
                  const isAssigned = !!del.delivery_staff_name;
                  const st = (del.status || '').toLowerCase();

                  return (
                    <tr key={del.delivery_ID} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Job Title & Order Specs */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-sm block group-hover:text-primary transition-colors">
                          {del.job_title}
                        </span>
                        <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-slate-400 mt-1">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">ID: {del.delivery_ID}</span>
                          <span>•</span>
                          <span>{parseFloat(del.distance || 0).toFixed(1)} km</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-black">LKR {parseFloat(del.delivery_fee || del.distance * 30 || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Student Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                            {del.student_name ? del.student_name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{del.student_name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{del.student_phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rider Card Column */}
                      <td className="px-6 py-4">
                        {isAssigned ? (
                          <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-2xl max-w-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 text-xs truncate">{del.delivery_staff_name}</span>
                              <span className="text-[9px] font-black bg-emerald-200/80 text-emerald-950 px-1.5 py-0.5 rounded-md shrink-0">
                                Nearest Match
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-800 font-semibold truncate">
                              {del.delivery_staff_phone || 'Registered Rider'} • {del.delivery_staff_vehicle || 'Motorbike'}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-amber-50/70 border border-amber-100 p-2.5 rounded-2xl max-w-xs space-y-0.5">
                            <span className="text-xs font-bold text-amber-800 block">System Auto-Matching...</span>
                            <span className="text-[10px] text-amber-600 font-medium block">Finding rider with shortest distance</span>
                          </div>
                        )}
                      </td>

                      {/* Route Path */}
                      <td className="px-6 py-4 space-y-1 max-w-xs">
                        <div className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <strong className="text-slate-400 shrink-0">From:</strong> {del.pickup_address}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          <strong className="text-slate-400 shrink-0">To:</strong> {del.delivery_address}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${st === 'delivered' || st === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          st === 'in_transit' || st === 'picked_up' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            st === 'assigned' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st === 'delivered' || st === 'confirmed' ? 'bg-emerald-600' :
                            st === 'in_transit' || st === 'picked_up' ? 'bg-blue-600 animate-pulse' :
                              'bg-emerald-500'
                            }`} />
                          {st === 'pending_assignment' ? 'Matching Rider' :
                            st === 'assigned' ? 'Rider Assigned' :
                              st === 'in_transit' ? 'In Transit' :
                                st === 'delivered' ? 'Delivered' :
                                  st === 'confirmed' ? 'Confirmed' : del.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedDelModal(del)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm hover:scale-105"
                        >
                          <Eye size={14} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspection Details Modal */}
      {selectedDelModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedDelModal(null)} />
          <div className="relative bg-white rounded-[2.5rem] max-w-lg w-full p-8 space-y-6 shadow-2xl border border-slate-100 animate-fadeIn z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dispatch Specs</span>
                <h3 className="font-heading font-black text-slate-900 text-xl flex items-center gap-2 mt-0.5">
                  <Truck size={22} className="text-primary" /> Delivery Details
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Order ID: {selectedDelModal.delivery_ID}</p>
              </div>
              <button
                onClick={() => setSelectedDelModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-5 rounded-2xl space-y-2 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Job Title</span>
                <p className="font-bold text-slate-800 text-base">{selectedDelModal.job_title}</p>
                <p className="text-xs text-emerald-600 font-black">Value / Payment: LKR {parseFloat(selectedDelModal.job_payment || 0).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Student (Sender)</span>
                  <p className="font-bold text-slate-800 text-xs">{selectedDelModal.student_name}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedDelModal.student_phone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Job Provider Contact</span>
                  <p className="font-bold text-slate-800 text-xs">{selectedDelModal.client_name || 'Job Provider'}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedDelModal.client_phone || 'N/A'}</p>
                </div>
              </div>

              <div className="p-5 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Auto-Assigned Rider</span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded-full">Shortest Distance Match</span>
                </div>
                {selectedDelModal.delivery_staff_name ? (
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedDelModal.delivery_staff_name}</p>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">{selectedDelModal.delivery_staff_phone || 'Registered Phone'} • {selectedDelModal.delivery_staff_vehicle || 'Motorbike'}</p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 font-bold">System searching for closest available rider...</p>
                )}
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pickup Location</span>
                  <p className="text-xs font-bold text-slate-800">{selectedDelModal.pickup_address}</p>
                </div>
                <div className="space-y-1 border-t border-slate-200/60 pt-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Delivery Destination</span>
                  <p className="text-xs font-bold text-slate-800">{selectedDelModal.delivery_address}</p>
                </div>
                <div className="flex justify-between items-center text-xs font-black text-slate-700 border-t border-slate-200/60 pt-3">
                  <span>Distance: {parseFloat(selectedDelModal.distance || 0).toFixed(1)} km</span>
                  <span className="text-emerald-600">Fee: LKR {parseFloat(selectedDelModal.delivery_fee || 0).toLocaleString()}</span>
                </div>
              </div>

              {selectedDelModal.otp && (
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900">Verification OTP Code:</span>
                  <span className="font-mono font-black text-amber-950 text-base tracking-widest">{selectedDelModal.otp}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDelModal(null)}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition-all shadow-md"
            >
              Close Inspection
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
