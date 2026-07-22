import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Trophy, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Award,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  QrCode,
  Lock,
  Tv,
  Check,
  Search
} from 'lucide-react';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  
  // Section 4 States (Join Tabs)
  const [joinTab, setJoinTab] = useState('code'); // 'code', 'qr', 'login'
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Section 9 States (Verification)
  const [certId, setCertId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  
  // Section 10 States (FAQ Accordion)
  const [activeFaq, setActiveFaq] = useState(null);

  const handleQuickJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode) {
      setJoinError('Please enter a join code.');
      return;
    }
    if (joinCode.length !== 6) {
      setJoinError('Code must be exactly 6 characters.');
      return;
    }
    navigate(`/join/${joinCode.toUpperCase()}`);
  };

  const handleVerifyCertificate = (e) => {
    e.preventDefault();
    if (!certId) {
      setVerificationResult({ success: false, message: 'Please enter a certificate ID.' });
      return;
    }
    // Simple mock verification response
    if (certId.toUpperCase().startsWith('MSC-') && certId.length >= 8) {
      setVerificationResult({
        success: true,
        message: 'Certificate Verified!',
        recipient: 'Harry Potter',
        event: 'Cloud Study Jam Quiz',
        date: 'July 17, 2026'
      });
    } else {
      setVerificationResult({
        success: false,
        message: 'Certificate ID not found. Ensure it starts with "MSC-" (e.g. MSC-1029).'
      });
    }
  };

  const scrollSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const upcomingQuizzes = [
    {
      event: 'Google Cloud Study Jam',
      quiz: 'Cloud Fundamentals Challenge',
      date: 'July 24, 2026',
      time: '3:00 PM IST',
      duration: '20 mins',
      status: 'Open',
      day: '24',
      month: 'JUL',
      registrations: '142',
      color: 'blue'
    },
    {
      event: 'React Developer Bootcamp',
      quiz: 'JSX and Hooks Mastery Trivia',
      date: 'July 29, 2026',
      time: '4:00 PM IST',
      duration: '30 mins',
      status: 'Open',
      day: '29',
      month: 'JUL',
      registrations: '98',
      color: 'indigo'
    }
  ];

  const features = [
    { title: 'Live Quiz', desc: 'Syncs questions instantly on all screens via WebSockets.', icon: Play, color: 'blue' },
    { title: 'Real-Time Leaderboard', desc: 'Rankings updates after every question based on speed and accuracy.', icon: Trophy, color: 'purple' },
    { title: 'Instant Results', desc: 'Detailed scorecards and analytics provided immediately upon completion.', icon: Award, color: 'amber' },
    { title: 'Digital Certificates', desc: 'Earn verified participation certificates immediately downloadable.', icon: ShieldCheck, color: 'emerald' },
    { title: 'Secure Participation', desc: 'Academic integrity protected via focus-loss trackers.', icon: Lock, color: 'red' }
  ];

  const faqs = [
    { q: 'How do I join?', a: 'Enter the 6-digit room code shared by the MC in the Join Quiz section above.' },
    { q: 'Do I need to register?', a: 'Yes, register using the upcoming events registration link or join with your student name and ID on the prompt.' },
    { q: 'What if my internet disconnects?', a: 'Our WebSocket protocol allows you to resume and join back immediately from the current question.' },
    { q: 'When are certificates issued?', a: 'Certificates are issued automatically and instantly once the quiz completes.' },
    { q: 'How are winners decided?', a: 'Winners are determined by correct answers and speed response times.' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF] relative overflow-hidden pb-12">
      
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_70%_50%_at_15%_15%,_rgba(37,99,235,0.06)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_45%_at_85%_85%,_rgba(139,92,246,0.04)_0%,_transparent_55%)]"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 space-y-20 sm:space-y-24 relative z-10 py-10 sm:py-16">

        {/* ════════ 1. HERO SECTION ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-full text-xs font-bold border border-brand-blue/15 shadow-sm">
              <Sparkles size={13} />
              <span>Microsoft Student Club (MSC)</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-brand-textMain tracking-tight leading-[1.1]">
              MSCPRPCEM <br/>Live Quiz Platform
            </h1>

            <p className="text-sm sm:text-base text-brand-textMuted leading-relaxed">
              Participate in live quizzes conducted during club events. Compete, learn, and earn certificates. Built for students, developers, and tech enthusiasts.
            </p>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => scrollSection('join-quiz')}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wide"
              >
                <span>Join Live Quiz</span>
                <Play size={13} fill="currentColor" />
              </button>
              <button 
                onClick={() => scrollSection('upcoming-quizzes')}
                className="flex items-center justify-center space-x-2 bg-white hover:bg-zinc-50 border border-brand-border text-brand-textMain font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wide"
              >
                <span>Upcoming Events</span>
                <Calendar size={13} />
              </button>
            </div>
          </div>

          <div id="join-quiz" className="lg:col-span-5 w-full text-left">
            <div className="bg-white border border-brand-border rounded-2xl shadow-soft relative overflow-hidden">
              {/* Tabs Header */}
              <div className="grid grid-cols-3 border-b border-brand-border bg-zinc-50">
                <button 
                  onClick={() => { setJoinTab('code'); setJoinError(''); }}
                  className={`py-2.5 sm:py-3 px-0.5 sm:px-1 text-center text-[9px] xs:text-[10px] sm:text-xs font-bold leading-tight transition-all border-b-2 ${joinTab === 'code' ? 'border-brand-blue text-brand-blue bg-white' : 'border-transparent text-brand-textMuted hover:text-brand-textMain'}`}
                >
                  Enter Join Code
                </button>
                <button 
                  onClick={() => { setJoinTab('qr'); setJoinError(''); }}
                  className={`py-2.5 sm:py-3 px-0.5 sm:px-1 text-center text-[9px] xs:text-[10px] sm:text-xs font-bold leading-tight transition-all border-b-2 ${joinTab === 'qr' ? 'border-brand-blue text-brand-blue bg-white' : 'border-transparent text-brand-textMuted hover:text-brand-textMain'}`}
                >
                  Scan QR Code
                </button>
                <button 
                  onClick={() => { setJoinTab('login'); setJoinError(''); }}
                  className={`py-2.5 sm:py-3 px-0.5 sm:px-1 text-center text-[9px] xs:text-[10px] sm:text-xs font-bold leading-tight transition-all border-b-2 ${joinTab === 'login' ? 'border-brand-blue text-brand-blue bg-white' : 'border-transparent text-brand-textMuted hover:text-brand-textMain'}`}
                >
                  Login and Join
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {joinError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold animate-fade-in">
                    {joinError}
                  </div>
                )}

                {joinTab === 'code' && (
                  <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="quizCode" className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
                        6-Digit Quiz Code
                      </label>
                      <input
                        id="quizCode"
                        type="text"
                        maxLength={6}
                        placeholder="ABC123"
                        value={joinCode}
                        onChange={(e) => {
                          setJoinCode(e.target.value.toUpperCase());
                          setJoinError('');
                        }}
                        className="block w-full border rounded-xl py-3.5 px-4 text-center font-black text-xl tracking-[0.35em] text-brand-textMain uppercase transition-all duration-200 placeholder:text-zinc-200 focus:bg-white focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/10 home-join-card-bg"
                      />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-sm">
                      Join
                    </button>
                  </form>
                )}

                {joinTab === 'qr' && (
                  <div className="text-center space-y-4">
                    <div className="w-40 h-40 mx-auto border-2 border-dashed border-zinc-300 rounded-2xl flex items-center justify-center bg-zinc-50 relative overflow-hidden group">
                      <QrCode size={48} className="text-zinc-400 animate-pulse" />
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-blue animate-[scan_2s_infinite]"></div>
                    </div>
                    <p className="text-xs text-brand-textMuted">Align the QR code provided by the MC inside the scan window.</p>
                  </div>
                )}

                {joinTab === 'login' && (
                  <div className="text-center space-y-4 py-3">
                    <p className="text-xs text-brand-textMuted">Are you pre-registered for the event? Login to access your active event lobby.</p>
                    <button 
                      onClick={() => navigate('/admin/login')}
                      className="flex items-center justify-center space-x-1.5 px-6 py-2.5 mx-auto bg-white border border-brand-border text-brand-blue hover:text-brand-dark hover:bg-zinc-50 font-bold rounded-xl shadow-sm transition-all active:scale-95 text-xs"
                    >
                      <span>Login Credentials</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
         {/* ════════ 2. LIVE STATUS BANNER ════════ */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-violet-50/30 border border-blue-200/50 rounded-2xl p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.05)] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-left group">
            {/* Left indicator accent */}
            <div className="absolute top-0 left-0 h-full w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.25)]"></div>
            
            {/* Subtle glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-all duration-500"></div>

            <div className="space-y-4 relative z-10 w-full md:w-auto">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200/60 px-3 py-1 rounded-full text-red-700">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider">Live Event Lobby</span>
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-brand-textMain tracking-tight leading-tight">
                  Cloud Study Jam Quiz
                </h3>
                <p className="text-xs text-brand-textMuted max-w-lg leading-relaxed">
                  Join the active session to test your Google Cloud knowledge, earn a rank on the live podium, and receive a participation certificate.
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-blue-100/50 text-xs text-brand-textMuted">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-brand-blue" />
                  <span>Started: <span className="text-brand-textMain font-bold">Just Now</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-brand-blue" />
                  <span>Duration: <span className="text-brand-textMain font-bold">20 Minutes</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-brand-blue" />
                  <span>Lobby Capacity: <span className="text-brand-blue font-extrabold animate-pulse">167 Joined</span></span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/join')}
              className="w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wider relative z-10 flex-shrink-0"
            >
              <span>Enter Lobby Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ════════ 3. UPCOMING QUIZZES ════════ */}
        <div id="upcoming-quizzes" className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Upcoming Quizzes</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Register for upcoming live events and prepare your knowledge.</p>
          </div>
          
          {upcomingQuizzes.length === 0 ? (
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-violet-50/30 border border-blue-200/50 rounded-2xl p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.05)] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-left group w-full">
              {/* Left indicator accent */}
              <div className="absolute top-0 left-0 h-full w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.25)]"></div>
              
              {/* Subtle glow accent */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-all duration-500"></div>

              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
                {/* SVG Event illustration */}
                <svg className="w-16 h-16 text-brand-blue/25 shrink-0" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Orbit Path */}
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" className="animate-[spin_40s_linear_infinite]" />
                  
                  {/* Calendar Graphic Board */}
                  <rect x="70" y="65" width="60" height="65" rx="8" fill="white" stroke="#3B82F6" strokeWidth="3" className="shadow-sm" />
                  <rect x="70" y="65" width="60" height="18" rx="2" fill="#3B82F6" />
                  <circle cx="85" cy="74" r="2.5" fill="white" />
                  <circle cx="115" cy="74" r="2.5" fill="white" />
                  
                  {/* Grid Lines inside Calendar */}
                  <line x1="80" y1="95" x2="120" y2="95" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="80" y1="108" x2="120" y2="108" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Clock / Hourglass element floating beside */}
                  <g className="animate-[bounce_2.5s_ease-in-out_infinite]">
                    <circle cx="135" cy="85" r="14" fill="white" stroke="#8B5CF6" strokeWidth="2" />
                    <path d="M131 80H139L135 85L131 80Z" fill="#8B5CF6" />
                    <path d="M131 90H139L135 85L131 90Z" fill="#8B5CF6" />
                  </g>
                </svg>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                    <span className="inline-flex items-center gap-1.5 bg-blue-100/60 border border-blue-200/50 px-3 py-1 rounded-full text-brand-blue">
                      <span className="text-[10px] font-black uppercase tracking-wider">Lobbies Cleared</span>
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-black text-brand-textMain tracking-tight leading-tight">
                      No Quizzes Scheduled Right Now
                    </h3>
                    <p className="text-xs text-brand-textMuted max-w-lg leading-relaxed">
                      We are currently curating new learning tracks and workshop challenges. Click Notify Me to get alerts immediately when slots open!
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const foot = document.querySelector('footer');
                  if (foot) foot.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wider relative z-10 flex-shrink-0"
              >
                <span>Notify Me</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingQuizzes.map((q, idx) => (
                <div key={idx} className="bg-white border border-brand-border rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col xs:flex-row overflow-hidden group">
                  
                  {/* Left Ticket Ribbon */}
                  <div className={`w-full xs:w-20 sm:w-24 py-3 xs:py-0 bg-gradient-to-br ${q.color === 'blue' ? 'from-blue-600 to-indigo-600' : 'from-indigo-600 to-purple-600'} flex flex-row xs:flex-col justify-center items-center gap-2 xs:gap-0 text-white shrink-0 border-b xs:border-b-0 xs:border-r border-dashed border-zinc-200/30 relative`}>
                    {/* Decorative Ticket Notches */}
                    <div className="hidden xs:block absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#F5FAFF] rounded-full border border-brand-border/60"></div>
                    <div className="hidden xs:block absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#F5FAFF] rounded-full border border-brand-border/60"></div>
                    
                    <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase opacity-85">{q.month}</span>
                    <span className="text-xl xs:text-2xl sm:text-3xl font-black xs:mt-1.5 leading-none">{q.day}</span>
                  </div>

                  {/* Right Content details */}
                  <div className="flex-grow p-5 sm:p-6 text-left flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-bold text-brand-blue uppercase bg-brand-lightBlue px-2.5 py-1 rounded-full border border-brand-blue/5 truncate max-w-[130px] sm:max-w-none">
                          {q.event}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded border border-zinc-200/50 uppercase whitespace-nowrap">
                          <User size={10} />
                          <span>{q.registrations} Registered</span>
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-black text-brand-textMain leading-snug group-hover:text-brand-blue transition-colors duration-250">
                          {q.quiz}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-textMuted pt-1 font-medium">
                          <span className="flex items-center gap-1"><Clock size={12} className="text-brand-blue" /> {q.duration}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} className="text-brand-blue" /> {q.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-brand-border pt-4 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded tracking-wide">
                        {q.status}
                      </span>
                      <button className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer text-[10px] uppercase tracking-wider">
                        <span>Register</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>



        {/* ════════ 5. PLATFORM FEATURES ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Platform Features</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">A simplified overview of key functionalities supporting our events.</p>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const configs = {
                blue: { grad: 'from-blue-500 to-indigo-500 shadow-blue-500/10', border: 'hover:border-blue-500/30', shadow: 'hover:shadow-[0_12px_24px_-4px_rgba(59,130,246,0.12)]', glow: 'bg-blue-400/10', dot: 'bg-blue-500' },
                purple: { grad: 'from-purple-500 to-violet-500 shadow-purple-500/10', border: 'hover:border-purple-500/30', shadow: 'hover:shadow-[0_12px_24px_-4px_rgba(139,92,246,0.12)]', glow: 'bg-purple-400/10', dot: 'bg-purple-500' },
                amber: { grad: 'from-amber-500 to-orange-500 shadow-amber-500/10', border: 'hover:border-amber-500/30', shadow: 'hover:shadow-[0_12px_24px_-4px_rgba(245,158,11,0.12)]', glow: 'bg-amber-400/10', dot: 'bg-amber-500' },
                emerald: { grad: 'from-emerald-500 to-teal-500 shadow-emerald-500/10', border: 'hover:border-emerald-500/30', shadow: 'hover:shadow-[0_12px_24px_-4px_rgba(16,185,129,0.12)]', glow: 'bg-emerald-400/10', dot: 'bg-emerald-500' },
                red: { grad: 'from-red-500 to-rose-500 shadow-red-500/10', border: 'hover:border-red-500/30', shadow: 'hover:shadow-[0_12px_24px_-4px_rgba(239,68,68,0.12)]', glow: 'bg-red-400/10', dot: 'bg-red-500' }
              };
              const c = configs[feat.color] || configs.blue;

              return (
                <div 
                  key={idx} 
                  className={`bg-white border border-brand-border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between text-left group relative overflow-hidden opacity-0 animate-fade-in ${c.border} ${c.shadow} hover:-translate-y-1`}
                  style={{ animationDelay: `${(idx + 1) * 80}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Hover glowing background ellipse */}
                  <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${c.glow}`}></div>
                  
                  {/* Floating pulse dot in top right */}
                  <div className="absolute top-4 right-4 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.dot}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`}></span>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className={`w-11 h-11 bg-gradient-to-br ${c.grad} text-white rounded-xl flex items-center justify-center shadow-md shadow-zinc-200/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <Icon size={18} className="stroke-[2.5]" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-brand-textMain leading-tight">{feat.title}</h4>
                      <p className="text-xs text-brand-textMuted leading-relaxed font-medium pr-1">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════ 6. HOW IT WORKS ════════ */}
        <div className="space-y-12 text-left relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">How It Works</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Follow these 4 simple steps to participate and validate your success.</p>
          </div>

          <div className="relative">
            {/* Background connection line */}
            <div className="hidden md:block absolute top-[44px] left-10 right-10 h-[2px] bg-gradient-to-r from-blue-200 via-indigo-200 to-emerald-200 pointer-events-none z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              {[
                { num: '01', title: 'Register for Event', desc: 'Secure your seat for the active workshop or tournament on the official MSC-PRPCEM portal to receive check-in access.', icon: Calendar, color: 'text-blue-500 bg-blue-50/50 border-blue-100' },
                { num: '02', title: 'Join Quiz Lobby', desc: 'Access the console, enter the 6-digit lobby code, and check in with your registered student credentials.', icon: Play, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100' },
                { num: '03', title: 'Answer Live Questions', desc: 'Tackle synchronous multi-choice questions in real-time. Speed and accuracy maximize your score weights!', icon: Zap, color: 'text-amber-500 bg-amber-50/50 border-amber-100' },
                { num: '04', title: 'Claim Verified Badge', desc: 'Review final leaderboard podium places and instantly download your authenticated SVG participation certificate.', icon: Award, color: 'text-emerald-500 bg-emerald-50/50 border-emerald-100' }
              ].map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-brand-border rounded-2xl p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:border-brand-blue/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group opacity-0 animate-fade-in"
                    style={{ animationDelay: `${(idx + 1) * 120}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Big background number watermark */}
                    <span className="text-7xl font-black text-zinc-100/50 absolute -bottom-2 -right-1 pointer-events-none select-none group-hover:text-brand-blue/5 group-hover:-translate-y-1 transition-all duration-300">
                      {step.num}
                    </span>

                    <div className="space-y-6 relative z-10">
                      {/* Step Indicator Header */}
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.color} shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <IconComponent size={20} className="stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 rounded">
                          Step {step.num}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs sm:text-sm font-black text-brand-textMain uppercase tracking-wider">{step.title}</h4>
                        <p className="text-xs text-brand-textMuted leading-relaxed pr-2 font-medium">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════ 7. LEADERBOARD PREVIEW (OPTIONAL) ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Top Performers</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Recognizing top scoring members from our recent events.</p>
          </div>

          <div className="leaderboard-grid-wrapper">
            
            {/* Top 3 Performers */}
            <div className="leaderboard-top3-container">
              
              {/* 2nd Place (Silver) */}
              <div className="medalist-card medalist-card-silver order-2 sm:order-1">
                <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-slate-200 shadow-sm mb-3">Overall #2</span>
                <div className="flex flex-col items-center space-y-3.5">
                  <div className="medalist-avatar-silver">
                    <div className="medalist-avatar-inner">BJ</div>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">Bob Johnson</h4>
                    <p className="text-[9px] font-semibold text-zinc-400">PRPCEM</p>
                  </div>
                </div>
                <span className="score-capsule score-capsule-silver">2,750 pts</span>
              </div>

              {/* 1st Place (Gold) */}
              <div className="medalist-card medalist-card-gold order-1 sm:order-2">
                <span className="inline-flex items-center justify-center bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm mb-3">👑 Overall #1</span>
                <div className="flex flex-col items-center space-y-3.5">
                  <div className="medalist-avatar-gold">
                    <div className="medalist-avatar-inner medalist-avatar-inner-gold">AS</div>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">Alice Smith</h4>
                    <p className="text-[9px] font-semibold text-zinc-400">PRPCEM</p>
                  </div>
                </div>
                <span className="score-capsule score-capsule-gold">2,890 pts</span>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="medalist-card medalist-card-bronze order-3 sm:order-3">
                <span className="inline-flex items-center justify-center bg-orange-50 text-orange-850 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-orange-200 shadow-sm mb-3">Overall #3</span>
                <div className="flex flex-col items-center space-y-3.5">
                  <div className="medalist-avatar-bronze">
                    <div className="medalist-avatar-inner medalist-avatar-inner-bronze">CL</div>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">Charlie Lee</h4>
                    <p className="text-[9px] font-semibold text-zinc-400">PRPCEM</p>
                  </div>
                </div>
                <span className="score-capsule score-capsule-bronze">2,640 pts</span>
              </div>

            </div>

            {/* Other Ranks List - Col Span 4 */}
            <div className="leaderboard-runnerups-container">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Runner Ups</h4>
                <div className="space-y-3">
                  {[
                    { rank: 4, name: 'Diana Prince', score: '2,510 pts', initials: 'DP' },
                    { rank: 5, name: 'Evan Wright', score: '2,430 pts', initials: 'EW' }
                  ].map((player, idx) => (
                    <div key={idx} className="leaderboard-runnerup-row group">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-black text-[10px] group-hover:bg-brand-blue group-hover:text-white transition-colors duration-200">
                          {player.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black text-[10px] group-hover:scale-105 transition-transform duration-200">
                          {player.initials}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs text-brand-textMain leading-tight">{player.name}</p>
                          <p className="text-[9px] text-brand-textMuted mt-0.5">PRPCEM Campus</p>
                        </div>
                      </div>
                      <span className="font-black text-xs text-brand-blue bg-brand-lightBlue px-2.5 py-1 rounded-full border border-brand-blue/10">{player.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-zinc-400 font-medium pl-1 border-t border-zinc-100/80 pt-3 mt-4">
                Scores compiled from verified lobby check-ins.
              </div>
            </div>

          </div>
        </div>

        {/* ════════ 8. RECENT EVENTS ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Recent Events</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Summary of successfully completed quiz challenges.</p>
          </div>

          <div className="recent-events-grid">
            {[
              { title: 'Git & GitHub Workshop', date: 'July 10, 2026', winner: 'Charlie Lee', players: 120 },
              { title: 'Web Development Basics', date: 'July 05, 2026', winner: 'Alice Smith', players: 95 }
            ].map((event, idx) => (
              <div key={idx} className="recent-event-card">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{event.date}</span>
                  <h4 className="text-sm font-bold text-brand-textMain">{event.title}</h4>
                  <div className="flex gap-4 text-[11px] text-brand-textMuted mt-1">
                    <span>🏆 Winner: <span className="font-bold text-brand-textMain">{event.winner}</span></span>
                    <span>👥 Participants: <span className="font-bold text-brand-textMain">{event.players}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                  <Check size={11} className="stroke-[3]" />
                  <span>Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════ 9. CERTIFICATE VERIFICATION ════════ */}
        <div className="max-w-md mx-auto w-full text-left space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Verify Certificate</h2>
            <p className="text-brand-textMuted text-xs">Enter your certificate validation code below to confirm authenticity.</p>
          </div>

          <div className="verify-cert-card">
            <form onSubmit={handleVerifyCertificate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="certIdInput" className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
                  Certificate ID
                </label>
                <div className="relative">
                  <input
                    id="certIdInput"
                    type="text"
                    placeholder="MSC-12345"
                    value={certId}
                    onChange={(e) => {
                      setCertId(e.target.value);
                      setVerificationResult(null);
                    }}
                    className="verify-cert-input"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>
              <button type="submit" className="verify-cert-btn">
                Verify
              </button>
            </form>

            {verificationResult && (
              <div className={verificationResult.success ? 'verify-result-success' : 'verify-result-error'}>
                <div className="flex gap-2 items-start">
                  {verificationResult.success ? <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" /> : <AlertCircle size={15} className="text-red-500 flex-shrink-0" />}
                  <div>
                    <p className="font-bold">{verificationResult.message}</p>
                    {verificationResult.success && (
                      <ul className="list-disc pl-4 mt-2 space-y-1 font-medium text-emerald-700">
                        <li>Recipient: {verificationResult.recipient}</li>
                        <li>Event: {verificationResult.event}</li>
                        <li>Date Issued: {verificationResult.date}</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════ 10. FAQ SECTION ════════ */}
        <div className="max-w-2xl mx-auto w-full text-left space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">FAQ</h2>
            <p className="text-brand-textMuted text-xs">Common questions about joining events and earning credentials.</p>
          </div>

          <div className="faq-list-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-accordion-item ${activeFaq === idx ? 'faq-accordion-item-active' : ''}`}>
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="faq-question-btn"
                >
                  <div className="flex items-center">
                    <span className="faq-badge-q">Q</span>
                    <span className="faq-question-text">{faq.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180 text-brand-blue' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="faq-answer-panel">
                    <div className="flex items-start">
                      <span className="faq-badge-a">A</span>
                      <p className="flex-1 mt-0.5">{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>



      </div>
    </div>
  );
}
