import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Play,
  Calendar,
  AlertTriangle,
  QrCode,
  ListCollapse,
  BarChart2,
  Users,
  BookOpen,
  X,
  Copy,
  Download,
  Share2,
  Check,
  Award,
  ShieldCheck,
  RefreshCw,
  FileCode,
  Trash2,
  Clock
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Quizzes list state
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  // General QR Sharing States for list cards
  const [qrQuiz, setQrQuiz] = useState(null);
  const [showCatalogQRModal, setShowCatalogQRModal] = useState(false);
  const [catalogCopyFeedback, setCatalogCopyFeedback] = useState(false);
  const [catalogCopyCodeFeedback, setCatalogCopyCodeFeedback] = useState(false);

  // Delete Quiz Modal State
  const [deleteQuizTarget, setDeleteQuizTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteQuiz = async (quizId) => {
    try {
      setDeleting(true);
      await api.delete(`/api/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      setDeleteQuizTarget(null);
    } catch (err) {
      console.error('Delete quiz error:', err);
      alert(err.response?.data?.error || 'Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  // Branding config
  const [branding, setBranding] = useState(null);



  // Load quizzes on mount
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/quizzes');
      setQuizzes(response.data);

      // Check if there is an active session currently running (ONLY FOR LIVE QUIZZES, NOT SCHEDULED)
      const session = response.data.find(
        (q) => (q.mode === 'LIVE' || (!q.mode && !q.schedule_type)) && (q.status === 'waiting_lobby' || q.status === 'in_progress')
      );
      setActiveSession(session || null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load branding config
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

  // General sharing helpers for catalog cards in dashboard
  const handleOpenCatalogQR = (quiz) => {
    setQrQuiz(quiz);
    setCatalogCopyFeedback(false);
    setShowCatalogQRModal(true);
  };

  const handleCatalogCopyLink = () => {
    if (!qrQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCatalogCopyFeedback(true);
      setTimeout(() => setCatalogCopyFeedback(false), 2000);
    });
  };

  const handleCatalogShareSession = () => {
    if (!qrQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`;
    if (navigator.share) {
      navigator.share({
        title: qrQuiz.title,
        text: `Join my live quiz "${qrQuiz.title}" by scanning the QR or using the link!`,
        url: url
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      handleCatalogCopyLink();
    }
  };

  // Helper to draw branded QR card on canvas and download
  const drawBrandedCard = (ctx, qrImage, quizData, brandData, logoImg) => {
    const W = 400;
    const H = 650;

    const getValidColor = (hex, fallback = '#2563EB') => {
      if (!hex || typeof hex !== 'string') return fallback;
      const cleaned = hex.trim();
      return /^#[0-9A-F]{6}$/i.test(cleaned) || /^#[0-9A-F]{3}$/i.test(cleaned) ? cleaned : fallback;
    };

    const colorToRgba = (hex, alpha, fallback = '#2563EB') => {
      const color = getValidColor(hex, fallback);
      let c = color.substring(1);
      if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const primaryColor = getValidColor(brandData?.primary_color);
    let rawClubName = (brandData?.club_name || 'Microsoft Student Club').toUpperCase().trim();
    let rawChapterName = (brandData?.chapter_name || 'MSC-PRPCEM Chapter').toUpperCase().trim();

    let clubName = rawClubName;
    let chapterName = rawChapterName;

    if (clubName === chapterName || (clubName.includes('PRPCEM') && chapterName.includes('PRPCEM'))) {
      clubName = 'MICROSOFT STUDENT CLUB';
      chapterName = 'MSC-PRPCEM CHAPTER';
    }
    const footerText = brandData?.footer_text || 'Powered by Microsoft Student Club Quiz Platform';

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Flowing wave/grid pattern (Azure AI style)
    ctx.strokeStyle = colorToRgba(primaryColor, 0.07);
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

    // Top gradient bar
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

    // Club name
    ctx.fillStyle = '#323130';
    ctx.font = 'bold 13px Inter, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(clubName, 200, 75);

    // Chapter name
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 11px Inter, "Segoe UI", sans-serif';
    ctx.fillText(chapterName, 200, 95);

    // Separator
    ctx.strokeStyle = '#edebe9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 115);
    ctx.lineTo(360, 115);
    ctx.stroke();

    // Quiz Title
    ctx.fillStyle = '#201f1e';
    ctx.font = 'bold 16px Inter, "Segoe UI", sans-serif';
    const titleText = quizData.title.toUpperCase();
    ctx.fillText(titleText.length > 35 ? titleText.slice(0, 35) + '...' : titleText, 200, 140);

    // Event name
    ctx.fillStyle = '#605e5c';
    ctx.font = '600 10px Inter, "Segoe UI", sans-serif';
    ctx.fillText(quizData.event_name.toUpperCase(), 200, 160);

    // QR frame
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(80, 185, 240, 240);
    ctx.strokeStyle = '#edebe9';
    ctx.strokeRect(80, 185, 240, 240);

    // QR image
    ctx.drawImage(qrImage, 90, 195, 220, 220);

    // Logo embedded inside the QR center
    if (logoImg) {
      const logoSize = brandData?.qr_logo_size !== undefined ? brandData.qr_logo_size : 28;
      const L = Math.round(logoSize * 1.375);
      const radius = Math.round(L / 2) + 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(200, 305, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(logoImg, 200 - Math.round(L / 2), 305 - Math.round(L / 2), L, L);
    }

    // Scan instructions
    ctx.fillStyle = '#605e5c';
    ctx.font = '600 11px Inter, "Segoe UI", sans-serif';
    ctx.fillText('Scan with camera or visit:', 200, 455);

    // Join URL
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 12px Inter, "Segoe UI", sans-serif';
    const joinUrl = `${window.location.origin}/join/${quizData.join_code}`;
    ctx.fillText(joinUrl, 200, 478);

    // Code box
    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(80, 505, 240, 70);
    ctx.strokeStyle = '#edebe9';
    ctx.strokeRect(80, 505, 240, 70);

    // Code label
    ctx.fillStyle = '#605e5c';
    ctx.font = 'bold 9px Inter, "Segoe UI", sans-serif';
    ctx.fillText('UNIQUE JOIN CODE', 200, 525);

    // Big code
    ctx.fillStyle = primaryColor;
    ctx.font = '900 28px Inter, "Segoe UI", sans-serif';
    ctx.fillText(quizData.join_code, 200, 560);

    // Footer
    ctx.fillStyle = '#a19f9d';
    ctx.font = 'bold 8px Inter, "Segoe UI", sans-serif';
    ctx.fillText(footerText, 200, 610);

    // Bottom gradient bar
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 4, W, 4);
  };

  const handleCatalogDownloadQR = (elementId) => {
    if (!qrQuiz) return;
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const logoSrc = branding?.logo_path ? (branding.logo_path.startsWith('http') ? branding.logo_path : `/${branding.logo_path}`) : null;

    const image = new Image();
    image.onload = () => {
      const drawCard = (logoImg) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 650;
        const ctx = canvas.getContext('2d');

        drawBrandedCard(ctx, image, qrQuiz, branding, logoImg);

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

  // Status details styling helper
  const getStatusDetails = (quiz) => {
    if (quiz.mode === 'SCHEDULED' || quiz.schedule_type) {
      return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border border-blue-200' };
    }
    const isExpired = quiz.scheduled_start && new Date(quiz.scheduled_start) < new Date() && quiz.status === 'draft';
    if (isExpired) {
      return { label: 'Expired', cls: 'bg-red-50 text-red-700 border border-red-200' };
    }
    if (quiz.status === 'completed') {
      return { label: 'Closed', cls: 'bg-zinc-150 text-zinc-650 border border-zinc-250' };
    }
    if (quiz.status === 'in_progress') {
      return { label: 'Live', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' };
    }
    if (quiz.status === 'waiting_lobby') {
      return { label: 'Lobby', cls: 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' };
    }
    return { label: 'Draft', cls: 'bg-blue-50 text-blue-700 border border-blue-200' };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-brand-border p-4.5 sm:p-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-brand-textMain tracking-tight">
              Admin Session Center
            </h1>
            <p className="text-xs sm:text-sm text-brand-textMuted mt-1">
              Select, monitor, and run live quiz sessions, view catalogs, and track participant standings.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            <span>Manage Quizzes</span>
          </button>
        </div>

        {/* Active Live Quiz Alert Banner */}
        {activeSession && (
          <div className="bg-amber-50 border border-amber-250 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-fade-in relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-[4px] bg-amber-500" />
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-inner">
                <AlertTriangle size={18} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider">Active Live Quiz Detected</h3>
                <p className="text-sm text-zinc-600 mt-1">
                  The live quiz <strong className="text-brand-blue">"{activeSession.title}"</strong> is currently in status <strong className="uppercase font-bold text-amber-700">{activeSession.status.replace('_', ' ')}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/run-quiz/${activeSession.id}`)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
            >
              <Play size={11} fill="currentColor" />
              <span>Go to Control Room</span>
            </button>
          </div>
        )}

        {/* Quiz Catalog Selector Grid */}
        <div className="bg-white border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-brand-border pb-4">
            <h2 className="text-base font-black text-brand-textMain uppercase tracking-widest">Select Quiz Session</h2>
            <p className="text-xs text-brand-textMuted mt-1">Choose a quiz below to manage its execution lobby or view results standings.</p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              Loading catalogs...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {quizzes.map((quiz) => {
                const statusDetails = getStatusDetails(quiz);
                const isScheduled = quiz.mode === 'SCHEDULED' || !!quiz.schedule_type;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white border border-brand-border hover:border-brand-blue/30 rounded-2xl p-5 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[240px] text-zinc-800"
                  >
                    {/* Top status indicator strip */}
                    <div className={`absolute top-0 left-0 w-full h-[4px] ${
                      isScheduled ? 'bg-blue-500' :
                      quiz.status === 'in_progress' ? 'bg-emerald-500 animate-pulse' :
                      quiz.status === 'waiting_lobby' ? 'bg-amber-500' :
                      quiz.status === 'completed' ? 'bg-zinc-350' : 'bg-brand-blue'
                    }`} />

                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="space-y-4 relative z-10 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 pt-1">
                          <span className="text-[9px] font-extrabold text-zinc-550 uppercase tracking-widest bg-zinc-100 px-2.5 py-0.5 rounded-full truncate max-w-[120px]">{quiz.event_name}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusDetails.cls}`}>
                            {statusDetails.label}
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 group-hover:text-brand-blue transition-colors line-clamp-1 leading-snug">
                            {quiz.title}
                          </h3>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                            {quiz.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Meta Information & Counts */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-500 bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-150/60">
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">Join Code</span>
                            <span className="font-mono font-bold text-zinc-800 text-xs">{quiz.join_code}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider">Type</span>
                            <span className="font-bold text-zinc-800 text-xs">{isScheduled ? 'Scheduled' : 'Live Host'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-brand-textMuted pt-1">
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
                    <div className="flex justify-between items-center space-x-2 mt-4 pt-3.5 border-t border-brand-border relative z-10">
                      {/* View Analytics / Report */}
                      <button
                        onClick={() => navigate(isScheduled ? `/admin/scheduled-quizzes/${quiz.id}` : `/admin/analytics/${quiz.id}`)}
                        className="flex items-center justify-center space-x-1 px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 border border-brand-border text-zinc-650 hover:text-brand-textMain rounded-xl transition-all text-xs font-semibold select-none cursor-pointer active:scale-95"
                        title={isScheduled ? 'View Overview' : 'View Report'}
                      >
                        <BarChart2 size={13} />
                        <span>{isScheduled ? 'Overview' : 'Report'}</span>
                      </button>

                      {/* Action Button: Live Control Room OR Scheduled Manager */}
                      {isScheduled ? (
                        <button
                          onClick={() => navigate(`/admin/scheduled-quizzes/${quiz.id}`)}
                          className="flex-grow flex items-center justify-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                          title="Manage Scheduled Quiz"
                        >
                          <Calendar size={12} />
                          <span>Manage Schedule</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/admin/run-quiz/${quiz.id}`)}
                          className="flex-grow flex items-center justify-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                          title="Run Live Quiz"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>{quiz.status === 'completed' ? 'Results' : quiz.status === 'in_progress' ? 'Resume' : 'Run Live Quiz'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {quizzes.length === 0 && !loading && (
                <div className="col-span-full py-16 text-center text-zinc-500 text-xs bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                  No quiz sessions resolved. Click "Manage Quizzes" to configure.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN QR CODE / SHARE MODAL (DASHBOARD CATALOG) */}
      {qrQuiz && showCatalogQRModal && (
        <div
          onClick={() => {
            setShowCatalogQRModal(false);
            setQrQuiz(null);
          }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-brand-border rounded-2xl shadow-2xl max-w-[280px] w-full relative cursor-default overflow-hidden animate-fade-in text-zinc-800"
          >
            <div className="h-1 w-full" style={{ background: branding?.primary_color || '#2563EB' }} />

            <button
              onClick={() => {
                setShowCatalogQRModal(false);
                setQrQuiz(null);
              }}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-50 hover:bg-zinc-150 text-zinc-400 hover:text-zinc-700 transition-all cursor-pointer z-20"
            >
              <X size={12} strokeWidth={3} />
            </button>

            <div className="px-4 pt-4 pb-3 text-center space-y-3">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate pr-6">{qrQuiz.event_name}</p>

              <div className="inline-block bg-white p-2.5 rounded-xl border border-zinc-100 shadow-sm">
                <QRCodeSVG
                  id="dashboard-catalog-qr-svg"
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

              <div className="bg-zinc-50 border border-zinc-150 rounded-xl py-2 px-3 relative group">
                <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Code</span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-2xl font-black tracking-[0.25em] select-all" style={{ color: branding?.primary_color || '#2563EB' }}>{qrQuiz.join_code}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrQuiz.join_code).then(() => {
                        setCatalogCopyCodeFeedback(true);
                        setTimeout(() => setCatalogCopyCodeFeedback(false), 2000);
                      });
                    }}
                    className="p-1 hover:bg-zinc-150 text-zinc-500 hover:text-brand-blue rounded transition-all cursor-pointer flex items-center justify-center"
                    title="Copy Join Code Only"
                  >
                    {catalogCopyCodeFeedback ? <Check size={12} className="text-emerald-500 animate-fade-in" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border px-3 py-2.5 grid grid-cols-3 gap-1.5">
              <button
                onClick={handleCatalogCopyLink}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-brand-border hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain transition-all text-[9px] font-bold cursor-pointer"
              >
                {catalogCopyFeedback ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {catalogCopyFeedback ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleCatalogDownloadQR('dashboard-catalog-qr-svg')}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-brand-border hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain transition-all text-[9px] font-bold cursor-pointer"
              >
                <Download size={13} />
                Save
              </button>
              <button
                onClick={handleCatalogShareSession}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white transition-all text-[9px] font-bold cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.15)]"
                style={{ backgroundColor: branding?.primary_color || '#2563EB' }}
              >
                <Share2 size={13} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quiz Confirmation Modal */}
      {deleteQuizTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 text-zinc-800">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Quiz</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{deleteQuizTarget.title}"</strong> ({deleteQuizTarget.event_name})? All questions, participants, answers, and violations will be removed.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteQuizTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuiz(deleteQuizTarget.id)}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deleting ? 'Deleting...' : 'Delete Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
