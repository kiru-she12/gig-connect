import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_JOBS, INITIAL_APPLICATIONS } from '../data/mockData';

const JobsContext = createContext();

const getDynamicCategory = (title, skills) => {
  const t = title.toLowerCase();
  const s = skills.join(', ').toLowerCase();
  
  if (t.includes('design') || t.includes('logo') || t.includes('poster') || t.includes('card') || t.includes('flyer') || t.includes('presentation') || t.includes('powerpoint') || t.includes('cv') || t.includes('resume') || s.includes('design') || s.includes('photoshop')) {
    return 'Design';
  }
  if (t.includes('data entry') || t.includes('excel') || t.includes('inventory') || t.includes('listing') || t.includes('typing') || t.includes('form') || s.includes('data entry') || s.includes('excel') || s.includes('typing')) {
    return 'Data Entry';
  }
  if (t.includes('photography') || t.includes('photographer') || t.includes('video') || t.includes('editor') || t.includes('vlog') || t.includes('reels') || t.includes('thumbnail') || s.includes('photography') || s.includes('video editing')) {
    return 'Photography';
  }
  if (t.includes('web dev') || t.includes('website') || s.includes('web dev') || s.includes('coding')) {
    return 'Web Dev';
  }
  if (t.includes('translation') || t.includes('translator') || t.includes('translate') || t.includes('proofreading') || s.includes('translation') || s.includes('translator')) {
    return 'Translation';
  }
  if (t.includes('tutor') || t.includes('homework') || t.includes('kids') || t.includes('academic') || s.includes('tutoring') || s.includes('maths')) {
    return 'Academic & Tutoring';
  }
  return 'Local Services';
};

