import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowRight, CheckCircle, Zap, Shield, Users, DollarSign, Briefcase, PlusCircle, User, Calendar, MapPin, Clock, ChevronDown, GraduationCap, Star, Play, Pause } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import JobCard from '../components/shared/JobCard';
import { INITIAL_JOBS } from '../data/mockData';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import logo from '../logo.svg';

const LandingPage = () => {
  const { jobs } = useJobs();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeSection, setActiveSection] = useState('home');

  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop",
      subtitle: "Find Flexible Gigs",
      title: "Earn while you learn\nat UWU"
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
    const sections = ['home', 'how-it-works', 'about', 'jobs', 'collaboration'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const sectionLabels = {
    home: 'Launch',
    'how-it-works': 'Community',
    about: 'Heritage',
    jobs: 'Opportunities',
    collaboration: 'Process'
  };

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

  const filteredJobs = jobs.filter(job => 
    job.status === 'Active' && 
    (searchTerm === '' || job.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'All' || job.category === categoryFilter)
  );

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

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden">
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
            className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]"
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
                    className="group relative px-8 py-3.5 bg-primary overflow-hidden rounded-2xl font-bold text-white text-sm flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.6)] active:scale-95"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out z-0"></div>
                    <span className="relative z-10 tracking-wide">Find Job</span>
                    <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
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
            <div className="flex flex-col items-center gap-[-8px] text-white/50 animate-bounce cursor-pointer hover:text-white transition-colors" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              <ChevronDown size={24} className="-mb-4" />
              <ChevronDown size={24} className="-mb-4 opacity-70" />
              <ChevronDown size={24} className="opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* Tata-Inspired Bento Grid Features Section */}
      <section id="how-it-works" className="pt-8 pb-12 lg:pt-12 lg:pb-16 bg-[#0F172A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="text-left mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 tracking-tight border-l-8 border-[#2563EB] pl-6 uppercase">Designed for the UWU Community</h2>
            <p className="text-slate-400 max-w-2xl text-lg font-medium opacity-90 pl-8">
              A specialized ecosystem bridging the gap between students and local opportunities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 h-auto bg-[#1a1a1a]">
            {/* 1. Left Column - Tall Vertical Card (Growth & Safety) */}
            <motion.div 
              className="md:row-span-2 bg-[#262626] rounded-none overflow-hidden group shadow-2xl flex flex-col perspective-1000"
              initial={{ opacity: 0, x: -50, rotateY: -10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              whileHover={{ rotateY: 5, translateZ: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="h-[60%] relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80" 
                  alt="Growth" 
                  className="w-full h-full object-cover grayscale-[0.8] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute top-0 left-0 bg-[#333] px-6 py-3 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                  Careers
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col justify-center border-t border-white/5">
                <span className="text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] mb-8 block">Careers</span>
                <h3 className="text-3xl font-black text-white mb-8 leading-tight">Professional <br /> Growth & Safety</h3>
                <div className="flex gap-4 border-l-2 border-[#D97706] pl-6">
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    We do not charge any security deposit from job seekers. Build your portfolio with trust and transparency.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 2. Top Right - Wide Horizontal Card (Instant Payouts / Early Career) */}
            <motion.div 
              className="md:col-span-2 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e3a8a] rounded-none p-8 relative overflow-hidden group min-h-[300px] flex items-center shadow-2xl perspective-1000"
              initial={{ opacity: 0, y: -50, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              whileHover={{ rotateX: -5, translateZ: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {/* TAS-style label */}
              <div className="absolute top-12 left-12 text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">
                GIGS
              </div>

              {/* Centered Translucent Box */}
              <div className="relative z-20 w-full md:w-[60%] bg-[#0f2d40]/80 backdrop-blur-md p-8 border-l border-white/20">
                <h3 className="text-4xl font-black text-white mb-6 leading-tight">Instant Payouts <br /> for Students?</h3>
                <div className="border-l-2 border-white/30 pl-6 py-2">
                  <p className="text-white/90 text-sm font-medium italic mb-2 tracking-wide">
                    Make #TheBestMoveForward.
                  </p>
                  <p className="text-white/60 text-xs uppercase tracking-widest font-black">
                    Registrations for 2026 are open.
                  </p>
                </div>
              </div>

              {/* Mountain Illustration (SVG representation of the Tata mountain) */}
              <div className="absolute bottom-0 right-0 w-[50%] h-[80%] pointer-events-none z-10 opacity-60">
                <svg viewBox="0 0 500 400" className="w-full h-full drop-shadow-2xl">
                  <path d="M500,400 L500,100 L400,200 L300,150 L200,300 L100,250 L0,400 Z" fill="#1e40af" />
                  <circle cx="100" cy="250" r="4" fill="#2563eb" />
                  <circle cx="200" cy="300" r="4" fill="#2563eb" />
                  <circle cx="300" cy="150" r="4" fill="#2563eb" />
                  <circle cx="400" cy="200" r="4" fill="#2563eb" />
                  <circle cx="500" cy="100" r="4" fill="#2563eb" />
                  <path d="M100,250 L200,300 L300,150 L400,200 L500,100" fill="none" stroke="#2563eb" strokeDasharray="6,4" strokeWidth="2" />
                  {/* Flag on peak */}
                  <path d="M500,100 L500,60 M500,60 L540,75 L500,90" fill="#7c3aed" stroke="#7c3aed" strokeWidth="2" />
                </svg>
              </div>

              {/* Arrow Bottom Right */}
              <div className="absolute bottom-12 right-12 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-2 duration-300">
                <ArrowRight size={32} />
              </div>
            </motion.div>

            {/* 3. Bottom Middle - Stats Card (In Numbers) */}
            <motion.div 
              className="bg-[#333333] rounded-none p-8 flex flex-col items-center justify-center text-center shadow-2xl group border-t border-white/5 perspective-1000"
              initial={{ opacity: 0, y: 50, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              whileHover={{ rotateX: 5, translateZ: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] mb-12 block">In Numbers</span>
              <div className="mb-8 opacity-40 group-hover:opacity-100 transition-opacity duration-500 scale-125">
                <Users size={48} className="text-white" />
              </div>
              <div className="text-6xl font-black text-[#2563EB] mb-4 tracking-tighter tabular-nums">500+</div>
              <p className="text-white font-bold text-xs uppercase tracking-[0.3em] leading-relaxed">Verified Students <br /> at the UWU group</p>
            </motion.div>

            {/* 4. Bottom Right - Featured Jobs (Careers) */}
            <motion.div 
              className="bg-[#1e3442] rounded-none p-8 shadow-2xl group border-t border-white/5 perspective-1000"
              initial={{ opacity: 0, x: 50, rotateY: 10 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              whileHover={{ rotateY: -5, translateZ: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] mb-12 block">Careers</span>
              <h3 className="text-3xl font-black text-white mb-10 tracking-tight">Featured Gigs</h3>
              
              <div className="space-y-10">
                {[
                  { title: 'Graphic Design', company: 'UWU Tech Hub, Badulla' },
                  { title: 'UI Audit Lead', company: 'Innovation Center, Remote' }
                ].map((item, i) => (
                  <div key={i} className="border-l border-white/30 pl-8 group-hover:border-[#2563EB] transition-colors duration-300">
                    <h4 className="text-white font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{item.company}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Heritage Section */}
      <section id="about" className="py-10 lg:py-16 bg-sky-50 relative overflow-hidden">
        {/* Rich Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] bg-sky-300/30 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute -bottom-[300px] -left-[300px] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[150px] pointer-events-none"></div>
        
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
                <div className="w-12 h-[1px] bg-sky-600/50"></div>
                <span className="text-sky-600 text-xs font-black uppercase tracking-[0.3em]">Heritage</span>
              </motion.div>
              
              <motion.h2 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 mb-8 leading-[1.1] tracking-tight"
              >
                A Legacy of <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 font-serif italic font-normal">Excellence</span>
              </motion.h2>
              
              <motion.p 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-slate-600 text-lg leading-relaxed mb-10 font-light"
              >
                At GigConnect, we believe that the gap between academic learning and professional experience should be a bridge, not a barrier. Founded by students of Uva Wellassa University, our platform was born from a simple observation: students have incredible skills, and local businesses have real needs.
              </motion.p>
              
              <div className="space-y-8 mb-12">
                {[
                  { title: 'For Students', text: 'Build a professional portfolio and earn income while studying.' },
                  { title: 'For Businesses', text: 'Access high-quality, specialized talent right from your campus.' },
                  { title: 'For UWU', text: 'Fostering an ecosystem of innovation and practical education.' }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                    className="flex gap-5 group cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full border border-sky-200 bg-white shadow-sm flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all duration-500">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors duration-300">{item.title}</h4>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.button 
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://www.uwu.ac.lk/', '_blank')}
                className="px-8 py-4 bg-[#0ea5e9] text-white hover:bg-[#0284c7] shadow-xl shadow-sky-500/20 rounded-full font-bold tracking-wide transition-all duration-300"
              >
                Discover Our Roots
              </motion.button>
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
      <section id="jobs" className="py-16 bg-[#0F172A] relative overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

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
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-medium text-white placeholder:text-slate-500 backdrop-blur-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl font-bold text-white hover:bg-white/10 transition-all backdrop-blur-md text-sm">
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
              {[
                { title: 'Website UI Design Audit', price: '$25/hr', tags: ['Design', 'Remote', '2-3 Hours'], desc: 'Review and provide feedback for a local coffee shop\'s new ordering system.' },
                { title: 'Custom Python Script', price: '$50 Fixed', tags: ['Coding', 'Remote', 'Fast Track'], desc: 'Small automation script needed for data cleanup. Budget is fixed.' }
              ].map((job, idx) => (
                <motion.div 
                  key={idx} 
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
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-slate-200"
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
                  <span className="text-4xl font-black text-white tracking-tighter">$200</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">Professional <br/> Event <br/> Photography</h3>
                <p className="text-blue-50 text-base leading-relaxed mb-8 font-medium opacity-90">
                  Looking for a student photographer for the Senior Gala. Equipment provided.
                </p>
                
                <div className="space-y-4 mb-10">
                  {[
                    { icon: 'Calendar', text: 'This Saturday, 6PM' },
                    { icon: 'MapPin', text: 'Campus Union Hall' },
                    { icon: 'Clock', text: '5 Hours Flat' }
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
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-4 bg-white text-primary rounded-2xl font-black text-lg hover:shadow-2xl hover:-translate-y-1 transition-all relative z-10 active:scale-[0.98]"
              >
                Apply Now
              </button>
            </motion.div>

            {/* Right Column (2 cards) */}
            <div className="space-y-6">
              {[
                { title: 'Math Tutor (Calculus II)', price: '$18/hr', tags: ['Tutoring', 'On-Campus', 'Ongoing'], desc: 'Need help preparing for the midterms. Twice a week sessions at the campus library.' },
                { title: 'Campus Tour Guide', price: '$15/hr', tags: ['Events', 'In-Person', '4 Hours'], desc: 'Help prospective students and their families navigate the campus.' }
              ].map((job, idx) => (
                <motion.div 
                  key={idx} 
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
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-3 bg-slate-50 text-slate-900 rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border border-slate-200"
                  >
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-all group">
              <span className="text-base">Explore all 150+ active gigs</span>
              <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Seamless Collaboration Section */}
      <section id="collaboration" className="py-16 lg:py-24 bg-sky-50 relative overflow-hidden">
        {/* Subtle luxury background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-300/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="text-center mb-12 flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <div className="w-8 md:w-12 h-[1px] bg-sky-600/50"></div>
              <span className="text-sky-600 text-xs font-black uppercase tracking-[0.3em]">The Process</span>
              <div className="w-8 md:w-12 h-[1px] bg-sky-600/50"></div>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-slate-900 mb-6 leading-tight tracking-tight"
            >
              Seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 font-serif italic font-normal">Collaboration</span>
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
              className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-transparent rounded-bl-full opacity-50"></div>
              
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl border border-sky-100 bg-white shadow-sm flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all duration-500">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-3xl font-heading font-black text-slate-900">For Students</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { title: 'Create your profile', desc: 'List your skills, campus organization affiliations, and availability.' },
                  { title: 'Browse & Apply', desc: 'Search for gigs that match your schedule and interests. Submit quick applications.' },
                  { title: 'Get Paid Safely', desc: 'Funds are held in escrow and released immediately upon project approval.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 group/step cursor-default">
                    <div className="w-10 h-10 rounded-full border border-sky-200 bg-white flex items-center justify-center text-sky-600 font-black text-sm flex-shrink-0 group-hover/step:bg-sky-50 group-hover/step:border-sky-300 transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover/step:text-sky-600 transition-colors">{step.title}</h4>
                      <p className="text-slate-500 leading-relaxed font-light">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Clients Card */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-50"></div>

              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl border border-blue-100 bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-3xl font-heading font-black text-slate-900">For Clients</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {[
                  { title: 'Post a Gig', desc: 'Describe the task, set your budget, and define the deadline.' },
                  { title: 'Hire Top Talent', desc: 'Review student portfolios and verified campus reviews to find the best fit.' },
                  { title: 'Approve & Release', desc: 'Review the work, provide feedback, and release payment with one click.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 group/step cursor-default">
                    <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center text-blue-600 font-black text-sm flex-shrink-0 group-hover/step:bg-blue-50 group-hover/step:border-blue-300 transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover/step:text-blue-600 transition-colors">{step.title}</h4>
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
                    <div className="bg-[#0a192f]/95 backdrop-blur-md border-l-4 border-[#2563EB] px-6 py-2.5 shadow-2xl">
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

      {/* Professional CTA Section */}
      <section className="py-24 relative bg-slate-950">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            whileInView={{ opacity: 1, scale: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden"
          >
            {/* Background Image for CTA */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" 
                alt="Networking Background" 
                className="w-full h-full object-cover opacity-[0.15] mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-900/90"></div>
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 opacity-80 z-10"></div>
            
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-sm"
              >
                <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">Join the Network</span>
              </motion.div>

            <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
              Ready to Boost Your <br className="hidden md:block" />Career and Income?
            </h2>
            
            <p className="text-slate-400 text-lg font-normal max-w-2xl mx-auto mb-10">
              Connect with top businesses, build a standout portfolio, and start earning on your own terms while completing your studies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button 
                onClick={() => setIsRegisterModalOpen(true)} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 text-white text-base md:text-lg font-bold px-10 py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all duration-300 flex items-center gap-2"
              >
                Register Now <ArrowRight size={18} />
              </motion.button>
              
              <motion.button 
                onClick={() => navigate('/login')} 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 backdrop-blur-sm border border-slate-700 text-base md:text-lg font-semibold px-8 py-4 rounded-xl transition-colors duration-300"
              >
                Sign In
              </motion.button>
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Luxury Light Footer */}
      <footer className="bg-sky-50 border-t border-sky-100 pt-20 pb-10 relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-sky-100 flex items-center justify-center">
                  <img src={logo} alt="GigConnect Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-2xl font-heading font-black text-slate-900 tracking-tight">GigConnect</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm font-light">
                Empowering university students to build their careers, gain real-world experience, and connect with top businesses.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-slate-900 font-black mb-6 tracking-wide">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-light">
                <li><a href="#home" className="hover:text-sky-600 transition-colors">Home</a></li>
                <li><a href="#about" className="hover:text-sky-600 transition-colors">Our Heritage</a></li>
                <li><a href="#how-it-works" className="hover:text-sky-600 transition-colors">Community</a></li>
                <li><a href="#jobs" className="hover:text-sky-600 transition-colors">Opportunities</a></li>
              </ul>
            </div>
            
            {/* Legal / Contact */}
            <div>
              <h4 className="text-slate-900 font-black mb-6 tracking-wide">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-light">
                <li><a href="#" className="hover:text-sky-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-sky-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-sky-600 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-sky-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-light">
              &copy; {new Date().getFullYear()} GigConnect. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 font-light">
              Built with <span className="text-rose-500">❤️</span> for Uva Wellassa University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
