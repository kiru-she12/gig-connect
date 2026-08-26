import React from 'react';
import { MapPin, Clock, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';

const JobCard = ({ job, onApply, applied = false, matchScore = null, isRecommended = false }) => {
  const isBoosted = Boolean(job.isBoosted || job.is_boosted == 1 || job.is_boosted === true || job.is_boosted === '1');

  return (
    <div className={`rounded-2xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
      isBoosted
        ? 'border-amber-400 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/60'
        : isRecommended 
          ? 'bg-white border-primary/40 bg-gradient-to-br from-white to-primary/[0.02] shadow-md shadow-primary/5' 
          : 'bg-white border-border hover:border-primary/30'
    }`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full transition-opacity ${
        isBoosted
          ? 'bg-amber-400 opacity-100'
          : isRecommended ? 'bg-primary opacity-100' : 'bg-primary opacity-0 group-hover:opacity-100'
      }`}></div>
      
      <div className="absolute top-4 right-4 flex items-center gap-2 flex-wrap justify-end">
        {isBoosted && (
          <div className="bg-amber-400 text-amber-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-300 shadow-sm flex items-center gap-1">
            <span>⚡</span>
            <span>FEATURED BOOST</span>
          </div>
        )}
        
        {isRecommended && (
          <div className="bg-primary/10 text-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border border-primary/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            Recommended {matchScore !== null ? `(${matchScore}% Match)` : ''}
          </div>
        )}
        
        {!isRecommended && matchScore !== null && (
          <div className="bg-primary-light text-primary px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-full border border-primary/10">
            {matchScore}% Match
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{job.category}</span>
          <span className="w-1 h-1 bg-border rounded-full"></span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{job.type}</span>
          {job.seekers_needed && (
            <>
              <span className="w-1 h-1 bg-border rounded-full"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                👥 {job.seekers_needed} {job.seekers_needed > 1 ? 'Seekers' : 'Seeker'} Needed
              </span>
            </>
          )}
        </div>
        <h3 className="font-heading font-bold text-xl text-text-primary group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-text-secondary">
            {job.clientName ? job.clientName[0] : 'G'}
          </div>
          <span className="text-xs font-medium text-text-secondary">{job.clientName}</span>
          {job.clientEmail && (
            <span className="text-[10px] text-text-muted">({job.clientEmail})</span>
          )}
          <CheckCircle size={12} className="text-primary" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {job.skills.map((skill, index) => (
          <span key={index} className="px-2.5 py-1 bg-background text-text-secondary text-[10px] font-bold rounded-lg border border-border/50">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase">Budget</p>
            <p className="text-sm font-bold text-text-primary">LKR {job.pay.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-bold uppercase">Duration</p>
            <p className="text-sm font-bold text-text-primary">{job.duration}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => onApply && onApply(job.id)}
        disabled={applied}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
          applied 
          ? 'bg-gray-50 text-text-muted cursor-not-allowed border border-border' 
          : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {applied ? 'Application Sent' : (
          <>
            Apply for Gig
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
};

export default JobCard;
