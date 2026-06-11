import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useJobs } from '../../context/JobsContext';
import { 
  Users, CheckCircle, Search, BarChart2, MessageSquare, Truck, AlertCircle, 
  FileText, LayoutDashboard, TrendingUp, DollarSign, ShieldAlert, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { jobs, applications, approveJob, rejectJob } = useJobs();

  return (
    <DashboardLayout>
      <Routes>
        <Route path="overview" element={<OverviewTab jobs={jobs} applications={applications} />} />
        <Route path="users" element={<UserManagementTab />} />
        <Route path="approvals" element={<ApprovalsTab jobs={jobs} approve={approveJob} reject={rejectJob} />} />
        <Route path="monitoring" element={<PlaceholderTab title="Job Monitoring" icon={Search} message="Real-time monitoring of all active platform jobs." />} />
        <Route path="revenue" element={<PlaceholderTab title="Payments & Revenue" icon={DollarSign} message="Financial reports and transaction history." />} />
        <Route path="communications" element={<PlaceholderTab title="Communications" icon={MessageSquare} message="Manage platform-wide announcements and direct support." />} />
        <Route path="delivery" element={<PlaceholderTab title="Delivery Management" icon={Truck} message="Oversee all active delivery assignments." />} />
        <Route path="complaints" element={<PlaceholderTab title="Complaints" icon={AlertCircle} message="Review and resolve student or client disputes." />} />
        <Route path="analytics" element={<AnalyticsTab />} />
        <Route path="reports" element={<PlaceholderTab title="Reports" icon={FileText} message="Generate and export platform performance reports." />} />
        <Route path="settings" element={<PlaceholderTab title="System Settings" icon={Settings} message="Configure platform parameters and admin roles." />} />
        <Route path="*" element={<OverviewTab jobs={jobs} applications={applications} />} />
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

const OverviewTab = ({ jobs, applications }) => {
  const stats = [
    { label: 'Total Users', value: '1,420', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'Active').length, change: '+5%', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Verified Clients', value: '42', change: '+2', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue (LKR)', value: '125,400', change: '+18%', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Approvals', value: jobs.filter(j => j.status === 'Pending Approval').length, change: '-3', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Fraud Alerts', value: '2', change: '0', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Active Deliveries', value: '12', change: '+4', icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Success Rate', value: '94%', change: '+1%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Admin Overview</h1>
        <p className="text-text-secondary mt-1">Platform health and activities at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 relative">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-heading font-bold text-text-primary">{stat.value}</p>
              <span className={`text-xs font-bold flex items-center ${stat.change.startsWith('+') ? 'text-emerald-600' : stat.change === '0' ? 'text-text-muted' : 'text-danger'}`}>
                {stat.change.startsWith('+') ? <ArrowUpRight size={12}/> : stat.change === '0' ? null : <ArrowDownRight size={12}/>}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { text: 'New student registration: Kirushika T.', time: '2 mins ago', icon: Users, color: 'bg-blue-100 text-blue-600' },
              { text: 'Job "Logo Design" posted by Badulla Tech', time: '15 mins ago', icon: FileText, color: 'bg-amber-100 text-amber-600' },
              { text: 'Payment of LKR 800 received (Commission)', time: '1 hour ago', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
              { text: 'Complaint raised by student cst23074', time: '3 hours ago', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 ${item.color} rounded-full flex-shrink-0 flex items-center justify-center`}>
                  <item.icon size={18} />
                </div>
                <div className="flex-1 border-b border-border pb-4 last:border-0">
                  <p className="text-sm font-medium text-text-primary">{item.text}</p>
                  <p className="text-xs text-text-muted mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/dashboard/admin/approvals" className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-primary hover:text-white rounded-xl transition-all group">
              <span className="text-sm font-medium">Review Pending Jobs</span>
              <span className="bg-white text-primary text-[10px] font-bold px-2 py-1 rounded-full shadow-sm group-hover:bg-primary-dark group-hover:text-white">5</span>
            </Link>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-primary hover:text-white rounded-xl transition-all">
              <span className="text-sm font-medium">Verify New Clients</span>
              <CheckCircle size={16} />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-primary hover:text-white rounded-xl transition-all">
              <span className="text-sm font-medium">Manage Complaints</span>
              <AlertCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalsTab = ({ jobs, approve, reject }) => {
  const pendingJobs = jobs.filter(j => j.status === 'Pending Approval');
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-heading font-bold text-text-primary">Job Approvals</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Job Info</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pendingJobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4">
                  <p className="font-bold text-text-primary">{job.title}</p>
                  <p className="text-xs text-text-muted">{job.category} • {job.type}</p>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">{job.clientName}</td>
                <td className="px-6 py-4 text-sm font-bold">LKR {job.pay}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => approve(job.id)}
                      className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => reject(job.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
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
          <div className="p-12 text-center text-text-muted">
            No jobs pending approval.
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
  const data = [
    { name: 'Week 1', jobs: 400, revenue: 2400 },
    { name: 'Week 2', jobs: 300, revenue: 1398 },
    { name: 'Week 3', jobs: 200, revenue: 9800 },
    { name: 'Week 4', jobs: 278, revenue: 3908 },
    { name: 'Week 5', jobs: 189, revenue: 4800 },
    { name: 'Week 6', jobs: 239, revenue: 3800 },
  ];

  const pieData = [
    { name: 'Web Dev', value: 400 },
    { name: 'Design', value: 300 },
    { name: 'Photography', value: 300 },
    { name: 'Data Entry', value: 200 },
  ];

  const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-heading font-bold text-text-primary">Platform Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="font-bold mb-6">Jobs Posted (Last 6 Weeks)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-6">Revenue Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold mb-6">Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementTab = () => (
  <div className="space-y-8 animate-fadeIn">
    <h1 className="text-3xl font-heading font-bold text-text-primary">User Management</h1>
    <div className="flex gap-4 mb-6">
      <button className="px-6 py-2 bg-primary text-white rounded-full font-bold">Students</button>
      <button className="px-6 py-2 bg-white border border-border text-text-secondary rounded-full hover:border-primary">Clients</button>
      <button className="px-6 py-2 bg-white border border-border text-text-secondary rounded-full hover:border-primary">Delivery Staff</button>
    </div>
    <div className="card p-20 text-center">
      <Users size={48} className="text-text-muted mx-auto mb-4" />
      <h3 className="text-xl font-bold">Manage Users</h3>
      <p className="text-text-secondary">Comprehensive user management interface coming soon.</p>
    </div>
  </div>
);

export default AdminDashboard;
