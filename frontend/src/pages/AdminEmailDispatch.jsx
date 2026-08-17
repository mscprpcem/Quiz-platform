import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Mail, Send, Users, CheckCircle2, AlertTriangle, Loader2, Sparkles,
  Filter, Search, RefreshCw, Eye, Edit3, ArrowRight, X, ExternalLink,
  BookOpen, Calendar, Radio, Check, Info, Layers, Tag, Award, UserCheck, Folder
} from 'lucide-react';

export default function AdminEmailDispatch() {
  const [searchParams] = useSearchParams();
  const [loadingAudiences, setLoadingAudiences] = useState(true);
  const [audienceData, setAudienceData] = useState({
    all_students_count: 0,
    students: [],
    quizzes: [],
    events: []
  });

  // Audience selection: 'all_students' | 'event_registrants' | 'quiz_participants' | 'custom'
  const [audienceType, setAudienceType] = useState('all_students');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventInfo, setSelectedEventInfo] = useState(null);
  
  // Participant Sub-filter: 'all' | 'completed' | 'in_progress' | 'registered'
  const [participantFilter, setParticipantFilter] = useState('all');

  const [loadingQuizParticipants, setLoadingQuizParticipants] = useState(false);
  const [quizParticipants, setQuizParticipants] = useState([]);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);

  const [loadingEventParticipants, setLoadingEventParticipants] = useState(false);
  const [eventParticipants, setEventParticipants] = useState([]);

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
    { label: 'Event Name', tag: '{event_name}', desc: 'Associated event' },
    { label: 'Quiz Title', tag: '{quiz_title}', desc: 'Title of quiz' },
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
        const eventsList = res.data.events || [];
        const quizzesList = res.data.quizzes || [];

        setAudienceData({
          all_students_count: res.data.all_students_count || 0,
          students: res.data.students || [],
          quizzes: quizzesList,
          events: eventsList
        });

        // Check if URL has ?eventId= or ?event=
        const urlEventId = searchParams.get('eventId') || searchParams.get('event');
        const urlEventName = searchParams.get('event') || searchParams.get('eventName');

        if (urlEventId && eventsList.length > 0) {
          const urlLower = String(urlEventId).toLowerCase().trim();
          const matchEv = eventsList.find(e =>
            String(e.id).toLowerCase() === urlLower ||
            String(e.slug || '').toLowerCase() === urlLower ||
            e.name.toLowerCase() === urlLower ||
            e.name.toLowerCase().includes(urlLower) ||
            urlLower.includes(e.name.toLowerCase()) ||
            e.id.replace(/[^a-z0-9]/g, '') === urlLower.replace(/[^a-z0-9]/g, '')
          );

          const targetEvent = matchEv || { id: urlEventId, name: urlEventName || urlEventId };
          setAudienceType('event_registrants');
          setSelectedEventId(targetEvent.id);
          setSelectedEventInfo(targetEvent);
          fetchEventParticipants(targetEvent.id, targetEvent.name);

          // Auto-populate default template for this event
          setSubject(`📢 Announcement: Upcoming Technical Tracks for ${targetEvent.name}`);
          setHeading(`Welcome to ${targetEvent.name}`);
          setMessageBody(
            `Hello {name},\n\nWe are thrilled to welcome you to "${targetEvent.name}"! All assessment tracks, workshop links, and challenges are now active for participants from {college}.\n\nPlease review the guidelines and schedule below.\n\nRegards,\nMicrosoft Student Club PRPCEM`
          );
          setCtaText('Access Participant Portal');
          setCtaUrl(window.location.origin + '/courses');
          return;
        }

        if (quizzesList.length > 0 && !selectedQuizId) {
          setSelectedQuizId(quizzesList[0].id);
          setSelectedQuizInfo(quizzesList[0]);
        }
        if (eventsList.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsList[0].id);
          setSelectedEventInfo(eventsList[0]);
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

  // Fetch participants when event selection changes
  useEffect(() => {
    if (audienceType === 'event_registrants' && selectedEventId) {
      const found = audienceData.events.find(e => String(e.id) === String(selectedEventId));
      if (found) setSelectedEventInfo(found);
      fetchEventParticipants(selectedEventId, found?.name);
    }
  }, [audienceType, selectedEventId, audienceData.events]);

  const fetchQuizParticipants = async (quizId) => {
    try {
      setLoadingQuizParticipants(true);
      const res = await api.get(`/api/admin/email-dispatch/quiz-participants?quizId=${encodeURIComponent(quizId)}`);
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

  const fetchEventParticipants = async (eventId, eventName) => {
    try {
      setLoadingEventParticipants(true);
      const evNameQuery = eventName ? `&eventName=${encodeURIComponent(eventName)}` : '';
      const res = await api.get(`/api/admin/email-dispatch/event-participants?eventId=${encodeURIComponent(eventId)}${evNameQuery}`);
      if (res.data.success) {
        setEventParticipants(res.data.participants || []);
        setExcludedEmails(new Set());
      }
    } catch (err) {
      console.error('Error loading event participants:', err);
    } finally {
      setLoadingEventParticipants(false);
    }
  };

  // Insert dynamic tag into message body
  const insertTag = (tag) => {
    if (messageBodyRef.current) {
      const textarea = messageBodyRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = textarea.value;
      const replacement = text.substring(0, start) + tag + text.substring(end);
      setMessageBody(replacement);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setMessageBody(prev => prev + ' ' + tag);
    }
  };

  // Compute active list of recipients based on selected audience
  const getCurrentRecipients = () => {
    let list = [];

    if (audienceType === 'all_students') {
      list = audienceData.students.map(s => ({
        email: (s.email || '').toLowerCase().trim(),
        name: s.name,
        college: s.college || '',
        meta: s.username ? `@${s.username}` : 'Student',
        status: 'registered'
      }));
    } else if (audienceType === 'event_registrants') {
      list = eventParticipants.map(p => ({
        email: (p.email || '').toLowerCase().trim(),
        name: p.name,
        college: p.college || '',
        meta: p.branch ? `${p.branch} (${p.year || ''})` : (p.source || 'Website Registered'),
        status: p.status || 'registered',
        phone: p.phone
      }));
    } else if (audienceType === 'quiz_participants') {
      list = quizParticipants.filter(p => {
        const st = (p.status || '').toLowerCase();
        if (participantFilter === 'completed') return st === 'completed' || st === 'finished';
        if (participantFilter === 'in_progress') return st === 'in_progress' || st === 'started';
        if (participantFilter === 'registered') return st === 'registered';
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
    const evName = selectedEventInfo?.name || selectedQuizInfo?.event_name || '{event_name}';

    if (type === 'reminder') {
      setSubject(`⏳ Reminder: ${evName} Assessment Starts Soon!`);
      setHeading(`${evName} Updates`);
      setMessageBody(
        `Hello {name},\n\nThis is a friendly reminder that your registered technical session for "${evName}" is scheduled to begin shortly.\n\nPlease ensure you have a stable internet connection, sign in with your email ({email}), and be ready on time.\n\nBest of luck!\n— Microsoft Student Club PRPCEM`
      );
      setCtaText('Launch Event Assessment');
      setCtaUrl(window.location.origin + '/courses');
    } else if (type === 'results') {
      setSubject(`🏆 Results & Leaderboard Announced: ${evName}`);
      setHeading(`${evName} Results Published`);
      setMessageBody(
        `Hello {name},\n\nThe official scores and performance rankings for "${evName}" have been verified and published!\n\nLog in to review your detailed scorecard, view your standing among participants from {college}, and access your digital certificate.\n\nThank you for participating!`
      );
      setCtaText('View Scorecard & Certificate');
      setCtaUrl(window.location.origin + '/student/profile');
    } else if (type === 'congratulations') {
      setSubject(`🎉 Congratulations on Completing ${evName}!`);
      setHeading(`Outstanding Achievement!`);
      setMessageBody(
        `Hello {name},\n\nCongratulations on successfully participating in "${evName}" organized by the Microsoft Student Club PRPCEM!\n\nYour verified digital credential is now ready to claim and showcase on your LinkedIn profile.\n\nKeep learning and building!`
      );
      setCtaText('Claim Digital Badge & Certificate');
      setCtaUrl(window.location.origin + '/student/profile');
    } else if (type === 'event_announcement') {
      setSubject(`📢 Announcement: Upcoming Technical Tracks for ${evName}`);
      setHeading(`Welcome to ${evName}`);
      setMessageBody(
        `Hello {name},\n\nWe are thrilled to welcome you to "${evName}"! All assessment tracks, workshop links, and challenges are now active for participants from {college}.\n\nPlease review the guidelines and schedule below.\n\nRegards,\nMicrosoft Student Club PRPCEM`
      );
      setCtaText('Access Participant Portal');
      setCtaUrl(window.location.origin + '/courses');
    }
  };

  // Submit email dispatch
  const handleSendDispatch = async () => {
    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject line.');
      return;
    }
    if (!messageBody.trim()) {
      setErrorMessage('Please write a message body.');
      return;
    }
    if (activeCount === 0) {
      setErrorMessage('No active recipient emails selected to dispatch.');
      return;
    }

    try {
      setDispatching(true);
      setErrorMessage('');

      const res = await api.post('/api/admin/email-dispatch/send', {
        audienceType,
        eventId: audienceType === 'event_registrants' ? selectedEventId : undefined,
        eventName: audienceType === 'event_registrants' ? (selectedEventInfo?.name || searchParams.get('event')) : undefined,
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
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to dispatch email broadcast.');
      setShowConfirmModal(false);
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

  const currentEventTitle = selectedEventInfo?.name || searchParams.get('event') || selectedQuizInfo?.event_name || 'MSC Tech Masterclass';

  const renderPreviewText = (text) => {
    if (!text) return '';
    return text
      .replace(/\{name\}/gi, sampleRecipient.name || 'Amit Yadav')
      .replace(/\{student_name\}/gi, sampleRecipient.name || 'Amit Yadav')
      .replace(/\{email\}/gi, sampleRecipient.email || 'student@example.com')
      .replace(/\{college\}/gi, sampleRecipient.college || 'PRPCEM Amravati')
      .replace(/\{quiz_title\}/gi, selectedQuizInfo?.title || currentEventTitle)
      .replace(/\{event_name\}/gi, currentEventTitle)
      .replace(/\{score\}/gi, sampleRecipient.score != null ? String(sampleRecipient.score) : '85')
      .replace(/\{status\}/gi, sampleRecipient.status || 'Registered');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left pb-12 font-segoe max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600"></div>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] font-black uppercase tracking-wider text-purple-700 mb-2">
            <Mail size={13} className="text-purple-600" />
            <span>Communications Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Email Broadcast & Dispatch Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dispatch personalized announcements, quiz reminders, results, and certificates with dynamic placeholder tagging.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAudiences}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors cursor-pointer"
            title="Refresh audiences"
          >
            <RefreshCw size={16} className={loadingAudiences ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {dispatchResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-start space-x-3">
            <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-emerald-900">Email Broadcast Successful!</h3>
              <p className="text-xs text-emerald-800 font-medium">
                {dispatchResult.message} Dispatched to <strong>{dispatchResult.successCount}</strong> active recipient(s).
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setAudienceType('all_students'); setExcludedEmails(new Set()); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  audienceType === 'all_students'
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Users ({audienceData.all_students_count})
              </button>

              <button
                type="button"
                onClick={() => { setAudienceType('event_registrants'); setExcludedEmails(new Set()); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  audienceType === 'event_registrants'
                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-2xs font-black'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                By Event ({audienceData.events?.length || 0})
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
                Custom
              </button>
            </div>

            {/* When By Event is selected: Event Dropdown */}
            {audienceType === 'event_registrants' && (
              <div className="space-y-3.5 animate-fade-in bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-purple-900">Select Official Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      const ev = audienceData.events.find(item => String(item.id) === String(e.target.value));
                      if (ev) setSelectedEventInfo(ev);
                    }}
                    className="w-full border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white text-slate-800 focus:border-purple-600 outline-none"
                  >
                    {audienceData.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} — ({ev.registration_count || 0} Registered Students)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-[11px] font-bold text-purple-700 flex items-center justify-between">
                  <span>Enrolled from Website Form:</span>
                  <span className="bg-purple-200/80 px-2 py-0.5 rounded-md text-purple-900 font-black">
                    {eventParticipants.length} Participant(s)
                  </span>
                </div>
              </div>
            )}

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
                      In Progress
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
              </div>
            )}

            {/* When Custom List is selected */}
            {audienceType === 'custom' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700">Paste Comma or Line-Separated Emails</label>
                <textarea
                  rows={4}
                  value={customEmailsText}
                  onChange={(e) => setCustomEmailsText(e.target.value)}
                  placeholder="student1@prpcem.ac.in, student2@gmail.com..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600 outline-none font-mono"
                />
              </div>
            )}

            {/* Recipient Search & Exclusion Table */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in recipient list..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap px-2"
                >
                  {excludedEmails.size === 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Scrollable Recipient Checkboxes List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {currentRecipients.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-bold">
                    No recipients matching current filter.
                  </div>
                ) : (
                  currentRecipients.map((r) => {
                    const isChecked = !excludedEmails.has(r.email);
                    return (
                      <div
                        key={r.email}
                        onClick={() => toggleExcludeEmail(r.email)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                          isChecked
                            ? 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                            : 'bg-slate-100/60 border-transparent text-slate-400 line-through opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-slate-800 text-[11px] truncate">
                              {r.name || r.email.split('@')[0]}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{r.email}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {r.college && (
                            <span className="text-[9px] font-bold text-slate-500 block truncate max-w-[120px]">
                              {r.college}
                            </span>
                          )}
                          {r.meta && (
                            <span className="text-[9px] font-extrabold text-blue-600 block">{r.meta}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: COMPOSER & PREVIEW TABS (7 cols) ════════ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Preset Buttons */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-purple-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Template Presets</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('event_announcement')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-[11px] font-black text-purple-700 transition-all cursor-pointer text-center"
              >
                📢 Announcement
              </button>
              <button
                type="button"
                onClick={() => applyPreset('reminder')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-[11px] font-black text-blue-700 transition-all cursor-pointer text-center"
              >
                ⏳ Session Reminder
              </button>
              <button
                type="button"
                onClick={() => applyPreset('results')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-[11px] font-black text-emerald-700 transition-all cursor-pointer text-center"
              >
                🏆 Results & Rank
              </button>
              <button
                type="button"
                onClick={() => applyPreset('congratulations')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-[11px] font-black text-amber-700 transition-all cursor-pointer text-center"
              >
                🎉 Claim Certificate
              </button>
            </div>
          </div>

          {/* Tab Switcher: Compose vs Live Preview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === 'compose'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Compose Broadcast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Eye size={14} />
                  <span>Student Live Preview</span>
                </button>
              </div>

              <div className="text-[11px] font-black text-slate-500">
                To: <span className="text-blue-600">{activeCount} Recipient(s)</span>
              </div>
            </div>

            {/* COMPOSE TAB */}
            {activeTab === 'compose' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Dynamic Tag Selector Pills */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} className="text-purple-600" />
                    <span>Click to Insert Dynamic Placeholder Tag:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicTags.map((dt) => (
                      <button
                        key={dt.tag}
                        type="button"
                        onClick={() => insertTag(dt.tag)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-black border border-slate-200 transition-all cursor-pointer flex items-center space-x-1"
                        title={dt.desc}
                      >
                        <code>{dt.tag}</code>
                        <span className="text-[9px] text-slate-400 font-normal">({dt.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Subject Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 📢 Important Update: VisionX Season 2 Assessment Details"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                {/* Email Heading */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Banner Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. VisionX Season 2 — Track 1 Assessment"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Personalized Message Body *</label>
                  <textarea
                    ref={messageBodyRef}
                    rows={8}
                    required
                    placeholder="Hello {name},\n\nWe are pleased to invite you to the upcoming session for {event_name}...\n\nRegards,\nMicrosoft Student Club PRPCEM"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600 font-sans leading-relaxed"
                  />
                </div>

                {/* Action CTA Button Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Call-to-Action Button Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Launch Assessment"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Call-to-Action URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Dispatch Trigger Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={activeCount === 0 || !subject.trim() || !messageBody.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>Review & Dispatch ({activeCount} Emails)</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] font-bold text-blue-800 flex items-center justify-between">
                  <span>Showing dynamic preview for sample student: <strong>{sampleRecipient.name}</strong> ({sampleRecipient.email})</span>
                  <span className="text-blue-600 font-extrabold">{sampleRecipient.college}</span>
                </div>

                {/* Rendered Email Template Mock */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-[#f8fafc]">
                  <div className="bg-[#0078D4] p-5 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-sm">
                        MS
                      </div>
                      <div>
                        <h4 className="text-sm font-black tracking-tight">{renderPreviewText(heading || subject || 'MSC Announcement')}</h4>
                        <p className="text-[10px] text-white/80 font-medium">Microsoft Student Club PRPCEM</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white space-y-4 text-xs text-slate-800 font-sans leading-relaxed">
                    <div className="border-b border-slate-100 pb-2 text-[11px] text-slate-500">
                      <strong>Subject:</strong> {renderPreviewText(subject || '(No Subject)')}
                    </div>

                    <div className="whitespace-pre-line text-slate-700">
                      {renderPreviewText(messageBody || 'Your email message body will be rendered here with personalized tags.')}
                    </div>

                    {ctaText && (
                      <div className="pt-3">
                        <span className="inline-block px-5 py-2.5 bg-[#0078D4] text-white font-bold rounded-xl text-xs shadow-xs">
                          {renderPreviewText(ctaText)} ↗
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
                      <p>© 2026 Microsoft Student Club PRPCEM. All rights reserved.</p>
                      <p>P. R. Pote Patil College of Engineering & Management, Amravati.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Email Broadcast</h3>
                <p className="text-xs text-slate-500">Personalized emails will be dispatched via SMTP.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 font-bold text-slate-700">
              <div className="flex justify-between">
                <span>Audience Mode:</span>
                <span className="text-blue-600 uppercase">{audienceType}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Recipients:</span>
                <span className="text-emerald-700 font-black">{activeCount} Student(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Subject:</span>
                <span className="truncate max-w-[200px] text-slate-900">{subject}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDispatch}
                disabled={dispatching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {dispatching && <Loader2 size={14} className="animate-spin" />}
                <span>{dispatching ? 'Sending Broadcast...' : 'Yes, Dispatch Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
