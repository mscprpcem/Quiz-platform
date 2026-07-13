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
  Eye,
  Calendar,
  AlertCircle,
  FileUp,
  X
} from 'lucide-react';

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

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleOpenCreate = (quiz = null) => {
    if (quiz) {
      setSelectedQuiz(quiz);
      let formattedDate = '';
      if (quiz.scheduled_start) {
        const d = new Date(quiz.scheduled_start);
        const pad = (n) => n.toString().padStart(2, '0');
        formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
      setQuizForm({
        title: quiz.title,
        event_name: quiz.event_name,
        description: quiz.description || '',
        scheduled_start: formattedDate
      });
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
      setFormError('Title and Event Name are required.');
      return;
    }

    try {
      if (selectedQuiz) {
        // Edit Mode
        await api.put(`/api/quizzes/${selectedQuiz.id}`, quizForm);
      } else {
        // Create Mode
        await api.post('/api/quizzes', quizForm);
      }
      setShowCreateModal(false);
      loadQuizzes();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save quiz details.');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (confirm('Are you sure you want to delete this quiz? All questions, participant scores, and logs will be permanently erased.')) {
      try {
        await api.delete(`/api/quizzes/${id}`);
        loadQuizzes();
      } catch (err) {
        alert('Error deleting quiz session.');
      }
    }
  };

  // Excel Import Operations
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
    if (!uploadFile) {
      setUploadErrors(['Please select an Excel file first.']);
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setLoading(true);
      const res = await api.post(`/api/quizzes/${selectedQuiz.id}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadSuccess(res.data.message);
      setUploadFile(null);
      loadQuizzes();
    } catch (err) {
      const errRes = err.response?.data;
      if (errRes && errRes.details) {
        setUploadErrors(errRes.details);
      } else {
        setUploadErrors([errRes?.error || 'Failed to upload spreadsheet file. Check layout configuration.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-microsoft-border p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Quiz Catalog</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure draft sheets, launch sessions, or read telemetry analytical logs.</p>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center space-x-1.5 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Quiz</span>
        </button>
      </div>

      {/* Grid List */}
      {loading && quizzes.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 font-semibold">
          Loading catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              {/* Header Text */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{quiz.event_name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    quiz.status === 'completed'
                      ? 'bg-zinc-100 text-zinc-600'
                      : quiz.status === 'draft'
                      ? 'bg-blue-50 text-microsoft-blue'
                      : 'bg-emerald-50 text-microsoft-success animate-pulse'
                  }`}>
                    {quiz.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-800 leading-tight">{quiz.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-3">{quiz.description || 'No description added yet.'}</p>
                <div className="flex items-center space-x-1.5 mt-2.5 text-xs text-zinc-400 font-medium">
                  <Calendar size={12} />
                  <span>{quiz.scheduled_start ? new Date(quiz.scheduled_start).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Not scheduled'}</span>
                </div>
              </div>

              {/* Counts section */}
              <div className="border-t border-b border-zinc-100 my-4 py-3 grid grid-cols-2 text-center text-xs">
                <div className="border-r border-zinc-100">
                  <span className="font-bold text-zinc-500">{quiz.questionCount || 0}</span>
                  <p className="text-[10px] text-zinc-400 uppercase">Questions</p>
                </div>
                <div>
                  <span className="font-bold text-zinc-500">{quiz.participantCount || 0}</span>
                  <p className="text-[10px] text-zinc-400 uppercase">Plays</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {/* Edit */}
                  <button
                    onClick={() => handleOpenCreate(quiz)}
                    className="flex justify-center items-center py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded transition-all text-xs font-semibold"
                    title="Edit Metadata"
                  >
                    <Edit2 size={14} className="mr-1" />
                    <span>Meta</span>
                  </button>

                  {/* Questions */}
                  <button
                    onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                    className="flex justify-center items-center py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded transition-all text-xs font-semibold"
                    title="Manage Questions"
                  >
                    <ListCollapse size={14} className="mr-1" />
                    <span>Sheet</span>
                  </button>

                  {/* Analytics */}
                  <button
                    onClick={() => navigate(`/admin/analytics/${quiz.id}`)}
                    className="flex justify-center items-center py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded transition-all text-xs font-semibold"
                    title="View Analytics"
                  >
                    <BarChart2 size={14} className="mr-1" />
                    <span>Report</span>
                  </button>
                </div>

                <div className="w-full">
                  {/* Excel Import */}
                  <button
                    onClick={() => handleOpenImport(quiz)}
                    className="w-full flex justify-center items-center py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-microsoft-success rounded transition-all text-xs font-bold cursor-pointer"
                  >
                    <FileSpreadsheet size={14} className="mr-1.5" />
                    <span>Import XLS</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {quizzes.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-zinc-400 text-sm bg-white border border-dashed border-zinc-200 rounded-xl">
              No quizzes in the database catalog. Create a quiz structure above to begin.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-microsoft-border max-w-md w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-3">
              {selectedQuiz ? 'Edit Quiz Metadata' : 'Create New Quiz'}
            </h3>

            {formError && (
              <div className="mt-4 bg-red-50 text-red-700 p-2.5 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveQuiz} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  value={quizForm.title}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Cloud Infrastructure Trivia"
                  className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={quizForm.event_name}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, event_name: e.target.value }))}
                  placeholder="Azure Seminar 2026"
                  className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={quizForm.description}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a brief summary details about this quiz..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Scheduled Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={quizForm.scheduled_start}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, scheduled_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-semibold py-2.5 rounded transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                Save Quiz Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-microsoft-border max-w-lg w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-3 flex items-center">
              <FileSpreadsheet className="text-microsoft-success mr-2 animate-bounce" size={24} />
              <span>Import Questions ({selectedQuiz?.title})</span>
            </h3>

            {/* Error Listing panel */}
            {uploadErrors.length > 0 && (
              <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-xs border border-red-200 max-h-48 overflow-y-auto space-y-1">
                <h4 className="font-bold flex items-center mb-1">
                  <AlertCircle size={14} className="mr-1" />
                  <span>Validation Errors Found:</span>
                </h4>
                {uploadErrors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}

            {/* Success panel */}
            {uploadSuccess && (
              <div className="mt-4 bg-emerald-50 text-emerald-800 p-3 rounded text-xs border border-emerald-200 font-semibold animate-fade-in">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadExcel} className="mt-4 space-y-5 text-sm">
              <div className="border-2 border-dashed border-zinc-200 rounded-lg p-6 text-center hover:border-microsoft-blue/50 transition-colors">
                <FileUp className="mx-auto text-zinc-400 mb-2" size={32} />
                <input
                  type="file"
                  id="excelFile"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="excelFile"
                  className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded font-semibold text-xs border border-zinc-200 inline-block transition-colors"
                >
                  Choose Excel Sheet
                </label>
                <p className="text-[11px] text-zinc-400 mt-2">
                  {uploadFile ? `Selected: ${uploadFile.name}` : 'Support Excel spreadsheets (.xlsx)'}
                </p>
              </div>

              {/* Sample columns overview */}
              <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-[10px] text-zinc-500 space-y-1.5">
                <p className="font-bold uppercase tracking-wider text-zinc-700">Required Column Layout (Row 2+):</p>
                <div className="grid grid-cols-4 gap-1 text-center font-bold">
                  <div className="bg-zinc-200 py-0.5 rounded">A: Question</div>
                  <div className="bg-zinc-200 py-0.5 rounded">B: Option A</div>
                  <div className="bg-zinc-200 py-0.5 rounded">C: Option B</div>
                  <div className="bg-zinc-200 py-0.5 rounded">D: Option C</div>
                  <div className="bg-zinc-200 py-0.5 rounded">E: Option D</div>
                  <div className="bg-zinc-200 py-0.5 rounded">F: Correct Ans</div>
                  <div className="bg-zinc-200 py-0.5 rounded">G: Timer (s)</div>
                  <div className="bg-zinc-200 py-0.5 rounded">H: Marks</div>
                </div>
                <p className="text-[9px] text-zinc-400">Correct Answer column values must be letter: A, B, C, or D.</p>
              </div>

              <button
                type="submit"
                disabled={!uploadFile}
                className="w-full bg-microsoft-blue hover:bg-microsoft-darkBlue disabled:bg-zinc-300 text-white font-semibold py-2.5 rounded transition-all shadow-sm cursor-pointer"
              >
                Upload Question Spreadsheet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
