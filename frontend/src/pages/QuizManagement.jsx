import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  BarChart2,
  ListCollapse,
  Calendar,
  AlertCircle,
  FileUp,
  X,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

/* ── Status badge helper ── */
function StatusBadge({ status }) {
  const map = {
    draft: 'bg-blue-50 text-microsoft-blue border border-blue-100',
    in_progress: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    completed: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
  };
  const cls = map[status] || map.draft;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {status === 'in_progress' ? 'Live' : status}
    </span>
  );
}

/* ── Modal overlay wrapper ── */
/* pt-16 = navbar height (h-16) so the modal never hides behind the sticky bar */
function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto pt-16 px-4 pb-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function QuizManagement() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Form States
  const [quizForm, setQuizForm] = useState({ title: '', event_name: '', description: '', scheduled_start: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/quizzes');
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuizzes(); }, []);

  const handleOpenCreate = (quiz = null) => {
    if (quiz) {
      setSelectedQuiz(quiz);
      let formattedDate = '';
      if (quiz.scheduled_start) {
        const d = new Date(quiz.scheduled_start);
        const pad = (n) => n.toString().padStart(2, '0');
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      setQuizForm({ title: quiz.title, event_name: quiz.event_name, description: quiz.description || '', scheduled_start: formattedDate });
    } else {
      setSelectedQuiz(null);
      setQuizForm({ title: '', event_name: '', description: '', scheduled_start: '' });
    }
    setFormError('');
    setShowCreateModal(true);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizForm.title || !quizForm.event_name) {
      setFormError('Quiz Title and Event Name are required fields.');
      return;
    }
    try {
      setSaving(true);
      if (selectedQuiz) {
        await api.put(`/api/quizzes/${selectedQuiz.id}`, quizForm);
      } else {
        await api.post('/api/quizzes', quizForm);
      }
      setShowCreateModal(false);
      loadQuizzes();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (confirm('Are you sure you want to delete this quiz? All questions, scores, and logs will be permanently erased.')) {
      try {
        await api.delete(`/api/quizzes/${id}`);
        loadQuizzes();
      } catch (err) {
        alert('Error deleting quiz session.');
      }
    }
  };

  const handleOpenImport = (quiz) => {
    setSelectedQuiz(quiz);
    setUploadFile(null);
    setUploadErrors([]);
    setUploadSuccess('');
    setShowImportModal(true);
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadErrors([]);
    setUploadSuccess('');
  };

  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadFile) { setUploadErrors(['Please select an Excel file first.']); return; }
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      setLoading(true);
      const res = await api.post(`/api/quizzes/${selectedQuiz.id}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess(res.data.message);
      setUploadFile(null);
      loadQuizzes();
    } catch (err) {
      const errRes = err.response?.data;
      if (errRes?.details) { setUploadErrors(errRes.details); }
      else { setUploadErrors([errRes?.error || 'Failed to upload spreadsheet.']); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-microsoft-border p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Quiz Catalog</h1>
          <p className="text-sm text-zinc-500 mt-1">Create and manage quizzes, import questions, and view analytics.</p>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center justify-center gap-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Plus size={16} />
          Create Quiz
        </button>
      </div>

      {/* ── Quiz Grid ── */}
      {loading && quizzes.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 font-semibold animate-pulse">Loading quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white border border-microsoft-border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col group overflow-hidden"
            >
              {/* Card top accent bar by status */}
              <div className={`h-1 w-full ${quiz.status === 'in_progress' ? 'bg-emerald-500' : quiz.status === 'completed' ? 'bg-zinc-300' : 'bg-microsoft-blue'}`} />

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate mb-1">{quiz.event_name}</p>
                    <h3 className="text-base font-bold text-zinc-800 leading-snug line-clamp-2">{quiz.title}</h3>
                  </div>
                  <StatusBadge status={quiz.status} />
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 flex-1">
                  {quiz.description || 'No description provided.'}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar size={12} className="flex-shrink-0" />
                  <span>{quiz.scheduled_start ? new Date(quiz.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled'}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
                    <span className="block text-lg font-extrabold text-zinc-700">{quiz.questionCount || 0}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Questions</span>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center border border-zinc-100">
                    <span className="block text-lg font-extrabold text-zinc-700">{quiz.participantCount || 0}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Participants</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1 border-t border-zinc-100">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpenCreate(quiz)}
                      title="Edit Quiz"
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                      title="Manage Questions"
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <ListCollapse size={14} />
                      Questions
                    </button>
                    <button
                      onClick={() => navigate(`/admin/analytics/${quiz.id}`)}
                      title="View Analytics"
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <BarChart2 size={14} />
                      Analytics
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenImport(quiz)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition-all text-xs font-bold cursor-pointer"
                  >
                    <FileSpreadsheet size={14} />
                    Import Questions (.xlsx)
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-semibold border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={13} />
                    Delete Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}

          {quizzes.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center text-zinc-400 bg-white border-2 border-dashed border-zinc-200 rounded-2xl gap-3">
              <BookOpen size={36} className="opacity-30" />
              <p className="text-sm font-semibold">No quizzes yet</p>
              <p className="text-xs">Click <span className="font-bold text-zinc-500">Create Quiz</span> above to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          CREATE / EDIT QUIZ MODAL
      ══════════════════════════════════════════ */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">

            {/* Modal header */}
            <div className="relative bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">
                    {selectedQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    {selectedQuiz ? 'Update the quiz metadata below.' : 'Fill in the details to set up a new quiz session.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              {formError && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveQuiz} className="space-y-4">
                {/* Quiz Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Cloud Infrastructure Trivia"
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Event Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.event_name}
                    onChange={(e) => setQuizForm((p) => ({ ...p, event_name: e.target.value }))}
                    placeholder="e.g. Azure Seminar 2026"
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Description <span className="text-zinc-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={quizForm.description}
                    onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="A short summary of what this quiz covers..."
                    className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all text-sm resize-none"
                  />
                </div>

                {/* Scheduled Start */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Scheduled Start <span className="text-zinc-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={quizForm.scheduled_start}
                      onChange={(e) => setQuizForm((p) => ({ ...p, scheduled_start: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-sm hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-microsoft-blue hover:bg-microsoft-darkBlue disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
                  >
                    {saving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        {selectedQuiz ? 'Save Changes' : 'Create Quiz'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════
          EXCEL IMPORT MODAL
      ══════════════════════════════════════════ */}
      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)}>
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">

            {/* Modal header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">Import Questions</h2>
                  <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                    For: <span className="font-semibold">{selectedQuiz?.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Error panel */}
              {uploadErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs space-y-1 max-h-36 overflow-y-auto">
                  <p className="font-bold flex items-center gap-1.5 mb-2">
                    <AlertCircle size={14} /> Validation Errors ({uploadErrors.length})
                  </p>
                  {uploadErrors.map((err, i) => <p key={i} className="leading-relaxed">• {err}</p>)}
                </div>
              )}

              {/* Success panel */}
              {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadExcel} className="space-y-4">
                {/* File drop zone */}
                <label
                  htmlFor="excelFile"
                  className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    uploadFile
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-zinc-200 hover:border-microsoft-blue/50 bg-zinc-50/50 hover:bg-zinc-50'
                  }`}
                >
                  <input
                    type="file"
                    id="excelFile"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadFile ? (
                    <>
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-700">{uploadFile.name}</p>
                      <p className="text-xs text-emerald-600 mt-1">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <FileUp size={32} className="mx-auto mb-2 text-zinc-400" />
                      <p className="text-sm font-semibold text-zinc-600">Drop your Excel file here</p>
                      <p className="text-xs text-zinc-400 mt-1">or <span className="text-microsoft-blue font-bold underline">browse to upload</span></p>
                      <p className="text-[10px] text-zinc-400 mt-2">Supports .xlsx and .xls files</p>
                    </>
                  )}
                </label>

                {/* Column format guide */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
                    Required Column Format (Row 2 onwards)
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { col: 'A', label: 'Question' },
                      { col: 'B', label: 'Option A' },
                      { col: 'C', label: 'Option B' },
                      { col: 'D', label: 'Option C' },
                      { col: 'E', label: 'Option D' },
                      { col: 'F', label: 'Correct Ans' },
                      { col: 'G', label: 'Timer (s)' },
                      { col: 'H', label: 'Marks' },
                    ].map(({ col, label }) => (
                      <div key={col} className="bg-white border border-zinc-200 rounded-lg py-1.5 px-1">
                        <span className="block text-[10px] font-extrabold text-microsoft-blue">{col}</span>
                        <span className="block text-[9px] text-zinc-500 font-medium leading-tight mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2.5">
                    ⚠ Correct Answer column must contain: <strong>A</strong>, <strong>B</strong>, <strong>C</strong>, or <strong>D</strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold text-sm hover:bg-zinc-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
                  >
                    <FileUp size={15} />
                    {loading ? 'Uploading...' : 'Upload Sheet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
