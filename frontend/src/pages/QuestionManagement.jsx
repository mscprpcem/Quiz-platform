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

/* ── Correct answer option key → label ── */
const OPTION_LABELS = { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' };

export default function QuestionManagement() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setSelectedQuestion(q);
      setForm({
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
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
    if (!form.question || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      setFormError('Please fill in the question text and all four answer options.');
      return;
    }
    try {
      setSaving(true);
      if (selectedQuestion) {
        await api.put(`/api/quizzes/questions/${selectedQuestion.id}`, form);
      } else {
        await api.post(`/api/quizzes/${id}/questions`, form);
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
      { 'Question': 'What does CPU stand for?', 'Option A': 'Central Processing Unit', 'Option B': 'Central Program Utility', 'Option C': 'Computer Personal Unit', 'Option D': 'Central Processor Unifier', 'Correct Answer': 'A', 'Explanation': 'CPU is the Central Processing Unit.' },
      { 'Question': 'Which data structure uses FIFO?', 'Option A': 'Stack', 'Option B': 'Queue', 'Option C': 'Tree', 'Option D': 'Graph', 'Correct Answer': 'B', 'Explanation': 'Queue operates on First In First Out.' },
      { 'Question': 'HTML stands for?', 'Option A': 'Hyper Trainer Marking Language', 'Option B': 'Hyper Text Marketing Language', 'Option C': 'Hyper Text Markup Language', 'Option D': 'Hyper Text Markup Leveler', 'Correct Answer': 'C', 'Explanation': 'HTML is Hyper Text Markup Language.' }
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
      ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 35 }];
      XLSX.writeFile(wb, 'live_quiz_questions_template.xlsx');
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          toast.warning('No question rows found in uploaded file.', 'Empty File');
          return;
        }

        const parsed = rawData.map(row => ({
          question: row.Question || row.question || '',
          option_a: row['Option A'] || row.option_a || row.A || '',
          option_b: row['Option B'] || row.option_b || row.B || '',
          option_c: row['Option C'] || row.option_c || row.C || '',
          option_d: row['Option D'] || row.option_d || row.D || '',
          correct_answer: (row['Correct Answer'] || row.correct_answer || row.Answer || 'A').toString().trim().toUpperCase(),
          timer: 30,
          marks: 1
        })).filter(q => q.question);

        let successCount = 0;
        for (const q of parsed) {
          try {
            await api.post(`/api/quizzes/${id}/questions`, q);
            successCount++;
          } catch (err) {
            console.error('Failed to add question:', q.question, err);
          }
        }
        toast.success(`Successfully imported ${successCount} of ${parsed.length} questions!`, 'Import Complete');
        loadQuizDetails();
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Failed to parse spreadsheet. Please use the template format.', 'Import Error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
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
              title="Download Microsoft Excel (.xlsx) Template"
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
          <label className="flex items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer">
            <Upload size={14} />
            <span>Import (.xlsx / .csv)</span>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
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
        {quiz?.questions?.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Question header bar */}
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-brand-border bg-zinc-50/50">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-semibold text-brand-textMuted">
                <span className="bg-brand-lightBlue text-brand-blue font-bold px-2.5 py-0.5 rounded-full">
                  Q{idx + 1}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-brand-blue" />
                  {q.timer}s
                </span>
                <span className="flex items-center gap-1">
                  <Award size={12} className="text-brand-blue" />
                  {q.marks} pts
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenForm(q)}
                  className="flex items-center gap-1.5 border border-brand-border bg-white hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>

            {/* Question body */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm sm:text-base font-bold text-brand-textMain leading-snug">{q.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map((key) => {
                  const text = q[`option_${key.toLowerCase()}`];
                  const isCorrect = q.correct_answer === key;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-650'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-550'
                      }`}>
                        {key}
                      </span>
                      <span className="truncate">{text}</span>
                      {isCorrect && <CheckCircle2 size={13} className="ml-auto text-emerald-650 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

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

                {/* Answer options */}
                <div>
                  <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest mb-2">
                    Answer Options <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((key) => {
                      const field = `option_${key.toLowerCase()}`;
                      const isCorrect = form.correct_answer === key;
                      return (
                        <div
                          key={key}
                          className={`relative rounded-xl border transition-all ${
                            isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-brand-border bg-brand-bgLight/50'
                          }`}
                        >
                          <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-600'
                          }`}>
                            {key}
                          </span>
                          <input
                            type="text"
                            required
                            value={form[field]}
                            onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                            placeholder={`Option ${key}`}
                            className="w-full pl-10 pr-3 py-2.5 bg-transparent text-brand-textMain placeholder-zinc-400 focus:outline-none text-sm rounded-xl"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Correct answer, timer, marks, difficulty row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest">
                      Correct Option
                    </label>
                    <select
                      value={form.correct_answer}
                      onChange={(e) => setForm((p) => ({ ...p, correct_answer: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
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
                      className="w-full px-3 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
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
                      className="w-full px-3 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
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
