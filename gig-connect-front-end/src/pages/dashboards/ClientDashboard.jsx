import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobsContext';
import { CATEGORIES, SKILLS_LIST } from '../../data/mockData';
import ComplaintsTab from '../../components/shared/ComplaintsTab';
import ChatTab from '../../components/shared/ChatTab';
import { 
  PlusCircle, List, Users, MessageSquare, MapPin, Star, Settings, 
  ChevronRight, ChevronLeft, CreditCard, CheckCircle, Clock, DollarSign
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
        <Route path="applicants" element={<ApplicantsTab clientJobs={clientJobs} applications={applications} updateStatus={updateApplicationStatus} />} />
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

const SettingsTab = ({ user }) => (
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
            <span className="badge bg-emerald-100 text-emerald-700 mt-2">Verified Client</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Name</label>
              <input type="text" className="input-field" defaultValue={user.name} />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Business Registration No.</label>
              <input type="text" className="input-field" defaultValue="BR-12345-67" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Contact Person</label>
              <input type="text" className="input-field" defaultValue="Manager Name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-1.5">Payment Method</label>
              <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <CreditCard size={18} className="text-text-muted" />
                <span className="text-sm">Visa ending in 4242</span>
              </div>
            </div>
          </div>
        </div>
        <button className="btn-primary">Save Profile Changes</button>
      </div>
    </div>
  </div>
);

const HomeTab = ({ user, clientJobs, clientApps }) => (
  <div className="space-y-8 animate-fadeIn">
    <div>
      <h1 className="text-3xl font-heading font-bold text-text-primary">Welcome, {user.name.split(' ')[0]}!</h1>
      <p className="text-text-secondary mt-1">Manage your job listings and find the best talent.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Jobs Posted', value: clientJobs.length, icon: List, color: 'text-blue-600', bg: 'bg-blue-50' },
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      addJob(formData);
      setStep(3);
      setLoading(false);
    }, 1500);
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
              job.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
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

const ApplicantsTab = ({ clientJobs, applications, updateStatus }) => {
  const [selectedJobId, setSelectedJobId] = useState(clientJobs[0]?.id || '');
  const filteredApps = applications.filter(app => app.jobId === selectedJobId);

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

      {filteredApps.length > 0 ? (
        <div className="space-y-4">
          {filteredApps.map(app => (
            <div key={app.id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center font-bold text-xl">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">Student Applicant</h4>
                    <span className="badge bg-blue-50 text-blue-600 text-[10px]">92% Match</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-bold"><Star size={14} fill="currentColor"/> 4.8</span>
                    <span>•</span>
                    <span>12 jobs completed</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => updateStatus(app.id, 'Rejected')}
                  className="px-4 py-2 text-danger font-bold text-sm hover:bg-red-50 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => updateStatus(app.id, 'Shortlisted')}
                  className="px-4 py-2 text-amber-600 font-bold text-sm bg-amber-50 rounded-lg"
                >
                  Shortlist
                </button>
                <button 
                  onClick={() => updateStatus(app.id, 'Accepted')}
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Hire Student
                </button>
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
