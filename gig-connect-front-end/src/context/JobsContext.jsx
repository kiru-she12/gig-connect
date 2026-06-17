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
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [deliveries, setDeliveries] = useState([]);

  const refreshJobs = async () => {
    try {
      const role = localStorage.getItem('role');
      const isAdminOrManager = role === 'admin' || role === 'manager';
      const url = isAdminOrManager 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_jobs.php?all=1`
        : `${import.meta.env.VITE_API_BASE_URL}/api/jobs/get_jobs.php`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const rawJobs = Array.isArray(data) ? data : (data.jobs || []);
        if (Array.isArray(rawJobs)) {
          const formattedJobs = rawJobs.map(job => {
            const parsedSkills = job.skills ? job.skills.split(', ') : [];
            return {
              id: job.job_ID || job.id,
              title: job.title,
              clientId: job.provider_ID || job.client_ID,
              clientName: 'GigConnect Partner',
              category: job.category || getDynamicCategory(job.title, parsedSkills),
              type: job.job_type || job.type,
              pay: job.payment || job.budget,
              duration: job.duration || 'Short Term',
              status: job.status,
              skills: parsedSkills,
              description: job.description,
              postedAt: job.created_at,
              deadline: job.deadline,
              is_product_based: job.is_product_based == 1 || job.is_product_based === true,
              isBoosted: job.is_boosted == 1 || job.isBoosted
            };
          });

          setJobs(prevJobs => {
            const combined = [...formattedJobs, ...INITIAL_JOBS];
            const unique = [];
            const seen = new Set();
            for (const item of combined) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
              }
            }
            return unique;
          });
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
        body: JSON.stringify({
          title: job.title,
          description: job.description,
          skills: job.skills.join(', '),
          payment: parseFloat(job.pay),
          job_type: job.type,
          deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0] // 7 days from now
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
      // Fallback
      const newJob = {
        ...job,
        id: `job_${Date.now()}`,
        status: 'Pending Approval',
        postedAt: new Date().toISOString(),
      };
      setJobs(prev => [newJob, ...prev]);
      return newJob;
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

  const updateApplicationStatus = (appId, status) => {
    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status } : app
    ));
  };

  const approveJob = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'Active' } : job
    ));
  };

  const rejectJob = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'Rejected' } : job
    ));
  };

  const markJobCompleted = (jobId) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'Completed' } : job
    ));
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
