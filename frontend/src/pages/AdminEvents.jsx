import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Sparkles, Plus, Search, Calendar, MapPin, Globe, Users,
  Trash2, Edit3, ExternalLink, Mail, ArrowRight, ShieldCheck,
  AlertCircle, RefreshCw, X, Radio, BookOpen, Image, Check, Download, FileText,
  Copy, Link as LinkIcon, Upload, CloudUpload, CheckCircle2, Clock, Timer,
  Lock, Unlock, Tag, AlertTriangle
} from 'lucide-react';

const POSTER_GALLERY = [
  {
    id: 'visionx',
    name: 'VisionX Innovation Fest',
    matchKeywords: ['vision', 'visionx', 'innovation', 'project'],
    url: 'https://mscprpcem.blob.core.windows.net/events/VisionX.png'
  },
  {
    id: 'spark',
    name: 'Spark Flagship Event',
    matchKeywords: ['spark', 'inauguration', 'team', 'gai'],
    url: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png'
  },
  {
    id: 'dotnet',
    name: '.NET Conf Amravati',
    matchKeywords: ['dotnet', '.net', 'c#', 'microsoft'],
    url: 'https://mscprpcem.blob.core.windows.net/events/12.png'
  },
  {
    id: 'gitlit',
    name: 'GitLit Code Fest',
    matchKeywords: ['gitlit', 'git', 'github', 'diwali', 'fest'],
    url: 'https://mscprpcem.blob.core.windows.net/events/gitlit.jpg'
  },
  {
    id: 'js_ai',
    name: 'JS AI Build-a-thon',
    matchKeywords: ['js', 'javascript', 'buildathon', 'hackathon'],
    url: 'https://mscprpcem.blob.core.windows.net/events/js_ai.png'
  },
  {
    id: 'ai_skill',
    name: 'Microsoft AI Skill Fest',
    matchKeywords: ['ai', 'copilot', 'azure', 'skill', 'cloud'],
    url: 'https://mscprpcem.blob.core.windows.net/events/aiskillfest.png'
  }
];

// Helper: Convert Date or ISO string to format required by <input type="datetime-local" />
const formatToDateTimeLocal = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  let hours = d.getHours();
  let minutes = d.getMinutes();
  if (hours === 0 && minutes === 0 && typeof dateVal === 'string' && !dateVal.includes(':')) {
    hours = 10;
    minutes = 0;
  }
  return `${year}-${month}-${day}T${pad(hours)}:${pad(minutes)}`;
};

