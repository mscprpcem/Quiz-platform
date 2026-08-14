import React, { useState, useEffect } from 'react';
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
import api from '../services/api';
import QRScanner from '../components/QRScanner';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  
  // Section 4 States (Join Tabs)
  const [joinTab, setJoinTab] = useState('code'); // 'code', 'qr', 'login'
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  
  // Dynamic Data States (Fetched from backend)
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Section 10 States (FAQ Accordion)
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingData(true);
        const [quizzesRes, scheduledRes, leaderboardRes] = await Promise.all([
          api.get('/api/quizzes/public').catch(() => ({ data: [] })),
          api.get('/api/scheduled-quizzes/public/all').catch(() => ({ data: [] })),
          api.get('/api/analytics/public/leaderboard').catch(() => ({ data: { leaderboard: [], recentEvents: [] } }))
        ]);

        const now = new Date();
        const allPublicQuizzes = [];

        // 1. Filter Live/Standard Quizzes (Only upcoming or actively running)
        if (Array.isArray(quizzesRes?.data)) {
          quizzesRes.data.forEach((q) => {
            if (!q) return;
            const eTime = q.scheduled_end ? new Date(q.scheduled_end) : null;
            const isEnded = (eTime && now > eTime) || q.status === 'completed' || q.status === 'expired';
            if (!isEnded) {
              allPublicQuizzes.push(q);
            }
          });
        }

        // 2. Filter Scheduled Quizzes (Only upcoming or actively in progress occurrences)
        if (Array.isArray(scheduledRes?.data)) {
          scheduledRes.data.forEach(sQuiz => {
            if (!sQuiz) return;
            const eTime = sQuiz.endTime || sQuiz.scheduled_end ? new Date(sQuiz.endTime || sQuiz.scheduled_end) : null;
            const isEnded = (eTime && now > eTime) || sQuiz.availability === 'COMPLETED' || sQuiz.availability === 'EXPIRED' || sQuiz.status === 'completed' || sQuiz.status === 'expired';

            // Only display in Upcoming section if not ended
            if (!isEnded && !allPublicQuizzes.some(q => q.id === sQuiz.quizId || q.id === sQuiz.occurrenceId)) {
              allPublicQuizzes.push({
                ...sQuiz,
                id: sQuiz.occurrenceId || sQuiz.quizId,
                mode: 'SCHEDULED',
                status: sQuiz.availability === 'ACTIVE' ? 'in_progress' : 'draft',
                subject: sQuiz.category
              });
            }
          });
        }

        // Sort by closest start time first
        allPublicQuizzes.sort((a, b) => {
          const aStart = new Date(a.scheduled_start || a.startTime || a.createdAt || 0);
          const bStart = new Date(b.scheduled_start || b.startTime || b.createdAt || 0);
          return aStart - bStart;
        });

        setUpcomingQuizzes(allPublicQuizzes);

        if (leaderboardRes?.data) {
          setLeaderboard(Array.isArray(leaderboardRes.data.leaderboard) ? leaderboardRes.data.leaderboard : []);
          setRecentEvents(Array.isArray(leaderboardRes.data.recentEvents) ? leaderboardRes.data.recentEvents : []);
        }
      } catch (err) {
        console.error('Fetch homepage data error:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchHomeData();
  }, []);

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

  const scrollSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const features = [
    { title: 'Interactive Live Quiz', desc: 'Syncs questions instantly on all participant screens via WebSockets.', icon: Play, color: 'blue' },
    { title: 'Scheduled Quizzes', desc: 'Time-window availability, recurring slots, and independent attempts.', icon: Calendar, color: 'emerald' },
    { title: 'Real-Time Leaderboards', desc: 'Rankings update dynamically after every question based on speed & accuracy.', icon: Trophy, color: 'purple' },
    { title: 'Instant Analytics', desc: 'Detailed scorecards and question breakdown analytics provided immediately.', icon: Award, color: 'amber' },
    { title: 'Proctoring & Anti-Cheat', desc: 'Academic integrity protected via focus-loss & tab-switch violation trackers.', icon: Lock, color: 'red' }
  ];

  const faqs = [
    { q: 'How do I join?', a: 'Enter the 6-digit room code shared by the MC in the Join Quiz section above.' },
    { q: 'Do I need to register?', a: 'Yes, register using the upcoming events registration link or join with your student name and ID on the prompt.' },
    { q: 'What if my internet disconnects?', a: 'Our WebSocket protocol allows you to resume and join back immediately from the current question.' },
    { q: 'How are winners decided?', a: 'Winners are determined by correct answers and speed response times.' }
  ];

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF] relative overflow-hidden pb-12">
      
      {/* Background ambient mesh glow circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-400/15 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[140px]"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 space-y-20 sm:space-y-24 relative z-10 py-10 sm:py-16">

        {/* ════════ 1. HERO SECTION ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 hero-vibrant-badge text-brand-blue px-4 py-2 rounded-full text-xs font-extrabold shadow-sm">
              <Sparkles size={14} className="text-brand-blue animate-pulse" />
              <span>Campus Interactive Learning & Events</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-textMain tracking-tight leading-[1.15]">
              Microsoft Student Club PRPCEM <br/>
              <span className="text-brand-blue bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent">
                Quiz Platform
              </span>
            </h1>

            <p className="text-sm sm:text-base text-brand-textMuted leading-relaxed">
              Participate in quizzes conducted during club events. Compete, learn, and excel. Built for students, developers, and tech enthusiasts.
            </p>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => scrollSection('join-quiz')}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wide"
              >
                <span>Join Quiz</span>
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
              <div className="grid grid-cols-2 border-b border-brand-border bg-zinc-50">
                <button 
                  onClick={() => { setJoinTab('code'); setJoinError(''); }}
                  className={`py-2.5 sm:py-3 px-1 text-center text-xs font-bold leading-tight transition-all border-b-2 ${joinTab === 'code' ? 'border-brand-blue text-brand-blue bg-white' : 'border-transparent text-brand-textMuted hover:text-brand-textMain'}`}
                >
                  Enter Join Code
                </button>
                <button 
                  onClick={() => { setJoinTab('qr'); setJoinError(''); }}
                  className={`py-2.5 sm:py-3 px-1 text-center text-xs font-bold leading-tight transition-all border-b-2 ${joinTab === 'qr' ? 'border-brand-blue text-brand-blue bg-white' : 'border-transparent text-brand-textMuted hover:text-brand-textMain'}`}
                >
                  Scan QR Code
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
                  <div className="py-2">
                    <QRScanner onScanSuccess={(scannedCode) => navigate(`/join/${scannedCode}`)} />
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

        {/* ════════ 3. UPCOMING QUIZZES ════════ */}
        <div id="upcoming-quizzes" className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Upcoming Quizzes</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Register for upcoming live events and prepare your knowledge.</p>
          </div>
          
          {upcomingQuizzes.length === 0 ? (
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-violet-50/30 border border-blue-200/50 rounded-2xl p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.05)] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-left group w-full">
              <div className="absolute top-0 left-0 h-full w-[4px] bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.25)]"></div>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/10 transition-all duration-500"></div>

              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
                <svg className="w-16 h-16 text-brand-blue/25 shrink-0" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 6" className="animate-[spin_40s_linear_infinite]" />
                  <rect x="70" y="65" width="60" height="65" rx="8" fill="white" stroke="#3B82F6" strokeWidth="3" className="shadow-sm" />
                  <rect x="70" y="65" width="60" height="18" rx="2" fill="#3B82F6" />
                  <circle cx="85" cy="74" r="2.5" fill="white" />
                  <circle cx="115" cy="74" r="2.5" fill="white" />
                  <line x1="80" y1="95" x2="120" y2="95" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="80" y1="108" x2="120" y2="108" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
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
              {upcomingQuizzes.map((q) => {
                if (!q) return null;
                const startDate = q.scheduled_start || q.startTime ? new Date(q.scheduled_start || q.startTime) : new Date(q.createdAt || Date.now());
                const endDate = q.scheduled_end || q.endTime ? new Date(q.scheduled_end || q.endTime) : null;
                const day = isNaN(startDate.getTime()) ? '15' : startDate.getDate();
                const month = isNaN(startDate.getTime()) ? 'AUG' : startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const startTimeStr = isNaN(startDate.getTime()) ? '10:00 AM' : startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = endDate && !isNaN(endDate.getTime()) ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                const qSlug = q.slug || (q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : q.join_code);

                return (
                  <div key={q.id || Math.random()} className="bg-white border border-brand-border rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col xs:flex-row overflow-hidden group">
                    
                    <div className="w-full xs:w-20 sm:w-24 py-3 xs:py-0 bg-gradient-to-br from-blue-600 to-indigo-600 flex flex-row xs:flex-col justify-center items-center gap-2 xs:gap-0 text-white shrink-0 border-b xs:border-b-0 xs:border-r border-dashed border-zinc-200/30 relative">
                      <div className="hidden xs:block absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#F5FAFF] rounded-full border border-brand-border/60"></div>
                      <div className="hidden xs:block absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#F5FAFF] rounded-full border border-brand-border/60"></div>
                      
                      <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase opacity-85">{month}</span>
                      <span className="text-xl xs:text-2xl sm:text-3xl font-black xs:mt-1.5 leading-none">{day}</span>
                    </div>

                    <div className="flex-grow p-5 sm:p-6 text-left flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-brand-blue uppercase bg-brand-lightBlue px-2.5 py-1 rounded-full border border-brand-blue/5 truncate max-w-[130px] sm:max-w-none">
                              {q.event_name || 'MSC Event'}
                            </span>
                            <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              {q.subject || 'Technical'}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded border border-zinc-200/50 uppercase whitespace-nowrap">
                            <User size={10} />
                            <span>{q.participantCount || 0} Joined</span>
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-black text-brand-textMain leading-snug group-hover:text-brand-blue transition-colors duration-250">
                            {q.title || 'Live Quiz Challenge'}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-textMuted pt-1 font-medium">
                            <span className="flex items-center gap-1"><BookOpen size={12} className="text-brand-blue" /> {q.questionCount || 0} Questions</span>
                            <span className="flex items-center gap-1 text-slate-700 font-bold"><Calendar size={12} className="text-brand-blue" /> Start: {startTimeStr}</span>
                            {endTimeStr && (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold"><Clock size={12} /> End: {endTimeStr}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-brand-border pt-4 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded tracking-wide">
                          {q.status === 'in_progress' ? 'Live Now' : q.status === 'waiting_lobby' ? 'Lobby Open' : 'Scheduled'}
                        </span>
                        <button
                          onClick={() => navigate(q.mode === 'SCHEDULED' || q.occurrenceId ? `/q/${q.custom_slug || q.slug || qSlug}` : `/join/${q.join_code}`)}
                          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer text-[10px] uppercase tracking-wider"
                        >
                          <span>Join Quiz</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════ 5. PLATFORM FEATURES ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Platform Features</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">A simplified overview of key functionalities supporting our events.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const configs = {
                blue: { iconClass: 'icon-grad-blue', dot: 'bg-blue-500' },
                purple: { iconClass: 'icon-grad-purple', dot: 'bg-purple-500' },
                amber: { iconClass: 'icon-grad-amber', dot: 'bg-amber-500' },
                emerald: { iconClass: 'icon-grad-emerald', dot: 'bg-emerald-500' },
                red: { iconClass: 'icon-grad-red', dot: 'bg-red-500' }
              };
              const c = configs[feat.color] || configs.blue;

              return (
                <div 
                  key={idx} 
                  className="feature-card-glow rounded-2xl p-5 flex flex-col justify-between h-full min-h-[170px] text-left group relative overflow-hidden opacity-0 animate-fade-in shadow-2xs"
                  style={{ animationDelay: `${(idx + 1) * 80}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="absolute top-4 right-4 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.dot}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`}></span>
                  </div>

                  <div className="space-y-4 relative z-10 flex flex-col justify-between h-full">
                    <div className={`w-11 h-11 ${c.iconClass} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <Icon size={19} className="stroke-[2.5]" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-brand-textMain leading-tight">{feat.title}</h4>
                      <p className="text-xs text-brand-textMuted leading-relaxed font-medium">{feat.desc}</p>
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
            <div className="hidden md:block absolute top-[44px] left-10 right-10 h-[2px] bg-gradient-to-r from-blue-200 via-indigo-200 to-emerald-200 pointer-events-none z-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              {[
                { num: '01', title: 'Register for Event', desc: 'Secure your seat for the active workshop or tournament on the official MSC-PRPCEM portal to receive check-in access.', icon: Calendar, color: 'text-blue-500 bg-blue-50/50 border-blue-100' },
                { num: '02', title: 'Join Quiz Lobby', desc: 'Access the console, enter the 6-digit lobby code, and check in with your registered student credentials.', icon: Play, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100' },
                { num: '03', title: 'Answer Questions', desc: 'Tackle synchronous multi-choice questions in real-time. Speed and accuracy maximize your score weights!', icon: Zap, color: 'text-amber-500 bg-amber-50/50 border-amber-100' },
                { num: '04', title: 'Review Leaderboard', desc: 'Review final leaderboard podium places and celebration rankings.', icon: Award, color: 'text-emerald-500 bg-emerald-50/50 border-emerald-100' }
              ].map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-brand-border rounded-2xl p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:border-brand-blue/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group opacity-0 animate-fade-in"
                    style={{ animationDelay: `${(idx + 1) * 120}ms`, animationFillMode: 'forwards' }}
                  >
                    <span className="text-7xl font-black text-zinc-100/50 absolute -bottom-2 -right-1 pointer-events-none select-none group-hover:text-brand-blue/5 group-hover:-translate-y-1 transition-all duration-300">
                      {step.num}
                    </span>

                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.color} shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <IconComponent size={20} className="stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 border border-zinc-100 px-2.5 py-0.5 rounded">
                          Step {step.num}
                        </span>
                      </div>

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

        {/* ════════ 7. LEADERBOARD PREVIEW ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Top Performers</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Recognizing top scoring members from completed club events.</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="bg-white border border-brand-border rounded-2xl p-8 sm:p-10 text-center space-y-3 shadow-soft">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto border border-purple-100 shadow-sm">
                <Trophy size={28} />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-brand-textMain">No Leaderboard Standings Yet</h3>
              <p className="text-xs sm:text-sm text-brand-textMuted max-w-md mx-auto leading-relaxed">
                Leaderboard rankings are updated dynamically when live quiz sessions complete. Be the first to participate and claim the #1 spot!
              </p>
            </div>
          ) : (
            <div className="leaderboard-grid-wrapper">
              
              {/* Top Performers */}
              <div className="leaderboard-top3-container">
                
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div className="medalist-card medalist-card-silver order-2 sm:order-1">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-slate-200 shadow-sm mb-3">Overall #2</span>
                    <div className="flex flex-col items-center space-y-3.5">
                      <div className="medalist-avatar-silver">
                        <div className="medalist-avatar-inner">{getInitials(leaderboard[1].name)}</div>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">{leaderboard[1].name || 'Participant'}</h4>
                        <p className="text-[9px] font-semibold text-zinc-400">{leaderboard[1].college || 'MSC Member'}</p>
                      </div>
                    </div>
                    <span className="score-capsule score-capsule-silver">{leaderboard[1].score || 0} pts</span>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="medalist-card medalist-card-gold order-1 sm:order-2">
                    <span className="inline-flex items-center justify-center bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm mb-3">👑 Overall #1</span>
                    <div className="flex flex-col items-center space-y-3.5">
                      <div className="medalist-avatar-gold">
                        <div className="medalist-avatar-inner medalist-avatar-inner-gold">{getInitials(leaderboard[0].name)}</div>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">{leaderboard[0].name || 'Participant'}</h4>
                        <p className="text-[9px] font-semibold text-zinc-400">{leaderboard[0].college || 'MSC Member'}</p>
                      </div>
                    </div>
                    <span className="score-capsule score-capsule-gold">{leaderboard[0].score || 0} pts</span>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div className="medalist-card medalist-card-bronze order-3 sm:order-3">
                    <span className="inline-flex items-center justify-center bg-orange-50 text-orange-850 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-orange-200 shadow-sm mb-3">Overall #3</span>
                    <div className="flex flex-col items-center space-y-3.5">
                      <div className="medalist-avatar-bronze">
                        <div className="medalist-avatar-inner medalist-avatar-inner-bronze">{getInitials(leaderboard[2].name)}</div>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <h4 className="font-extrabold text-zinc-800 text-xs sm:text-sm truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">{leaderboard[2].name || 'Participant'}</h4>
                        <p className="text-[9px] font-semibold text-zinc-400">{leaderboard[2].college || 'MSC Member'}</p>
                      </div>
                    </div>
                    <span className="score-capsule score-capsule-bronze">{leaderboard[2].score || 0} pts</span>
                  </div>
                )}

              </div>

              {/* Runner Ups */}
              {leaderboard.length > 3 && (
                <div className="leaderboard-runnerups-container">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Runner Ups</h4>
                    <div className="space-y-3">
                      {leaderboard.slice(3, 5).map((player, idx) => {
                        if (!player) return null;
                        return (
                          <div key={idx} className="leaderboard-runnerup-row group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-black text-[10px] group-hover:bg-brand-blue group-hover:text-white transition-colors duration-200">
                                {idx + 4}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black text-[10px] group-hover:scale-105 transition-transform duration-200">
                                {getInitials(player.name)}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-xs text-brand-textMain leading-tight">{player.name || 'Participant'}</p>
                                <p className="text-[9px] text-brand-textMuted mt-0.5">{player.college || 'MSC Member'}</p>
                              </div>
                            </div>
                            <span className="font-black text-xs text-brand-blue bg-brand-lightBlue px-2.5 py-1 rounded-full border border-brand-blue/10">{player.score || 0} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ════════ 8. RECENT EVENTS ════════ */}
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-textMain tracking-tight">Recent Events</h2>
            <p className="text-brand-textMuted text-xs sm:text-sm">Summary of successfully completed quiz challenges.</p>
          </div>

          {recentEvents.length === 0 ? (
            <div className="bg-white border border-brand-border rounded-2xl p-8 sm:p-10 text-center space-y-3 shadow-soft">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                <Calendar size={28} />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-brand-textMain">No Recent Events Recorded</h3>
              <p className="text-xs sm:text-sm text-brand-textMuted max-w-md mx-auto leading-relaxed">
                Summaries of completed workshops and quiz challenges will be recorded here automatically once sessions end.
              </p>
            </div>
          ) : (
            <div className="recent-events-grid">
              {recentEvents.map((event, idx) => {
                if (!event) return null;
                const eventDate = event.date ? new Date(event.date) : new Date();
                const dateStr = isNaN(eventDate.getTime()) ? 'Recently Completed' : eventDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={idx} className="recent-event-card">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{dateStr}</span>
                      <h4 className="text-sm font-bold text-brand-textMain">{event.title || 'Completed Event'}</h4>
                      <div className="flex gap-4 text-[11px] text-brand-textMuted mt-1">
                        <span>👥 Participants: <span className="font-bold text-brand-textMain">{event.players || 0}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                      <Check size={11} className="stroke-[3]" />
                      <span>Completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
