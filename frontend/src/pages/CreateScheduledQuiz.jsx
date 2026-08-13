import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import {
  Calendar, ArrowLeft, ArrowRight, Plus, Trash2, Upload, FileSpreadsheet,
  CheckCircle, AlertTriangle, Clock, ShieldCheck, HelpCircle, Layers, CheckSquare, Sparkles, RefreshCw, QrCode, Mail
} from 'lucide-react';

export default function CreateScheduledQuiz() {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, mode is EDIT

  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(isEditMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeFormat12, setTimeFormat12] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();
  const currentAmpm = currentHour >= 12 ? 'PM' : 'AM';
  const startHh = String((currentHour % 12) || 12).padStart(2, '0');
  const endHour = (currentHour + 2) % 24;
  const endAmpm = endHour >= 12 ? 'PM' : 'AM';
  const endHh = String((endHour % 12) || 12).padStart(2, '0');

  const [formData, setFormData] = useState({
    title: '',
    custom_slug: '',
    description: '',
    category: 'Cloud',
    difficulty: 'Intermediate',
    instructions: 'Complete all questions within the allocated time window.',
    schedule_type: 'ONE_TIME',
    start_date: today,
    end_date: nextMonth,
    
    // Time with seconds & AM/PM
    start_time_hh: startHh,
    start_time_mm: '00',
    start_time_ss: '00',
    start_time_ampm: currentAmpm,

    end_time_hh: endHh,
    end_time_mm: '00',
    end_time_ss: '00',
    end_time_ampm: endAmpm,

    timezone: 'Asia/Kolkata',

    // Granular Recurrence Settings
    days_of_week: ['MON'],
    weeks_pattern: '1_3',
    day_of_month: 1,
    custom_interval_days: 3,

    // Quiz Rules & Proctoring
    time_limit: 30,
    max_attempts: 1,
    score_policy: 'BEST',
    shuffle_questions: true,
    shuffle_answers: true,
    require_fullscreen: false,
    anti_cheat_enabled: true,
    max_violations: 3,
    positive_marks: 1,
    negative_marks: 0,
    show_leaderboard: true,

    // Questions List
    questions: []
  });

  // Pre-fill quiz data if editing
  useEffect(() => {
    if (!id) return;
    const fetchQuizDetails = async () => {
      try {
        setLoadingQuiz(true);
        const res = await api.get(`/api/scheduled-quizzes/${id}`);
        const q = res.data?.quiz;
        if (q) {
          let sConf = {};
          try { sConf = typeof q.schedule_config === 'string' ? JSON.parse(q.schedule_config) : (q.schedule_config || {}); } catch(e){}

          setFormData({
            title: q.title || '',
            custom_slug: q.custom_slug || '',
            description: q.description || '',
            category: q.subject || 'Cloud',
            difficulty: q.difficulty || 'Intermediate',
            instructions: q.instructions || '',
            schedule_type: q.schedule_type || 'ONE_TIME',
            start_date: q.scheduled_start ? new Date(q.scheduled_start).toISOString().split('T')[0] : today,
            end_date: q.scheduled_end ? new Date(q.scheduled_end).toISOString().split('T')[0] : nextMonth,
            start_time_hh: '10',
            start_time_mm: '00',
            start_time_ss: '00',
            start_time_ampm: 'AM',
            end_time_hh: '11',
            end_time_mm: '00',
            end_time_ss: '00',
            end_time_ampm: 'AM',
            timezone: q.timezone || 'Asia/Kolkata',
            days_of_week: sConf.daysOfWeek || ['MON'],
            weeks_pattern: sConf.weeksPattern || '1_3',
            day_of_month: sConf.dayOfMonth || 1,
            custom_interval_days: sConf.customIntervalDays || 3,
            time_limit: q.time_limit || 30,
            max_attempts: q.max_attempts !== undefined ? q.max_attempts : 1,
            score_policy: q.score_policy || 'BEST',
            shuffle_questions: q.shuffle_questions !== undefined ? q.shuffle_questions : true,
            shuffle_answers: q.shuffle_answers !== undefined ? q.shuffle_answers : true,
            require_fullscreen: q.require_fullscreen !== undefined ? q.require_fullscreen : false,
            anti_cheat_enabled: q.anti_cheat_enabled !== undefined ? q.anti_cheat_enabled : true,
            max_violations: q.max_violations || 3,
            positive_marks: q.positive_marks || 1,
            negative_marks: q.negative_marks || 0,
            show_leaderboard: q.show_leaderboard !== undefined ? q.show_leaderboard : true,
            questions: q.questions || []
          });
        }
      } catch (err) {
        console.error('Fetch quiz for edit error:', err);
        setErrorMessage('Failed to load quiz details for editing.');
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizDetails();
  }, [id]);

  // Helper to format start/end time into 24-hour HH:mm:ss string for API payload
  const buildTimeString = (hh, mm, ss, ampm) => {
    let h = parseInt(hh || '0', 10);
    if (timeFormat12) {
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = (mm || '00').padStart(2, '0');
    const sStr = (ss || '00').padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  };

  // Step Validation Enforcer
  const validateTab = (tabIndex) => {
    setErrorMessage('');
    if (tabIndex === 1) {
      if (!formData.title.trim()) {
        setErrorMessage('Quiz Title is required.');
        return false;
      }
      if (!formData.start_date || !formData.end_date) {
        setErrorMessage('Start Date and End Date are required.');
        return false;
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        setErrorMessage('Start Date cannot be after End Date.');
        return false;
      }
    }
    return true;
  };

  const handleNextTab = () => {
    if (validateTab(activeTab)) {
      setActiveTab(prev => Math.min(4, prev + 1));
    }
  };

  // CSV / Excel File Upload & Parser
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          alert('No question rows found in uploaded file.');
          return;
        }

        const parsedQuestions = rawData.map((row, idx) => {
          // Normalize column names flexibly
          const qText = row.Question || row.question || row.QuestionText || row.Prompt || '';
          const optA = row['Option A'] || row.option_a || row.OptionA || row.A || '';
          const optB = row['Option B'] || row.option_b || row.OptionB || row.B || '';
          const optC = row['Option C'] || row.option_c || row.OptionC || row.C || '';
          const optD = row['Option D'] || row.option_d || row.OptionD || row.D || '';
          const correct = (row['Correct Answer'] || row.correct_answer || row.Correct || row.Answer || 'A').toString().trim().toUpperCase();
          const explanation = row.Explanation || row.explanation || '';

          return {
            question: qText,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_answer: ['A', 'B', 'C', 'D'].includes(correct) ? correct : 'A',
            explanation
          };
        }).filter(q => q.question);

        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...parsedQuestions]
        }));

        alert(`Successfully imported ${parsedQuestions.length} questions from ${file.name}!`);
      } catch (err) {
        console.error('CSV/Excel parse error:', err);
        alert('Failed to parse spreadsheet. Please ensure standard column headers: Question, Option A, Option B, Option C, Option D, Correct Answer.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          explanation: ''
        }
      ]
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, questions: updated }));
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index)
    }));
  };

  const handleToggleDayOfWeek = (dayCode) => {
    setFormData(prev => {
      const exists = prev.days_of_week.includes(dayCode);
      const updated = exists 
        ? prev.days_of_week.filter(d => d !== dayCode)
        : [...prev.days_of_week, dayCode];
      return { ...prev, days_of_week: updated.length ? updated : [dayCode] };
    });
  };

  // Download Excel Template with sample rows
  const handleDownloadTemplate = () => {
    const sampleData = [
      { 'Question': 'What does CPU stand for?', 'Option A': 'Central Processing Unit', 'Option B': 'Central Program Utility', 'Option C': 'Computer Personal Unit', 'Option D': 'Central Processor Unifier', 'Correct Answer': 'A', 'Explanation': 'CPU = Central Processing Unit' },
      { 'Question': 'Which data structure uses FIFO?', 'Option A': 'Stack', 'Option B': 'Queue', 'Option C': 'Tree', 'Option D': 'Graph', 'Correct Answer': 'B', 'Explanation': 'Queue uses First In First Out' },
      { 'Question': 'HTML stands for?', 'Option A': 'Hyper Trainer Marking Language', 'Option B': 'Hyper Text Marketing Language', 'Option C': 'Hyper Text Markup Language', 'Option D': 'Hyper Text Markup Leveler', 'Correct Answer': 'C', 'Explanation': '' }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 40 }
    ];
    
    XLSX.writeFile(wb, 'quiz_questions_template.xlsx');
  };

  const handlePublishSubmit = async () => {
    if (!validateTab(1)) return;

    const startTimeStr = buildTimeString(formData.start_time_hh, formData.start_time_mm, formData.start_time_ss, formData.start_time_ampm);
    const endTimeStr = buildTimeString(formData.end_time_hh, formData.end_time_mm, formData.end_time_ss, formData.end_time_ampm);

    const payload = {
      title: formData.title,
      custom_slug: formData.custom_slug,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      instructions: formData.instructions,
      schedule_type: formData.schedule_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: startTimeStr,
      end_time: endTimeStr,
      timezone: formData.timezone,
      time_limit: formData.time_limit,
      max_attempts: formData.max_attempts,
      score_policy: formData.score_policy,
      shuffle_questions: formData.shuffle_questions,
      shuffle_answers: formData.shuffle_answers,
      require_fullscreen: formData.require_fullscreen,
      anti_cheat_enabled: formData.anti_cheat_enabled,
      max_violations: formData.max_violations,
      positive_marks: formData.positive_marks,
      negative_marks: formData.negative_marks,
      show_leaderboard: formData.show_leaderboard,
      questions: formData.questions,
      schedule_config: {
        daysOfWeek: formData.days_of_week,
        weeksPattern: formData.weeks_pattern,
        dayOfMonth: formData.day_of_month,
        customIntervalDays: formData.custom_interval_days
      }
    };

    try {
      setSaving(true);
      if (isEditMode) {
        await api.put(`/api/scheduled-quizzes/${id}`, payload);
        alert('Scheduled Quiz updated successfully!');
      } else {
        await api.post('/api/scheduled-quizzes', payload);
        alert('Scheduled Quiz published successfully!');
      }
      navigate('/admin/scheduled-quizzes');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save scheduled quiz.');
    } finally {
      setSaving(false);
    }
  };

  const DAYS = [
    { code: 'MON', label: 'Mon' },
    { code: 'TUE', label: 'Tue' },
    { code: 'WED', label: 'Wed' },
    { code: 'THU', label: 'Thu' },
    { code: 'FRI', label: 'Fri' },
    { code: 'SAT', label: 'Sat' },
    { code: 'SUN', label: 'Sun' }
  ];

  if (loadingQuiz) {
    return (
      <div className="py-20 text-center text-slate-400 font-extrabold animate-pulse">
        Loading quiz details for editing...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left font-segoe pb-16">
      
      {/* ════════ HEADER BAR ════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/scheduled-quizzes')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Back to Scheduled Quizzes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
              {isEditMode ? 'Scheduled Quiz Editor' : 'Scheduled Quiz Creator'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {isEditMode ? 'Edit Scheduled Quiz' : 'Create Scheduled Quiz'}
            </h1>
          </div>
        </div>

        <button
          onClick={handlePublishSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Publish Scheduled Quiz'}
        </button>
      </div>

      {/* ════════ STEP TABS ════════ */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-2 shadow-2xs space-x-2 overflow-x-auto">
        {[
          { id: 1, title: '1. Basic & Recurrence' },
          { id: 2, title: `2. Questions & Excel Import (${formData.questions.length})` },
          { id: 3, title: '3. Rules & Proctoring' },
          { id: 4, title: '4. Review & Publish' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (validateTab(activeTab)) setActiveTab(tab.id);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ════════ TAB 1: BASIC INFORMATION & RECURRENCE ════════ */}
      {activeTab === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xs">
          
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Basic Quiz Details</h3>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Quiz Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Azure Fundamentals Weekly Assessment"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QrCode size={18} className="text-blue-600" />
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                    Custom URL Slug & QR Code Direct Join
                  </span>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase">
                  Instant Mobile Access
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Custom Short Link (Vanity Slug)</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl whitespace-nowrap">
                      {typeof window !== 'undefined' ? `${window.location.host}/q/` : 'quiz.mscprpcem.tech/q/'}
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. test"
                      value={formData.custom_slug}
                      onChange={e => setFormData({ ...formData, custom_slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                      className="w-full border border-blue-300 rounded-xl px-3.5 py-2 text-xs font-black text-blue-700 bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                    Students visiting <strong className="text-blue-600">{typeof window !== 'undefined' ? window.location.host : 'quiz.mscprpcem.tech'}/q/{formData.custom_slug || 'test'}</strong> or scanning the QR code will open this quiz session directly.
                  </p>
                </div>

                {/* Live QR Code Preview */}
                <div className="bg-white p-3 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-2xs">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://quiz.mscprpcem.tech'}/q/${formData.custom_slug || 'test'}`}
                    size={84}
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                    level="M"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Scan to Join Direct</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Description</label>
              <textarea
                rows={3}
                placeholder="Overview of topics tested, guidelines, and passing criteria..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-semibold bg-slate-50 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                >
                  <option value="Cloud">Cloud & Azure</option>
                  <option value="DBMS">Database Management</option>
                  <option value="DSA">Data Structures & Algo</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Programming">Programming Languages</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Recurrence Section */}
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recurrence & Time Window</h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Schedule Pattern</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-bold">
                {['ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      const isOneTime = st === 'ONE_TIME';
                      setFormData(prev => ({
                        ...prev,
                        schedule_type: st,
                        end_date: isOneTime ? prev.start_date : (prev.end_date === prev.start_date ? nextMonth : prev.end_date)
                      }));
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      formData.schedule_type === st 
                        ? 'bg-blue-600 text-white font-black border-blue-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Weekly / Biweekly Days Selection */}
            {(formData.schedule_type === 'WEEKLY' || formData.schedule_type === 'BIWEEKLY') && (
              <div className="p-5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-blue-900 block">Select Active Day(s) of the Week</span>
                
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const isSelected = formData.days_of_week.includes(day.code);
                    return (
                      <button
                        key={day.code}
                        type="button"
                        onClick={() => handleToggleDayOfWeek(day.code)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>

                {formData.schedule_type === 'BIWEEKLY' && (
                  <div className="space-y-1 pt-2 border-t border-blue-200/60">
                    <label className="block text-xs font-bold text-slate-700">Biweekly Week Pattern</label>
                    <select
                      value={formData.weeks_pattern}
                      onChange={e => setFormData({ ...formData, weeks_pattern: e.target.value })}
                      className="border rounded-xl px-3 py-2 text-xs font-bold bg-white"
                    >
                      <option value="1_3">1st & 3rd Weeks of the Month</option>
                      <option value="2_4">2nd & 4th Weeks of the Month</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Monthly Day Selection */}
            {formData.schedule_type === 'MONTHLY' && (
              <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-purple-900 block">Monthly Schedule Option</span>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold text-slate-600">Run on Day of Month:</span>
                  <select
                    value={formData.day_of_month}
                    onChange={e => setFormData({ ...formData, day_of_month: parseInt(e.target.value, 10) })}
                    className="border rounded-xl px-3 py-2 text-xs font-bold bg-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Day {num}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Interval Configuration */}
            {formData.schedule_type === 'CUSTOM' && (
              <div className="p-5 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-4">
                <span className="text-xs font-extrabold text-amber-900 block">Custom Repeat Interval</span>
                
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold text-slate-600">Repeat Every</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.custom_interval_days}
                    onChange={e => setFormData({ ...formData, custom_interval_days: parseInt(e.target.value, 10) || 3 })}
                    className="w-16 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                  />
                  <span className="font-bold text-slate-600">Day(s)</span>
                </div>

                <div className="space-y-2 pt-2 border-t border-amber-200/60">
                  <span className="text-xs font-bold text-slate-700 block">Active Day(s) of the Week (Optional)</span>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const isSelected = formData.days_of_week.includes(day.code);
                      return (
                        <button
                          key={day.code}
                          type="button"
                          onClick={() => handleToggleDayOfWeek(day.code)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {formData.schedule_type === 'ONE_TIME' ? (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">
                  Date of Event / Quiz <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, start_date: val, end_date: val }));
                  }}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Start Date (Series Starts) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    End Date (Series Ends) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
                  />
                </div>
              </div>
            )}

            {/* Time Window with Seconds & 12h / 24h Toggle */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {formData.schedule_type === 'ONE_TIME' ? 'Quiz Slot Time Window' : 'Daily Time Window (HH:MM:SS)'}
                </span>
                
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <span className="text-slate-400">Format:</span>
                  <button
                    type="button"
                    onClick={() => setTimeFormat12(!timeFormat12)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-blue-600 font-extrabold cursor-pointer"
                  >
                    {timeFormat12 ? '12-Hour AM/PM' : '24-Hour'}
                  </button>
                </div>
              </div>

              {/* Start Time & End Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Start Time */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    {formData.schedule_type === 'ONE_TIME' ? 'Quiz Start Time' : 'Daily Start Time'}
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="1"
                      max={timeFormat12 ? 12 : 23}
                      placeholder="HH"
                      value={formData.start_time_hh}
                      onChange={e => setFormData({ ...formData, start_time_hh: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={formData.start_time_mm}
                      onChange={e => setFormData({ ...formData, start_time_mm: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={formData.start_time_ss}
                      onChange={e => setFormData({ ...formData, start_time_ss: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />

                    {timeFormat12 && (
                      <select
                        value={formData.start_time_ampm}
                        onChange={e => setFormData({ ...formData, start_time_ampm: e.target.value })}
                        className="border rounded-xl p-2 text-xs font-bold bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* End Time */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    {formData.schedule_type === 'ONE_TIME' ? 'Quiz End Time' : 'Daily End Time'}
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="1"
                      max={timeFormat12 ? 12 : 23}
                      placeholder="HH"
                      value={formData.end_time_hh}
                      onChange={e => setFormData({ ...formData, end_time_hh: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="MM"
                      value={formData.end_time_mm}
                      onChange={e => setFormData({ ...formData, end_time_mm: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="SS"
                      value={formData.end_time_ss}
                      onChange={e => setFormData({ ...formData, end_time_ss: e.target.value })}
                      className="w-14 border rounded-xl p-2 text-center text-xs font-bold bg-white"
                    />

                    {timeFormat12 && (
                      <select
                        value={formData.end_time_ampm}
                        onChange={e => setFormData({ ...formData, end_time_ampm: e.target.value })}
                        className="border rounded-xl p-2 text-xs font-bold bg-white"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleNextTab}
              className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>Next: Add Questions & Import</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* ════════ TAB 2: QUESTIONS & CSV/EXCEL BULK IMPORT ════════ */}
      {activeTab === 2 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Questions Management ({formData.questions.length})</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Upload a CSV/Excel file or add questions manually.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Download Template Button */}
              <button
                onClick={handleDownloadTemplate}
                type="button"
                className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-extrabold rounded-xl text-xs flex items-center space-x-2 cursor-pointer transition-all"
              >
                <ArrowLeft size={14} className="rotate-[-90deg]" />
                <span>Download Template</span>
              </button>

              {/* CSV / Excel Bulk Uploader Button */}
              <label className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-extrabold rounded-xl text-xs flex items-center space-x-2 cursor-pointer transition-all">
                <FileSpreadsheet size={16} />
                <span>Upload CSV / Excel</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleAddQuestion}
                className="px-4 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Verification Table Preview */}
          {formData.questions.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-4">
              <FileSpreadsheet size={44} className="mx-auto text-slate-300" />
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800">No Questions Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Upload a `.csv` or `.xlsx` spreadsheet with headers: <code>Question, Option A, Option B, Option C, Option D, Correct Answer</code> or add questions manually.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {formData.questions.map((q, idx) => (
                <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-blue-600">Question #{idx + 1}</span>
                    <button onClick={() => handleRemoveQuestion(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter question text..."
                    value={q.question}
                    onChange={e => handleQuestionChange(idx, 'question', e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs font-bold bg-white"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={q.option_a}
                      onChange={e => handleQuestionChange(idx, 'option_a', e.target.value)}
                      className="border rounded-xl px-3 py-2 text-xs bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={q.option_b}
                      onChange={e => handleQuestionChange(idx, 'option_b', e.target.value)}
                      className="border rounded-xl px-3 py-2 text-xs bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={q.option_c}
                      onChange={e => handleQuestionChange(idx, 'option_c', e.target.value)}
                      className="border rounded-xl px-3 py-2 text-xs bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={q.option_d}
                      onChange={e => handleQuestionChange(idx, 'option_d', e.target.value)}
                      className="border rounded-xl px-3 py-2 text-xs bg-white font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-bold text-slate-600">Correct Option:</span>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleQuestionChange(idx, 'correct_answer', opt)}
                        className={`w-8 h-8 rounded-xl font-black text-xs cursor-pointer ${
                          q.correct_answer === opt ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setActiveTab(1)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Previous Step</span>
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-sm"
            >
              <span>Next: Rules & Proctoring</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      )}

      {/* ════════ TAB 3: RULES & PROCTORING ════════ */}
      {activeTab === 3 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Quiz Rules & Anti-Cheat Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Time Limit (Minutes)</label>
              <input
                type="number"
                value={formData.time_limit}
                onChange={e => setFormData({ ...formData, time_limit: parseInt(e.target.value, 10) })}
                className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">Max Attempts Per User</label>
              <select
                value={formData.max_attempts}
                onChange={e => setFormData({ ...formData, max_attempts: parseInt(e.target.value, 10) })}
                className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold bg-white"
              >
                <option value={1}>1 Attempt (Default)</option>
                <option value={2}>2 Attempts</option>
                <option value={3}>3 Attempts</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shuffle_questions}
                onChange={e => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Shuffle Questions Order</span>
            </label>

            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shuffle_answers}
                onChange={e => setFormData({ ...formData, shuffle_answers: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Shuffle Answer Options</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_fullscreen}
                onChange={e => setFormData({ ...formData, require_fullscreen: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Require Fullscreen Mode</span>
            </label>

            <label className="flex items-center space-x-3 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.anti_cheat_enabled}
                onChange={e => setFormData({ ...formData, anti_cheat_enabled: e.target.checked })}
                className="rounded text-blue-600 w-4 h-4"
              />
              <span>Enable Anti-Cheat Detection</span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setActiveTab(2)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Previous Step</span>
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className="px-6 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-sm"
            >
              <span>Next: Review & Publish</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ════════ TAB 4: REVIEW & PUBLISH ════════ */}
      {activeTab === 4 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs text-left">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b pb-2">Review Scheduled Quiz Configuration</h3>

          <div className="p-6 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3 text-xs font-semibold text-slate-700">
            <div><strong>Title:</strong> {formData.title}</div>
            <div><strong>Schedule Pattern:</strong> {formData.schedule_type}</div>
            <div><strong>Date Window:</strong> {formData.start_date} to {formData.end_date}</div>
            <div><strong>Daily Time Window:</strong> {buildTimeString(formData.start_time_hh, formData.start_time_mm, formData.start_time_ss, formData.start_time_ampm)} to {buildTimeString(formData.end_time_hh, formData.end_time_mm, formData.end_time_ss, formData.end_time_ampm)} ({formData.timezone})</div>
            <div><strong>Total Questions:</strong> {formData.questions.length} Questions</div>
            <div><strong>Time Limit:</strong> {formData.time_limit} Mins</div>
            <div><strong>Proctoring:</strong> {formData.anti_cheat_enabled ? 'Anti-Cheat Enabled' : 'Standard'}</div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setActiveTab(3)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handlePublishSubmit}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
            >
              {saving ? 'Publishing...' : 'Publish Scheduled Quiz'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