// Helper: Format readable date time string
const formatDisplayDateTime = (dateVal, includeTime = true) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  return d.toLocaleString('en-US', options);
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  
  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Innovation Challenge',
    mode: 'Hybrid',
    venue: 'PRPCEM Campus & Virtual',
    poster_url: POSTER_GALLERY[0].url,
    description: '',
    start_date: '',
    end_date: '',
    registration_start_date: '',
    registration_end_date: '',
    max_registrations: '',
    initial_registration_count: '',
    fee: 'Free',
    is_registration_open: true,
    rewards: 'Certificates, Prizes & Swags',
    status: 'upcoming'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterUploadSuccess, setPosterUploadSuccess] = useState(false);

  // Registrations Modal State
  const [regsModalOpen, setRegsModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regsSearch, setRegsSearch] = useState('');
  const [regsPage, setRegsPage] = useState(1);
  const [regsLimit, setRegsLimit] = useState(25);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Pagination for Events List (9 items per page)
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLimit, setEventsLimit] = useState(9);

  // Lock body scroll when either modal is open
  useEffect(() => {
    if (modalOpen || regsModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, regsModalOpen]);

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be under 10MB.');
      return;
    }

    try {
      setUploadingPoster(true);
      setPosterUploadSuccess(false);
      const uploadFormData = new FormData();
      uploadFormData.append('poster', file);

      const res = await api.post('/api/events/upload-poster', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success && res.data.url) {
        setFormData(prev => ({
          ...prev,
          poster_url: res.data.url
        }));
        setPosterUploadSuccess(true);
        setTimeout(() => setPosterUploadSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Poster upload failed:', err);
      alert(err.response?.data?.error || 'Failed to upload poster image to Azure Blob Storage.');
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleDeleteReg = async (regId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete the registration for "${studentName}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/events/registrations/${regId}`);
      setRegistrations(prev => prev.filter(r => r.id !== regId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete registration');
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/events');
      if (res.data?.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.warn('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleNameChange = (nameVal) => {
    const autoSlug = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const updated = {
      ...formData,
      name: nameVal,
      slug: (!editingEvent || !formData.slug) ? autoSlug : formData.slug
    };

    const cleanLower = nameVal.toLowerCase();
    for (const item of POSTER_GALLERY) {
      if (item.matchKeywords.some(kw => cleanLower.includes(kw))) {
        updated.poster_url = item.url;
        break;
      }
    }
    setFormData(updated);
  };

  const openCreateModal = () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    nextWeek.setHours(10, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeek.getTime() + 6 * 60 * 60 * 1000); // 4 PM same day
    const regDeadline = new Date(nextWeek.getTime() - 2 * 60 * 60 * 1000); // 8 AM same day

    setEditingEvent(null);
    setFormData({
      name: '',
      slug: '',
      category: 'Innovation Challenge',
      mode: 'Hybrid',
      venue: 'PRPCEM Campus & Virtual',
      poster_url: POSTER_GALLERY[0].url,
      description: '',
      start_date: formatToDateTimeLocal(nextWeek),
      end_date: formatToDateTimeLocal(nextWeekEnd),
      registration_start_date: formatToDateTimeLocal(new Date()),
      registration_end_date: formatToDateTimeLocal(regDeadline),
      max_registrations: '',
      initial_registration_count: '',
      fee: 'Free',
      is_registration_open: true,
      rewards: 'Certificates, Prizes & Swags',
      status: 'upcoming'
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    const resolvedStartDate = ev.start_date || ev.startDate || ev.date || (ev.source === 'json' ? ev.startDate : null);
    const resolvedEndDate = ev.end_date || ev.endDate || null;
    const resolvedRegStart = ev.registration_start_date || null;
    const resolvedRegEnd = ev.registration_end_date || null;
    const isFuture = resolvedStartDate && !isNaN(new Date(resolvedStartDate).getTime()) && new Date(resolvedStartDate) > new Date();

    setFormData({
      name: ev.name || ev.title || '',
      slug: ev.slug || ev.id || (ev.name ? ev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''),
      category: ev.category || 'Technical Workshop',
      mode: ev.mode || 'Offline',
      venue: ev.venue || 'PRPCEM Amravati',
      poster_url: ev.poster_url || ev.poster || POSTER_GALLERY[0].url,
      description: ev.description || '',
      start_date: formatToDateTimeLocal(resolvedStartDate),
      end_date: formatToDateTimeLocal(resolvedEndDate),
      registration_start_date: formatToDateTimeLocal(resolvedRegStart),
      registration_end_date: formatToDateTimeLocal(resolvedRegEnd),
      max_registrations: ev.max_registrations !== null && ev.max_registrations !== undefined ? String(ev.max_registrations) : '',
      initial_registration_count: ev.initial_registration_count !== undefined && ev.initial_registration_count !== null ? String(ev.initial_registration_count) : '0',
      fee: ev.fee || 'Free',
      is_registration_open: ev.is_registration_open !== false,
      rewards: ev.rewards || 'Certificates & Swags',
      status: isFuture ? 'upcoming' : ((ev.status === 'past' || ev.status === 'completed') ? 'completed' : (ev.status || 'upcoming'))
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleViewRegistrations = async (ev) => {
    setViewingEvent(ev);
    setRegsModalOpen(true);
    setRegistrations([]);
    try {
      setLoadingRegs(true);
      const res = await api.get(`/api/events/${ev.id}/registrations`);
      if (res.data?.success) {
        setRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      console.warn('Failed to load registrations:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const exportRegistrationsCSV = () => {
    if (!registrations || registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = ['Full Name', 'Email', 'College', 'Branch', 'Year', 'Phone', 'Roll No', 'Submitted Date', 'Status'];
    const rows = registrations.map(r => [
      `"${(r.full_name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.college || '').replace(/"/g, '""')}"`,
      `"${(r.branch || '').replace(/"/g, '""')}"`,
      `"${(r.year_of_study || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.roll_no || '').replace(/"/g, '""')}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
      `"${r.status || 'registered'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(viewingEvent?.name || 'event').replace(/[^a-z0-9]/gi, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteEvent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete event "${name}"? Linked quizzes will remain safe.`)) {
      return;
    }
    try {
      await api.delete(`/api/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleCopyLink = (slugOrId) => {
    const url = `https://www.mscprpcem.tech/register/${slugOrId}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(slugOrId);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Event name is required');
      return;
    }

    if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      setErrorMsg('Event End Date & Time cannot be earlier than Start Date & Time.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const resolvedStartIso = formData.start_date
        ? new Date(formData.start_date).toISOString()
        : (editingEvent?.start_date || editingEvent?.startDate ? new Date(editingEvent.start_date || editingEvent.startDate).toISOString() : null);

      const resolvedEndIso = formData.end_date
        ? new Date(formData.end_date).toISOString()
        : (editingEvent?.end_date || editingEvent?.endDate ? new Date(editingEvent.end_date || editingEvent.endDate).toISOString() : null);

      const resolvedRegStartIso = formData.registration_start_date
        ? new Date(formData.registration_start_date).toISOString()
        : (editingEvent?.registration_start_date ? new Date(editingEvent.registration_start_date).toISOString() : null);

      const resolvedRegEndIso = formData.registration_end_date
        ? new Date(formData.registration_end_date).toISOString()
        : (editingEvent?.registration_end_date ? new Date(editingEvent.registration_end_date).toISOString() : null);

      const isFuture = resolvedStartIso && new Date(resolvedStartIso) > new Date();
      const cleanStatus = isFuture && (formData.status === 'past' || formData.status === 'completed')
        ? 'upcoming'
        : ((formData.status === 'past' || formData.status === 'completed') ? 'completed' : (formData.status || 'upcoming'));

      const payload = {
        ...formData,
        start_date: resolvedStartIso,
        end_date: resolvedEndIso,
        registration_start_date: resolvedRegStartIso,
        registration_end_date: resolvedRegEndIso,
        max_registrations: formData.max_registrations !== '' && formData.max_registrations !== null ? parseInt(formData.max_registrations, 10) : null,
        initial_registration_count: formData.initial_registration_count !== '' && formData.initial_registration_count !== null ? parseInt(formData.initial_registration_count, 10) : 0,
        status: cleanStatus
      };

      if (editingEvent && !editingEvent.id.startsWith('auto-')) {
        const res = await api.put(`/api/events/${editingEvent.id}`, payload);
        if (res.data?.success) {
          fetchEvents();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/api/events', payload);
        if (res.data?.success) {
          fetchEvents();
          setModalOpen(false);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedFilter === 'ALL') return true;
    
    const status = (e.status || '').toUpperCase();
    const now = new Date();
    const startDate = e.start_date ? new Date(e.start_date) : (e.startDate ? new Date(e.startDate) : null);
    const endDate = e.end_date ? new Date(e.end_date) : (e.endDate ? new Date(e.endDate) : null);
    const isFutureEvent = Boolean(startDate && !isNaN(startDate.getTime()) && startDate > now);
    const isEventEnded = Boolean(endDate && !isNaN(endDate.getTime())
      ? endDate < now 
      : (startDate && !isNaN(startDate.getTime()) ? startDate < now : false));
    const isCompleted = !isFutureEvent && (status === 'COMPLETED' || status === 'PAST' || status === 'CONCLUDED' || isEventEnded);

    if (selectedFilter === 'COMPLETED') {
      return isCompleted;
    }
    if (selectedFilter === 'UPCOMING') {
      return isFutureEvent || (!isCompleted && (status === 'UPCOMING' || status === 'OPEN' || status === 'ACTIVE'));
    }
    if (selectedFilter === 'LIVE') {
      return (status === 'LIVE' || e.is_live) && !isEventEnded;
    }
    if (selectedFilter === 'REG_OPEN') {
      return e.is_registration_open && !e.is_registration_ended && !isEventEnded;
    }
    return status === selectedFilter;
  }).sort((a, b) => {
    const timeA = new Date(a.start_date || a.startDate || a.date || a.createdAt || 0).getTime() || 0;
    const timeB = new Date(b.start_date || b.startDate || b.date || b.createdAt || 0).getTime() || 0;
    if (timeB !== timeA) return timeB - timeA;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const filteredRegs = registrations.filter(r => {
    if (!regsSearch.trim()) return true;
    const q = regsSearch.toLowerCase();
    return (r.full_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.college || '').toLowerCase().includes(q) ||
      (r.branch || '').toLowerCase().includes(q);
  });

  const totalEventsPages = eventsLimit === 0 ? 1 : (Math.ceil(filteredEvents.length / eventsLimit) || 1);
  const paginatedEvents = eventsLimit === 0 ? filteredEvents : filteredEvents.slice((eventsPage - 1) * eventsLimit, eventsPage * eventsLimit);

  const renderEventCard = (ev) => {
    const currentSlug = ev.slug || ev.id;
    const isCopied = copyFeedback === currentSlug;
    const hasDates = Boolean(ev.start_date);
    const isRegClosed = !ev.is_registration_open || ev.is_registration_ended;

    const startDateObj = ev.start_date ? new Date(ev.start_date) : (ev.startDate ? new Date(ev.startDate) : null);
    const isFutureEv = Boolean(startDateObj && !isNaN(startDateObj.getTime()) && startDateObj > new Date());
    const rawStatus = (ev.status || '').toLowerCase();
    const isLive = rawStatus === 'live' || ev.is_live;
    const isCompleted = !isFutureEv && (rawStatus === 'completed' || rawStatus === 'past');
    const badgeLabel = isLive ? 'Live' : (isCompleted ? 'Completed' : 'Upcoming');

    return (
      <div
        key={ev.id}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
      >
        <div>
          {/* Poster Preview Header */}
          <div className="relative h-48 bg-slate-950 overflow-hidden">
            <img
              src={ev.poster_url || POSTER_GALLERY[0].url}
              alt={ev.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = POSTER_GALLERY[0].url;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            
            {/* Status & Fee Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                isLive
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : isCompleted
                  ? 'bg-slate-600/90 text-white backdrop-blur-xs'
                  : 'bg-purple-600 text-white'
              }`}>
                {badgeLabel}
              </span>
              {ev.fee && (
                <span className="px-2 py-1 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-xs border border-white/20">
                  {ev.fee}
                </span>
              )}
            </div>

            {/* Top Action Icons */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={() => openEditModal(ev)}
                className="p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
                title="Edit event"
              >
                <Edit3 size={13} />
              </button>
              {ev.source === 'database' && (
                <button
                  onClick={() => handleDeleteEvent(ev.id, ev.name)}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Category Pill on bottom of image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <span className="text-[11px] font-bold opacity-90 truncate">
                {ev.category || 'MSC Flagship Event'}
              </span>
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                {ev.mode || 'Hybrid'}
              </span>
            </div>
          </div>

          {/* Event Content Body */}
          <div className="p-5 space-y-3">
            <div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                {ev.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {ev.description || 'Official challenges and tracks for this event.'}
              </p>
            </div>

            {/* 📅 Event Date & Timing Badge */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-800 font-bold">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="truncate">
                    {ev.start_date
                      ? `${formatDisplayDateTime(ev.start_date, true)}${ev.end_date ? ` → ${formatDisplayDateTime(ev.end_date, false)}` : ''}`
                      : 'Date TBA'}
                  </span>
                </div>
              </div>

              {/* ⏳ Registration Deadline */}
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1 text-slate-500 font-medium truncate">
                  <Clock size={11} className="text-slate-400 shrink-0" />
                  <span>
                    Reg Deadline: {ev.registration_end_date ? formatDisplayDateTime(ev.registration_end_date, true) : 'Open till start'}
                  </span>
                </div>
                <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                  isRegClosed
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isRegClosed ? 'Closed' : 'Open'}
                </span>
              </div>
            </div>

            {/* Live Website Slug Registration Badge */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-2 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <LinkIcon size={12} className="text-purple-600 shrink-0" />
                <span className="font-mono font-bold text-purple-800 truncate">
                  /register/{currentSlug}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopyLink(currentSlug)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                  }`}
                  title="Copy Full Registration URL"
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={`https://www.mscprpcem.tech/register/${currentSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-purple-600 hover:text-purple-800 hover:bg-white rounded-md cursor-pointer"
                  title="Open Registration Page"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{ev.venue || 'PRPCEM Amravati'}</span>
              </div>
              
              {/* Website Registrations Count & Capacity */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Users size={13} className="text-purple-600 shrink-0" />
                  <span className="font-extrabold text-purple-700">
                    {ev.registration_count || 0}
                    {ev.max_registrations ? ` / ${ev.max_registrations} Seats` : ' Enrolled'}
                  </span>
                  {parseInt(ev.initial_registration_count, 10) > 0 && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      ({ev.actual_registration_count || 0} online + {ev.initial_registration_count} base)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleViewRegistrations(ev)}
                  className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  View List ({ev.actual_registration_count || 0})
                </button>
              </div>

              {/* Capacity Progress Bar if limit set */}
              {ev.max_registrations && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (ev.registration_count || 0) >= ev.max_registrations ? 'bg-rose-500' : 'bg-purple-600'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round(((ev.registration_count || 0) / ev.max_registrations) * 100))}%`
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-slate-400 shrink-0" />
                <span>
                  {ev.total_quizzes > 0 ? (
                    <span className="text-slate-700 font-bold">{ev.total_quizzes} Quiz Track(s) Attached</span>
                  ) : (
                    <span className="text-slate-400 font-medium">Standalone Event (0 Quizzes Attached)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-2 text-xs font-bold mt-2">
          <button
            onClick={() => navigate(`/admin/scheduled-quizzes/create?event=${encodeURIComponent(ev.name)}`)}
            className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Attach Quiz</span>
          </button>

          <button
            onClick={() => navigate(`/admin/email-dispatch?eventId=${encodeURIComponent(ev.id)}&event=${encodeURIComponent(ev.name)}`)}
            className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Mail size={13} />
            <span>Dispatch Email</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Management</h1>
              <p className="text-xs text-slate-500 font-medium">
                Configure event dates, registration deadlines, capacity limits, and custom <code>/register/:slug</code> URLs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors cursor-pointer"
            title="Refresh events"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event name, slug, venue..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setEventsPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-hidden focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 self-stretch sm:self-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Events' },
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'REG_OPEN', label: 'Reg Open' },
            { key: 'LIVE', label: 'Live Now' },
            { key: 'COMPLETED', label: 'Completed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setSelectedFilter(key);
                setEventsPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === key
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="h-44 bg-slate-100 rounded-2xl w-full" />
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-base font-black text-slate-900">No Events Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an event (e.g. <strong>VisionX Season 2</strong>) with full scheduling, registration deadlines, and link challenge quizzes.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEvents.map((ev) => renderEventCard(ev))}
          </div>

          {/* Pagination Controls Bar (9 items per page) */}
          {filteredEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="text-slate-500 font-bold">
                Showing{' '}
                <span className="text-slate-900 font-extrabold">
                  {filteredEvents.length === 0 ? 0 : (eventsPage - 1) * (eventsLimit || filteredEvents.length) + 1}
                </span>{' '}
                to{' '}
                <span className="text-slate-900 font-extrabold">
                  {eventsLimit === 0 ? filteredEvents.length : Math.min(eventsPage * eventsLimit, filteredEvents.length)}
                </span>{' '}
                of <span className="text-purple-600 font-black">{filteredEvents.length}</span> event(s)
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-[11px] font-bold text-slate-400">Show:</span>
                  <select
                    value={eventsLimit}
                    onChange={(e) => {
                      setEventsLimit(parseInt(e.target.value, 10));
                      setEventsPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value={9}>9 / page</option>
                    <option value={18}>18 / page</option>
                    <option value={27}>27 / page</option>
                    <option value={0}>All events</option>
                  </select>
                </div>

                {eventsLimit > 0 && totalEventsPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                      disabled={eventsPage === 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalEventsPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setEventsPage(pg)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          eventsPage === pg
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      onClick={() => setEventsPage((prev) => Math.min(totalEventsPages, prev + 1))}
                      disabled={eventsPage >= totalEventsPages}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registrations List Modal (Rendered in Portal) */}
      {regsModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {viewingEvent?.name} — Registrations
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {registrations.length} student(s) registered online through the portal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={exportRegistrationsCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setRegsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Search & Items Per Page Selector */}
            <div className="my-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Search registered students by name, email, college, branch..."
                value={regsSearch}
                onChange={(e) => {
                  setRegsSearch(e.target.value);
                  setRegsPage(1);
                }}
                className="w-full sm:flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              />
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
                <select
                  value={regsLimit}
                  onChange={(e) => {
                    setRegsLimit(parseInt(e.target.value, 10));
                    setRegsPage(1);
                  }}
                  className="px-2.5 py-2 bg-blue-50 text-blue-700 font-bold border border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] border border-slate-100 rounded-2xl">
              {loadingRegs ? (
                <div className="p-8 text-center text-xs font-bold text-slate-500">Loading registrations...</div>
              ) : filteredRegs.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">No registrations found.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">College & Branch</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Registered At</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredRegs
                      .slice((regsPage - 1) * regsLimit, regsPage * regsLimit)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{r.full_name}</td>
                          <td className="p-3 text-blue-600">{r.email}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800 truncate max-w-[180px]">{r.college}</div>
                            <div className="text-[10px] text-slate-400">{r.branch} {r.year_of_study ? `(${r.year_of_study})` : ''}</div>
                          </td>
                          <td className="p-3 text-slate-600">{r.phone || '—'}</td>
                          <td className="p-3 text-[11px] text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteReg(r.id, r.full_name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete registration"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginator Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-bold">
                Showing{' '}
                <span className="text-slate-900 font-extrabold">
                  {filteredRegs.length === 0 ? 0 : (regsPage - 1) * regsLimit + 1}
                </span>{' '}
                to{' '}
                <span className="text-slate-900 font-extrabold">
                  {Math.min(regsPage * regsLimit, filteredRegs.length)}
                </span>{' '}
                of <span className="text-slate-900 font-extrabold">{filteredRegs.length}</span> record(s)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRegsPage(prev => Math.max(1, prev - 1))}
                  disabled={regsPage === 1 || filteredRegs.length === 0}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-bold text-slate-700 font-mono">
                  {regsPage} / {Math.ceil(filteredRegs.length / regsLimit) || 1}
                </span>
                <button
                  onClick={() => setRegsPage(prev => Math.min(Math.ceil(filteredRegs.length / regsLimit), prev + 1))}
                  disabled={regsPage >= Math.ceil(filteredRegs.length / regsLimit) || filteredRegs.length === 0}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Next
                </button>
                <button
                  onClick={() => setRegsModalOpen(false)}
                  className="ml-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create / Edit Event Modal (Rendered in Portal on document.body) */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingEvent ? `Edit Event: ${editingEvent.name}` : 'Create New Club Event'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure event details, dates, attendee counts, and registration settings.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="mt-5 space-y-4 text-xs">
              
              {/* Event Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VisionX Season 2, Spark '26, .NET Conf Amravati"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-bold text-slate-900"
                />
              </div>

              {/* Event URL Slug Configuration */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Custom Registration Page URL Slug *</span>
                  <span className="text-[10px] text-purple-600 font-medium">Direct Link on Main Website</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-[11px] select-none">
                    www.mscprpcem.tech/register/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="visionx-s2, spark26, dotnet2025"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono font-bold text-purple-700 outline-none focus:bg-white focus:border-purple-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Students can open <code className="text-purple-600 font-bold">https://www.mscprpcem.tech/register/{formData.slug || 'event-slug'}</code> directly to register.
                </p>
              </div>

              {/* ════════ SECTION 1: ATTENDEES & REGISTRATIONS COUNT ════════ */}
              <div className="p-4 bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-blue-50/70 border border-purple-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                      <Users size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-purple-950 uppercase tracking-wide block">
                        Attendees & Registration Numbers
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Set base count for past/offline events & configure seat limits
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Displayed on Website</span>
                    <span className="text-xs font-black text-purple-700 bg-white/80 px-2 py-0.5 rounded-lg border border-purple-200 inline-block">
                      {(parseInt(formData.initial_registration_count, 10) || 0) + (editingEvent?.actual_registration_count || 0)} Students Enrolled
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Initial / Base Count</span>
                      <span className="text-[9px] text-purple-600 font-bold bg-purple-100/80 px-1.5 py-0.2 rounded">Editable</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150 (Default: 0)"
                      value={formData.initial_registration_count}
                      onChange={(e) => setFormData({ ...formData, initial_registration_count: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-black text-purple-950 outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                      Base count for past or offline participants. Online signups automatically add to this.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Seat / Capacity Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 200 (Blank = Unlimited)"
                      value={formData.max_registrations}
                      onChange={(e) => setFormData({ ...formData, max_registrations: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                      Maximum total seats allowed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Registration Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_registration_open: !formData.is_registration_open })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        formData.is_registration_open
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                      }`}
                    >
                      {formData.is_registration_open ? (
                        <>
                          <Unlock size={13} />
                          <span>Accepting Signups</span>
                        </>
                      ) : (
                        <>
                          <Lock size={13} />
                          <span>Registration Closed</span>
                        </>
                      )}
                    </button>
                    <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                      Toggle if student registration form is active.
                    </p>
                  </div>
                </div>

                {editingEvent && (
                  <div className="flex items-center justify-between bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-purple-100 text-[11px] flex-wrap gap-2">
                    <span className="text-slate-600 font-medium">
                      🌐 Online student signups: <strong className="text-purple-700 font-black">{editingEvent.actual_registration_count || 0}</strong>
                    </span>
                    <span className="text-slate-600 font-medium">
                      ➕ Base count: <strong className="text-purple-700 font-black">{parseInt(formData.initial_registration_count, 10) || 0}</strong>
                    </span>
                    <span className="text-purple-950 font-extrabold">
                      = Total Count: <strong className="text-purple-600 font-black">{(parseInt(formData.initial_registration_count, 10) || 0) + (editingEvent.actual_registration_count || 0)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* ════════ SECTION 2: EVENT DATE & TIME ════════ */}
              <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-purple-600" />
                  <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                    Event Schedule (Date & Time)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Event Starts At (Date & Time) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Event Ends At (Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* ════════ SECTION 3: REGISTRATION DEADLINE WINDOW ════════ */}
              <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-blue-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Registration Deadline Window & Fee
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Registration Opens On
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.registration_start_date}
                      onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Leave blank for immediate opening.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Registration Last Date / Deadline *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.registration_end_date}
                      onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Auto-closes after this date.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Entry Fee / Price
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free, ₹50, ₹100"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Poster Upload & Gallery Section */}
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <CloudUpload size={15} className="text-purple-600" />
                    <span>Event Poster Image</span>
                  </label>
                  <span className="text-[10px] text-purple-600 font-bold">Azure Blob Storage Enabled</span>
                </div>

                {/* Azure Blob File Uploader Box */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-dashed border-purple-200 hover:border-purple-400 transition-all">
                  {/* Current Poster Preview Thumbnail */}
                  {formData.poster_url ? (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100 shadow-2xs">
                      <img
                        src={formData.poster_url}
                        alt="Current Poster"
                        className="w-full h-full object-cover"
                      />
                      {formData.poster_url.includes('blob.core.windows.net') && (
                        <span className="absolute top-0.5 right-0.5 bg-blue-600 text-[7px] text-white font-bold px-1 rounded-xs">
                          Azure
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-14 rounded-lg border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                      <Image size={20} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-black cursor-pointer shadow-2xs flex items-center gap-1.5 transition-all">
                        {uploadingPoster ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Uploading to Azure...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={12} />
                            <span>Upload Image to Azure Blob</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePosterUpload}
                          disabled={uploadingPoster}
                          className="hidden"
                        />
                      </label>

                      {posterUploadSuccess && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Uploaded!
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Supports PNG, JPG, WEBP, GIF, SVG (Max 10MB). Automatically stored in Azure Blob Storage.
                    </p>
                  </div>
                </div>

                {/* Preset Gallery */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                    Or Choose from Pre-Designed Event Posters:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {POSTER_GALLERY.map((p) => {
                      const isSelected = formData.poster_url === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, poster_url: p.url })}
                          className={`relative aspect-4/3 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-purple-600 ring-2 ring-purple-600/30 scale-102 shadow-xs'
                              : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                          }`}
                          title={p.name}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center text-white">
                              <Check size={14} className="stroke-[3]" />
                            </div>
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[7px] font-bold text-white text-center py-0.5 truncate px-1">
                            {p.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct URL Input */}
                <div>
                  <input
                    type="url"
                    placeholder="Or enter direct image URL: https://..."
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-purple-600 font-mono text-[10px] text-slate-600"
                  />
                </div>
              </div>

              {/* Category, Mode, and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                  >
                    <option value="Innovation Challenge">Innovation Challenge</option>
                    <option value="Flagship Event">Flagship Event</option>
                    <option value="Technical Workshop">Technical Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="AI / Cloud Skill Fest">AI / Cloud Skill Fest</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Event Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-hidden"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="registration_open">Registration Open</option>
                    <option value="registration_closed">Registration Closed</option>
                    <option value="live">Live Now</option>
                    <option value="completed">Completed / Past</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Venue</label>
                <input
                  type="text"
                  placeholder="e.g. PRPCEM Campus / Main Auditorium"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe the vision, agenda, and outcomes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Rewards & Badges</label>
                <input
                  type="text"
                  placeholder="e.g. Official Microsoft Swags, Cash Prizes & Verified Certificates"
                  value={formData.rewards}
                  onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs shadow-sm cursor-pointer transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
