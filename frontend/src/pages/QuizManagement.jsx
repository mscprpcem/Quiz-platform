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
  Calendar,
  AlertCircle,
  FileUp,
  X,
  Share2,
  Copy,
  Download,
  Check,
  QrCode,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

/* ── Status badge helper ── */
function StatusBadge({ status }) {
  const map = {
    draft: 'bg-blue-50 text-blue-700 border border-blue-200',
    in_progress: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed: 'bg-zinc-150 text-zinc-650 border border-zinc-250',
    waiting_lobby: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  const cls = map[status] || map.draft;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${cls}`}>
      {status === 'in_progress' ? 'Live' : status === 'waiting_lobby' ? 'Lobby' : status.replace('_', ' ')}
    </span>
  );
}

/* ── Modal overlay wrapper ── */
/* pt-16 = navbar height so the modal never hides behind the sticky bar */
function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto pt-14 xs:pt-16 px-3 sm:px-4 pb-6 animate-fade-in"
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
  const [qrQuiz, setQrQuiz] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Delete Confirmation States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetQuiz, setDeleteTargetQuiz] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form States
  const [quizForm, setQuizForm] = useState({ title: '', event_name: '', description: '', scheduled_start: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Branding config
  const [branding, setBranding] = useState(null);

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

  const loadBranding = async () => {
    try {
      const res = await api.get('/api/branding');
      setBranding(res.data);
    } catch (err) {
      console.error('Error loading branding:', err);
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadBranding();
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

  const handleOpenDeleteModal = (quiz) => {
    setDeleteTargetQuiz(quiz);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetQuiz) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/quizzes/${deleteTargetQuiz.id}`);
      setShowDeleteModal(false);
      setDeleteTargetQuiz(null);
      loadQuizzes();
    } catch (err) {
      alert('Error deleting quiz session. Please try again.');
    } finally {
      setDeleteLoading(false);
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

  // Download QR Code Helper (branded)
  const handleDownloadQR = (elementId) => {
    if (!qrQuiz) return;
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const getValidColor = (hex, fallback = '#2563EB') => {
      if (!hex || typeof hex !== 'string') return fallback;
      const cleaned = hex.trim();
      const isValid = /^#[0-9A-F]{6}$/i.test(cleaned) || /^#[0-9A-F]{3}$/i.test(cleaned);
      return isValid ? cleaned : fallback;
    };

    const colorToRgba = (hex, alpha, fallback = '#2563EB') => {
      const color = getValidColor(hex, fallback);
      let c = color.substring(1);
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const primaryColor = getValidColor(branding?.primary_color);
    const clubName = (branding?.club_name || 'Microsoft Student Club').toUpperCase();
    const chapterName = (branding?.chapter_name || 'MSC-PRPCEM Chapter').toUpperCase();
    const footerText = branding?.footer_text || 'Powered by Microsoft Student Club Quiz Platform';
    const logoSrc = branding?.logo_path ? (branding.logo_path.startsWith('http') ? branding.logo_path : `/${branding.logo_path}`) : null;

    const image = new Image();
    image.onload = () => {
      const drawCard = (logoImg) => {
        const canvas = document.createElement('canvas');
        const W = 400;
        const H = 650;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);

        // Flowing wave/grid pattern (Azure AI style)
        ctx.strokeStyle = colorToRgba(primaryColor, 0.07); // very light opacity
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 150);
        ctx.bezierCurveTo(100, 50, 300, 250, W, 150);
        ctx.stroke();

        ctx.strokeStyle = colorToRgba(primaryColor, 0.03);
        ctx.beginPath();
        ctx.moveTo(0, 480);
        ctx.bezierCurveTo(100, 550, 300, 380, W, 480);
        ctx.stroke();

        // Decorative dot grid pattern
        ctx.globalAlpha = 0.03;
        for (let x = 0; x < W; x += 16) {
          for (let y = 0; y < H; y += 16) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Stylized background nodes
        ctx.fillStyle = colorToRgba(primaryColor, 0.06);
        ctx.beginPath();
        ctx.arc(40, 180, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(360, 520, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(330, 220, 6, 0, Math.PI * 2);
        ctx.fill();

        // Top bar
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(0.5, colorToRgba(primaryColor, 0.8));
        grad.addColorStop(1, primaryColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, 8);

        // Logo
        if (logoImg) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(200, 34, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.drawImage(logoImg, 178, 12, 44, 44);
        } else {
          ctx.fillStyle = '#f25022';
          ctx.fillRect(188, 18, 11, 11);
          ctx.fillStyle = '#7fba00';
          ctx.fillRect(201, 18, 11, 11);
          ctx.fillStyle = '#00a4ef';
          ctx.fillRect(188, 31, 11, 11);
          ctx.fillStyle = '#ffb900';
          ctx.fillRect(201, 31, 11, 11);
        }

        ctx.fillStyle = '#323130';
        ctx.font = 'bold 13px Inter, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(clubName, 200, 75);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 11px Inter, "Segoe UI", sans-serif';
        ctx.fillText(chapterName, 200, 95);

        ctx.strokeStyle = '#edebe9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 115);
        ctx.lineTo(360, 115);
        ctx.stroke();

        ctx.fillStyle = '#201f1e';
        ctx.font = 'bold 16px Inter, "Segoe UI", sans-serif';
        const titleText = qrQuiz.title.toUpperCase();
        ctx.fillText(titleText.length > 35 ? titleText.slice(0, 35) + '...' : titleText, 200, 140);

        ctx.fillStyle = '#605e5c';
        ctx.font = '600 10px Inter, "Segoe UI", sans-serif';
        ctx.fillText(qrQuiz.event_name.toUpperCase(), 200, 160);

        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(80, 185, 240, 240);
        ctx.strokeStyle = '#edebe9';
        ctx.strokeRect(80, 185, 240, 240);
        ctx.drawImage(image, 90, 195, 220, 220);

        // Center Logo in QR code
        if (logoImg) {
          const logoSize = branding?.qr_logo_size !== undefined ? branding.qr_logo_size : 28;
          const L = Math.round(logoSize * 1.375);
          const radius = Math.round(L / 2) + 3;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(200, 305, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.drawImage(logoImg, 200 - Math.round(L / 2), 305 - Math.round(L / 2), L, L);
        }

        ctx.fillStyle = '#605e5c';
        ctx.font = '600 11px Inter, "Segoe UI", sans-serif';
        ctx.fillText('Scan with camera or visit:', 200, 455);

        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 12px Inter, "Segoe UI", sans-serif';
        ctx.fillText(`${window.location.origin}/join/${qrQuiz.join_code}`, 200, 478);

        ctx.fillStyle = '#f3f2f1';
        ctx.fillRect(80, 505, 240, 70);
        ctx.strokeStyle = '#edebe9';
        ctx.strokeRect(80, 505, 240, 70);

        ctx.fillStyle = '#605e5c';
        ctx.font = 'bold 9px Inter, "Segoe UI", sans-serif';
        ctx.fillText('UNIQUE JOIN CODE', 200, 525);

        ctx.fillStyle = primaryColor;
        ctx.font = '900 28px Inter, "Segoe UI", sans-serif';
        ctx.fillText(qrQuiz.join_code, 200, 560);

        ctx.fillStyle = '#a19f9d';
        ctx.font = 'bold 8px Inter, "Segoe UI", sans-serif';
        ctx.fillText(footerText, 200, 610);

        ctx.fillStyle = grad;
        ctx.fillRect(0, H - 4, W, 4);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `quiz-${qrQuiz.join_code}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };

      if (logoSrc) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => drawCard(logoImg);
        logoImg.onerror = () => drawCard(null);
        logoImg.src = logoSrc;
      } else {
        drawCard(null);
      }
    };
    image.src = blobURL;
  };

  // Helper to open QR Modal
  const handleOpenQR = (quiz) => {
    setQrQuiz(quiz);
    setCopyFeedback(false);
    setShowQRModal(true);
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
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-brand-border p-5 sm:p-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-textMain tracking-tight">Quiz Catalog</h1>
          <p className="text-xs sm:text-sm text-brand-textMuted mt-1">Configure draft sheets, launch sessions, or read telemetry analytical logs.</p>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] cursor-pointer flex-shrink-0"
        >
          <Plus size={16} />
          Create Quiz
        </button>
      </div>

      {/* Quiz Grid */}
      {loading && quizzes.length === 0 ? (
        <div className="text-center py-20 text-zinc-550 font-semibold animate-pulse">Loading quizzes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => {
            const isExpired = quiz.scheduled_start && new Date(quiz.scheduled_start) < new Date() && quiz.status === 'draft';
            return (
              <div
                key={quiz.id}
                className="bg-white border border-brand-border hover:border-brand-blue/30 rounded-2xl p-5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[260px] text-zinc-800"
              >
                {/* Top status indicator strip */}
                <div className={`absolute top-0 left-0 w-full h-[4px] ${
                  quiz.status === 'in_progress' ? 'bg-emerald-500 animate-pulse' :
                  quiz.status === 'waiting_lobby' ? 'bg-amber-500' :
                  quiz.status === 'completed' ? 'bg-zinc-350' : 'bg-brand-blue'
                }`} />

                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="space-y-4 relative z-10 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 pt-1">
                      <span className="text-[9px] font-extrabold text-zinc-550 uppercase tracking-widest bg-zinc-100 px-2.5 py-0.5 rounded-full truncate max-w-[120px]">{quiz.event_name}</span>
                      <div className="flex gap-1.5 items-center">
                        <StatusBadge status={quiz.status} />
                      </div>
                    </div>
                    <div className="mt-3.5">
                      <h3 className="text-base font-extrabold text-brand-textMain leading-snug group-hover:text-brand-blue transition-colors duration-200 truncate" title={quiz.title}>{quiz.title}</h3>
                      <p className="text-xs text-brand-textMuted line-clamp-2 mt-1 leading-relaxed">{quiz.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Date & Schedule */}
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-textMuted">
                      <Calendar size={12} className="flex-shrink-0 text-brand-blue" />
                      <span className="truncate">{quiz.scheduled_start ? new Date(quiz.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Asynchronous Play'}</span>
                    </div>

                    {/* Counts section inline */}
                    <div className="flex gap-4 items-center text-xs text-brand-textMuted border-t border-brand-border pt-2.5">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-brand-blue" />
                        <span><strong>{quiz.questionCount || 0}</strong> Questions</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-brand-blue" />
                        <span><strong>{quiz.participantCount || 0}</strong> Plays</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions section */}
                <div className="flex flex-col gap-2 mt-4 pt-3.5 border-t border-brand-border relative z-10">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                      title="Manage Questions"
                      className="flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-50 hover:bg-zinc-100 border border-brand-border text-zinc-650 hover:text-brand-textMain rounded-xl transition-all text-[11px] sm:text-xs font-semibold select-none cursor-pointer active:scale-95"
                    >
                      <ListCollapse size={13} />
                      <span>Sheet</span>
                    </button>
                    <button
                      onClick={() => handleOpenImport(quiz)}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl transition-all text-[11px] sm:text-xs font-bold cursor-pointer active:scale-95"
                      title="Import Questions from Excel"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Import .xlsx</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleOpenCreate(quiz)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-brand-border hover:bg-zinc-50 text-zinc-500 hover:text-brand-textMain rounded-xl transition-all text-xs font-bold cursor-pointer active:scale-95"
                    title="Edit Quiz Details"
                  >
                    <Edit2 size={13} />
                    <span>Edit Info</span>
                  </button>
                </div>
              </div>
            );
          })}

          {quizzes.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center text-brand-textMuted bg-white border-2 border-dashed border-brand-border rounded-2xl gap-3">
              <BookOpen size={36} className="opacity-30" />
              <p className="text-sm font-semibold">No quizzes yet</p>
              <p className="text-xs">Click <span className="font-bold text-brand-textMuted">Create Quiz</span> above to get started.</p>
            </div>
          )}
        </div>
      )}
      </div>

      {/* â”€â”€ CREATE / EDIT QUIZ MODAL â”€â”€ */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-150 overflow-hidden text-zinc-750">
            {/* Modal header */}
            <div className="relative bg-gradient-to-r from-brand-blue to-brand-dark px-6 py-5">
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
                  <label className="block text-xs font-bold text-zinc-550 uppercase tracking-widest">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Cloud Infrastructure Trivia"
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Event Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-550 uppercase tracking-widest">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.event_name}
                    onChange={(e) => setQuizForm((p) => ({ ...p, event_name: e.target.value }))}
                    placeholder="e.g. Azure Seminar 2026"
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-555 uppercase tracking-widest">
                    Description <span className="text-brand-textMuted font-normal normal-case">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={quizForm.description}
                    onChange={(e) => setQuizForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="A short summary of what this quiz covers..."
                    className="w-full px-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm resize-none"
                  />
                </div>

                {/* Scheduled Start */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-550 uppercase tracking-widest">
                    Scheduled Start <span className="text-brand-textMuted font-normal normal-case">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-textMuted pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={quizForm.scheduled_start}
                      onChange={(e) => setQuizForm((p) => ({ ...p, scheduled_start: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-brand-textMain focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-border text-zinc-650 font-semibold text-sm hover:bg-brand-bgLight transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-blue hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
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

      {/* â”€â”€ EXCEL IMPORT MODAL â”€â”€ */}
      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)}>
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-150 overflow-hidden text-zinc-750">
            {/* Modal header */}
            <div className="relative bg-gradient-to-r from-emerald-650 to-emerald-700 px-6 py-5 text-white">
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
                  {uploadErrors.map((err, i) => <p key={i} className="leading-relaxed">â€¢ {err}</p>)}
                </div>
              )}

              {/* Success panel */}
              {uploadSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
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
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-brand-border hover:border-brand-blue/50 bg-brand-bgLight/50 hover:bg-brand-bgLight'
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
                      <p className="text-sm font-bold text-emerald-750">{uploadFile.name}</p>
                      <p className="text-xs text-emerald-650 mt-1">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <FileUp size={32} className="mx-auto mb-2 text-zinc-450" />
                      <p className="text-sm font-semibold text-zinc-650">Drop your Excel file here</p>
                      <p className="text-xs text-zinc-450 mt-1">or <span className="text-brand-blue font-bold underline">browse to upload</span></p>
                      <p className="text-[10px] text-brand-textMuted mt-2">Supports .xlsx and .xls files</p>
                    </>
                  )}
                </label>

                {/* Column format guide */}
                <div className="bg-brand-bgLight border border-brand-border rounded-xl p-4">
                  <p className="text-xs font-bold text-zinc-650 uppercase tracking-wider mb-3">
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
                      <div key={col} className="bg-white border border-brand-border rounded-lg py-1.5 px-1">
                        <span className="block text-[10px] font-extrabold text-brand-blue">{col}</span>
                        <span className="block text-[9px] text-brand-textMuted font-medium leading-tight mt-0.5">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-brand-textMuted mt-2.5">
                    âš  Correct Answer column must contain: <strong>A</strong>, <strong>B</strong>, <strong>C</strong>, or <strong>D</strong>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-brand-border text-zinc-650 font-semibold text-sm hover:bg-brand-bgLight transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || loading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
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

      {/* QR CODE SHARE MODAL */}
      {qrQuiz && showQRModal && (
        <div
          onClick={() => { setShowQRModal(false); setQrQuiz(null); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-[280px] w-full relative cursor-default overflow-hidden animate-fade-in"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: branding?.primary_color || '#2563EB' }} />

            {/* Close button */}
            <button
              onClick={() => { setShowQRModal(false); setQrQuiz(null); }}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-50 hover:bg-zinc-150 text-brand-textMuted hover:text-brand-textMain transition-all cursor-pointer z-20"
            >
              <X size={12} strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="px-4 pt-4 pb-3 text-center space-y-3">
              {/* Event name */}
              <p className="text-[9px] font-bold text-brand-textMuted uppercase tracking-widest truncate pr-6">{qrQuiz.event_name}</p>

              {/* QR Code */}
              <div className="inline-block bg-brand-bgLight p-2.5 rounded-lg border border-zinc-100 shadow-sm">
                <QRCodeSVG
                  id="catalog-qr-svg"
                  value={`${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                  imageSettings={branding?.logo_path ? {
                    src: branding.logo_path.startsWith('http') ? branding.logo_path : `/${branding.logo_path}`,
                    x: undefined,
                    y: undefined,
                    height: branding?.qr_logo_size || 28,
                    width: branding?.qr_logo_size || 28,
                    excavate: true,
                  } : undefined}
                />
              </div>

              {/* Join Code */}
              <div className="bg-brand-bgLight border border-zinc-100 rounded-lg py-2 px-3">
                <span className="block text-[8px] font-bold text-brand-textMuted uppercase tracking-widest">Code</span>
                <span className="block text-2xl font-black tracking-[0.25em] mt-0.5 select-all" style={{ color: branding?.primary_color || '#2563EB' }}>{qrQuiz.join_code}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-zinc-100 px-3 py-2.5 grid grid-cols-3 gap-1.5">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-brand-border hover:bg-brand-bgLight text-brand-textMuted hover:text-zinc-700 transition-all text-[9px] font-bold cursor-pointer"
              >
                {copyFeedback ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copyFeedback ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleDownloadQR('catalog-qr-svg')}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-brand-border hover:bg-brand-bgLight text-brand-textMuted hover:text-zinc-700 transition-all text-[9px] font-bold cursor-pointer"
              >
                <Download size={13} />
                Save
              </button>
              <button
                onClick={handleShareSession}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white transition-all text-[9px] font-bold cursor-pointer"
                style={{ backgroundColor: branding?.primary_color || '#2563EB' }}
              >
                <Share2 size={13} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deleteTargetQuiz && (
        <div
          onClick={() => { setShowDeleteModal(false); setDeleteTargetQuiz(null); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-brand-border animate-fade-in-scale cursor-default space-y-4 text-zinc-750"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-textMain">Delete Quiz?</h3>
                <p className="text-xs text-brand-textMuted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-brand-bgLight border border-zinc-100 rounded-xl p-3 text-left">
              <p className="text-sm font-semibold text-zinc-705">{deleteTargetQuiz.title}</p>
              <p className="text-[11px] text-brand-textMuted mt-0.5">All questions, participant scores, and logs will be permanently erased.</p>
            </div>

            <div className="flex space-x-3 pt-1">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteTargetQuiz(null); }}
                className="flex-1 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-zinc-600 hover:bg-brand-bgLight hover:border-zinc-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-[0.97] shadow-md flex items-center justify-center space-x-1.5"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Quiz</span>
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
