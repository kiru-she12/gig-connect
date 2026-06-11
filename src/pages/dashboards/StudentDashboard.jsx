import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import JobCard from '../../components/shared/JobCard';
import { 
  TrendingUp, Briefcase, DollarSign, Star, Search, Clock, 
  CheckCircle2, MessageSquare, Truck, Settings, Bell, CheckCircle 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { jobs, applications, applyForJob } = useJobs();
  const location = useLocation();

  // Helper to get active tab from path
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'home';
  };

  const studentApps = applications.filter(app => app.studentId === user.id);
  const earned = studentApps
    .filter(app => app.status === 'Paid')
    .reduce((sum, app) => {
      const job = jobs.find(j => j.id === app.jobId);
      return sum + (job ? job.pay : 0);
    }, 0);

  // Recommendation logic: Simple skill match
  const recommendedJobs = jobs
    .filter(job => job.status === 'Active' && !studentApps.some(app => app.jobId === job.id))
    .map(job => {
      const matchCount = job.skills.filter(s => user.skills?.includes(s)).length;
      const score = Math.round((matchCount / (job.skills.length || 1)) * 100);
      return { ...job, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <DashboardLayout>
      <Routes>
        <Route path="home" element={
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
              <p className="text-text-secondary mt-1">Here's what's happening with your gigs today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Applications Sent', value: studentApps.length, icon: Briefcase, color: 'bg-blue-500' },
                { label: 'Jobs Completed', value: studentApps.filter(a => a.status === 'Completed').length, icon: CheckCircle2, color: 'bg-emerald-500' },
                { label: 'Total Earned', value: `LKR ${earned.toLocaleString()}`, icon: DollarSign, color: 'bg-amber-500' },
                { label: 'Platform Rating', value: '4.8', icon: Star, color: 'bg-purple-500' },
              ].map((stat, i) => (
                <div key={i} className="card p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`text-${stat.color.split('-')[1]}-600`} size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-heading font-bold text-text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended Jobs */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-bold text-text-primary">Recommended for You</h2>
                <Link to="/dashboard/student/browse" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                  View All <Search size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedJobs.slice(0, 4).map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    matchScore={job.matchScore}
                    onApply={(id) => applyForJob(id, user.id)}
                  />
                ))}
              </div>
            </section>
          </div>
        } />

        <Route path="browse" element={
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary">Browse All Gigs</h1>
              <p className="text-text-secondary mt-1">Find the perfect task to earn some extra cash.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {jobs.filter(j => j.status === 'Active').map(job => (
                <JobCard 
                  key={job.id} 
                  job={job}
                  applied={studentApps.some(a => a.jobId === job.id)}
                  onApply={(id) => applyForJob(id, user.id)}
                />
              ))}
            </div>
          </div>
        } />

        <Route path="applications" element={
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-primary">My Applications</h1>
              <p className="text-text-secondary mt-1">Track the status of your gig applications.</p>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Job Title</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Client</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Applied Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentApps.map((app) => {
                      const job = jobs.find(j => j.id === app.jobId);
                      const statusColors = {
                        'Applied': 'bg-blue-100 text-blue-700',
                        'Shortlisted': 'bg-amber-100 text-amber-700',
                        'Accepted': 'bg-emerald-100 text-emerald-700',
                        'Rejected': 'bg-red-100 text-red-700',
                        'Completed': 'bg-gray-100 text-gray-700',
                      };
                      return (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-text-primary">{job?.title}</td>
                          <td className="px-6 py-4 text-text-secondary">{job?.clientName}</td>
                          <td className="px-6 py-4 text-text-muted text-sm">{new Date(app.appliedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`badge ${statusColors[app.status] || 'bg-gray-100'}`}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />

        <Route path="messages" element={
          <div className="card h-[600px] flex flex-col items-center justify-center">
            <MessageSquare size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-bold">Messages</h3>
            <p className="text-text-secondary">Simulated chat interface coming soon.</p>
          </div>
        } />

        <Route path="delivery" element={
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-heading font-bold text-text-primary">Delivery Tasks</h1>
                <p className="text-text-secondary mt-1">Manage your on-campus delivery assignments.</p>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border">
                <span className="text-sm font-bold">Delivery Agent Mode</span>
                <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer p-1">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                </div>
              </div>
            </div>

            <div className="card p-12 text-center">
              <Truck size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Active Deliveries</h3>
              <p className="text-text-secondary">You haven't been assigned any deliveries yet.</p>
            </div>
          </div>
        } />

        <Route path="reviews" element={
          <div className="space-y-8 animate-fadeIn">
            <h1 className="text-3xl font-heading font-bold text-text-primary">Ratings & Reviews</h1>
            <div className="card p-12 text-center">
              <Star size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Reviews Yet</h3>
              <p className="text-text-secondary">Complete some jobs to start receiving feedback!</p>
            </div>
          </div>
        } />

        <Route path="settings" element={
          <div className="space-y-8 animate-fadeIn">
            <h1 className="text-3xl font-heading font-bold text-text-primary">Profile Settings</h1>
            <div className="card p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-bold text-2xl">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <p className="text-text-secondary">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5">Full Name</label>
                      <input type="text" className="input-field" defaultValue={user.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5">University ID</label>
                      <input type="text" className="input-field" defaultValue="UWU/CST/20/001" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5">Phone Number</label>
                      <input type="text" className="input-field" defaultValue="+94 77 123 4567" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5">Bank Account (for payouts)</label>
                      <input type="text" className="input-field" defaultValue="**** **** **** 1234" />
                    </div>
                  </div>
                </div>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        } />

        <Route path="*" element={<Navigate to="home" replace />} />
      </Routes>
    </DashboardLayout>
  );
};


export default StudentDashboard;
