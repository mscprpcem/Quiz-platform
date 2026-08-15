import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Mail, Send, Users, CheckCircle2, AlertTriangle, Loader2, Sparkles,
  Filter, Search, RefreshCw, Eye, Edit3, ArrowRight, X, ExternalLink,
  BookOpen, Calendar, Radio, Check, Info, Layers, Tag, Award, UserCheck
} from 'lucide-react';

export default function AdminEmailDispatch() {
  const [loadingAudiences, setLoadingAudiences] = useState(true);
  const [audienceData, setAudienceData] = useState({
    all_students_count: 0,
    students: [],
    quizzes: []
  });

  // Audience selection: 'all_students' | 'quiz_participants' | 'custom'
  const [audienceType, setAudienceType] = useState('all_students');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  
  // Participant Sub-filter: 'all' | 'completed' | 'in_progress' | 'registered'
  const [participantFilter, setParticipantFilter] = useState('all');

  const [loadingQuizParticipants, setLoadingQuizParticipants] = useState(false);
  const [quizParticipants, setQuizParticipants] = useState([]);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);
  const [customEmailsText, setCustomEmailsText] = useState('');

  // Selected / Excluded recipients
  const [excludedEmails, setExcludedEmails] = useState(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');

  // Email Content
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // Active input ref for inserting tags
  const messageBodyRef = useRef(null);

  // UI state
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'preview'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Available dynamic tags from registration & quiz context
  const dynamicTags = [
    { label: 'Full Name', tag: '{name}', desc: 'Student Name' },
    { label: 'Email', tag: '{email}', desc: 'Email address' },
    { label: 'College', tag: '{college}', desc: 'College name' },
    { label: 'Quiz Title', tag: '{quiz_title}', desc: 'Title of quiz' },
    { label: 'Event Name', tag: '{event_name}', desc: 'Associated event' },
    { label: 'Score', tag: '{score}', desc: 'Achieved score' }
  ];

  // Fetch audiences on mount
  useEffect(() => {
    fetchAudiences();
  }, []);

  const fetchAudiences = async () => {
    try {
      setLoadingAudiences(true);
      setErrorMessage('');
      const res = await api.get('/api/admin/email-dispatch/audiences');
      if (res.data.success) {
        setAudienceData({
          all_students_count: res.data.all_students_count || 0,
          students: res.data.students || [],
          quizzes: res.data.quizzes || []
        });
        if (res.data.quizzes.length > 0 && !selectedQuizId) {
          setSelectedQuizId(res.data.quizzes[0].id);
          setSelectedQuizInfo(res.data.quizzes[0]);
        }
      }
    } catch (err) {
      console.error('Error loading audiences:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to load recipient audiences.');
    } finally {
      setLoadingAudiences(false);
    }
  };

  // Fetch participants when quiz selection changes
  useEffect(() => {
    if (audienceType === 'quiz_participants' && selectedQuizId) {
      const found = audienceData.quizzes.find(q => String(q.id) === String(selectedQuizId));
      if (found) setSelectedQuizInfo(found);
      fetchQuizParticipants(selectedQuizId);
    }
  }, [audienceType, selectedQuizId, audienceData.quizzes]);

  const fetchQuizParticipants = async (quizId) => {
    try {
      setLoadingQuizParticipants(true);
      const res = await api.get(`/api/admin/email-dispatch/quiz-participants?quizId=${quizId}`);
      if (res.data.success) {
        setQuizParticipants(res.data.participants || []);
        if (res.data.quiz) {
          setSelectedQuizInfo(res.data.quiz);
        }
        setExcludedEmails(new Set());
      }
    } catch (err) {
      console.error('Error loading quiz participants:', err);
    } finally {
      setLoadingQuizParticipants(false);
    }
  };

  // Insert dynamic tag into message body
  const insertTag = (tag) => {
    if (messageBodyRef.current) {
      const textarea = messageBodyRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newText = messageBody.substring(0, start) + tag + messageBody.substring(end);
      setMessageBody(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      setMessageBody(prev => prev + ' ' + tag);
    }
  };

  // Resolve current active list of recipients with sub-filter applied
  const getCurrentRecipients = () => {
    let list = [];
    if (audienceType === 'all_students') {
      list = audienceData.students.map(s => ({
        email: (s.email || '').toLowerCase().trim(),
        name: s.name || s.email.split('@')[0],
        college: s.college || '',
        meta: s.college || 'Registered Student',
        status: 'registered'
      }));
    } else if (audienceType === 'quiz_participants') {
      list = quizParticipants.filter(p => {
        const st = (p.status || '').toLowerCase();
        if (participantFilter === 'completed') return st === 'completed' || st === 'finished';
        if (participantFilter === 'in_progress') return st === 'in_progress' || st === 'started';
        if (participantFilter === 'registered') return st === 'registered' || (st !== 'completed' && st !== 'finished');
        return true; // 'all'
      }).map(p => ({
        email: (p.email || '').toLowerCase().trim(),
        name: p.name,
        college: p.college || '',
        meta: p.source || 'Participant',
        status: p.status || 'registered',
        score: p.score
      }));
    } else if (audienceType === 'custom') {
      const emails = customEmailsText
        .split(/[\n,;]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes('@'));
      list = Array.from(new Set(emails)).map(e => ({
        email: e,
        name: e.split('@')[0],
        meta: 'Custom Email',
        status: 'custom'
      }));
    }

    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      list = list.filter(r => r.email.includes(q) || r.name.toLowerCase().includes(q) || (r.college && r.college.toLowerCase().includes(q)));
    }

    return list;
  };

  const currentRecipients = getCurrentRecipients();
  const activeCount = currentRecipients.filter(r => !excludedEmails.has(r.email)).length;

  const toggleExcludeEmail = (email) => {
    setExcludedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (excludedEmails.size === 0) {
      setExcludedEmails(new Set(currentRecipients.map(r => r.email)));
    } else {
      setExcludedEmails(new Set());
    }
  };

  // Quick preset templates with dynamic tags
  const applyPreset = (type) => {
    const qTitle = selectedQuizInfo?.title || '{quiz_title}';
    const evName = selectedQuizInfo?.event_name || '{event_name}';

    if (type === 'reminder') {
      setSubject(`⏳ Reminder: ${qTitle} Starts Soon!`);
      setHeading(`${evName} — ${qTitle}`);
      setMessageBody(
        `Hello {name},\n\nThis is a friendly reminder that your registered quiz session for "${qTitle}" is scheduled to begin shortly.\n\nPlease ensure you have a stable internet connection, sign in to your student account ({email}), and be ready to begin on time.\n\nBest of luck!\n— Microsoft Student Club PRPCEM`
      );
      setCtaText('Launch Quiz Assessment');
      setCtaUrl(window.location.origin + '/courses');
    } else if (type === 'results') {
      setSubject(`🏆 Results & Leaderboard Announced: ${qTitle}`);
      setHeading(`${qTitle} Results Published`);
      setMessageBody(
        `Hello {name},\n\nThe official scores and performance rankings for "${qTitle}" have been verified and published!\n\nLog in to review your detailed scorecard, view your standing among participants from {college}, and access your digital certificate.\n\nThank you for participating!`
      );
      setCtaText('View Leaderboard & Badges');
      setCtaUrl(window.location.origin + '/login');
    } else if (type === 'announcement') {
      setSubject(`📢 New Challenge Live: ${qTitle} — ${evName}`);
      setHeading(`New Event: ${evName}`);
      setMessageBody(
        `Hello {name},\n\nA brand new technical assessment "${qTitle}" is now live on the Microsoft Student Club Quiz Platform!\n\nTest your knowledge, compete on the live leaderboard, and earn digital certificate credentials to showcase your skills.`
      );
      setCtaText('Browse Available Quizzes');
      setCtaUrl(window.location.origin + '/courses');
    }
  };

  // Send Broadcast
  const handleDispatch = async () => {
    setDispatching(true);
    setErrorMessage('');
    try {
      const res = await api.post('/api/admin/email-dispatch/send', {
        audienceType,
        quizId: audienceType === 'quiz_participants' ? selectedQuizId : undefined,
        participantFilter: audienceType === 'quiz_participants' ? participantFilter : undefined,
        customEmails: audienceType === 'custom' ? customEmailsText : undefined,
        excludedEmails: Array.from(excludedEmails),
        subject,
        heading: heading || subject,
        messageBody,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined
      });

      if (res.data.success) {
        setDispatchResult(res.data);
        setShowConfirmModal(false);
      } else {
        setErrorMessage(res.data.error || 'Failed to dispatch emails.');
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch email broadcast.');
    } finally {
      setDispatching(false);
    }
  };

  // Helper for live preview rendering with sample student substitution
  const sampleRecipient = currentRecipients[0] || {
    name: 'Amit Yadav',
    email: 'amit.yadav@example.com',
    college: 'PRPCEM Amravati',
    score: 85
  };

  const renderPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/\{name\}/gi, sampleRecipient.name || 'Amit Yadav')
      .replace(/\{student_name\}/gi, sampleRecipient.name || 'Amit Yadav')
      .replace(/\{email\}/gi, sampleRecipient.email || 'student@example.com')
      .replace(/\{college\}/gi, sampleRecipient.college || 'PRPCEM Amravati')
      .replace(/\{quiz_title\}/gi, selectedQuizInfo?.title || 'Technical Quiz Challenge')
      .replace(/\{event_name\}/gi, selectedQuizInfo?.event_name || 'MSC Tech Masterclass')
      .replace(/\{score\}/gi, sampleRecipient.score != null ? String(sampleRecipient.score) : '85')
      .replace(/\{status\}/gi, sampleRecipient.status || 'Registered');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left pb-12 font-segoe max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-black uppercase tracking-wider text-blue-700 mb-2">
            <Mail size={13} className="text-blue-600" />
            <span>Communications Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Email Broadcast & Dispatch Center
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Personalize and broadcast notification emails with dynamic tags like <code className="text-blue-600 font-bold">{'{name}'}</code>, <code className="text-blue-600 font-bold">{'{college}'}</code>, and <code className="text-blue-600 font-bold">{'{quiz_title}'}</code>.
          </p>
        </div>

        <button
          onClick={fetchAudiences}
          disabled={loadingAudiences}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loadingAudiences ? 'animate-spin' : ''} />
          <span>Refresh Audiences</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {dispatchResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between space-x-4 shadow-sm animate-fade-in">
          <div className="flex items-start space-x-3">
            <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-emerald-900">Email Broadcast Successful!</h3>
              <p className="text-xs text-emerald-800 font-medium">
                {dispatchResult.message} Dispatched to <strong>{dispatchResult.sentCount}</strong> active recipient(s).
              </p>
            </div>
          </div>
          <button
            onClick={() => setDispatchResult(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs font-bold text-red-700 space-x-3 animate-shake">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Grid: Left Audience & Recipients, Right Composer & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ════════ LEFT COLUMN: RECIPIENT AUDIENCE SELECTION (5 cols) ════════ */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={18} className="text-blue-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Select Audience</h2>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-black">
                {activeCount} Active
              </span>
            </div>

            {/* Audience Type Radio Pills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setAudienceType('all_students'); setExcludedEmails(new Set()); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  audienceType === 'all_students'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Students ({audienceData.all_students_count})
              </button>

              <button
                type="button"
                onClick={() => { setAudienceType('quiz_participants'); setExcludedEmails(new Set()); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  audienceType === 'quiz_participants'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                By Quiz ({audienceData.quizzes.length})
              </button>

              <button
                type="button"
                onClick={() => { setAudienceType('custom'); setExcludedEmails(new Set()); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  audienceType === 'custom'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Custom List
              </button>
            </div>

            {/* When By Quiz is selected: Quiz Dropdown + Participant Subset Filters */}
            {audienceType === 'quiz_participants' && (
              <div className="space-y-3.5 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Select Quiz Assessment</label>
                  <select
                    value={selectedQuizId}
                    onChange={(e) => {
                      setSelectedQuizId(e.target.value);
                      const q = audienceData.quizzes.find(item => String(item.id) === String(e.target.value));
                      if (q) setSelectedQuizInfo(q);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                  >
                    {audienceData.quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} — [{q.event_name || 'MSC Event'}] ({q.mode || 'LIVE'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participant Filter Pills: All, Completed, In Progress, Registered */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Participant Filter Group
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('all')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        participantFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({quizParticipants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('completed')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        participantFilter === 'completed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('in_progress')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        participantFilter === 'in_progress' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      In-Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('registered')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        participantFilter === 'registered' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Registered
                    </button>
                  </div>
                </div>

                {/* Selected Quiz Details Badge */}
                {selectedQuizInfo && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-950 truncate">{selectedQuizInfo.title}</span>
                      <span className="text-[10px] font-black uppercase bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded">
                        {selectedQuizInfo.mode || 'LIVE'}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-800 font-semibold">
                      Event: <span className="font-bold text-blue-900">{selectedQuizInfo.event_name || 'MSC Tech Event'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Emails Textarea (when custom is active) */}
            {audienceType === 'custom' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700">Enter Recipient Emails</label>
                <textarea
                  rows={4}
                  value={customEmailsText}
                  onChange={(e) => setCustomEmailsText(e.target.value)}
                  placeholder="student1@gmail.com, student2@gmail.com&#10;student3@gmail.com"
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                />
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Separate emails with commas, semicolons, or line breaks.
                </span>
              </div>
            )}

            {/* Recipient Search & Toggle Bar */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Target Recipients ({currentRecipients.length})</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  {excludedEmails.size === 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, email, or college..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              {/* Scrollable Recipient Checkbox List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {loadingQuizParticipants ? (
                  <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    <span>Loading participants...</span>
                  </div>
                ) : currentRecipients.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-semibold">
                    No participants match current filter.
                  </div>
                ) : (
                  currentRecipients.map((rec) => {
                    const isChecked = !excludedEmails.has(rec.email);
                    const st = (rec.status || '').toLowerCase();
                    const statusBadgeClass =
                      st === 'completed' || st === 'finished'
                        ? 'bg-emerald-100 text-emerald-800'
                        : st === 'in_progress' || st === 'started'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800';

                    return (
                      <div
                        key={rec.email}
                        onClick={() => toggleExcludeEmail(rec.email)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/50 border-blue-200 text-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold flex items-center space-x-1.5 truncate">
                            <span>{rec.name}</span>
                            {rec.status && (
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${statusBadgeClass}`}>
                                {rec.status}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{rec.email}</div>
                          {rec.college && (
                            <div className="text-[9px] text-slate-400 font-medium truncate">{rec.college}</div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 pointer-events-none cursor-pointer"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ════════ RIGHT COLUMN: COMPOSER & PREVIEW (7 cols) ════════ */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            
            {/* View Mode Toggle Tabs & Presets */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    activeTab === 'compose'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Compose Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye size={14} />
                  <span>Live Preview</span>
                </button>
              </div>

              {/* Quick Template Presets */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('reminder')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Reminder
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('results')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Results
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('announcement')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  New Quiz
                </button>
              </div>
            </div>

            {/* COMPOSE TAB */}
            {activeTab === 'compose' ? (
              <div className="space-y-4">
                
                {/* Dynamic Variable Chips / Tags */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                      <Tag size={13} className="text-blue-600" />
                      <span>Insert Dynamic Registration Field:</span>
                    </div>
                    <span className="text-[10px] text-blue-700 font-medium">Click to insert at cursor</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {dynamicTags.map((dt) => (
                      <button
                        key={dt.tag}
                        type="button"
                        onClick={() => insertTag(dt.tag)}
                        title={dt.desc}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1 active:scale-95"
                      >
                        <span>+ {dt.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🚀 Reminder: {quiz_title} Begins at 6:00 PM"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Heading / Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Header Title</label>
                  <input
                    type="text"
                    placeholder="e.g. {event_name} — {quiz_title}"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Message Body *</label>
                  <textarea
                    ref={messageBodyRef}
                    rows={6}
                    required
                    placeholder="Hello {name},\n\nEnter your message content here. You can use dynamic placeholders like {name}, {email}, {college}, and {quiz_title}..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-4 text-xs font-medium leading-relaxed bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>

                {/* Optional Call to Action Button */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-800">
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Optional Call-to-Action (CTA) Button</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Start {quiz_title}"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Button Target Link (URL)</label>
                      <input
                        type="url"
                        placeholder="https://quiz.mscprpcem.tech/courses"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  disabled={!subject.trim() || !messageBody.trim() || activeCount === 0}
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 mt-2"
                >
                  <Send size={15} />
                  <span>Dispatch Email Broadcast ({activeCount} Recipients)</span>
                </button>

              </div>
            ) : (
              /* LIVE PREVIEW TAB (WITH SAMPLE DATA SUBSTITUTION) */
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info size={16} className="text-blue-600 flex-shrink-0" />
                    <span>Rendered preview for: <strong>{sampleRecipient.name}</strong> ({sampleRecipient.email})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded font-mono text-[10px]">
                    {sampleRecipient.college || 'PRPCEM'}
                  </span>
                </div>

                {/* Email Mock Preview Card */}
                <div className="border border-slate-200 rounded-2xl bg-slate-100 p-4 sm:p-6 overflow-hidden">
                  <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden text-center">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                      <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                        Microsoft Student Club PRPCEM
                      </div>
                      <h2 className="text-xl font-black text-slate-900">
                        {renderPreviewText(heading || subject) || 'MSC PRPCEM Announcement'}
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-left text-xs text-slate-700 leading-relaxed space-y-3">
                      {messageBody ? (
                        renderPreviewText(messageBody).split('\n\n').map((par, i) => (
                          <p key={i} className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                            {par}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">No message body entered yet.</p>
                      )}

                      {ctaText && ctaUrl && (
                        <div className="text-center pt-3 pb-1">
                          <span className="inline-block py-2.5 px-6 bg-blue-600 text-white font-extrabold rounded-xl text-xs shadow-md">
                            {renderPreviewText(ctaText)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                      Official communication from MSC Quiz Platform • PRPCEM Amravati
                    </div>

                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('compose')}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                  >
                    ← Edit Content
                  </button>

                  <button
                    type="button"
                    disabled={!subject.trim() || !messageBody.trim() || activeCount === 0}
                    onClick={() => setShowConfirmModal(true)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>Proceed to Dispatch</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ════════ CONFIRMATION MODAL ════════ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-xs">
              <Send size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Confirm Email Broadcast</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                You are about to dispatch this personalized email to <strong>{activeCount}</strong> recipient(s).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
              <div className="font-bold text-slate-900 truncate">
                <span className="text-slate-500">Subject:</span> {subject}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                <span className="text-slate-500">Audience:</span>{' '}
                {audienceType === 'all_students'
                  ? 'All Registered Students'
                  : audienceType === 'quiz_participants'
                  ? `Quiz: ${selectedQuizInfo?.title || 'Selected Quiz'} (${participantFilter.toUpperCase()})`
                  : 'Custom Email List'}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={dispatching}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatching}
                className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {dispatching ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
