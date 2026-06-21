import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowRight, CheckCircle, Zap, Shield, Users, DollarSign, Briefcase, PlusCircle, User, Calendar, MapPin, Clock, ChevronDown, GraduationCap, Star, Play, Pause, Sparkles, Truck, MessageSquare, Percent, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import JobCard from '../components/shared/JobCard';
import { INITIAL_JOBS } from '../data/mockData';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import studentImg from '../indian_student_laptop_green.png';

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
          <span>Proposals: 5-10</span>

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
            <span className="text-[11px] font-medium">Client: <strong>{job.clientName}</strong> {job.clientEmail && <span className="text-slate-400 font-normal">({job.clientEmail})</span>}</span>
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

      return {
        id: dbJob.id,
        title: dbJob.title,
        price: formattedPrice,
        tags: tags.slice(0, 3),
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
      navigate('/dashboard/student/overview');
    } else {
      setWarningMessage("You must be logged in as a Student to apply for a job. Please log in with a Student account.");
    }
  };

  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop",
      subtitle: "Find Flexible Jobs",
      title: "Earn while you learn\nat University"
    },
    {
      image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80",
      subtitle: "Build Your Portfolio",
      title: "Real projects for\nreal clients"
    },
    {
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80",
      image2: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80",
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
      jobs: 'Opportunities',
      collaboration: 'Process'
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
      .filter(j => j.score === 0)
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
          <div className="bg-[#D1EBE1] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 min-h-[550px] shadow-lg border border-[#4E8C7E]/25">
            {/* Outlined text in background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <span className="text-[12vw] font-black text-[#1A312C]/5 uppercase tracking-widest font-sans leading-none">
                STUDENT
              </span>
            </div>

            {/* Left Content Column */}
            <div className="relative z-10 flex-1 w-full lg:max-w-2xl text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-none mb-4 uppercase text-[#1A312C]">
                Welcome back, <br />
                <span className="font-serif italic font-normal text-[#4E8C7E]">{user.name.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-[#1A312C]/80 text-base sm:text-lg font-medium max-w-xl">
                Find high-quality Jobs opportunities matching your skill set and study schedule.
              </p>

              {/* Integrated Search Input */}
              <div className="w-full max-w-xl bg-white rounded-2xl p-2.5 flex items-center shadow-xl border border-slate-200/50 mt-8 mb-4">
                <Search className="ml-4 text-slate-400 flex-shrink-0" size={18} />
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
                <div className="flex items-center gap-2 pr-1">
                  <button
                    onClick={handleSearchSubmit}
                    className="px-6 py-2.5 bg-[#1A312C] text-white rounded-xl text-xs font-bold hover:bg-[#4E8C7E] transition-all active:scale-95 whitespace-nowrap"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Popular tags list */}
              <div className="flex flex-wrap items-center gap-1.5 text-[#1A312C]/90">
                <span className="font-bold opacity-90 mr-1 text-[#1A312C]">Popular skills:</span>
                {['All', 'Design', 'Data Entry', 'Photography', 'Web Dev', 'Translation'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      navigate('/jobs', { state: { category: cat } });
                    }}
                    className="px-3 py-1 rounded-full border text-[11px] font-bold transition-all whitespace-nowrap bg-white text-[#1A312C] border-[#1A312C]/20 hover:bg-[#1A312C] hover:text-white"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Student Image & Floating Cards Column */}
            <div className="relative z-10 flex-shrink-0 w-full lg:w-96 flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-[3rem] overflow-hidden border-4 border-white/80 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                  alt="Student working"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Pill 1: Student Tag */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-4 bg-white border border-slate-100 rounded-2xl p-3 shadow-xl flex items-center gap-2.5 animate-float"
              >
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 leading-none">{user.name.split(' ')[0]}</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">UWU Student</p>
                </div>
              </motion.div>

              {/* Floating Pill 2: Gigs completed */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-24 -right-4 bg-white border border-slate-100 rounded-2xl p-3 shadow-xl flex items-center gap-2 animate-float-delayed"
              >
                <div className="w-6 h-6 rounded-full bg-[#89D7B7]/25 text-[#1A312C] flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-900 leading-none">{completedCount}+ Gigs</h4>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">Completed</p>
                </div>
              </motion.div>

              {/* Floating Pill 3: Standing/Rating */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 left-6 bg-white border border-slate-100 rounded-2xl p-3 shadow-xl flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px]">
                  ★
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-900 leading-none">
                    {studentRating === 0 ? 'New' : studentRating.toFixed(2)} Rating
                  </h4>
                  <p className="text-[8px] text-slate-400 font-bold mt-0.5">
                    {noShows > 0 ? `-${noShows * 1.5} Penalty` : 'Top Standing'}
                  </p>
                </div>
              </motion.div>
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

                  return (
                    <div
                      key={`${job.job_ID || job.id}-${idx}`}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-accent/20 px-2.5 py-1 rounded-full">
                              {job.job_type}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-black text-slate-800 bg-primary-light border border-slate-200 px-2 py-0.5 rounded-full">{matchPct}% Match</span>
                            </div>
                          </div>

                          <h3 className="font-heading font-black text-base text-slate-900 group-hover:text-[#89D7B7] transition-colors leading-snug line-clamp-2">
                            {job.title}
                          </h3>

                          <p className="text-[#4E8C7E] font-extrabold text-sm mt-2">
                            LKR {parseFloat(job.payment || 0).toLocaleString()}
                          </p>

                          {/* Client & Date / Time */}
                          <div className="mt-3 text-[11px] font-semibold text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {job.provider_name && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-slate-700">Client:</span>
                                <span className="text-slate-600">{job.provider_name}</span>
                                {job.provider_email && (
                                  <span className="text-slate-400 text-[9px] font-normal">({job.provider_email})</span>
                                )}
                              </div>
                            )}
                            {job.job_date && (
                              <div className="flex items-center gap-1 text-slate-500 font-medium">
                                <span className="font-bold text-slate-700">Schedule:</span>
                                <span className="text-slate-600">{job.job_date} @ {job.start_time} - {job.end_time}</span>
                              </div>
                            )}
                          </div>

                          {/* Reason tags */}
                          {job.match_reasons && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {job.match_reasons.slice(0, 2).map((reason, i) => (
                                <span key={i} className="text-[9px] font-bold bg-white text-[#1A312C] border border-[#4E8C7E]/25 px-2 py-0.5 rounded-full">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(job.skills ? job.skills.split(',').slice(0, 3) : []).map((s, i) => (
                              <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => handleApplyJobClick()}
                            disabled={alreadyApplied}
                            className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-wider transition-all ${alreadyApplied
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-900 hover:text-[#4E8C7E] group-hover:translate-x-1'
                              }`}
                          >
                            {alreadyApplied ? 'Applied' : <><span>Quick Apply</span><ArrowRight size={12} className="inline ml-1" /></>}
                          </button>
                        </div>
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
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80"
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
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80"
                  alt="Student collaborating"
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
                    title: 'Verified Clients Only',
                    desc: 'Every client is verified with NIC and OTP, so you know who you\'re working with.'
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
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-[#1A312C] shadow-md border border-[#4E8C7E]/20">
            <div className="max-w-2xl">
              <span className="text-5xl font-serif italic opacity-30">“</span>
              <p className="text-lg sm:text-xl font-bold leading-relaxed -mt-4 text-slate-900">
                I hired a student tour guide through GigConnect for my trip to Ella. She was incredibly knowledgeable, showing us hidden waterfalls and viewpoints we never would have found otherwise. It was a truly unforgettable experience!
              </p>

              <div className="flex items-center gap-3 mt-8">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-900">
                  O
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-none">Oliver Bennett</h4>
                  <p className="text-[10px] text-slate-700 font-bold mt-1">Tourist from United Kingdom</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-950 tracking-tight max-w-[200px] uppercase leading-none text-right md:text-left">
                What our customers say
              </h3>
            </div>
          </section>

          {/* ── TOP RATED STUDENTS / EXPERIENCED FREELANCE ── */}
          <section className="flex flex-col lg:flex-row items-center justify-between gap-12 py-6">
            <div className="max-w-md">
              <div className="text-yellow-500 text-sm font-bold mb-2">★★★★★</div>
              <h3 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 tracking-tight uppercase leading-none mb-4">
                Experienced Gigs
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 font-light">
                Our platform features talented student freelancers who possess a deep understanding of their craft, delivering top-quality work that exceeds expectations.
              </p>
              <button
                onClick={() => document.getElementById('browse').scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full text-xs font-bold transition-all"
              >
                Start Finding
              </button>
            </div>

            {/* Grid of student avatars */}
            <div className="grid grid-cols-4 gap-4 sm:gap-6 flex-shrink-0">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
              ].map((url, idx) => (
                <div key={idx} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform">
                  <img src={url} alt="Student Profile" className="w-full h-full object-cover" />
                </div>
              ))}
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
              <div className="flex flex-col gap-6">
                {generalGigs.map((job, idx) => (
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
              {[
                {
                  step: '01',
                  title: 'Register with UWU Email',
                  desc: 'Sign up using your @std.uwu.ac.lk email and verify with OTP. Your account gets approved by admin within 24 hours.'
                },
                {
                  step: '02',
                  title: 'Build Your Profile',
                  desc: 'Add your skills, availability, and preferences so the system can match you with the right jobs.'
                },
                {
                  step: '03',
                  title: 'Browse or Get Recommendations',
                  desc: 'Search jobs by category, payment, and location, or check your personalized "Recommended for You" section.'
                },
                {
                  step: '04',
                  title: 'Apply & Get Shortlisted',
                  desc: 'Apply with one click. Clients review your profile, skills, and ratings to shortlist candidates.'
                },
                {
                  step: '05',
                  title: 'Work & Earn',
                  desc: 'Once accepted, complete the job on your schedule. For product-based jobs, choose self-delivery or let our Delivery Staff handle it.'
                },
                {
                  step: '06',
                  title: 'Get Paid & Rated',
                  desc: 'Receive payment, leave a review for the client, and build your rating for future opportunities.'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#4E8C7E]/20 rounded-3xl p-8 hover:border-accent hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full opacity-55"></div>

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-4xl font-extrabold text-accent font-sans tracking-tight">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#4E8C7E]/20 text-[#1A312C] group-hover:bg-accent group-hover:text-white transition-colors">
                      <Sparkles size={16} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-primary group-hover:text-[#4E8C7E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[#4E8C7E] text-sm leading-relaxed font-light">
                    {item.desc}
                  </p>
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
        <footer className="bg-black pt-16 pb-8 relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.02] pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#89D7B7]/5 rounded-full blur-[150px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl font-heading font-black text-white tracking-tight">GigConnect</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-light">
                  Empowering university students to build their careers, gain real-world experience, and connect with top businesses.
                </p>
              </div>

              <div>
                <h4 className="text-white font-black mb-6 tracking-wide">Platform</h4>
                <ul className="space-y-4 text-sm text-slate-400 font-light">
                  <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                  <li><a href="#browse" className="hover:text-white transition-colors">Browse Gigs</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-black mb-6 tracking-wide">Legal</h4>
                <ul className="space-y-4 text-sm text-slate-400 font-light">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="mailto:gigconnectsystem@gmail.com" className="hover:text-white transition-colors">Contact Support</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm font-light">
                &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
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
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
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

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {/* Left Column (2 cards) */}
            <div className="space-y-6">
              {dynamicGuestJobs.left.map((job, idx) => (
                <motion.div
                  key={job.id || idx}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl transition-all group h-[calc(50%-12px)] flex flex-col justify-between hover:border-primary/30"
                >
                  <div>
                    <div className="flex justify-end items-start mb-4">
                      <span className="text-xl font-black text-primary">{job.price}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-2">{job.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="w-full py-3 bg-white text-[#1A312C] rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-[#4E8C7E]/20"
                  >
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Featured Center Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
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
            <div className="space-y-6">
              {dynamicGuestJobs.right.map((job, idx) => (
                <motion.div
                  key={job.id || idx}
                  variants={{
                    hidden: { opacity: 0, y: 50, rotateX: 15 },
                    visible: { opacity: 1, y: 0, rotateX: 0 }
                  }}
                  whileHover={{ y: -10, rotateY: 5, translateZ: 30 }}
                  className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xl transition-all group h-[calc(50%-12px)] flex flex-col justify-between hover:border-primary/30 perspective-1000"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div>
                    <div className="flex justify-end items-start mb-4">
                      <span className="text-xl font-black text-primary">{job.price}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-2">{job.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="w-full py-3 bg-white text-[#1A312C] rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-[#4E8C7E]/20"
                  >
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-all group"
            >
              <span className="text-base">Explore all 150+ active gigs</span>
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
      <footer className="bg-black pt-20 pb-10 relative overflow-hidden text-white">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#89D7B7]/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-heading font-black text-white tracking-tight">GigConnect</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-light">
                Empowering university students to build their careers, gain real-world experience, and connect with top businesses.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-black mb-6 tracking-wide">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Our Heritage</a></li>
                <li><a href="#jobs" className="hover:text-white transition-colors">Opportunities</a></li>
              </ul>
            </div>

            {/* Legal / Contact */}
            <div>
              <h4 className="text-white font-black mb-6 tracking-wide">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="mailto:gigconnectsystem@gmail.com" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-light">
              &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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
