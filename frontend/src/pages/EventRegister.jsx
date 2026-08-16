import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, MapPin, Users, Sparkles, CheckCircle2,
  AlertTriangle, ArrowRight, Share2, Tag, BookOpen, ShieldCheck,
  Check, Copy, ExternalLink, Timer, Lock, ArrowLeft, Loader2, Award
} from 'lucide-react';

export default function EventRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { studentAccount } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: 'PRPCEM Amravati',
    branch: 'Computer Science & Engineering',
    yearOfStudy: '3rd Year',
    rollNo: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(null);
  const [formError, setFormError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  // Auto-fill student details if logged in
  useEffect(() => {
    if (studentAccount) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || studentAccount.name || '',
        email: prev.email || studentAccount.email || '',
        college: prev.college || studentAccount.college || 'PRPCEM Amravati',
        branch: prev.branch || studentAccount.branch || 'Computer Science & Engineering'
      }));
    }
  }, [studentAccount]);

  // Fetch Event Details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/events/details/${slug}`);
        if (res.data?.success && res.data.event) {
          setEvent(res.data.event);
        } else {
          setError('Event not found.');
        }
      } catch (err) {
        console.error('Failed to load event:', err);
        setError(err.response?.data?.error || `Could not find event "${slug}".`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventDetails();
    }
  }, [slug]);

  // Countdown timer to registration deadline
  useEffect(() => {
    if (!event) return;

    const targetDate = event.registration_end_date
      ? new Date(event.registration_end_date)
      : event.start_date
      ? new Date(event.start_date)
      : null;

    if (!targetDate || isNaN(targetDate.getTime())) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/api/events/register', {
        eventId: event?.id || slug,
        eventName: event?.name || slug,
        slug: slug,
        ...formData
      });

      if (res.data?.success) {
        setRegisteredSuccess(res.data);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setFormError(err.response?.data?.error || err.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-segoe">
        <Loader2 size={36} className="text-purple-600 animate-spin mb-3" />
        <h2 className="text-base font-bold text-slate-800">Loading Event Details...</h2>
        <p className="text-xs text-slate-400">Fetching event schedule and registration information</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-segoe">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">{error || `We couldn't find an event for "${slug}".`}</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isRegistrationClosed = !event.is_registration_open || event.is_registration_ended || timeLeft.isExpired;

  return (
    <div className="min-h-screen bg-slate-50 font-segoe py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8 animate-fade-in">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-purple-600 font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Portal</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-purple-700 hover:border-purple-200 font-bold shadow-2xs transition-all cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Event'}</span>
          </button>
        </div>

        {/* Hero Event Banner Card */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left / Top: Event Poster */}
          <div className="lg:col-span-5 relative bg-slate-950 min-h-[200px] sm:min-h-[260px] lg:min-h-[380px] overflow-hidden group">
            <img
              src={event.poster_url}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            
            {/* Mode & Category Tags */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm">
                {event.category || 'Official Event'}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs">
                {event.mode || 'Hybrid'}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
              <div className="text-[10px] sm:text-[11px] font-bold opacity-80 uppercase tracking-widest">Organized by</div>
              <div className="text-xs sm:text-sm font-black truncate">Microsoft Student Club PRPCEM</div>
            </div>
          </div>

          {/* Right: Event Summary & Highlights */}
          <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  <Sparkles size={13} />
                  <span>Verified Club Event</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 sm:px-3 py-1 rounded-full">
                  Entry: {event.fee || 'Free'}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {event.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {event.description || `Official technical challenges, keynote sessions, and live quizzes for ${event.name}.`}
              </p>

              {/* Event Timing & Venue Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                  <Calendar size={17} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Schedule</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {event.start_date
                        ? new Date(event.start_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Date Coming Soon'}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2.5">
                  <MapPin size={17} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venue / Platform</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate max-w-[200px]">
                      {event.venue || 'PRPCEM Amravati Campus'}
                    </div>
                  </div>
                </div>
              </div>

              {event.rewards && (
                <div className="p-2.5 sm:p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
                  <Award size={17} className="text-amber-600 shrink-0" />
                  <span className="font-bold">Rewards: {event.rewards}</span>
                </div>
              )}
            </div>

            {/* Registration Deadline Countdown Bar */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-purple-200">
                  <Timer size={13} className="text-purple-300 animate-pulse" />
                  <span>Registration Deadline</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-purple-300">
                  {event.registration_end_date ? new Date(event.registration_end_date).toLocaleDateString() : 'Active'}
                </span>
              </div>

              {isRegistrationClosed ? (
                <div className="py-2 text-center text-xs font-black text-rose-300 bg-rose-950/60 rounded-xl border border-rose-800/60">
                  Registration has ended for this event
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                  {[
                    { label: 'Days', val: timeLeft.days },
                    { label: 'Hours', val: timeLeft.hours },
                    { label: 'Mins', val: timeLeft.minutes },
                    { label: 'Secs', val: timeLeft.seconds }
                  ].map((item, i) => (
                    <div key={i} className="bg-white/10 rounded-xl py-1.5 px-1 sm:px-2 backdrop-blur-xs">
                      <span className="block text-base sm:text-lg font-black font-mono leading-tight">{String(item.val).padStart(2, '0')}</span>
                      <span className="block text-[8px] sm:text-[9px] font-bold text-purple-300 uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ════════ REGISTRATION FORM OR CONFIRMATION ════════ */}
        {registeredSuccess ? (
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm animate-fade-in max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Registration Confirmed!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                You're enrolled for <strong>{event.name}</strong>. A confirmation email has been dispatched to <strong>{formData.email}</strong>.
              </p>
            </div>

            {/* Registered Tracks */}
            {registeredSuccess.event?.tracks && registeredSuccess.event.tracks.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Linked Quiz Tracks:
                </div>
                <div className="space-y-2">
                  {registeredSuccess.event.tracks.map((t, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Join Code: <strong className="text-purple-600 font-black">{t.join_code}</strong></div>
                      </div>
                      <a
                        href={t.direct_url}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>Launch</span>
                        <ArrowRight size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => navigate('/courses')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Browse Quiz Tracks
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        ) : isRegistrationClosed ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <h3 className="text-lg font-black text-slate-900">Registration is Closed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The registration deadline for this event has passed or seat capacity has been reached. Please stay tuned for future workshops and challenges.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Explore Other Events
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <h3 className="text-lg font-black text-slate-900">Participant Registration Form</h3>
              <p className="text-xs text-slate-500 font-medium">Enter your details to reserve your seat and get instant access credentials.</p>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    College / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PRPCEM Amravati"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch / Dept
                  </label>
                  <input
                    type="text"
                    placeholder="CSE / IT / AIDS"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Alumni / Professional">Alumni / Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Roll No / PRN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21CS042"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Confirming Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
