import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Calendar, Settings, Plus, Edit, Trash2, CheckCircle, 
  XCircle, ShieldAlert, Award, Clock, ArrowLeft, RefreshCw, Eye, EyeOff, Radio
} from 'lucide-react';
import api from '../services/api';

export default function AdminWeeklyLeague() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weeks'); // 'weeks', 'attempts'

  // Modals & Form states
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);

  // League Form
  const [leagueForm, setLeagueForm] = useState({
    name: 'Tech Challenge Series',
    description: 'Scheduled multi-session technology quiz series',
    type: 'SCHEDULED_LEAGUE', // 'LIVE_REALTIME' or 'SCHEDULED_LEAGUE'
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    recurrence: 'weekly_1day', // 'weekly_1day', 'daily', 'weekly_multiple', 'specific_dates'
    repeatDays: ['Monday'],
    customDatesInput: '',
    numberOfWeeks: 8
  });

  // Week Form
  const [weekForm, setWeekForm] = useState({
    title: '',
    technology: '',
    description: '',
    quizId: '',
    startDateTime: '',
    endDateTime: '',
    published: true,
    enabled: true,
    timeLimit: 30,
    maxAttempts: 1,
    attemptScoringPolicy: 'best',
    shuffleQuestions: true,
    shuffleAnswers: true,
    requireFullscreen: true,
    detectFullscreenExit: true,
    detectTabSwitch: true,
    detectCopyPaste: true,
    autoSubmitOnViolationThreshold: 0,
    marksPerCorrect: 4,
    marksPerWrong: -1,
    marksUnanswered: 0
  });

  // Add Custom Week Form
  const [addWeekForm, setAddWeekForm] = useState({
    title: '',
    technology: '',
    description: '',
    quizId: '',
    startDateTime: new Date().toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  // Attempt log states
  const [attemptLogs, setAttemptLogs] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [leaguesRes, quizzesRes] = await Promise.all([
        api.get('/api/weekly-league/admin/leagues'),
        api.get('/api/quizzes/admin/all').catch(() => ({ data: [] }))
      ]);

      if (leaguesRes.data.success) {
        setLeagues(leaguesRes.data.leagues || []);
        if (leaguesRes.data.leagues.length > 0) {
          setSelectedLeague(leaguesRes.data.leagues[0]);
        }
      }

      if (Array.isArray(quizzesRes.data)) {
        setAvailableQuizzes(quizzesRes.data);
      }
    } catch (err) {
      console.error('Fetch admin league error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    try {
      const customDates = leagueForm.customDatesInput
        ? leagueForm.customDatesInput.split(',').map(d => d.trim()).filter(Boolean)
        : [];

      const payload = {
        name: leagueForm.name,
        description: leagueForm.description,
        type: leagueForm.type,
        startDate: leagueForm.startDate,
        endDate: leagueForm.endDate,
        recurrence: leagueForm.recurrence,
        repeatDays: leagueForm.repeatDays,
        customDates,
        numberOfWeeks: parseInt(leagueForm.numberOfWeeks) || 8
      };

      const res = await api.post('/api/weekly-league/admin/leagues', payload);
      if (res.data.success) {
        setShowLeagueModal(false);
        fetchInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create league/quiz event');
    }
  };

  const handleAddCustomWeek = async (e) => {
    e.preventDefault();
    if (!selectedLeague) return;

    try {
      const res = await api.post(`/api/weekly-league/admin/leagues/${selectedLeague.id}/weeks`, addWeekForm);
      if (res.data.success) {
        setShowAddWeekModal(false);
        fetchInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add session');
    }
  };

  const handleDeleteWeek = async (weekId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled session?')) return;
    try {
      const res = await api.delete(`/api/weekly-league/admin/weeks/${weekId}`);
      if (res.data.success) {
        fetchInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete session');
    }
  };

  const handleEditWeekClick = (week) => {
    setSelectedWeek(week);
    const s = week.settings || {};
    setWeekForm({
      title: week.title,
      technology: week.technology,
      description: week.description || '',
      quizId: week.quiz_id || '',
      startDateTime: week.start_date_time ? new Date(week.start_date_time).toISOString().slice(0, 16) : '',
      endDateTime: week.end_date_time ? new Date(week.end_date_time).toISOString().slice(0, 16) : '',
      published: week.published,
      enabled: week.enabled,
      timeLimit: s.timeLimit !== undefined ? s.timeLimit : 30,
      maxAttempts: s.maxAttempts !== undefined ? s.maxAttempts : 1,
      attemptScoringPolicy: s.attemptScoringPolicy || 'best',
      shuffleQuestions: s.shuffleQuestions !== false,
      shuffleAnswers: s.shuffleAnswers !== false,
      requireFullscreen: s.requireFullscreen !== false,
      detectFullscreenExit: s.detectFullscreenExit !== false,
      detectTabSwitch: s.detectTabSwitch !== false,
      detectCopyPaste: s.detectCopyPaste !== false,
      autoSubmitOnViolationThreshold: s.autoSubmitOnViolationThreshold || 0,
      marksPerCorrect: s.marksPerCorrect !== undefined ? s.marksPerCorrect : 4,
      marksPerWrong: s.marksPerWrong !== undefined ? s.marksPerWrong : -1,
      marksUnanswered: s.marksUnanswered !== undefined ? s.marksUnanswered : 0
    });
    setShowWeekModal(true);
  };

  const handleSaveWeek = async (e) => {
    e.preventDefault();
    if (!selectedWeek) return;

    try {
      const payload = {
        title: weekForm.title,
        technology: weekForm.technology,
        description: weekForm.description,
        quizId: weekForm.quizId || null,
        startDateTime: weekForm.startDateTime,
        endDateTime: weekForm.endDateTime,
        published: weekForm.published,
        enabled: weekForm.enabled,
        settings: {
          timeLimit: parseInt(weekForm.timeLimit),
          maxAttempts: parseInt(weekForm.maxAttempts),
          attemptScoringPolicy: weekForm.attemptScoringPolicy,
          shuffleQuestions: weekForm.shuffleQuestions,
          shuffleAnswers: weekForm.shuffleAnswers,
          requireFullscreen: weekForm.requireFullscreen,
          detectFullscreenExit: weekForm.detectFullscreenExit,
          detectTabSwitch: weekForm.detectTabSwitch,
          detectCopyPaste: weekForm.detectCopyPaste,
          autoSubmitOnViolationThreshold: parseInt(weekForm.autoSubmitOnViolationThreshold),
          marksPerCorrect: parseFloat(weekForm.marksPerCorrect),
          marksPerWrong: parseFloat(weekForm.marksPerWrong),
          marksUnanswered: parseFloat(weekForm.marksUnanswered)
        }
      };

      const res = await api.put(`/api/weekly-league/admin/weeks/${selectedWeek.id}`, payload);
      if (res.data.success) {
        setShowWeekModal(false);
        fetchInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save session settings');
    }
  };

  const handleTogglePublishWeek = async (weekId) => {
    try {
      await api.post(`/api/weekly-league/admin/weeks/${weekId}/publish`);
      fetchInitialData();
    } catch (err) {
      alert('Failed to toggle publish status');
    }
  };

  const loadAttemptLogs = async () => {
    if (!selectedLeague) return;
    try {
      const res = await api.get(`/api/weekly-league/admin/leagues/${selectedLeague.id}/attempts`);
      if (res.data.success) {
        setAttemptLogs(res.data.attempts || []);
      }
    } catch (err) {
      console.error('Fetch attempt logs error:', err);
    }
  };

  const handleToggleRepeatDay = (day) => {
    const cur = [...leagueForm.repeatDays];
    if (cur.includes(day)) {
      if (cur.length > 1) {
        setLeagueForm({ ...leagueForm, repeatDays: cur.filter(d => d !== day) });
      }
    } else {
      setLeagueForm({ ...leagueForm, repeatDays: [...cur, day] });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3 text-brand-blue font-extrabold text-sm">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading Scheduled Quiz & League Manager...</span>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-left font-segoe">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Admin Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quiz & Tech League Manager
            </h1>
            <p className="text-xs text-slate-500 font-medium">Configure Live Real-Time or Scheduled Normal Quizzes (Daily, Weekly, or Custom Dates).</p>
          </div>

          <button
            onClick={() => setShowLeagueModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create New Quiz Event / Series</span>
          </button>
        </div>

        {/* League Selector */}
        {leagues.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Active Quiz Series / League</span>
              <select
                value={selectedLeague?.id || ''}
                onChange={(e) => {
                  const l = leagues.find(item => item.id === e.target.value);
                  setSelectedLeague(l);
                }}
                className="block w-full sm:w-96 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none bg-slate-50"
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} [{l.type === 'LIVE_REALTIME' ? 'Live Quiz' : 'Scheduled Quiz'}] ({l.weeks?.length || 0} Sessions)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddWeekModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all cursor-pointer flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Add Custom Session</span>
              </button>
              <button
                onClick={() => { setActiveTab('weeks'); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'weeks' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Sessions ({selectedLeague?.weeks?.length || 0})
              </button>
              <button
                onClick={() => { setActiveTab('attempts'); loadAttemptLogs(); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'attempts' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Logs
              </button>
            </div>
          </div>
        )}

        {/* ════════ WEEKS / SESSIONS MANAGEMENT GRID ════════ */}
        {activeTab === 'weeks' && selectedLeague && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">{selectedLeague.name} — Scheduled Sessions</h2>
                <span className="text-xs text-slate-500">Configure quiz binding, opening & closing date-times, timers, anti-cheat, and positive/negative marks</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedLeague.weeks?.map((w) => (
                <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all relative group">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Session #{w.week_number}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePublishWeek(w.id)}
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider cursor-pointer ${
                            w.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {w.published ? 'Published' : 'Draft'}
                        </button>
                        <button
                          onClick={() => handleDeleteWeek(w.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">{w.technology}</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{w.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{w.description}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold space-y-1.5 border border-slate-100">
                      <div className="flex justify-between text-slate-600">
                        <span>Bound Quiz:</span>
                        <span className="text-slate-900 font-extrabold truncate max-w-[140px]">
                          {w.quiz?.title || 'None Attached'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Opening Window:</span>
                        <span className="text-slate-900 font-semibold">
                          {w.start_date_time ? new Date(w.start_date_time).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Timer / Attempts:</span>
                        <span>{w.settings?.timeLimit || 30} mins ({w.settings?.maxAttempts || 1} attempt)</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Marks (+ / -):</span>
                        <span className="text-emerald-600 font-black">+{w.settings?.marksPerCorrect || 4} / {w.settings?.marksPerWrong || -1}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditWeekClick(w)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-700 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Edit size={14} />
                    <span>Configure Session Settings</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ ATTEMPTS LOGS ════════ */}
        {activeTab === 'attempts' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Participant Attempt & Violation History</h3>

            {attemptLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No quiz attempt logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Time Taken</th>
                      <th className="py-3 px-4">Violations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-900">
                    {attemptLogs.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50 font-semibold">
                        <td className="py-3.5 px-4 font-bold">{att.user_name} ({att.user_college})</td>
                        <td className="py-3.5 px-4">{att.leagueWeek?.title}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            att.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-brand-blue">{att.score} pts</td>
                        <td className="py-3.5 px-4">{Math.floor((att.time_taken || 0) / 60)}m {att.time_taken % 60}s</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.violation_count > 0 ? 'bg-red-100 text-red-700 font-black' : 'text-slate-400'
                          }`}>
                            {att.violation_count || 0} violations
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════ CREATE LEAGUE / QUIZ EVENT MODAL ════════ */}
        {showLeagueModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-black text-slate-900">Create Quiz Event / Series</h3>
                <button onClick={() => setShowLeagueModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
              </div>

              <form onSubmit={handleCreateLeague} className="space-y-5">
                
                {/* Option 1 vs Option 2 Selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Quiz Mode *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLeagueForm({ ...leagueForm, type: 'LIVE_REALTIME' })}
                      className={`p-4 rounded-2xl border text-left space-y-1 cursor-pointer transition-all ${
                        leagueForm.type === 'LIVE_REALTIME' 
                          ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/30' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-slate-900">Option 1: Live Real-Time Quiz</div>
                      <div className="text-[11px] text-slate-500">Synchronous socket quiz for live host events</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLeagueForm({ ...leagueForm, type: 'SCHEDULED_LEAGUE' })}
                      className={`p-4 rounded-2xl border text-left space-y-1 cursor-pointer transition-all ${
                        leagueForm.type === 'SCHEDULED_LEAGUE' 
                          ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/30' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-slate-900">Option 2: Normal / Scheduled Quiz</div>
                      <div className="text-[11px] text-slate-500">Self-paced scheduled series (Daily, Weekly, or Custom)</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Event / Series Name *</label>
                  <input
                    type="text"
                    required
                    value={leagueForm.name}
                    onChange={e => setLeagueForm({ ...leagueForm, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <textarea
                    rows={2}
                    value={leagueForm.description}
                    onChange={e => setLeagueForm({ ...leagueForm, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50"
                  />
                </div>

                {/* Start Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={leagueForm.startDate}
                      onChange={e => setLeagueForm({ ...leagueForm, startDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">End Date *</label>
                    <input
                      type="date"
                      required
                      value={leagueForm.endDate}
                      onChange={e => setLeagueForm({ ...leagueForm, endDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                    />
                  </div>
                </div>

                {/* Recurrence Mode Selector */}
                {leagueForm.type === 'SCHEDULED_LEAGUE' && (
                  <div className="space-y-3 pt-2 border-t">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Schedule Recurrence Mode *</label>
                    <select
                      value={leagueForm.recurrence}
                      onChange={e => setLeagueForm({ ...leagueForm, recurrence: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-extrabold bg-slate-50"
                    >
                      <option value="weekly_1day">Weekly (1 day per week, e.g. 8 Weeks)</option>
                      <option value="daily">Repeat Daily (Every day from Start to End Date)</option>
                      <option value="weekly_multiple">Repeat on Multiple Specific Days of the Week</option>
                      <option value="specific_dates">Specific Custom Dates</option>
                    </select>

                    {/* Checkboxes for Multiple Days of the Week */}
                    {leagueForm.recurrence === 'weekly_multiple' && (
                      <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Select Active Days of Week:</span>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map(day => (
                            <label key={day} className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border cursor-pointer">
                              <input
                                type="checkbox"
                                checked={leagueForm.repeatDays.includes(day)}
                                onChange={() => handleToggleRepeatDay(day)}
                              />
                              <span>{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Text input for Specific Dates */}
                    {leagueForm.recurrence === 'specific_dates' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Specific Dates (Comma Separated YYYY-MM-DD)</label>
                        <input
                          type="text"
                          placeholder="2026-08-10, 2026-08-15, 2026-08-20"
                          value={leagueForm.customDatesInput}
                          onChange={e => setLeagueForm({ ...leagueForm, customDatesInput: e.target.value })}
                          className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowLeagueModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-blue text-white font-extrabold rounded-xl text-xs cursor-pointer"
                  >
                    Create Series & Generate Slots
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ ADD CUSTOM SESSION MODAL ════════ */}
        {showAddWeekModal && selectedLeague && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
              <h3 className="text-xl font-black text-slate-900">Add Custom Session / Week</h3>

              <form onSubmit={handleAddCustomWeek} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Session 9: Cloud Architecture"
                    value={addWeekForm.title}
                    onChange={e => setAddWeekForm({ ...addWeekForm, title: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Technology Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud"
                    value={addWeekForm.technology}
                    onChange={e => setAddWeekForm({ ...addWeekForm, technology: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Opening Date-Time</label>
                    <input
                      type="datetime-local"
                      value={addWeekForm.startDateTime}
                      onChange={e => setAddWeekForm({ ...addWeekForm, startDateTime: e.target.value })}
                      className="w-full border rounded-xl px-2 py-2 text-[11px] font-bold bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Closing Date-Time</label>
                    <input
                      type="datetime-local"
                      value={addWeekForm.endDateTime}
                      onChange={e => setAddWeekForm({ ...addWeekForm, endDateTime: e.target.value })}
                      className="w-full border rounded-xl px-2 py-2 text-[11px] font-bold bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWeekModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand-blue text-white font-extrabold rounded-xl text-xs cursor-pointer"
                  >
                    Add Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ CONFIGURE WEEK / SESSION MODAL ════════ */}
        {showWeekModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-black text-slate-900">Configure Session #{selectedWeek?.week_number}</h3>
                <button onClick={() => setShowWeekModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
              </div>

              <form onSubmit={handleSaveWeek} className="space-y-6">
                
                {/* General */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider border-b pb-1">1. Topic & Quiz Binding</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Quiz / Session Title *</label>
                      <input
                        type="text"
                        required
                        value={weekForm.title}
                        onChange={e => setWeekForm({ ...weekForm, title: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Technology Topic *</label>
                      <input
                        type="text"
                        required
                        value={weekForm.technology}
                        onChange={e => setWeekForm({ ...weekForm, technology: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Bind Existing Quiz / Questions</label>
                    <select
                      value={weekForm.quizId}
                      onChange={e => setWeekForm({ ...weekForm, quizId: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                    >
                      <option value="">-- No Quiz Attached --</option>
                      {availableQuizzes.map(q => (
                        <option key={q.id} value={q.id}>{q.title} ({q.subject})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timing */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider border-b pb-1">2. Availability Window & Timer</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Start Time (Opening)</label>
                      <input
                        type="datetime-local"
                        value={weekForm.startDateTime}
                        onChange={e => setWeekForm({ ...weekForm, startDateTime: e.target.value })}
                        className="w-full border rounded-xl px-2 py-2 text-[11px] font-bold bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">End Time (Closing)</label>
                      <input
                        type="datetime-local"
                        value={weekForm.endDateTime}
                        onChange={e => setWeekForm({ ...weekForm, endDateTime: e.target.value })}
                        className="w-full border rounded-xl px-2 py-2 text-[11px] font-bold bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Timer (Minutes)</label>
                      <input
                        type="number"
                        value={weekForm.timeLimit}
                        onChange={e => setWeekForm({ ...weekForm, timeLimit: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Anti-Cheat */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider border-b pb-1">3. Anti-Cheat & Security Config</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={weekForm.requireFullscreen}
                        onChange={e => setWeekForm({ ...weekForm, requireFullscreen: e.target.checked })}
                      />
                      <span>Require Fullscreen</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={weekForm.detectTabSwitch}
                        onChange={e => setWeekForm({ ...weekForm, detectTabSwitch: e.target.checked })}
                      />
                      <span>Detect Tab Switch & Blur</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={weekForm.shuffleQuestions}
                        onChange={e => setWeekForm({ ...weekForm, shuffleQuestions: e.target.checked })}
                      />
                      <span>Shuffle Questions per attempt</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={weekForm.shuffleAnswers}
                        onChange={e => setWeekForm({ ...weekForm, shuffleAnswers: e.target.checked })}
                      />
                      <span>Shuffle Options per attempt</span>
                    </label>
                  </div>
                </div>

                {/* Marks */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider border-b pb-1">4. Scoring Rules & Attempts</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Correct Marks (+)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={weekForm.marksPerCorrect}
                        onChange={e => setWeekForm({ ...weekForm, marksPerCorrect: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 text-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Wrong Marks (-)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={weekForm.marksPerWrong}
                        onChange={e => setWeekForm({ ...weekForm, marksPerWrong: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 text-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Attempts</label>
                      <input
                        type="number"
                        value={weekForm.maxAttempts}
                        onChange={e => setWeekForm({ ...weekForm, maxAttempts: e.target.value })}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowWeekModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-blue text-white font-extrabold rounded-xl text-xs cursor-pointer"
                  >
                    Save Session Configuration
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
