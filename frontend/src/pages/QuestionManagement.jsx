import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import { toggleOptionInSelection, normalizeSelection } from '../utils/fullscreen';

/* ── Correct answer option key → label ── */
const OPTION_LABELS = { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' };

export default function QuestionManagement() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formError, setFormError] = useState('');

  // Bulk timer states
  const [showBulkTimerModal, setShowBulkTimerModal] = useState(false);
  const [bulkTimerVal, setBulkTimerVal] = useState(30);
  const [bulkTimerSaving, setBulkTimerSaving] = useState(false);

  const handleBulkTimerUpdate = async (e) => {
    e.preventDefault();
    try {
      setBulkTimerSaving(true);
      await api.put(`/api/quizzes/${id}/questions/timer`, { timer: bulkTimerVal });
      toast.success(`Default timer set to ${bulkTimerVal} seconds for all questions.`);
      setShowBulkTimerModal(false);
      loadQuizDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update bulk timer.');
    } finally {
      setBulkTimerSaving(false);
    }
  };

  // Form state
  const [form, setForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    question_type: 'single',
    timer: 30,
    marks: 500,
    difficulty: 'Intermediate'
  });

  const loadQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${id}`);
      setQuiz(res.data);
    } catch (err) {
      console.error(err);
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuizDetails(); }, [id]);

  const handleOpenForm = (q = null) => {
    if (q) {
      const qType = q.question_type || (q.correct_answer && q.correct_answer.includes(',') ? 'multiple' : 'single');
      setSelectedQuestion(q);
      setForm({
        question: q.question,
        option_a: q.option_a || 'True',
        option_b: q.option_b || 'False',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_answer: q.correct_answer || 'A',
        question_type: qType,
        timer: q.timer,
        marks: q.marks,
        difficulty: q.difficulty || 'Intermediate'
      });
    } else {
      setSelectedQuestion(null);
      setForm({
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        question_type: 'single',
        timer: 30,
        marks: 500,
        difficulty: quiz?.difficulty || 'Intermediate'
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!form.question || !form.option_a || !form.option_b) {
      setFormError('Please fill in the question statement and options.');
      return;
    }
    if (form.question_type !== 'true_false' && (!form.option_c || !form.option_d)) {
      setFormError('Please provide all four options (A, B, C, D) for multiple choice questions.');
      return;
    }
    if (!form.correct_answer) {
      setFormError('Please select at least one correct option.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        correct_answer: normalizeSelection(form.correct_answer)
      };

      if (selectedQuestion) {
        await api.put(`/api/quizzes/questions/${selectedQuestion.id}`, payload);
      } else {
        await api.post(`/api/quizzes/${id}/questions`, payload);
      }
      setShowModal(false);
      loadQuizDetails();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (confirm('Are you sure you want to remove this question?')) {
      try {
        await api.delete(`/api/quizzes/questions/${qId}`);
        loadQuizDetails();
      } catch (err) {
        alert('Error deleting question.');
      }
    }
  };

  if (loading && !quiz) {
    return <div className="text-center py-24 font-semibold text-brand-textMuted animate-pulse">Loading question sheet...</div>;
  }

  const handleDownloadTemplate = (format = 'xlsx') => {
    const sampleData = [
      {
        'Question': 'What does CPU stand for in computer systems?',
        'Option A': 'Central Processing Unit',
        'Option B': 'Central Program Utility',
        'Option C': 'Computer Personal Unit',
        'Option D': 'Central Processor Unifier',
        'Correct Answer': 'A',
        'Question Type': 'Single Choice',
        'Timer': 30,
        'Marks': 500,
        'Explanation': 'CPU is the Central Processing Unit that executes instructions.'
      },
      {
        'Question': 'HTTP transmits data in cleartext without encryption by default.',
        'Option A': 'True',
        'Option B': 'False',
        'Option C': '',
        'Option D': '',
        'Correct Answer': 'A',
        'Question Type': 'True/False',
        'Timer': 20,
        'Marks': 500,
        'Explanation': 'True. HTTP is unencrypted; HTTPS provides TLS/SSL encryption.'
      },
      {
        'Question': 'Relational databases only support unstructured JSON documents.',
        'Option A': 'True',
        'Option B': 'False',
        'Option C': '',
        'Option D': '',
        'Correct Answer': 'B',
        'Question Type': 'True/False',
        'Timer': 20,
        'Marks': 500,
        'Explanation': 'False. Relational databases are structured around schema-defined tables.'
      },
      {
        'Question': 'Which of the following are valid NoSQL database models? (Select all that apply)',
        'Option A': 'Document Stores (e.g. MongoDB)',
        'Option B': 'Key-Value Stores (e.g. Redis)',
        'Option C': 'Relational Tables (e.g. MySQL)',
        'Option D': 'Wide-Column Stores (e.g. Cassandra)',
        'Correct Answer': 'A, B, D',
        'Question Type': 'Multiple Choice',
        'Timer': 45,
        'Marks': 500,
        'Explanation': 'Document, Key-Value, and Wide-Column are NoSQL models. MySQL is relational.'
      },
      {
        'Question': 'Which of the following are primitive data types in JavaScript? (Select all that apply)',
        'Option A': 'String',
        'Option B': 'Number',
        'Option C': 'Object',
        'Option D': 'Boolean',
        'Correct Answer': 'A, B, D',
        'Question Type': 'Multiple Choice',
        'Timer': 30,
        'Marks': 500,
        'Explanation': 'String, Number, and Boolean are primitives; Object is a reference type.'
      }
    ];
    
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'live_quiz_questions_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      ws['!cols'] = [
        { wch: 45 }, // Question
        { wch: 32 }, // Option A
        { wch: 32 }, // Option B
        { wch: 32 }, // Option C
        { wch: 32 }, // Option D
        { wch: 18 }, // Correct Answer
        { wch: 18 }, // Question Type
        { wch: 10 }, // Timer
        { wch: 10 }, // Marks
        { wch: 45 }  // Explanation
      ];
      XLSX.writeFile(wb, 'live_quiz_questions_template.xlsx');
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/api/quizzes/${id}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data?.message || 'Questions successfully imported!', 'Import Complete');
      await loadQuizDetails();
    } catch (err) {
      console.error('Import error:', err);
      const details = err.response?.data?.details;
      const errorMsg = err.response?.data?.error || 'Failed to import spreadsheet.';
      if (details && Array.isArray(details)) {
        toast.error(`${errorMsg}: ${details.slice(0, 3).join(', ')}${details.length > 3 ? '...' : ''}`, 'Import Error');
      } else {
        toast.error(errorMsg, 'Import Error');
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-brand-border p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 border border-brand-border hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain rounded-xl transition-all flex-shrink-0 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">{quiz?.event_name}</p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-brand-textMain tracking-tight leading-tight mt-0.5">
              {quiz?.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          {/* Download Template Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              type="button"
              className="flex items-center justify-center gap-1.5 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Download Microsoft Excel (.xlsx) Template with Single Choice, True/False & Multi-Choice Examples"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span>Excel Template</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              type="button"
              className="flex items-center justify-center gap-1.5 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Download Standard CSV (.csv) Template"
            >
              <FileText size={13} className="text-blue-600" />
              <span>CSV Template</span>
            </button>
          </div>

          {/* Upload Excel / CSV */}
          <label className={`flex items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer ${
            importing ? 'opacity-70 pointer-events-none' : ''
          }`}>
            <Upload size={14} className={importing ? 'animate-spin' : ''} />
            <span>{importing ? 'Importing...' : 'Import (.xlsx / .csv)'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleExcelUpload}
              disabled={importing}
              className="hidden"
            />
          </label>

          {quiz?.questions?.length > 0 && (
            <button
              onClick={() => setShowBulkTimerModal(true)}
              className="flex items-center justify-center gap-2 border border-brand-border bg-white hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Clock size={16} />
              Set All Timers
            </button>
          )}
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      {/* ── Questions List ── */}
      <div className="space-y-4">
        {quiz?.questions?.map((q, idx) => {
          const qType = q.question_type || (q.correct_answer && q.correct_answer.includes(',') ? 'multiple' : 'single');
          const correctKeys = normalizeSelection(q.correct_answer).split(',').filter(Boolean);
          const isTF = qType === 'true_false';

          return (
            <div
              key={q.id}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Question header */}
              <div className="px-5 py-3.5 bg-brand-bgLight/40 border-b border-brand-border/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-brand-blue text-white text-xs font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  
                  {/* Type badge */}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    isTF
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : qType === 'multiple'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {isTF ? 'True / False' : qType === 'multiple' ? '☑ Multi-Choice' : 'Single Choice'}
                  </span>

                  <span className="text-xs font-semibold text-brand-textMuted flex items-center gap-1">
                    <Clock size={12} /> {q.timer}s
                  </span>
                  <span className="text-xs font-semibold text-brand-textMuted flex items-center gap-1">
                    <Award size={12} /> {q.marks} pts
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    (q.difficulty || 'Intermediate').toLowerCase().includes('easy')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : (q.difficulty || 'Intermediate').toLowerCase().includes('hard')
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {q.difficulty || 'Medium'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenForm(q)}
                    className="p-1.5 hover:bg-white text-brand-textMuted hover:text-brand-blue rounded-lg border border-transparent hover:border-brand-border transition-all cursor-pointer"
                    title="Edit question"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 hover:bg-red-50 text-brand-textMuted hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Question body */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm sm:text-base font-bold text-brand-textMain leading-snug">{q.question}</p>

                <div className={`grid gap-2 ${isTF ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {(isTF ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((key) => {
                    const text = isTF ? (key === 'A' ? 'True' : 'False') : q[`option_${key.toLowerCase()}`];
                    const isCorrect = correctKeys.includes(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-650'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-550'
                        }`}>
                          {key}
                        </span>
                        <span className="truncate font-semibold">{text || `Option ${key}`}</span>
                        {isCorrect && <CheckCircle2 size={14} className="ml-auto text-emerald-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {quiz?.questions?.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-3 text-brand-textMuted bg-white border border-dashed border-brand-border rounded-2xl">
            <HelpCircle size={36} className="opacity-30" />
            <p className="text-sm font-semibold">No questions yet</p>
            <p className="text-xs">Click <span className="font-bold text-brand-textMuted">Add Question</span> or import an Excel sheet to get started.</p>
          </div>
        )}
      </div>
    </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ADD / EDIT QUESTION MODAL
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
            <form
              onSubmit={handleSaveQuestion}
              onClick={(e) => e.stopPropagation()}
              className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal header (fixed) */}
              <div className="relative bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-4 flex items-start gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">
                    {selectedQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    {selectedQuestion ? 'Update the question details below.' : 'Fill in the question, options, and correct answer.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ml-auto w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal form body (scrollable) */}
              <div className="overflow-y-auto p-6 space-y-4 flex-grow min-h-0">
                {formError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Question text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.question}
                    onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                    placeholder="e.g. Which Azure service is used for serverless computing?"
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm resize-none"
                  />
                </div>

                {/* Question Type Toggle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                    Question Format
                  </label>
                  <div className="flex items-center bg-brand-bgLight border border-brand-border rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(p => ({
                          ...p,
                          question_type: 'single',
                          correct_answer: (p.correct_answer || 'A').split(',')[0] || 'A'
                        }));
                      }}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        form.question_type === 'single' ? 'bg-brand-blue text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, question_type: 'multiple' }));
                      }}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        form.question_type === 'multiple' ? 'bg-purple-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      ☑ Multi-Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(p => ({
                          ...p,
                          question_type: 'true_false',
                          option_a: 'True',
                          option_b: 'False',
                          option_c: '',
                          option_d: '',
                          correct_answer: ['A', 'B'].includes(p.correct_answer) ? p.correct_answer : 'A'
                        }));
                      }}
                      className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        form.question_type === 'true_false' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      True / False
                    </button>
                  </div>
                </div>

                {/* Answer options */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      {form.question_type === 'true_false' ? 'True / False Options' : 'Answer Options'} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-brand-textMuted font-semibold">
                      {form.question_type === 'multiple' ? 'Click option badges to toggle correct answers' : 'Mark the correct answer below'}
                    </span>
                  </div>

                  {form.question_type === 'true_false' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        form.correct_answer === 'A' ? 'border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-300/30' : 'border-brand-border bg-brand-bgLight/50'
                      }`}>
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">A</span>
                          <span className="font-extrabold text-sm text-slate-900">True</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, correct_answer: 'A' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            form.correct_answer === 'A' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {form.correct_answer === 'A' ? '✓ Correct' : 'Mark Correct'}
                        </button>
                      </div>

                      <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        form.correct_answer === 'B' ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-300/30' : 'border-brand-border bg-brand-bgLight/50'
                      }`}>
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">B</span>
                          <span className="font-extrabold text-sm text-slate-900">False</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, correct_answer: 'B' }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            form.correct_answer === 'B' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {form.correct_answer === 'B' ? '✓ Correct' : 'Mark Correct'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((key) => {
                        const field = `option_${key.toLowerCase()}`;
                        const selectedKeys = normalizeSelection(form.correct_answer).split(',').filter(Boolean);
                        const isCorrect = selectedKeys.includes(key);

                        const handleToggle = () => {
                          if (form.question_type === 'multiple') {
                            const next = toggleOptionInSelection(form.correct_answer, key);
                            setForm(p => ({ ...p, correct_answer: next || key }));
                          } else {
                            setForm(p => ({ ...p, correct_answer: key }));
                          }
                        };

                        return (
                          <div
                            key={key}
                            className={`relative rounded-xl border transition-all p-1 ${
                              isCorrect ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300/30' : 'border-brand-border bg-brand-bgLight/50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={handleToggle}
                              className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-all ${
                                isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                              }`}
                              title={form.question_type === 'multiple' ? `Toggle Option ${key}` : `Mark Option ${key} Correct`}
                            >
                              {key}
                            </button>
                            <input
                              type="text"
                              required
                              value={form[field]}
                              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                              placeholder={`Option ${key}`}
                              className="w-full pl-11 pr-16 py-2 bg-transparent text-brand-textMain placeholder-zinc-400 focus:outline-none text-xs font-semibold rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={handleToggle}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold px-2 py-0.5 rounded cursor-pointer transition-all ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-700 bg-white border border-slate-200'
                              }`}
                            >
                              {isCorrect ? '✓ Correct' : '+ Mark'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Correct answer, difficulty, timer, marks row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      Correct Answer
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {(form.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(opt => {
                        const selectedKeys = normalizeSelection(form.correct_answer).split(',').filter(Boolean);
                        const isSelected = form.question_type === 'true_false' ? form.correct_answer === opt : selectedKeys.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (form.question_type === 'multiple') {
                                const next = toggleOptionInSelection(form.correct_answer, opt);
                                setForm(p => ({ ...p, correct_answer: next || opt }));
                              } else {
                                setForm(p => ({ ...p, correct_answer: opt }));
                              }
                            }}
                            className={`w-8 h-8 rounded-xl font-black text-xs cursor-pointer transition-all ${
                              isSelected ? 'bg-emerald-600 text-white shadow-xs scale-105' : 'bg-white border text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {form.question_type === 'true_false' ? (opt === 'A' ? 'T' : 'F') : opt}
                          </button>
                        );
                      })}
                      {form.question_type === 'multiple' && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                          {normalizeSelection(form.correct_answer)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm font-semibold"
                    >
                      <option value="Easy">Easy (1.0x)</option>
                      <option value="Intermediate">Medium (1.5x)</option>
                      <option value="Hard">Hard (2.0x)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      Timer (s)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      required
                      value={form.timer}
                      onChange={(e) => setForm((p) => ({ ...p, timer: parseInt(e.target.value, 10) }))}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      Points
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={5000}
                      required
                      value={form.marks}
                      onChange={(e) => setForm((p) => ({ ...p, marks: parseInt(e.target.value, 10) }))}
                      className="w-full px-3 py-2 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer / actions (fixed) */}
              <div className="flex gap-3 px-6 py-4 border-t border-zinc-100 bg-brand-bgLight flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-brand-border text-zinc-600 font-semibold text-sm hover:bg-brand-bgLight transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      {selectedQuestion ? 'Save Changes' : 'Add Question'}
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* ── BULK TIMER MODAL ── */}
      {showBulkTimerModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowBulkTimerModal(false)}
        >
          <div
            className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="relative bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white leading-tight">
                  Set Timer for All
                </h2>
                <p className="text-xs text-white/70 mt-0.5">
                  This will update the duration for all questions in this quiz.
                </p>
              </div>
              <button
                onClick={() => setShowBulkTimerModal(false)}
                className="ml-auto w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all flex-shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              <form onSubmit={handleBulkTimerUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                    Timer Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={bulkTimerVal}
                    onChange={(e) => setBulkTimerVal(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkTimerModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-border text-zinc-650 font-semibold text-sm hover:bg-brand-bgLight transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkTimerSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
                  >
                    {bulkTimerSaving ? 'Updating...' : 'Set for All'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
