import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Sparkles, Plus, Search, Calendar, MapPin, Globe, Users,
  Trash2, Edit3, ExternalLink, Mail, ArrowRight, ShieldCheck,
  AlertCircle, RefreshCw, X, Radio, BookOpen
} from 'lucide-react';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, UPCOMING, LIVE, COMPLETED
  
  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Technical Workshop',
    mode: 'Offline',
    venue: 'PRPCEM Amravati',
    poster_url: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
    description: '',
    rewards: 'Certificates & Exciting Swags',
    status: 'upcoming'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      category: 'Technical Workshop',
      mode: 'Offline',
      venue: 'PRPCEM Amravati',
      poster_url: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
      description: '',
      rewards: 'Certificates & Exciting Swags',
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
      poster_url: ev.poster_url || 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
      description: ev.description || '',
      rewards: ev.rewards || 'Certificates & Swags',
      status: ev.status || 'upcoming'
    });
    setErrorMsg('');
    setModalOpen(true);
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
    return (e.status || '').toUpperCase() === selectedFilter;
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
                  Create and manage official club events, workshops, and link multiple quiz challenge tracks.
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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Create New Event</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by event name, category, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl text-xs font-bold">
            {['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedFilter === filter
                    ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <RefreshCw size={24} className="animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Loading events and challenge tracks...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Sparkles size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Events Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create your first event to start grouping multiple quizzes and sync live challenges with the main website.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
            >
              <Plus size={16} />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Banner / Poster Header */}
                  <div className="relative h-36 bg-gradient-to-r from-purple-600 to-indigo-600 overflow-hidden">
                    <img
                      src={ev.poster_url || 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png'}
                      alt={ev.name}
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">
                        {ev.category || 'Event'}
                      </span>
                      <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-[10px] font-extrabold text-white">
                        {ev.mode || 'Offline'}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit3 size={12} />
                      </button>
                      {!ev.id.startsWith('auto-') && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.name)}
                          className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-50 text-red-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                        {ev.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {ev.description || 'Official challenge and assessment tracks for this event.'}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ev.venue || 'PRPCEM Amravati'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-slate-400 shrink-0" />
                        <span><strong>{ev.total_quizzes || 0}</strong> Quiz Track(s) Attached</span>
                      </div>
                    </div>

                    {/* Attached Quiz Tracks List */}
                    {ev.quizzes && ev.quizzes.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Included Quizzes ({ev.quizzes.length}):
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
                    <span>Add Quiz</span>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/email-dispatch?event=${encodeURIComponent(ev.name)}`)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Mail size={13} />
                    <span>Dispatch Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Event Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {editingEvent ? 'Edit Club Event' : 'Create New Club Event'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure event details and multi-quiz track grouping.</p>
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
                    placeholder="e.g. Spark '26, Azure Cloud Summit, AI Copilot Fest"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    >
                      <option value="Technical Workshop">Technical Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Buildathon">Buildathon</option>
                      <option value="Conference">Conference</option>
                      <option value="Code Fest">Code Fest</option>
                      <option value="Quiz & Assessment">Quiz & Assessment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Event Mode
                    </label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    >
                      <option value="Offline">Offline (Campus)</option>
                      <option value="Online">Online (Virtual)</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Venue / Campus Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PRPCEM Main Auditorium"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://mscprpcem.blob.core.windows.net/events/clean_529287766.png"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Rewards & Swags
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Certificates, Microsoft Swags, Goodies"
                    value={formData.rewards}
                    onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Event Overview & Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Comprehensive description of the event agenda, topics, and schedule..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Saving Event...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
