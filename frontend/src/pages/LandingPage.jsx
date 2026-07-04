import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowRight, CheckCircle, Zap, Shield, Users, DollarSign, Briefcase, PlusCircle, User, Calendar, MapPin, Clock, ChevronDown, GraduationCap, Star, Play, Pause, Sparkles, Truck, MessageSquare, Percent, CheckCircle2, Heart, PenTool } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import JobCard from '../components/shared/JobCard';
import { INITIAL_JOBS } from '../data/mockData';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import studentImg from '../assets/images/students-group.jpg';
import studentBenchImg from '../assets/images/student-bench.jpg';
import studentsStudying from '../assets/images/students-studying.jpg';
import heroChef from '../assets/images/hero-chef.jpg';
import heroVideo from '../assets/images/hero-video.jpg';
import heroAuditorium from '../assets/images/hero-auditorium.jpg';
import chefsEvent from '../assets/images/chefs-event.jpg';

const getCategoryIcon = (category, title) => {
  const t = (title || '').toLowerCase();
  const c = (category || '').toLowerCase();
  
  if (c.includes('design') || t.includes('design') || t.includes('graphic')) {
    return {
      icon: <PenTool size={20} className="text-violet-600" />,
      bg: 'bg-violet-100'
    };
  }
  if (c.includes('web') || c.includes('dev') || t.includes('web') || t.includes('developer') || t.includes('code')) {
    return {
      icon: <Briefcase size={20} className="text-blue-600" />,
      bg: 'bg-blue-100'
    };
  }
  if (c.includes('photo') || t.includes('photo') || t.includes('video')) {
    return {
      icon: <Sparkles size={20} className="text-pink-600" />,
      bg: 'bg-pink-100'
    };
  }
  if (c.includes('data') || t.includes('data') || t.includes('entry') || t.includes('excel')) {
    return {
      icon: <CheckCircle size={20} className="text-amber-600" />,
      bg: 'bg-amber-100'
    };
  }
  if (c.includes('academic') || c.includes('tutor') || t.includes('tutor') || t.includes('teach')) {
    return {
      icon: <GraduationCap size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-100'
    };
  }
  return {
    icon: <Briefcase size={20} className="text-slate-600" />,
    bg: 'bg-slate-100'
  };
};

