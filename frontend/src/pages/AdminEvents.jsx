import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Sparkles, Plus, Search, Calendar, MapPin, Globe, Users,
  Trash2, Edit3, ExternalLink, Mail, ArrowRight, ShieldCheck,
  AlertCircle, RefreshCw, X, Radio, BookOpen, Image, Check, Download, FileText
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
    category: 'Innovation Challenge',
    mode: 'Hybrid',
    venue: 'PRPCEM Campus & Virtual',
    poster_url: POSTER_GALLERY[0].url,
    description: '',
    rewards: 'Certificates, Prizes & Swags',
    status: 'upcoming'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Registrations Modal State
  const [regsModalOpen, setRegsModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regsSearch, setRegsSearch] = useState('');

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
    const updated = { ...formData, name: nameVal };
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
    setEditingEvent(null);
    setFormData({
      name: '',
      category: 'Innovation Challenge',
      mode: 'Hybrid',
      venue: 'PRPCEM Campus & Virtual',
      poster_url: POSTER_GALLERY[0].url,
      description: '',
      rewards: 'Certificates, Prizes & Swags',
      status: 'upcoming'
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      name: ev.name || '',
      category: ev.category || 'Technical Workshop',
      mode: ev.mode || 'Offline',
      venue: ev.venue || 'PRPCEM Amravati',
      poster_url: ev.poster_url || POSTER_GALLERY[0].url,
      description: ev.description || '',
      rewards: ev.rewards || 'Certificates & Swags',
      status: ev.status || 'upcoming'
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

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Event name is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (editingEvent && !editingEvent.id.startsWith('auto-')) {
        const res = await api.put(`/api/events/${editingEvent.id}`, formData);
        if (res.data?.success) {
          fetchEvents();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/api/events', formData);
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
      (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedFilter === 'ALL') return true;
    
    const status = (e.status || '').toUpperCase();
    if (selectedFilter === 'COMPLETED') {
      return status === 'COMPLETED' || status === 'PAST' || status === 'CONCLUDED';
    }
    if (selectedFilter === 'UPCOMING') {
      return status === 'UPCOMING' || status === 'OPEN' || status === 'ACTIVE';
    }
    if (selectedFilter === 'LIVE') {
      return status === 'LIVE' || e.is_live;
    }
    return status === selectedFilter;
  });

  const filteredRegs = registrations.filter(r => {
    if (!regsSearch.trim()) return true;
    const q = regsSearch.toLowerCase();
    return (r.full_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.college || '').toLowerCase().includes(q) ||
      (r.branch || '').toLowerCase().includes(q);
  });

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
                Create official club events, track website participant registrations, and attach multiple challenge quizzes.
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
            placeholder="Search by event name, category, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-hidden focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 self-stretch sm:self-auto overflow-x-auto">
          {['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {filter}
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
            Create an event (e.g. <strong>VisionX Season 2</strong>) to display on the main website and link challenge quizzes.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
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
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      (ev.status || '').toLowerCase() === 'live' || ev.is_live
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : (ev.status || '').toLowerCase() === 'completed' || (ev.status || '').toLowerCase() === 'past'
                        ? 'bg-slate-600/90 text-white backdrop-blur-xs'
                        : 'bg-purple-600 text-white'
                    }`}>
                      {ev.status || 'Upcoming'}
                    </span>
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

                  <div className="text-[11px] text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{ev.venue || 'PRPCEM Amravati'}</span>
                    </div>
                    
                    {/* Website Registrations Count */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-purple-600 shrink-0" />
                        <span className="font-extrabold text-purple-700">
                          {ev.registration_count || 0} Registered Student(s)
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewRegistrations(ev)}
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        View List
                      </button>
                    </div>

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

                  {/* Attached Quiz Tracks List */}
                  {ev.quizzes && ev.quizzes.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Included Quiz Tracks ({ev.quizzes.length}):
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-xs">
                        {ev.quizzes.map((q) => (
                          <div
                            key={q.id}
                            className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px]"
                          >
                            <div className="truncate font-bold text-slate-700">
                              {q.title}
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase ${
                              q.mode === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {q.mode}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="p-5 pt-0 grid grid-cols-2 gap-2 text-xs font-bold">
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
          ))}
        </div>
      )}

      {/* Registrations List Modal */}
      {regsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {viewingEvent?.name} — Registrations
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {registrations.length} student(s) enrolled from the main website.
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

            {/* Filter Search */}
            <div className="my-4">
              <input
                type="text"
                placeholder="Search registered students by name, email, college, branch..."
                value={regsSearch}
                onChange={(e) => setRegsSearch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
              />
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredRegs.map((r) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">Total: {filteredRegs.length} record(s)</span>
              <button
                onClick={() => setRegsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingEvent ? 'Edit Club Event' : 'Create New Club Event'}
                  </h3>
                  <p className="text-xs text-slate-500">Events appear on mscprpcem.tech with custom posters.</p>
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
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="mt-5 space-y-4 text-xs">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-bold"
                />
              </div>

              {/* Visual Poster Template Gallery */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Select Event Poster Design</span>
                  <span className="text-[10px] text-purple-600 font-normal">Click to choose design</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {POSTER_GALLERY.map((p) => {
                    const isSelected = formData.poster_url === p.url;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, poster_url: p.url })}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
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
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-bold text-white text-center py-0.5 truncate px-1">
                          {p.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Poster URL Fallback */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Or Custom Poster Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Venue</label>
                <input
                  type="text"
                  placeholder="e.g. PRPCEM Campus / Auditorium"
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
        </div>
      )}
    </div>
  );
}
