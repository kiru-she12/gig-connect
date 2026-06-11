import React, { createContext, useContext, useState } from 'react';
import { INITIAL_JOBS, INITIAL_APPLICATIONS } from '../data/mockData';

const JobsContext = createContext();

export const JobsProvider = ({ children }) => {
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [deliveries, setDeliveries] = useState([]);

  const addJob = (job) => {
    const newJob = {
      ...job,
      id: `job_${Date.now()}`,
      status: 'Pending Approval',
      postedAt: new Date().toISOString(),
    };
    setJobs([newJob, ...jobs]);
    return newJob;
  };

  const applyForJob = (jobId, studentId) => {
    const newApp = {
      id: `app_${Date.now()}`,
      jobId,
      studentId,
      status: 'Applied',
      appliedAt: new Date().toISOString(),
    };
    setApplications([newApp, ...applications]);
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
      markJobCompleted 
    }}>
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = () => useContext(JobsContext);