export const JobsProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const refreshJobs = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const role = storedUser?.role;
      const isAdminOrManager = role === 'admin' || role === 'manager';
      const url = isAdminOrManager 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_jobs.php?all=1`
        : `${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_jobs.php`;

      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(url, { 
        headers,
        credentials: 'include' 
      });
      if (response.ok) {
        const data = await response.json();
        const rawJobs = Array.isArray(data) ? data : (data.jobs || []);
        if (Array.isArray(rawJobs)) {
          const formattedJobs = rawJobs.map(job => {
            const parsedSkills = job.skills 
              ? job.skills.split(',').map(s => s.trim()).filter(Boolean) 
              : [];
            return {
              id: job.job_ID || job.id,
              title: job.title,
              clientId: job.provider_ID || job.client_ID,
              clientName: job.provider_name || 'GigConnect Partner',
              clientEmail: job.provider_email || '',
              clientPhone: job.provider_phone || '',
              clientNic: job.provider_nic || '',
              clientBusinessRegNo: job.provider_business_reg_no || '',
              clientBusinessType: job.provider_business_type || '',
              clientAddress: job.provider_address || '',
              jobAddress: job.address || '',
              clientIsVerified: job.provider_is_verified == 1,
              job_date: job.job_date || null,
              start_time: job.start_time || null,
              end_time: job.end_time || null,
              category: job.category || getDynamicCategory(job.title, parsedSkills),
              type: job.job_type || job.type,
              pay: Math.round(parseFloat(job.payment || job.budget || 0)),
              duration: job.job_date ? `${job.job_date} @ ${job.start_time} - ${job.end_time}` : (job.duration || 'Short Term'),
              status: job.status === 'pending' ? 'Pending Approval' :
                      job.status === 'active' ? 'Active' :
                      job.status === 'completed' ? 'Completed' :
                      job.status === 'closed' ? 'Closed' : job.status,
              skills: parsedSkills,
              description: job.description,
              postedAt: job.created_at,
              deadline: job.deadline,
              is_product_based: job.is_product_based == 1 || job.is_product_based === true,
              isBoosted: job.is_boosted == 1 || job.isBoosted,
              seekers_needed: job.seekers_needed || 1,
              payment_status: job.payment_status || 'unpaid',
              provider_rating: job.provider_rating || null
            };
          });

          formattedJobs.sort((a, b) => {
            const boostA = a.isBoosted ? 1 : 0;
            const boostB = b.isBoosted ? 1 : 0;
            if (boostA !== boostB) return boostB - boostA;
            return 0;
          });

          setJobs(formattedJobs);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs from backend:', err);
    }
  };

  useEffect(() => {
    refreshJobs();
  }, []);

  const addJob = async (job) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/post_job.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title: job.title,
          description: job.description,
          skills: job.skills.join(', '),
          payment: Math.round(parseFloat(job.pay || 0)),
          job_type: job.type.toLowerCase().replace('-', ''),
          deadline: job.deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
          job_date: job.job_date || null,
          start_time: job.start_time || null,
          end_time: job.end_time || null,
          business_reg_no: job.business_reg_no,
          address: job.address,
          latitude: job.latitude,
          longitude: job.longitude,
          seekers_needed: parseInt(job.seekers_needed || 1),
          is_product_based: job.is_product_based || 0,
          is_boosted: (job.is_boosted || job.isBoosted) ? 1 : 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post job to backend');
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      await refreshJobs();
      return resData;
    } catch (err) {
      console.error('Error posting job to backend:', err);
      throw err;
    }
  };

  const applyForJob = async (jobId, studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/apply_jobs.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          job_ID: jobId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      const newApp = {
        id: resData.application_ID || `app_${Date.now()}`,
        jobId,
        studentId,
        status: 'Applied',
        appliedAt: new Date().toISOString(),
      };
      setApplications(prev => [newApp, ...prev]);
      return resData;
    } catch (err) {
      console.error('Error applying for job:', err);
      const newApp = {
        id: `app_${Date.now()}`,
        jobId,
        studentId,
        status: 'Applied',
        appliedAt: new Date().toISOString(),
      };
      setApplications(prev => [newApp, ...prev]);
      return newApp;
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      const actionMap = {
        'shortlisted': 'shortlist',
        'accepted': 'accept',
        'rejected': 'reject',
        'shortlist': 'shortlist',
        'accept': 'accept',
        'reject': 'reject',
        'Shortlisted': 'shortlist',
        'Accepted': 'accept',
        'Rejected': 'reject'
      };
      const action = actionMap[status];
      if (!action) {
        throw new Error(`Invalid status: ${status}`);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobs/update_applicant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          application_ID: appId,
          action: action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update application status in database');
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: resData.status } : app
      ));

      return resData;
    } catch (err) {
      console.error('Error updating application status:', err);
      // Fallback
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status } : app
      ));
    }
  };

  const approveJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/approve_job.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          job_ID: jobId,
          action: 'approve'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? { ...job, status: 'Active' } : job
          ));
          return data;
        } else {
          throw new Error(data.error || 'Failed to approve job');
        }
      }
    } catch (err) {
      console.error('Error approving job:', err);
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: 'Active' } : job
      ));
    }
  };

  const rejectJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/approve_job.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          job_ID: jobId,
          action: 'reject'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? { ...job, status: 'Closed' } : job
          ));
          return data;
        } else {
          throw new Error(data.error || 'Failed to reject job');
        }
      }
    } catch (err) {
      console.error('Error rejecting job:', err);
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: 'Rejected' } : job
      ));
    }
  };

  const markJobCompleted = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/approve_job.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          job_ID: jobId,
          status: 'completed'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? { ...job, status: 'Completed' } : job
          ));
          return data;
        } else {
          throw new Error(data.error || 'Failed to mark job as completed');
        }
      }
    } catch (err) {
      console.error('Error completing job:', err);
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, status: 'Completed' } : job
      ));
    }
  };

  return (
    <JobsContext.Provider value={{ 
      jobs, 
      applications, 
      deliveries,
      addJob, 
      applyForJob, 
      updateApplicationStatus, 
      approveJob, 
      rejectJob,
      markJobCompleted,
      refreshJobs
    }}>
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = () => useContext(JobsContext);