const DetailedStudentJobCard = ({ job, onApply, applied = false, matchScore = null, isRecommended = false }) => {
  return (
    <div className={`bg-white rounded-2xl p-6 md:p-8 border shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isRecommended
        ? 'border-accent bg-white/40 shadow-sm'
        : 'border-border hover:border-accent'
      }`}>
      {/* Left accent line */}
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-accent transition-opacity ${isRecommended ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}></div>

      <div className="flex-1 space-y-4">
        {/* Top meta-info */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-text-secondary">
          <span>Posted recently</span>
          <span>•</span>
          <span>{job.seekers_needed ? `${job.seekers_needed} Seeker${job.seekers_needed > 1 ? 's' : ''} Needed` : '1 Seeker Needed'}</span>

          {isRecommended && (
            <span className="ml-auto md:ml-0 bg-accent/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-accent/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
              {matchScore}% Match
            </span>
          )}

          {!isRecommended && matchScore !== null && matchScore > 0 && (
            <span className="ml-auto md:ml-0 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-slate-200">
              {matchScore}% Match
            </span>
          )}
        </div>

        {/* Job Title */}
        <div>
          <h3 className="font-heading font-black text-2xl text-slate-900 group-hover:text-primary transition-colors leading-snug">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mt-1.5">
            <span className="text-[#4E8C7E] font-extrabold uppercase tracking-wider">{job.category}</span>
            <span>•</span>
            <span>{job.type}</span>
            <span>•</span>
            <span>Est. Budget: LKR {job.pay.toLocaleString()}</span>
            <span>•</span>
            <span>{job.duration}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-text-primary/80 text-sm leading-relaxed max-w-3xl line-clamp-3">
          {job.description}
        </p>

        {/* Skills needed */}
        <div className="flex flex-wrap gap-2">
          {job.skills.map((skill, index) => (
            <span key={index} className="px-3 py-1 bg-white text-[#1A312C] text-[10px] font-bold rounded-lg border border-border">
              {skill}
            </span>
          ))}
        </div>

        {/* Client trust & details */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-border max-w-2xl">
          <div className="flex items-center gap-1.5 text-[#4E8C7E] font-bold">
            <CheckCircle size={14} />
            <span>Payment Verified</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <span>★★★★★</span>
            <span className="text-slate-600 text-[11px] font-medium ml-1">4.9 rating</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">LKR 15k+</span> spent
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium">Job Provider: <strong>{job.clientName}</strong> {job.clientEmail && <span className="text-slate-400 font-normal">({job.clientEmail})</span>}</span>
          </div>
        </div>
      </div>

      {/* Apply Action Button */}
      <div className="w-full md:w-auto flex-shrink-0">
        <button
          onClick={() => onApply && onApply(job.id)}
          disabled={applied}
          className={`w-full md:w-48 py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${applied
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-[#4E8C7E] text-white hover:bg-[#1A312C] shadow-sm hover:scale-[1.02] active:scale-[0.98]'
            }`}
        >
          {applied ? (
            'Application Sent'
          ) : (
            <>
              Apply Now
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const { jobs, applications, applyForJob } = useJobs();
  const { user, setIsLoginModalOpen, setIsRegisterModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'client') {
        navigate('/dashboard/client/home');
      } else if (user.role === 'admin' || user.role === 'manager') {
        navigate('/dashboard/admin/overview');
      } else if (user.role === 'delivery_staff') {
        navigate('/dashboard/delivery/overview');
      }
    }
  }, [user, navigate]);

  // Generate deterministic-looking random particles for the background
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }).map(() => ({
      size: Math.random() * 4 + 2,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 2,
      xOffset: Math.random() * 40 - 20
    }));
  }, []);

  // Dynamic guest jobs construction from database
  const dynamicGuestJobs = React.useMemo(() => {
    const dbActiveJobs = (jobs || []).filter(j => j.status?.toLowerCase() === 'active');

    // Default fallback jobs matching the design
    const defaultGuestJobs = [
      {
        id: 'default_1',
        title: 'Website UI Design Audit',
        price: '$25/hr',
        tags: ['Design', 'Remote', '2-3 Hours'],
        desc: 'Review and provide feedback for a local coffee shop\'s new ordering system.',
        isFeatured: false,
        date: 'Flexible',
        location: 'Remote',
        duration: '2-3 Hours'
      },
      {
        id: 'default_2',
        title: 'Custom Python Script',
        price: '$50 Fixed',
        tags: ['Coding', 'Remote', 'Fast Track'],
        desc: 'Small automation script needed for data cleanup. Budget is fixed.',
        isFeatured: false,
        date: 'Flexible',
        location: 'Remote',
        duration: 'Fast Track'
      },
      {
        id: 'default_featured',
        title: 'Professional Event Photography',
        price: '$200',
        tags: ['Photography', 'On-Campus', '5 Hours'],
        desc: 'Looking for a student photographer for the Senior Gala. Equipment provided.',
        isFeatured: true,
        date: 'This Saturday, 6PM',
        location: 'Campus Union Hall',
        duration: '5 Hours Flat'
      },
      {
        id: 'default_3',
        title: 'Math Tutor (Calculus II)',
        price: '$18/hr',
        tags: ['Tutoring', 'On-Campus', 'Ongoing'],
        desc: 'Need help preparing for the midterms. Twice a week sessions at the campus library.',
        isFeatured: false,
        date: 'Twice a week',
        location: 'Campus Library',
        duration: 'Ongoing'
      },
      {
        id: 'default_4',
        title: 'Campus Tour Guide',
        price: '$15/hr',
        tags: ['Events', 'In-Person', '4 Hours'],
        desc: 'Help prospective students and their families navigate the campus.',
        isFeatured: false,
        date: 'Flexible',
        location: 'Campus Union',
        duration: '4 Hours'
      }
    ];

    if (dbActiveJobs.length === 0) {
      return {
        left: [defaultGuestJobs[0], defaultGuestJobs[1]],
        featured: defaultGuestJobs[2],
        right: [defaultGuestJobs[3], defaultGuestJobs[4]]
      };
    }

    // Helper to format a database job
    const formatDbJob = (dbJob, isFeatured) => {
      const formattedPrice = `LKR ${parseFloat(dbJob.pay || 0).toLocaleString()}`;

      // Build dynamic tags from job fields
      const tags = [];
      if (dbJob.type) tags.push(dbJob.type.charAt(0).toUpperCase() + dbJob.type.slice(1));
      if (dbJob.category) tags.push(dbJob.category);
      if (dbJob.skills && dbJob.skills.length > 0) {
        tags.push(dbJob.skills[0]);
      } else {
        tags.push('General');
      }

      // Deduplicate tags to avoid visual replication
      const uniqueTags = Array.from(new Set(tags));

      return {
        id: dbJob.id,
        title: dbJob.title,
        price: formattedPrice,
        tags: uniqueTags.slice(0, 3),
        category: dbJob.category || 'General',
        desc: dbJob.description || '',
        isFeatured: isFeatured,
        date: dbJob.job_date || 'Flexible Schedule',
        location: dbJob.type === 'remote' ? 'Remote Task' : (dbJob.clientName || 'On-Campus'),
        duration: dbJob.job_date ? `${dbJob.start_time} - ${dbJob.end_time}` : (dbJob.duration || 'Short Term')
      };
    };

    // 1. Select Featured Job
    let featuredJobRaw = dbActiveJobs.find(j => j.isBoosted);
    if (!featuredJobRaw) {
      featuredJobRaw = dbActiveJobs[0];
    }
    const featuredJob = formatDbJob(featuredJobRaw, true);

    // 2. Select 4 other jobs (excluding the featured one)
    const remainingDbJobs = dbActiveJobs.filter(j => j.id !== featuredJobRaw.id);

    const otherJobs = [];
    // Take from remaining DB jobs
    for (let i = 0; i < Math.min(4, remainingDbJobs.length); i++) {
      otherJobs.push(formatDbJob(remainingDbJobs[i], false));
    }

    // Fill up to 4 if we don't have enough DB jobs
    const defaultOthers = [defaultGuestJobs[0], defaultGuestJobs[1], defaultGuestJobs[3], defaultGuestJobs[4]];
    while (otherJobs.length < 4) {
      const fallbackJob = defaultOthers[otherJobs.length];
      otherJobs.push(fallbackJob);
    }

    return {
      left: [otherJobs[0], otherJobs[1]],
      featured: featuredJob,
      right: [otherJobs[2], otherJobs[3]]
    };
  }, [jobs]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [warningMessage, setWarningMessage] = useState(null);
  const [recsMetadata, setRecsMetadata] = useState(null);
  const [backendRecs, setBackendRecs] = useState([]);

  useEffect(() => {
    if (user && user.role === 'student') {
      const token = localStorage.getItem('token');
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost/gigconnect/backend'}/api/jobs/recommendations.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.recommendations) {
            setBackendRecs(data.recommendations);
          }
          if (data.meta) {
            setRecsMetadata(data.meta);
          }
        })
        .catch(err => console.error("Failed to load recommendations:", err));
    }
  }, [user]);

  const handlePostJobClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else if (user.role === 'client') {
      navigate('/dashboard/client/post');
    } else {
      setWarningMessage("You must be logged in as a Job Provider to post a job. Please log in with a Job Provider account.");
    }
  };

  const handleApplyJobClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else if (user.role === 'student') {
      navigate('/dashboard/student/applications');
    } else {
      setWarningMessage("You must be logged in as a Student to apply for a job. Please log in with a Student account.");
    }
  };

  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const heroSlides = [
    {
      image: heroChef,
      subtitle: "Find Flexible Jobs",
      title: "Earn while you learn\nat University"
    },
    {
      image: heroVideo,
      subtitle: "Build Your Portfolio",
      title: "Real projects for\nreal clients"
    },
    {
      image: heroAuditorium,
      image2: heroAuditorium,
      subtitle: "Campus Connections",
      title: "Network with local\nbusinesses"
    }
  ];

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, heroSlides.length]);

  // Parallax Scroll Refs and Transforms
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityParallax = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const yBento = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  // 3D Mouse Movement Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { damping: 20, stiffness: 100 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { damping: 20, stiffness: 100 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isStudent = user && user.role === 'student';

  const sectionLabels = isStudent
    ? {
      home: 'Launch',
      browse: 'Gigs',
      'how-it-works': 'Guide'
    }
    : {
      home: 'Launch',
      about: 'Heritage',
      jobs: 'Opportunities'
    };

  // Section Tracking Logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = isStudent
      ? ['home', 'browse', 'how-it-works']
      : ['home', 'about', 'jobs', 'collaboration'];

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isStudent]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (user && user.role === 'student') {
    const studentRating = recsMetadata ? parseFloat(recsMetadata.student_rating || 0) : parseFloat(user.rating || 0);
    const dbCompletedCount = recsMetadata ? parseInt(recsMetadata.completed_jobs || 0) : 0;

    const studentApps = (applications || []).filter(app => app.studentId === user.id);
    const completedCount = recsMetadata ? dbCompletedCount : studentApps.filter(a => a.status === 'Completed' || a.status === 'Paid').length;
    const noShows = studentApps.filter(a => a.status === 'Accepted' && jobs.find(j => j.id === a.jobId)?.status === 'Closed' && !jobs.find(j => j.id === a.jobId)?.completedTime).length;

    const getJobMatchScore = (job) => {
      const found = backendRecs.find(r => r.job_ID === job.id);
      if (found) return found.match_score;

      const studentSkills = user.skills || [];
      const jobSkills = job.skills || [];
      const intersect = jobSkills.filter(s =>
        studentSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())
      );
      const skillMatchRatio = jobSkills.length > 0 ? (intersect.length / jobSkills.length) : 0.0;

      let score = 0;
      const rating = studentRating;

      if (completedCount < 3) {
        score = skillMatchRatio * 10.0;
      } else {
        score = (skillMatchRatio * 7.0) + ((rating / 5.0) * 3.0);
      }

      score -= (noShows * 1.5);

      if (job.isBoosted) {
        score += 2.0;
      }

      return Math.max(0, score);
    };

    const studentFilteredJobs = jobs.filter(job => job.status === 'Active' || job.status === 'active');

    const scoredJobs = studentFilteredJobs.map(job => {
      const rawScore = getJobMatchScore(job);
      const pct = Math.min(100, Math.round(rawScore * 10));
      return { ...job, score: rawScore, matchPercent: pct };
    });

    const recommendedGigs = scoredJobs
      .filter(j => j.score > 0)
      .sort((a, b) => b.score - a.score);

    const generalGigs = scoredJobs
      .sort((a, b) => b.id - a.id);

    const handleSearchSubmit = () => {
      navigate('/jobs', {
        state: {
          search: searchTerm
        }
      });
    };

    const CATEGORY_IMAGES = {
      'Design': 'https://images.unsplash.com/photo-1541462608141-2ff01dd914e0?auto=format&fit=crop&w=400&q=80',
      'Data Entry': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&q=80',
      'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
      'Web Dev': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
      'Translation': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80',
      'Academic & Tutoring': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80',
      'Local Services': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80',
      'Default': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80'
    };

    return (
      <div ref={heroRef} className="flex-1 flex flex-col overflow-x-hidden bg-slate-50 min-h-screen pt-20">
        <Navbar />

        {/* Hero Section Container */}
        <section id="home" className="max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 py-8 relative">
          <div className="bg-gradient-to-br from-[#2E7D5C] via-[#1A5C41] to-[#0D3826] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[450px] shadow-2xl border border-white/10 gap-8 text-left">
            {/* Outlined text in background */}
            <div className="absolute inset-0 flex items-center justify-start pl-8 sm:pl-16 pointer-events-none select-none overflow-hidden">
              <span className="text-[15vw] font-black text-white/[0.07] uppercase tracking-widest font-sans leading-none select-none">
                STUDENT
              </span>
            </div>

            {/* Content Column */}
            <div className="relative z-10 w-full md:w-3/5 flex flex-col items-start">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-none mb-6 uppercase text-white">
                Welcome back, <br />
                <span className="text-[#89D7B7]">{user.name.split(' ')[0]}</span>!
              </h1>

              {/* Integrated Search Input */}
              <div className="w-full max-w-md bg-white rounded-full p-1.5 pl-4 flex items-center shadow-2xl border border-white/5 mb-4 transition-all focus-within:ring-2 focus-within:ring-white/20">
                <Search className="text-slate-400 flex-shrink-0" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                  placeholder="Search for any service or gig..."
                  className="w-full bg-transparent border-0 outline-none text-slate-800 px-3 text-xs sm:text-sm placeholder:text-slate-400 font-medium"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="w-10 h-10 bg-[#1A312C] text-white rounded-full flex items-center justify-center hover:bg-[#4E8C7E] transition-all active:scale-95 flex-shrink-0"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Popular tags list */}
              <div className="flex flex-wrap items-center gap-1.5 text-white/90 mb-6">
                <span className="font-bold opacity-90 mr-1 text-white text-xs">Popular skills:</span>
                {['All', 'Design', 'Data Entry', 'Photography', 'Web Dev', 'Translation'].map((cat) => (
                  <button
                     key={cat}
                     onClick={() => {
                       navigate('/jobs', { state: { category: cat } });
                     }}
                     className="px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all whitespace-nowrap bg-white/20 text-white border-white/10 hover:bg-white hover:text-[#2E7D5C]"
                   >
                     {cat}
                   </button>
                ))}
              </div>

              {/* Description */}
              <p className="text-white/90 text-sm sm:text-base font-medium max-w-md leading-relaxed">
                Find high-quality Jobs opportunities matching your skill set and study schedule.
              </p>
            </div>

            {/* Right Column / Rating Box */}
            <div className="relative z-10 w-full md:w-auto flex flex-col items-center justify-center flex-shrink-0">
              <div className="bg-slate-900/60 backdrop-blur-md rounded-[2rem] p-6 shadow-2xl border border-white/10 flex flex-col gap-5 w-full min-w-[260px] max-w-[280px] text-left animate-fadeIn">
                {/* Item 1: Profile Status */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#89D7B7]/10 rounded-full flex items-center justify-center flex-shrink-0 text-[#89D7B7]">
                    {studentRating > 0 ? <Zap size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {studentRating > 0 ? "Experienced Student" : "New Student"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {studentRating > 0 ? "Active profile" : "Fresh account"}
                    </p>
                  </div>
                </div>

                {/* Item 2: Rating */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400">
                    <Star className="fill-amber-400 text-amber-400" size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {studentRating > 0 ? `${studentRating.toFixed(1)} / 5.0 Rating` : "No Ratings Yet"}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {studentRating > 0 ? "High performance" : "Start your first gig"}
                    </p>
                  </div>
                </div>

                {/* Item 3: Completed Gigs */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {completedCount} Gigs Completed
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {completedCount > 0 ? "Completed works" : "Ready to hire"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 flex-1 space-y-16">

          {/* ── RECOMMENDED GIGS SECTION ── */}
          <section id="browse">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight uppercase leading-none">
                  Recommended Gigs
                </h2>
                {recsMetadata && (
                  <p className="text-xs text-slate-400 font-medium mt-2">
                    {recsMetadata.algo_label}
                    {recsMetadata.student_rating > 0 && (
                      <span className="ml-2 text-amber-500 font-bold">★ {parseFloat(recsMetadata.student_rating).toFixed(1)}</span>
                    )}
                  </p>
                )}
              </div>
              <Link
                to="/jobs"
                className="text-xs font-bold text-[#4E8C7E] hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                Browse All <ArrowRight size={12} />
              </Link>
            </div>

            {backendRecs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-border text-center shadow-sm max-w-2xl mx-auto">
                <Sparkles size={36} className="text-accent mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No Custom Recommendations</h3>
                <p className="text-text-secondary text-sm mt-1 mb-6 max-w-md mx-auto">
                  Add more skills or update your preferences in Profile Settings to unlock personalized recommendations with match scores.
                </p>
                <Link
                  to="/dashboard/student/settings"
                  className="px-5 py-2.5 bg-[#4E8C7E] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#1A312C] transition-all inline-block"
                >
                  Configure Profile Skills
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {backendRecs.slice(0, 8).map((job, idx) => {
                  const matchPct = job.match_score || 0;
                  const alreadyApplied = (applications || []).some(a => a.job_ID === job.job_ID);
                  const iconStyle = getCategoryIcon(job.category, job.title);

                  return (
                    <div
                      key={`${job.job_ID || job.id}-${idx}`}
                      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group p-6 relative overflow-hidden"
                    >
                      {/* Heart Icon at Top Right */}
                      <button className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-slate-50 transition-colors text-slate-300 hover:text-rose-500 z-20">
                        <Heart size={18} />
                      </button>

                      {/* Header Row: Logo & Title/Details */}
                      <div className="flex items-start gap-4">
                        {/* Rounded Icon Box */}
                        <div className={`w-12 h-12 rounded-2xl ${iconStyle.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                          {iconStyle.icon}
                        </div>
                        {/* Title and Client Info */}
                        <div className="pr-6">
                          <h3 className="font-heading font-black text-sm text-slate-800 group-hover:text-[#4E8C7E] transition-colors leading-snug line-clamp-2">
                            {job.title}
                          </h3>
                          <div className="text-[11px] text-slate-400 font-bold mt-1 flex items-center gap-1 flex-wrap">
                            <span>{job.provider_name || 'Job Provider'}</span>
                            {job.provider_email && (
                              <span className="text-slate-300 text-[9px] font-normal">({job.provider_email})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges / Tags Row */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {/* Job Type Badge */}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-transparent ${
                          (job.job_type || '').toLowerCase() === 'remote'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {job.job_type}
                        </span>

                        {/* Match Percentage */}
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-transparent">
                          {matchPct}% Match
                        </span>

                        {/* Reasons tags */}
                        {job.match_reasons && job.match_reasons.slice(0, 1).map((reason, i) => {
                          const isPref = reason.toLowerCase().includes('pref');
                          return (
                            <span key={i} className={`text-[9px] font-black px-2.5 py-1 rounded-full border border-transparent ${
                              isPref ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
                            }`}>
                              {reason}
                            </span>
                          );
                        })}

                        {/* Skills */}
                        {(job.skills ? job.skills.split(',').slice(0, 2) : []).map((s, i) => (
                          <span key={i} className="text-[9px] font-black bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full border border-transparent">
                            {s.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Schedule info if exists */}
                      {job.job_date && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-3.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span className="text-slate-600">
                            {job.job_date} @ {job.start_time} - {job.end_time}
                          </span>
                        </div>
                      )}

                      {/* Divider line */}
                      <div className="border-t border-slate-100 my-4"></div>

                      {/* Footer Row: Price & Action button */}
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salary</div>
                          <div className="text-sm font-black text-slate-800">
                            LKR {parseFloat(job.payment || 0).toLocaleString()}
                          </div>
                        </div>

                        <button
                          onClick={() => handleApplyJobClick()}
                          disabled={alreadyApplied}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                            alreadyApplied
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-[#1A312C] text-white hover:bg-[#4E8C7E] hover:shadow-md'
                          }`}
                        >
                          {alreadyApplied ? (
                            'Applied'
                          ) : (
                            <>
                              <span>Quick Apply</span>
                              <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── MID-PAGE BANNER (Outstanding Workmanship) ── */}
          <section className="relative rounded-[2.5rem] overflow-hidden bg-black min-h-[400px] flex items-end shadow-lg">
            <img
              src={studentsStudying}
              alt="Students collaborating"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            <div className="relative z-10 m-6 sm:m-10 bg-white rounded-3xl p-8 max-w-2xl text-[#1A312C] shadow-2xl border border-[#4E8C7E]/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A312C] bg-white/45 px-2.5 py-1 rounded-full">
                For Talent
              </span>
              <h3 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-[#1A312C] tracking-tight mt-4 mb-3 uppercase">
                Find Outstanding Workmanship.
              </h3>
              <p className="text-[#1A312C] text-sm sm:text-base leading-relaxed font-semibold">
                Our platform fosters cooperation between local employers and students. Work on projects tailored to your classes, prove your skills, and earn income.
              </p>
            </div>
          </section>

          {/* ── WHY CHOOSE US (Why GigConnect?) ── */}
          <section className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Image Column */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
                <img
                  src={chefsEvent}
                  alt="Chefs event"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/10"></div>
              </div>
              {/* Guarantee Seal */}
              <div className="absolute -bottom-6 -right-4 w-28 h-28 bg-primary-light rounded-full border-4 border-white shadow-xl flex items-center justify-center text-center p-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight">
                  100% Verified
                </span>
              </div>
            </div>

            {/* Right Features Column */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight uppercase mb-2">
                  Why Choose Us?
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-light">
                  Choose us for unmatched flexibility, verified opportunities, and a reliable platform designed specifically for students.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                {[
                  {
                    title: 'Flexible Around Your Studies',
                    desc: 'One-day and part-time jobs that fit your timetable, not the other way around.'
                  },
                  {
                    title: 'Verified Job Providers Only',
                    desc: 'Every job provider is verified with NIC and OTP, so you know who you\'re working with.'
                  },
                  {
                    title: 'Safe, Monitored Chats & Deals',
                    desc: 'All chats happen inside the platform — no sketchy off-platform deals.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/60 p-5 rounded-2xl flex gap-4 hover:border-accent transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary-light border border-slate-200 flex items-center justify-center text-slate-800 text-xs font-black flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.title}</h4>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS (What Our Customers Say) ── */}
          <section className="bg-[#EAF5EF] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-[#1A312C] shadow-md border border-[#4E8C7E]/20">
            <div className="max-w-2xl">
              <span className="text-5xl font-serif italic opacity-50 text-[#4E8C7E]">“</span>
              <p className="text-lg sm:text-xl font-bold leading-relaxed -mt-4 text-[#1A312C]">
                I hired a student tour guide through GigConnect for my trip to Ella. She was incredibly knowledgeable, showing us hidden waterfalls and viewpoints we never would have found otherwise. It was a truly unforgettable experience!
              </p>

              <div className="flex items-center gap-3 mt-8">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#1A312C] border border-[#4E8C7E]/20">
                  O
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1A312C] leading-none">Oliver Bennett</h4>
                  <p className="text-[10px] text-[#4E8C7E] font-bold mt-1">Tourist from United Kingdom</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#1A312C] tracking-tight max-w-[200px] uppercase leading-none text-right md:text-left">
                What our customers say
              </h3>
            </div>
          </section>



          {/* ── GENERAL OPPORTUNITIES SECTION ── */}
          <section className="pt-8 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm">
                <Briefcase size={16} />
              </div>
              <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight uppercase">
                Explore General Opportunities
              </h2>
            </div>

            {generalGigs.length === 0 ? (
              <div className="text-center py-12 text-[#4E8C7E] font-medium bg-white rounded-3xl border border-slate-200 shadow-sm">
                No general gigs match your filters.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-6">
                  {generalGigs.slice(0, 5).map((job, idx) => (
                    <DetailedStudentJobCard
                      key={`${job.id}-${idx}`}
                      job={job}
                      applied={studentApps.some(a => a.jobId === job.id)}
                      matchScore={0}
                      isRecommended={false}
                      onApply={(id) => applyForJob(id, user.id)}
                    />
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Link
                    to="/jobs"
                    className="px-8 py-3.5 bg-[#1A312C] text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-[#4E8C7E] hover:shadow-md transition-all active:scale-95 duration-200 flex items-center gap-2"
                  >
                    <span>View All General Opportunities</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </section>

        </main>

        {/* Timeline / Guide Section */}
        <section id="how-it-works" className="py-24 bg-white/30 border-t border-b border-[#4E8C7E]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.02] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            {/* Header */}
            <div className="text-center mb-20 flex flex-col items-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 md:w-12 h-[1px] bg-[#89D7B7]/50"></div>
                <span className="text-[#4E8C7E] text-xs font-black uppercase tracking-[0.3em]">Student Portal Guide</span>
                <div className="w-8 md:w-12 h-[1px] bg-[#89D7B7]/50"></div>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-[#1A312C] mb-6 leading-tight tracking-tight uppercase">
                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A312C] to-[#4E8C7E] font-serif italic font-normal">Works</span>
              </h2>

              <p className="text-[#4E8C7E] max-w-2xl mx-auto text-lg font-light leading-relaxed">
                Your journey from registering with your university credentials to completing gigs, building your reputation, and getting paid.
              </p>
            </div>

            {/* Steps Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
              {[
                {
                  step: '01',
                  title: 'Register with UWU Email',
                  desc: 'Sign up using your @std.uwu.ac.lk email and verify with OTP. Your account gets approved by admin within 24 hours.',
                  bg: 'bg-[#FFEFE6]', // Peach
                  border: 'border-[#FFD7C2]/30',
                  logoText: 'R',
                  label: 'Student Registry',
                  tags: ['OTP Verification', 'Admin Review', '24h Approval'],
                  rate: 'LKR 0 Fees',
                  location: 'Online Portal'
                },
                {
                  step: '02',
                  title: 'Build Your Profile',
                  desc: 'Add your skills, availability, and preferences so the system can match you with the right jobs.',
                  bg: 'bg-[#EBF8F5]', // Mint
                  border: 'border-[#C2EDE2]/30',
                  logoText: 'P',
                  label: 'Skill Showcase',
                  tags: ['Skills List', 'Availability', 'Preferences'],
                  rate: '100% Free',
                  location: 'Dashboard Setup'
                },
                {
                  step: '03',
                  title: 'Browse Recommendations',
                  desc: 'Search jobs by category, payment, and location, or check your personalized "Recommended for You" section.',
                  bg: 'bg-[#F4F0FF]', // Lavender
                  border: 'border-[#E5D9FF]/30',
                  logoText: 'B',
                  label: 'Job Discovery',
                  tags: ['Smart Match', 'Custom Filters', 'Live Feeds'],
                  rate: '100+ Live Gigs',
                  location: 'Campus Wide'
                },
                {
                  step: '04',
                  title: 'Apply & Get Shortlisted',
                  desc: 'Apply with one click. Job providers review your profile, skills, and ratings to shortlist candidates.',
                  bg: 'bg-[#EEF5FC]', // Light Blue
                  border: 'border-[#D0E2F7]/30',
                  logoText: 'A',
                  label: 'Application Flow',
                  tags: ['One-Click', 'Shortlisting', 'Fast Process'],
                  rate: 'Direct Contact',
                  location: 'Instant Alert'
                },
                {
                  step: '05',
                  title: 'Work & Earn',
                  desc: 'Once accepted, complete the job on your schedule. Choose self-delivery or let our Delivery Staff handle it.',
                  bg: 'bg-[#FFF0F6]', // Pink
                  border: 'border-[#FFD3E8]/30',
                  logoText: 'W',
                  label: 'Active Gigs',
                  tags: ['Flexible Hours', 'Self-Delivery', 'Gig Tracking'],
                  rate: 'On-Demand',
                  location: 'UWU Campus'
                },
                {
                  step: '06',
                  title: 'Get Paid & Rated',
                  desc: 'Receive payment, leave a review for the job provider, and build your rating for future opportunities.',
                  bg: 'bg-[#F8F9FA]', // Grey
                  border: 'border-[#E9ECEF]/30',
                  logoText: 'E',
                  label: 'Direct Payments',
                  tags: ['Secure Pay', 'Provider Reviews', 'Rating Boost'],
                  rate: 'Instant Deposit',
                  location: '5-Star System'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.bg} border ${item.border} rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[350px] group`}
                >
                  <div>
                    {/* Card Top Row: Date style pill & Bookmark */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="px-3 py-1 bg-white text-slate-800 text-[10px] font-bold rounded-full shadow-sm border border-slate-100">
                        Step {item.step}
                      </span>
                      <button className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100">
                        <Heart size={14} className="fill-transparent group-hover:fill-red-400 group-hover:text-red-400 transition-all" />
                      </button>
                    </div>

                    {/* Card Company & Logo Row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-500">{item.label}</span>
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {item.logoText}
                      </div>
                    </div>

                    {/* Card Title & Description */}
                    <div className="mb-4 space-y-2">
                      <h3 className="font-heading font-black text-lg text-slate-900 group-hover:text-[#4E8C7E] transition-colors leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div>
                    {/* Card Tags List */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {item.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className="px-2.5 py-1 bg-white/70 text-slate-700 text-[9px] font-extrabold rounded-full border border-slate-200/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Card Bottom Row: Rate & Location */}
                    <div className="pt-4 border-t border-slate-200/40">
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{item.rate}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Vertical Nav UI */}
        <div className="hidden lg:flex fixed top-1/2 right-12 -translate-y-1/2 h-[70vh] flex-col justify-center items-center z-[90]">
          <div className="absolute inset-y-0 right-[7px] w-[2px] border-r-2 border-dashed border-slate-300/30 pointer-events-none"></div>

          <div className="flex flex-col justify-between h-full py-10 relative z-10">
            {Object.keys(sectionLabels).map((id) => (
              <button
                key={id}
                onClick={() => {
                  const el = document.getElementById(id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative flex items-center justify-center h-12 focus:outline-none cursor-pointer group pointer-events-auto bg-transparent border-0 p-0"
              >
                <AnimatePresence mode="wait">
                  {activeSection === id ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute right-8 flex items-center"
                    >
                      <div className="bg-primary/95 backdrop-blur-md border-l-4 border-accent px-6 py-2.5 shadow-2xl">
                        <span className="text-white text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                          {sectionLabels[id]}
                        </span>
                        <div className="absolute left-full top-1/2 -translate-y-1/2 w-10 h-[2px] bg-[#89D7B7]"></div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400/50 border border-slate-300 group-hover:bg-slate-500/80 transition-colors"></div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>

        {/* Dark Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden bg-white">
      <Navbar />

      {/* Hero Section with Parallax */}
      <section
        id="home"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative pt-20 pb-0 lg:pt-24 overflow-hidden min-h-[75vh] lg:min-h-[100vh] flex flex-col perspective-1000"
      >
        {/* Background Image with Parallax Effect and Slider */}
        <motion.div
          style={{ y: yParallax, opacity: opacityParallax }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <AnimatePresence initial={false}>
            {currentImage === 0 && (
              <motion.img
                key="img-0"
                src={heroSlides[0].image}
                initial={{ opacity: 0, scale: 1.0 }}
                animate={{ opacity: 1, scale: 1.25, transition: { opacity: { duration: 0.8, ease: "easeInOut" }, scale: { duration: 6, ease: "linear" } } }}
                exit={{ opacity: 0, scale: 1.25, transition: { duration: 0.8, ease: "easeInOut" } }}
                alt="Students working"
                className="absolute inset-0 w-full h-full object-cover origin-center"
              />
            )}
            {currentImage === 1 && (
              <motion.img
                key="img-1"
                src={heroSlides[1].image}
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1.0, transition: { opacity: { duration: 0.8, ease: "easeInOut" }, scale: { duration: 6, ease: "linear" } } }}
                exit={{ opacity: 0, scale: 1.0, transition: { duration: 0.8, ease: "easeInOut" } }}
                alt="Students working"
                className="absolute inset-0 w-full h-full object-cover origin-center"
              />
            )}
            {currentImage === 2 && (
              <motion.div
                key="img-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.8, ease: "easeInOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img
                  src={heroSlides[2].image}
                  className="absolute inset-0 w-full h-full object-cover origin-center"
                  initial={{ opacity: 1, scale: 1.0 }}
                  animate={{ opacity: 0, scale: 1.15, transition: { opacity: { delay: 2.5, duration: 0.8 }, scale: { duration: 6, ease: "linear" } } }}
                  exit={{ opacity: 0, scale: 1.15, transition: { duration: 0.8 } }}
                />
                <motion.img
                  src={heroSlides[2].image2}
                  className="absolute inset-0 w-full h-full object-cover origin-center"
                  initial={{ opacity: 0, scale: 1.0 }}
                  animate={{ opacity: 1, scale: 1.15, transition: { opacity: { delay: 2.5, duration: 0.8 }, scale: { duration: 6, ease: "linear" } } }}
                  exit={{ opacity: 0, scale: 1.15, transition: { duration: 0.8 } }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Dark Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10 z-10"></div>

          {/* Decorative Dot Pattern Overlay */}
          <div
            className="absolute inset-0 z-10 opacity-[0.25] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          ></div>
        </motion.div>

        {/* Floating 3D Background Elements & Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Particle Pattern */}
          {particles.map((p, i) => (
            <motion.div
              key={`particle-${i}`}
              animate={{
                y: [0, -40, 0],
                x: [0, p.xOffset, 0],
                opacity: [0.1, 0.5, 0.1],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay
              }}
              className="absolute bg-white rounded-full blur-[1px]"
              style={{
                width: p.size + 'px',
                height: p.size + 'px',
                top: p.top + '%',
                left: p.left + '%',
              }}
            />
          ))}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
          ></motion.div>
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -10, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#89D7B7]/10 rounded-full blur-[120px]"
          ></motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10 w-full flex-1 flex flex-col justify-center pb-12 lg:pb-16 pt-32">
          <motion.div
            style={{ rotateX, rotateY }}
            className="flex flex-col items-start max-w-2xl w-full -mt-24 md:-mt-32"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full"
              >
                <p className="text-white/80 font-medium text-xs md:text-sm tracking-wide mb-3">
                  {heroSlides[currentImage].subtitle}
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-medium text-white leading-[1.1] mb-8 tracking-tight whitespace-pre-line">
                  {heroSlides[currentImage].title}
                </h1>

                <div className="flex items-center gap-5 mt-2">
                  <button
                    onClick={() => document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' })}
                    className="group relative px-8 py-3.5 bg-primary overflow-hidden rounded-2xl font-bold text-white text-sm flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(94,130,112,0.6)] active:scale-95"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out z-0"></div>
                    <span className="relative z-10 tracking-wide">Find Job</span>
                    <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={handlePostJobClick}
                    className="group relative px-8 py-3.5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl font-bold text-white text-sm flex items-center gap-3 transition-all duration-300 hover:bg-slate-800/80 hover:border-white/30 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
                  >
                    <span className="tracking-wide">Post Job</span>
                    <PlusCircle size={18} className="transition-transform duration-500 group-hover:rotate-90 text-slate-300 group-hover:text-white" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Popular Tags */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-12 lg:mt-16 flex items-center gap-3 flex-wrap"
            >
              <span className="text-white/90 font-medium text-sm mr-2">Popular Tags</span>
              {['Graphic Design', 'Web Dev', 'Tutoring'].map((tag, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                  <CheckCircle size={14} className="text-white/50" />
                  <span className="text-white/80 text-xs font-medium">{tag}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 sm:px-10 lg:px-16 pb-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Play/Pause & Counter */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-primary transition-colors flex items-center gap-4"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}

                {/* Slide Counter */}
                <div className="text-white font-bold text-sm tracking-widest mt-0.5">
                  {currentImage + 1} <span className="opacity-50">/ {heroSlides.length}</span>
                </div>
              </button>

              {/* Progress Bars */}
              <div className="hidden md:flex items-center gap-2 ml-4">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className="relative w-24 h-[2px] bg-white/20 overflow-hidden"
                  >
                    {currentImage === index && isPlaying && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="absolute top-0 left-0 h-full bg-primary"
                      />
                    )}
                    {currentImage === index && !isPlaying && (
                      <div className="absolute top-0 left-0 h-full bg-primary w-full" />
                    )}
                    {currentImage > index && (
                      <div className="absolute top-0 left-0 h-full bg-white/60 w-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll Down Indicators */}
            <div className="flex flex-col items-center gap-[-8px] text-white/50 animate-bounce cursor-pointer hover:text-white transition-colors" onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}>
              <ChevronDown size={24} className="-mb-4" />
              <ChevronDown size={24} className="-mb-4 opacity-70" />
              <ChevronDown size={24} className="opacity-40" />
            </div>
          </div>
        </div>
      </section>


      {/* Heritage Section */}
      <section id="about" className="py-10 lg:py-16 bg-white/40 relative overflow-hidden">
        {/* Rich Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-[#89D7B7]/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute -bottom-[300px] -left-[300px] w-[800px] h-[800px] bg-[#4E8C7E]/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Content Column */}
            <motion.div
              className="lg:col-span-6 order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="inline-flex items-center gap-3 mb-8"
              >
                <div className="w-12 h-[1px] bg-[#89D7B7]/50"></div>
                <span className="text-[#1A312C] text-xs font-black uppercase tracking-[0.3em]">Heritage</span>
              </motion.div>

              <motion.h2
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 mb-8 leading-[1.1] tracking-tight"
              >
                A Bridge to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A312C] to-[#4E8C7E] font-serif italic font-normal">Opportunity</span>
              </motion.h2>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-slate-600 text-lg leading-relaxed mb-10 font-light"
              >
                At GigConnect, we believe a university timetable shouldn't stand between students and real income. Founded by students of Uva Wellassa University, our platform was born from a simple observation: Badulla's students have valuable skills, and local clients need affordable, trustworthy help — but no platform connects them safely.
              </motion.p>

              <div className="space-y-8 mb-12">
                {[
                  { title: 'For Students', text: 'Earn flexible income around your class schedule, with every client verified for your safety.' },
                  { title: 'For Job providers', text: 'Hire verified, skilled UWU students for short-term tasks — at a fraction of the cost of mainstream platforms.' },
                  { title: 'For UWU', text: 'Strengthening the bridge between academic life and real-world experience for our student community.' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                    className="flex gap-5 group cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#89D7B7] bg-white shadow-sm flex items-center justify-center text-[#4E8C7E] group-hover:bg-[#4E8C7E] group-hover:text-white group-hover:border-[#4E8C7E] transition-all duration-500">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#1A312C] transition-colors duration-300">{item.title}</h4>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Button Removed */}
            </motion.div>

            {/* Image Column */}
            <motion.div
              className="lg:col-span-6 order-1 lg:order-2 relative"
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
                <motion.div
                  className="mt-12 md:mt-24 rounded-t-full rounded-b-3xl overflow-hidden shadow-2xl shadow-slate-300 relative group"
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src={studentBenchImg}
                    alt="Heritage Campus"
                    className="w-full h-full object-cover aspect-[3/4] transition-all duration-700 group-hover:scale-105"
                  />
                </motion.div>
                <motion.div
                  className="rounded-b-full rounded-t-3xl overflow-hidden shadow-2xl shadow-slate-300 relative group"
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80"
                    alt="University Students"
                    className="w-full h-full object-cover aspect-[3/4] transition-all duration-700 group-hover:scale-105"
                  />
                </motion.div>
              </div>


            </motion.div>

          </div>
        </div>
      </section>

      {/* Browse Jobs Section */}
      <section id="jobs" className="py-16 bg-black relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#89D7B7]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-2 tracking-tight">Available Opportunities</h2>
              <p className="text-slate-400 text-base font-medium">Find the perfect gig that fits your schedule.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search gigs..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium text-white placeholder:text-slate-500 backdrop-blur-md text-sm cursor-pointer"
                  onClick={() => navigate('/jobs')}
                  readOnly
                />
              </div>
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-all backdrop-blur-md text-sm"
              >
                <Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left Column (2 cards) */}
            <div className="flex flex-col gap-6 h-full">
              {dynamicGuestJobs.left.map((job, idx) => {
                const iconStyle = getCategoryIcon(job.category || job.tags[0], job.title);
                return (
                  <motion.div
                    key={job.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl transition-all group flex-1 flex flex-col justify-between hover:border-primary/30"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div className={`w-9 h-9 rounded-xl ${iconStyle.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                          {iconStyle.icon}
                        </div>
                        <span className="text-xl font-black text-primary">{job.price}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-primary transition-colors leading-tight line-clamp-1">{job.title}</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{job.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.tags.map((t, i) => (
                          <span key={`${t}-${i}`} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200/60">{t}</span>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-slate-500">
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <MapPin size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <Clock size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate">{job.duration}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/jobs')}
                      className="w-full py-2.5 mt-3 bg-white text-[#1A312C] rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-[#4E8C7E]/20"
                    >
                      View Details
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Featured Center Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="bg-primary rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-primary/30 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/20 rounded-full blur-[80px] transition-transform group-hover:scale-110"></div>

              <div className="relative z-10">
                <div className="flex justify-end items-start mb-8">
                  <span className="text-4xl font-black text-white tracking-tighter">{dynamicGuestJobs.featured.price}</span>
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">{dynamicGuestJobs.featured.title}</h3>
                <p className="text-[#F2F2EE]/90 text-base leading-relaxed mb-8 font-medium opacity-90">
                  {dynamicGuestJobs.featured.desc}
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: 'Calendar', text: dynamicGuestJobs.featured.date },
                    { icon: 'MapPin', text: dynamicGuestJobs.featured.location },
                    { icon: 'Clock', text: dynamicGuestJobs.featured.duration }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-white/90">
                      <div className="w-5 h-5 flex items-center justify-center opacity-70">
                        {item.icon === 'Calendar' && <Calendar size={18} />}
                        {item.icon === 'MapPin' && <MapPin size={18} />}
                        {item.icon === 'Clock' && <Clock size={18} />}
                      </div>
                      <span className="text-sm font-bold tracking-tight">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/jobs')}
                className="w-full py-4 bg-white text-primary rounded-2xl font-black text-lg hover:shadow-2xl hover:-translate-y-1 transition-all relative z-10 active:scale-[0.98]"
              >
                Apply Now
              </button>
            </motion.div>

            {/* Right Column (2 cards) */}
            <div className="flex flex-col gap-6 h-full">
              {dynamicGuestJobs.right.map((job, idx) => {
                const iconStyle = getCategoryIcon(job.category || job.tags[0], job.title);
                return (
                  <motion.div
                    key={job.id || idx}
                    initial={{ opacity: 0, y: 50, rotateX: 15 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -10, rotateY: 5, translateZ: 30 }}
                    className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl transition-all group flex-1 flex flex-col justify-between hover:border-primary/30 perspective-1000"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <div className={`w-9 h-9 rounded-xl ${iconStyle.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                          {iconStyle.icon}
                        </div>
                        <span className="text-xl font-black text-primary">{job.price}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 mb-1 group-hover:text-primary transition-colors leading-tight line-clamp-1">{job.title}</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{job.desc}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.tags.map((t, i) => (
                          <span key={`${t}-${i}`} className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200/60">{t}</span>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-slate-500">
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <MapPin size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <Clock size={12} className="text-primary/70 shrink-0" />
                          <span className="truncate">{job.duration}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/jobs')}
                      className="w-full py-2.5 mt-3 bg-white text-[#1A312C] rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-[#4E8C7E]/20"
                    >
                      View Details
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-all group"
            >
              <span className="text-base">Explore all</span>
              <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Seamless Collaboration Section */}
      <section id="collaboration" className="py-16 lg:py-24 bg-[#EAF5EF] relative overflow-hidden">
        {/* Subtle luxury background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#89D7B7]/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#4E8C7E]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="text-center mb-12 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <div className="w-8 md:w-12 h-[1px] bg-[#89D7B7]/50"></div>
              <span className="text-[#1A312C] text-xs font-black uppercase tracking-[0.3em]">The Process</span>
              <div className="w-8 md:w-12 h-[1px] bg-[#89D7B7]/50"></div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 mb-6 leading-tight tracking-tight"
            >
              Seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A312C] to-[#4E8C7E] font-serif italic font-normal">Collaboration</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-slate-600 max-w-2xl mx-auto text-lg font-light leading-relaxed"
            >
              Whether you're offering your skills or looking for help, we've made the process simple, secure, and university-focused.
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.2 }
              }
            }}
          >
            {/* For Students Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-white rounded-[2.5rem] border border-[#4E8C7E]/20 p-8 lg:p-10 shadow-[0_10px_40px_rgba(26,49,44,0.04)] hover:shadow-[0_20px_50px_rgba(26,49,44,0.08)] transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#89D7B7]/20 to-transparent rounded-bl-full opacity-50"></div>

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl border border-[#89D7B7] bg-white shadow-sm flex items-center justify-center text-[#4E8C7E] group-hover:bg-[#4E8C7E] group-hover:text-white group-hover:border-[#4E8C7E] transition-all duration-500">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-3xl font-heading font-black text-slate-900">For Students 🎓</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { title: 'Create your profile', desc: 'Verify with your UWU student email, then add your skills, availability, and job preferences.' },
                  { title: 'Get matched & apply', desc: 'Browse recommended jobs based on your skills, or search and filter listings that fit your schedule.' },
                  { title: 'Work and get rated', desc: 'Complete the job, communicate safely through the platform, and build your rating for future gigs.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 group/step cursor-default">
                    <div className="w-10 h-10 rounded-full border border-[#89D7B7] bg-white flex items-center justify-center text-[#4E8C7E] font-black text-sm flex-shrink-0 group-hover/step:bg-white group-hover/step:border-[#4E8C7E] transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover/step:text-[#1A312C] transition-colors">{step.title}</h4>
                      <p className="text-slate-500 leading-relaxed font-light">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Job Providers Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-white rounded-[2.5rem] border border-[#4E8C7E]/20 p-8 lg:p-10 shadow-[0_10px_40px_rgba(26,49,44,0.04)] hover:shadow-[0_20px_50px_rgba(26,49,44,0.08)] transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4E8C7E]/20 to-transparent rounded-bl-full opacity-50"></div>

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl border border-[#89D7B7] bg-white shadow-sm flex items-center justify-center text-[#4E8C7E] group-hover:bg-[#4E8C7E] group-hover:text-white group-hover:border-[#4E8C7E] transition-all duration-500">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-3xl font-heading font-black text-slate-900">For Job Providers 💼</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { title: 'Post a job', desc: 'Describe the task, set the payment, and choose onsite or remote — business registration number is mandatory for onsite jobs.' },
                  { title: 'Review applicants', desc: 'See a ranked list of students matched by skill and rating, then shortlist your top picks.' },
                  { title: 'Confirm and pay', desc: 'Track job progress, confirm completion, and pay a low commission — far less than other platforms.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 group/step cursor-default">
                    <div className="w-10 h-10 rounded-full border border-[#89D7B7] bg-white flex items-center justify-center text-[#4E8C7E] font-black text-sm flex-shrink-0 group-hover/step:bg-white group-hover/step:border-[#4E8C7E] transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover/step:text-[#1A312C] transition-colors">{step.title}</h4>
                      <p className="text-slate-500 leading-relaxed font-light">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Authentic Tata-Style Global Vertical Nav UI */}
      <div className="hidden lg:flex fixed top-1/2 right-12 -translate-y-1/2 h-[70vh] flex-col justify-center items-center z-[90] pointer-events-none">
        {/* Vertical Dashed Track */}
        <div className="absolute inset-y-0 right-[7px] w-[2px] border-r-2 border-dashed border-white/20"></div>

        <div className="flex flex-col justify-between h-full py-10">
          {Object.keys(sectionLabels).map((id) => (
            <div key={id} className="relative flex items-center justify-center h-12">
              <AnimatePresence mode="wait">
                {activeSection === id ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-8 flex items-center"
                  >
                    {/* The "Heritage" Style Box */}
                    <div className="bg-primary/95 backdrop-blur-md border-l-4 border-accent px-6 py-2.5 shadow-2xl">
                      <span className="text-white text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                        {sectionLabels[id]}
                      </span>
                      {/* Signature Orange Connector Line */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 w-10 h-[2px] bg-[#D97706] shadow-[0_0_15px_rgba(217,119,6,0.5)]"></div>
                    </div>
                  </motion.div>
                ) : (
                  /* Non-active dot indicator */
                  <div className="w-2 h-2 rounded-full bg-white/20 border border-white/10 group-hover:bg-white/40 transition-all"></div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS (What Our Customers Say) ── */}
      <section className="py-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="bg-[#EAF5EF] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-[#1A312C] shadow-md border border-[#4E8C7E]/20">
            <div className="max-w-2xl text-left">
              <span className="text-5xl font-serif italic opacity-50 text-[#4E8C7E]">“</span>
              <p className="text-lg sm:text-xl font-bold leading-relaxed -mt-4 text-[#1A312C]">
                I hired a student tour guide through GigConnect for my trip to Ella. She was incredibly knowledgeable, showing us hidden waterfalls and viewpoints we never would have found otherwise. It was a truly unforgettable experience!
              </p>

              <div className="flex items-center gap-3 mt-8">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[#1A312C] border border-[#4E8C7E]/20">
                  O
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1A312C] leading-none">Oliver Bennett</h4>
                  <p className="text-[10px] text-[#4E8C7E] font-bold mt-1">Tourist from United Kingdom</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 text-left md:text-right">
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-[#1A312C] tracking-tight max-w-[200px] uppercase leading-none">
                What our customers say
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Achieve More, Together Section (with original content) */}
      <section className="mx-6 sm:mx-10 lg:mx-16 my-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center relative min-h-[500px]">
          
          {/* Left Image Column */}
          <div className="lg:col-span-8 w-full h-[350px] sm:h-[450px] lg:h-[500px] rounded-[2.5rem] overflow-hidden shadow-xl relative z-0">
            <img
              src={studentImg}
              alt="Indian student working on laptop"
              className="w-full h-full object-cover"
            />
            {/* Subtle overlay for the image */}
            <div className="absolute inset-0 bg-black/10"></div>
          </div>

          {/* Right Card Column - Overlapping on Desktop */}
          <div className="lg:col-span-6 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-[48%] bg-[#F5FBF7] rounded-[2.5rem] p-8 sm:p-12 lg:p-14 shadow-2xl border border-[#4E8C7E]/10 z-10 overflow-hidden relative">
            
            {/* Decorative background blobs */}
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#E2F5EC] rounded-full blur-2xl opacity-80 pointer-events-none"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#DDF8A3]/30 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#4E8C7E] bg-[#E2F5EC] px-3 py-1 rounded-full inline-block">
                Join the Network
              </span>
              
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-[#1A312C] leading-[1.1] tracking-tight uppercase">
                Ready to Boost Your <br className="hidden sm:block" />Career and Income?
              </h3>
              
              <p className="text-[#3B5A51] text-sm sm:text-base leading-relaxed font-medium">
                Connect with top businesses, build a standout portfolio, and start earning on your own terms while completing your studies.
              </p>
              
              <div className="flex flex-wrap gap-4 items-center pt-2">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="bg-[#CFF293] hover:bg-[#bfe283] text-[#1A312C] text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 duration-200 flex items-center gap-2"
                >
                  Register Now <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-transparent hover:bg-[#1A312C]/5 border border-[#1A312C]/20 text-[#1A312C] text-xs sm:text-sm font-bold px-6 py-3.5 rounded-full transition-all active:scale-95 duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Dark Footer */}
      <Footer />

      {/* Warning Modal */}
      <AnimatePresence>
        {warningMessage && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Action Required</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">{warningMessage}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setWarningMessage(null)}
                  className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setWarningMessage(null);
                    setIsLoginModalOpen(true);
                  }}
                  className="flex-1 py-3 px-6 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  Log In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
