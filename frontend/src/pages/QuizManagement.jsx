import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
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
  X,
  Share2,
  Copy,
  Download,
  Check,
  QrCode
} from 'lucide-react';

export default function QuizManagement() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [qrQuiz, setQrQuiz] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
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

  // Copy Link Helper
  const handleCopyLink = () => {
    if (!qrQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  // Share Helper
  const handleShareSession = () => {
    if (!qrQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`;
    if (navigator.share) {
      navigator.share({
        title: qrQuiz.title,
        text: `Join my live quiz "${qrQuiz.title}" by scanning the QR or using the link!`,
        url: url
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code Helper
  const handleDownloadQR = (elementId) => {
    if (!qrQuiz) return;
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 620;
      const ctx = canvas.getContext('2d');
      
      // Draw card background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw top gradient border
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#0078d4');
      grad.addColorStop(1, '#005a9e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 8);
      
      // Draw Microsoft 4-square logo
      ctx.fillStyle = '#f25022';
      ctx.fillRect(187, 30, 12, 12);
      ctx.fillStyle = '#7fba00';
      ctx.fillRect(201, 30, 12, 12);
      ctx.fillStyle = '#00a4ef';
      ctx.fillRect(187, 44, 12, 12);
      ctx.fillStyle = '#ffb900';
      ctx.fillRect(201, 44, 12, 12);
      
      // MSC text header
      ctx.fillStyle = '#323130';
      ctx.font = 'bold 13px "Segoe UI", "Segoe UI Semibold", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MICROSOFT STUDENT CLUB', 200, 75);
      
      // MSC-PRPCEM text
      ctx.fillStyle = '#0078d4';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('MSC-PRPCEM CHAPTER', 200, 95);
      
      // Separator line
      ctx.strokeStyle = '#edebe9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 115);
      ctx.lineTo(360, 115);
      ctx.stroke();
      
      // Quiz Title
      ctx.fillStyle = '#201f1e';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(qrQuiz.title.toUpperCase(), 200, 140);
      
      // Event name
      ctx.fillStyle = '#605e5c';
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillText(qrQuiz.event_name.toUpperCase(), 200, 158);
      
      // Draw QR Code frame/inner shadow box
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(80, 185, 240, 240);
      ctx.strokeStyle = '#edebe9';
      ctx.strokeRect(80, 185, 240, 240);
      
      // Draw the QR Code image
      ctx.drawImage(image, 90, 195, 220, 220);
      
      // Scan instructions
      ctx.fillStyle = '#605e5c';
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText('Scan with camera or visit:', 200, 455);
      
      // Join URL
      ctx.fillStyle = '#005a9e';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      const joinUrl = `${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`;
      ctx.fillText(joinUrl, 200, 475);
      
      // Code background box
      ctx.fillStyle = '#f3f2f1';
      ctx.fillRect(80, 505, 240, 65);
      ctx.strokeStyle = '#edebe9';
      ctx.strokeRect(80, 505, 240, 65);
      
      // Code label
      ctx.fillStyle = '#605e5c';
      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillText('UNIQUE JOIN CODE', 200, 523);
      
      // Big Code text
      ctx.fillStyle = '#0078d4';
      ctx.font = 'black 28px "Segoe UI", sans-serif';
      ctx.fillText(qrQuiz.join_code, 200, 555);
      
      // Footnote
      ctx.fillStyle = '#a19f9d';
      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.fillText('Powered by Microsoft Student Club Quiz Platform', 200, 600);
      
      // Export as PNG
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `msc-prpcem-quiz-${qrQuiz.join_code}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  // Helper to open QR Modal
  const handleOpenQR = (quiz) => {
    setQrQuiz(quiz);
    setCopyFeedback(false);
    setShowQRModal(true);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-microsoft-border p-6 rounded-xl shadow-sm gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Quiz Catalog</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Configure draft sheets, launch sessions, or read telemetry analytical logs.</p>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center space-x-1.5 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer flex-shrink-0"
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
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">{quiz.event_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-max ${
                      quiz.status === 'completed'
                        ? 'bg-zinc-100 text-zinc-600'
                        : quiz.status === 'draft'
                        ? 'bg-blue-50 text-microsoft-blue'
                        : 'bg-emerald-50 text-microsoft-success animate-pulse'
                    }`}>
                      {quiz.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenCreate(quiz)}
                      className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded transition-all cursor-pointer"
                      title="Edit Metadata"
                    >
                      <Edit2 size={13} />
                    </button>
                    
                    {/* Share QR */}
                    <button
                      onClick={() => handleOpenQR(quiz)}
                      className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-microsoft-blue rounded transition-all cursor-pointer"
                      title="Share & QR Code Card"
                    >
                      <QrCode size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-red-600 rounded transition-all cursor-pointer"
                      title="Delete Quiz"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-800 leading-tight truncate">{quiz.title}</h3>
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
                <div className="grid grid-cols-2 gap-2">
                  {/* Questions Sheet */}
                  <button
                    onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                    className="flex justify-center items-center py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-lg transition-all text-xs font-semibold"
                    title="Manage Questions"
                  >
                    <ListCollapse size={13} className="mr-1" />
                    <span>Sheet</span>
                  </button>

                  {/* Analytics */}
                  <button
                    onClick={() => navigate(`/admin/analytics/${quiz.id}`)}
                    className="flex justify-center items-center py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-lg transition-all text-xs font-semibold"
                    title="View Analytics"
                  >
                    <BarChart2 size={13} className="mr-1" />
                    <span>Report</span>
                  </button>
                </div>

                {/* Import Spreadsheet */}
                <button
                  onClick={() => handleOpenImport(quiz)}
                  className="w-full flex justify-center items-center py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-microsoft-success rounded-lg transition-all text-xs font-bold cursor-pointer"
                  title="Import Questions via Excel"
                >
                  <FileSpreadsheet size={13} className="mr-1.5" />
                  <span>Import Spreadsheet</span>
                </button>
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
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 bg-zinc-950/60 z-50 overflow-y-auto py-8 flex justify-center items-start cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-microsoft-border max-w-md w-full shadow-2xl p-6 relative animate-fade-in cursor-default my-auto text-zinc-700"
          >
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
        <div
          onClick={() => setShowImportModal(false)}
          className="fixed inset-0 bg-zinc-950/60 z-50 overflow-y-auto py-8 flex justify-center items-start cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-microsoft-border max-w-lg w-full shadow-2xl p-6 relative animate-fade-in cursor-default my-auto text-zinc-700"
          >
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

      {/* FULLSCREEN QR CODE / SHARE MODAL */}
      {qrQuiz && showQRModal && (
        <div
          onClick={() => {
            setShowQRModal(false);
            setQrQuiz(null);
          }}
          className="fixed inset-0 bg-zinc-950/80 z-50 overflow-y-auto py-6 flex justify-center items-start cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 text-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-zinc-800 relative animate-fade-in text-center space-y-4 cursor-default my-auto"
          >
            <button
              onClick={() => {
                setShowQRModal(false);
                setQrQuiz(null);
              }}
              className="absolute top-4 right-4 bg-zinc-850 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white p-2 rounded-full transition-all cursor-pointer"
              title="Close Modal"
            >
              <X size={16} />
            </button>

            {/* Branded Card Container */}
            <div className="bg-white text-zinc-850 p-4 rounded-xl shadow-inner border-2 border-microsoft-blue/15 max-w-xs mx-auto space-y-3.5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue"></div>
              
              {/* Microsoft Logo Icon */}
              <div className="flex flex-col items-center space-y-1 pt-1">
                <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                  <div className="bg-[#f25022]"></div>
                  <div className="bg-[#7fba00]"></div>
                  <div className="bg-[#00a4ef]"></div>
                  <div className="bg-[#ffb900]"></div>
                </div>
                <h2 className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500">Microsoft Student Club</h2>
                <span className="text-[9px] font-bold text-microsoft-blue bg-microsoft-lightBlue px-2 py-0.5 rounded-full uppercase tracking-wider">
                  MSC-PRPCEM CHAPTER
                </span>
              </div>

              <div className="border-t border-b border-zinc-100 py-2 my-0.5 text-zinc-750">
                <h1 className="text-sm font-black text-zinc-850 leading-tight uppercase truncate" title={qrQuiz.title}>{qrQuiz.title}</h1>
                <p className="text-[8px] text-zinc-450 font-bold uppercase tracking-widest mt-0.5 truncate" title={qrQuiz.event_name}>{qrQuiz.event_name}</p>
              </div>

              {/* QR Code Container */}
              <div className="inline-block bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                <QRCodeSVG
                  id="catalog-qr-svg"
                  value={`${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`}
                  size={130}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1.5 text-zinc-700">
                <div className="text-[10px] font-semibold text-zinc-500">
                  <p>Scan with camera or visit:</p>
                  <p className="text-microsoft-darkBlue font-bold underline select-all mt-0.5 break-all">
                    {window.location.origin}/join/{qrQuiz.join_code}
                  </p>
                </div>
                
                <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-lg">
                  <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest text-center">Unique Join Code</span>
                  <span className="block text-xl font-black text-microsoft-blue tracking-widest select-all mt-0.5 text-center">{qrQuiz.join_code}</span>
                </div>
              </div>
            </div>

            {/* Actions for Modal */}
            <div className="flex flex-col space-y-2.5 max-w-xs mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md border border-zinc-750"
                >
                  {copyFeedback ? <Check size={14} className="text-microsoft-success animate-scale-up" /> : <Copy size={14} />}
                  <span>{copyFeedback ? 'Copied' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={() => handleDownloadQR('catalog-qr-svg')}
                  className="flex items-center justify-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md border border-zinc-750"
                >
                  <Download size={14} />
                  <span>Download Card</span>
                </button>
              </div>
              <button
                onClick={handleShareSession}
                className="w-full flex items-center justify-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-bold py-3 rounded-lg text-xs transition-all cursor-pointer shadow-lg"
              >
                <Share2 size={14} />
                <span>Share Join Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
