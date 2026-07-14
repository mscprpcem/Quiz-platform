import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Play,
  Pause,
  ArrowRight,
  SkipForward,
  LogOut,
  Users,
  Award,
  BookOpen,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Lock,
  Plus,
  Eye,
  X,
  Copy,
  Download,
  Share2,
  Check,
  CheckCircle,
  Edit2,
  ListCollapse,
  BarChart2,
  QrCode
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { socket, connectSocket } = useSocket();

  // Quizzes list state
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz session states
  const [activeQuiz, setActiveQuiz] = useState(null); // Full quiz object (metadata + questions)
  const [participants, setParticipants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [currentQuestionStatus, setCurrentQuestionStatus] = useState('closed'); // 'closed', 'released', 'timer_ended'
  const [timerCount, setTimerCount] = useState(0);
  const [submissionStats, setSubmissionStats] = useState({ submittedCount: 0, totalCount: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Inactive Quiz Management States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', event_name: '', description: '', scheduled_start: '' });
  const [formError, setFormError] = useState('');
  
  // General QR Sharing States for list cards
  const [qrQuiz, setQrQuiz] = useState(null);
  const [showCatalogQRModal, setShowCatalogQRModal] = useState(false);
  const [catalogCopyFeedback, setCatalogCopyFeedback] = useState(false);

  // Branding config
  const [branding, setBranding] = useState(null);

  // Load quizzes on mount
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/quizzes');
      setQuizzes(response.data);

      // Check if there is an active session currently running
      const activeSession = response.data.find(
        (q) => q.status === 'waiting_lobby' || q.status === 'in_progress'
      );
      if (activeSession) {
        handleLoadActiveQuiz(activeSession.id);
      }
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

  // Set up WebSocket events when active quiz changes
  useEffect(() => {
    if (!socket || !activeQuiz) return;

    connectSocket();

    const joinAdmin = () => {
      socket.emit('admin_join_quiz', { quizId: activeQuiz.id });
    };

    socket.on('connect', joinAdmin);

    if (socket.connected) {
      joinAdmin();
    }

    // Live lobby participant updates
    socket.on('lobby_participants_update', (data) => {
      setParticipants(data);
      setSubmissionStats((prev) => ({ ...prev, totalCount: data.length }));
    });

    // Question submission count updates
    socket.on('question_progress_update', (data) => {
      setSubmissionStats(data);
    });

    // Question ended (timer expired/locked)
    socket.on('question_ended', ({ correctAnswer, leaderboard }) => {
      setCurrentQuestionStatus('timer_ended');
      if (timerIntervalId) clearInterval(timerIntervalId);
      setTimerCount(0);

      // Refresh participant listings with scores
      setParticipants(leaderboard);
    });

    return () => {
      socket.off('connect', joinAdmin);
      socket.off('lobby_participants_update');
      socket.off('question_progress_update');
      socket.off('question_ended');
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [socket, activeQuiz, timerIntervalId]);

  // Copy Link Helper
  const handleCopyLink = () => {
    if (!activeQuiz) return;
    const url = `${window.location.origin}/join/${activeQuiz.join_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  // Helper: draw a branded QR card on a canvas and export as PNG download
  const drawBrandedCard = (ctx, qrImage, quizData, brandData, logoImg) => {
    const W = 400;
    const H = 650;

    const getValidColor = (hex, fallback = '#0078d4') => {
      if (!hex || typeof hex !== 'string') return fallback;
      const cleaned = hex.trim();
      const isValid = /^#[0-9A-F]{6}$/i.test(cleaned) || /^#[0-9A-F]{3}$/i.test(cleaned);
      return isValid ? cleaned : fallback;
    };

    const colorToRgba = (hex, alpha, fallback = '#0078d4') => {
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

    const primaryColor = getValidColor(brandData?.primary_color);
    const clubName = (brandData?.club_name || 'Microsoft Student Club').toUpperCase();
    const chapterName = (brandData?.chapter_name || 'MSC-PRPCEM Chapter').toUpperCase();
    const footerText = brandData?.footer_text || 'Powered by Microsoft Student Club Quiz Platform';

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

    // Logo embedded inside the QR code center
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

  // Download QR Code Helper
  const handleDownloadQR = (elementId) => {
    if (!activeQuiz) return;
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const logoSrc = branding?.logo_path ? `/${branding.logo_path}` : null;

    const image = new Image();
    image.onload = () => {
      const drawCard = (logoImg) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 650;
        const ctx = canvas.getContext('2d');

        drawBrandedCard(ctx, image, activeQuiz, branding, logoImg);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `quiz-${activeQuiz.join_code}.png`;
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

  // Share Session Helper
  const handleShareSession = () => {
    if (!activeQuiz) return;
    const url = `${window.location.origin}/join/${activeQuiz.join_code}`;
    if (navigator.share) {
      navigator.share({
        title: activeQuiz.title,
        text: `Join my live quiz "${activeQuiz.title}" by scanning the QR or using the link!`,
        url: url
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      handleCopyLink();
    }
  };

  // Inactive Quiz Management Actions (Dashboard)
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

  const handleCatalogDownloadQR = (elementId) => {
    if (!qrQuiz) return;
    const svgElement = document.getElementById(elementId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const logoSrc = branding?.logo_path ? `/${branding.logo_path}` : null;

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

  // Load detailed active quiz from backend
  const handleLoadActiveQuiz = async (quizId) => {
    try {
      const response = await api.get(`/api/quizzes/${quizId}`);
      const quizData = response.data;
      setActiveQuiz(quizData);
      setCurrentQuestionIndex(quizData.current_question_index);
      setCurrentQuestionStatus(quizData.current_question_status);
    } catch (err) {
      console.error('Error loading active quiz details:', err);
    }
  };

  // Controller functions
  const startLobby = () => {
    if (socket && activeQuiz) {
      socket.emit('start_lobby', { quizId: activeQuiz.id });
      setActiveQuiz((prev) => ({ ...prev, status: 'waiting_lobby' }));
      loadQuizzes();
    }
  };

  const startQuiz = () => {
    if (socket && activeQuiz) {
      socket.emit('start_quiz', { quizId: activeQuiz.id });
      setActiveQuiz((prev) => ({ ...prev, status: 'in_progress' }));
      setCurrentQuestionIndex(0);
      setCurrentQuestionStatus('closed');
      loadQuizzes();
    }
  };

  const releaseQuestion = () => {
    if (socket && activeQuiz) {
      const nextIndex = currentQuestionStatus === 'timer_ended' ? currentQuestionIndex + 1 : currentQuestionIndex;

      if (nextIndex >= activeQuiz.questions.length) {
        alert('All questions have already been released!');
        return;
      }

      const questionObj = activeQuiz.questions[nextIndex];

      socket.emit('release_question', { quizId: activeQuiz.id, questionIndex: nextIndex });
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestionStatus('released');
      setTimerCount(questionObj.timer);
      setSubmissionStats({ submittedCount: 0, totalCount: participants.length });

      // Run local visual countdown
      if (timerIntervalId) clearInterval(timerIntervalId);
      const interval = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(interval);
    }
  };

  const lockSubmissions = () => {
    if (socket && activeQuiz) {
      socket.emit('end_question', { quizId: activeQuiz.id });
    }
  };

  const skipQuestion = () => {
    if (socket && activeQuiz) {
      socket.emit('skip_question', { quizId: activeQuiz.id });
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < activeQuiz.questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestionStatus('closed');
      } else {
        // Last question skipped -> completes quiz
        endQuiz();
      }
    }
  };

  const pauseQuiz = () => {
    if (socket && activeQuiz) {
      socket.emit('pause_quiz', { quizId: activeQuiz.id });
      setIsPaused(true);
      if (timerIntervalId) clearInterval(timerIntervalId);
    }
  };

  const resumeQuiz = () => {
    if (socket && activeQuiz) {
      socket.emit('resume_quiz', { quizId: activeQuiz.id });
      setIsPaused(false);

      // Resume countdown
      const interval = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(interval);
    }
  };

  const endQuiz = () => {
    if (socket && activeQuiz) {
      socket.emit('end_quiz', { quizId: activeQuiz.id });
      setActiveQuiz(null);
      setParticipants([]);
      loadQuizzes();
    }
  };

  const kickParticipant = (participantId) => {
    if (socket && activeQuiz) {
      if (confirm('Are you sure you want to remove this participant?')) {
        socket.emit('kick_participant', { quizId: activeQuiz.id, participantId });
      }
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-lg shadow-zinc-150/30 gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#f25022] via-[#7fba00] via-[#00a4ef] to-[#ffb900]"></div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Quiz Control Center</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-microsoft-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-microsoft-blue"></span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Manage live quiz sessions, monitor participants, and release questions.</p>
        </div>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue hover:from-microsoft-darkBlue hover:to-microsoft-darkBlue text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex-shrink-0"
        >
          <Plus size={16} />
          <span>Manage Quizzes</span>
        </button>
      </div>

      {/* Live Active Session Panel */}
      {activeQuiz ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls Section */}
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-150 pb-4">
              <div>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-microsoft-lightBlue text-microsoft-darkBlue border border-microsoft-blue/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-microsoft-blue animate-pulse"></span>
                  <span>Live: {activeQuiz.status.replace('_', ' ')}</span>
                </span>
                <h2 className="text-xl font-black text-zinc-800 tracking-tight mt-2">{activeQuiz.title}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Join Code: <span className="font-extrabold text-microsoft-blue select-all bg-microsoft-lightBlue px-2 py-0.5 rounded ml-1">{activeQuiz.join_code}</span></p>
              </div>

              {/* Abort Session */}
              <button
                onClick={endQuiz}
                className="bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 hover:text-red-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                Abort Session
              </button>
            </div>

            {/* Dashboard status indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 text-center shadow-sm">
                <Users className="text-microsoft-blue mx-auto mb-1.5" size={20} />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Joined Players</span>
                <p className="text-2xl font-black text-zinc-800 mt-1">{participants.length}</p>
              </div>

              <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 text-center shadow-sm">
                <BookOpen className="text-zinc-500 mx-auto mb-1.5" size={20} />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Question Progress</span>
                <p className="text-2xl font-black text-zinc-800 mt-1">
                  {currentQuestionIndex >= 0 ? `${currentQuestionIndex + 1}/${activeQuiz.questions.length}` : `0/${activeQuiz.questions.length}`}
                </p>
              </div>

              <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 text-center shadow-sm">
                <Award className="text-microsoft-success mx-auto mb-1.5" size={20} />
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Gameplay Status</span>
                <p className="text-sm font-black text-microsoft-success mt-2 uppercase tracking-wide bg-emerald-50 border border-emerald-100 py-1.5 rounded-lg">
                  {currentQuestionStatus.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Session Actions Panel */}
            <div className="bg-zinc-50/50 border border-zinc-150 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quiz Control Console</h3>
              
              <div className="flex flex-wrap gap-3">
                {activeQuiz.status === 'draft' && (
                  <button
                    onClick={startLobby}
                    className="flex items-center space-x-2 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Start Session Lobby</span>
                  </button>
                )}

                {activeQuiz.status === 'waiting_lobby' && (
                  <button
                    onClick={startQuiz}
                    className="flex items-center space-x-2 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Start Quiz Gameplay</span>
                  </button>
                )}

                {activeQuiz.status === 'in_progress' && (
                  <>
                    {/* Release Button */}
                    <button
                      onClick={releaseQuestion}
                      disabled={currentQuestionStatus === 'released'}
                      className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-zinc-300 disabled:to-zinc-300 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowRight size={16} />
                      <span>
                        {currentQuestionStatus === 'timer_ended'
                          ? 'Release Next Question'
                          : currentQuestionIndex === -1
                          ? 'Release First Question'
                          : 'Release Current Question'}
                      </span>
                    </button>

                    {/* Lock submissions */}
                    <button
                      onClick={lockSubmissions}
                      disabled={currentQuestionStatus !== 'released'}
                      className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-300 disabled:to-zinc-300 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <Lock size={16} />
                      <span>Lock Answers</span>
                    </button>

                    {/* Pause / Resume */}
                    {isPaused ? (
                      <button
                        onClick={resumeQuiz}
                        disabled={currentQuestionStatus !== 'released'}
                        className="flex items-center space-x-2 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 disabled:from-zinc-300 disabled:to-zinc-300 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Play size={16} fill="currentColor" />
                        <span>Resume Question</span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseQuiz}
                        disabled={currentQuestionStatus !== 'released'}
                        className="flex items-center space-x-2 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 disabled:from-zinc-300 disabled:to-zinc-300 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <Pause size={16} fill="currentColor" />
                        <span>Pause Question</span>
                      </button>
                    )}

                    {/* Skip question */}
                    <button
                      onClick={skipQuestion}
                      className="flex items-center space-x-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <SkipForward size={16} />
                      <span>Skip Question</span>
                    </button>
                  </>
                )}
              </div>

              {/* Submissions feedback progress */}
              {currentQuestionStatus === 'released' && (
                <div className="border-t border-zinc-200/80 pt-4 space-y-2 animate-fade-in">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>Active Timer: <span className="font-extrabold text-red-655 animate-pulse">{timerCount}s</span></span>
                    <span>Submissions: <span className="font-extrabold text-zinc-850">{submissionStats.submittedCount} / {submissionStats.totalCount}</span></span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue h-full transition-all duration-300 shadow-[0_0_8px_rgba(0,120,212,0.4)]"
                      style={{
                        width: `${submissionStats.totalCount > 0 ? (submissionStats.submittedCount / submissionStats.totalCount) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Active Question details & Session QR Code) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Active Question Spec Sheet */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <h3 className="text-md font-extrabold text-zinc-800 border-b border-zinc-100 pb-3 tracking-tight">Active Question Details</h3>
              
              {currentQuestionIndex >= 0 && activeQuiz.questions[currentQuestionIndex] ? (
                <div className="space-y-4 py-4 flex-grow animate-fade-in text-sm">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Question Text</span>
                    <p className="font-bold text-zinc-800 leading-snug mt-1.5">
                      {activeQuiz.questions[currentQuestionIndex].question}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`p-2.5 border rounded-xl ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'a' ? 'border-emerald-505 bg-emerald-50/50' : 'border-zinc-150 bg-zinc-50/50'}`}>
                      <span className={`font-bold uppercase tracking-wider text-[9px] block ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'a' ? 'text-emerald-700' : 'text-zinc-450'}`}>Option A</span>
                      <p className={`font-semibold mt-0.5 truncate ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'a' ? 'text-emerald-800' : 'text-zinc-650'}`}>{activeQuiz.questions[currentQuestionIndex].option_a}</p>
                    </div>
                    <div className={`p-2.5 border rounded-xl ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'b' ? 'border-emerald-505 bg-emerald-50/50' : 'border-zinc-150 bg-zinc-50/50'}`}>
                      <span className={`font-bold uppercase tracking-wider text-[9px] block ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'b' ? 'text-emerald-700' : 'text-zinc-450'}`}>Option B</span>
                      <p className={`font-semibold mt-0.5 truncate ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'b' ? 'text-emerald-800' : 'text-zinc-650'}`}>{activeQuiz.questions[currentQuestionIndex].option_b}</p>
                    </div>
                    <div className={`p-2.5 border rounded-xl ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'c' ? 'border-emerald-505 bg-emerald-50/50' : 'border-zinc-150 bg-zinc-50/50'}`}>
                      <span className={`font-bold uppercase tracking-wider text-[9px] block ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'c' ? 'text-emerald-700' : 'text-zinc-450'}`}>Option C</span>
                      <p className={`font-semibold mt-0.5 truncate ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'c' ? 'text-emerald-800' : 'text-zinc-650'}`}>{activeQuiz.questions[currentQuestionIndex].option_c}</p>
                    </div>
                    <div className={`p-2.5 border rounded-xl ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'd' ? 'border-emerald-505 bg-emerald-50/50' : 'border-zinc-150 bg-zinc-50/50'}`}>
                      <span className={`font-bold uppercase tracking-wider text-[9px] block ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'd' ? 'text-emerald-700' : 'text-zinc-450'}`}>Option D</span>
                      <p className={`font-semibold mt-0.5 truncate ${activeQuiz.questions[currentQuestionIndex].correct_answer === 'd' ? 'text-emerald-800' : 'text-zinc-650'}`}>{activeQuiz.questions[currentQuestionIndex].option_d}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl font-bold text-xs flex justify-between items-center shadow-sm">
                    <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-600 animate-pulse" /> Correct Answer:</span>
                    <span className="text-sm font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded-md">Option {activeQuiz.questions[currentQuestionIndex].correct_answer}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400 text-sm flex-grow flex items-center justify-center">
                  Release first question to show details.
                </div>
              )}

              <button
                onClick={() => navigate(`/admin/quizzes/${activeQuiz.id}`)}
                className="w-full text-center border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 text-zinc-600 font-bold py-2.5 rounded-xl text-xs transition-all mt-4 cursor-pointer"
              >
                Configure Question Sheet
              </button>
            </div>

            {/* Session Share Link */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-md space-y-4 text-center">
              <h3 className="text-md font-extrabold text-zinc-800 border-b border-zinc-100 pb-3 tracking-tight">Session Share Link</h3>
              <div className="flex flex-col items-center space-y-3.5">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-inner">
                  <QRCodeSVG
                    id="sidebar-qr-svg"
                    value={`${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`}
                    size={130}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="w-full">
                  <p className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest">Join URL</p>
                  <p className="text-xs text-zinc-550 font-bold select-all truncate max-w-[200px] mx-auto bg-zinc-50 border border-zinc-155 rounded-xl px-2.5 py-1.5 mt-1 leading-snug">
                    {window.location.origin}/join/{activeQuiz.join_code}
                  </p>
                </div>
                <div className="w-full grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCopyLink}
                    title="Copy Link"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/40 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2.5 rounded-xl text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {copyFeedback ? <Check size={14} className="text-microsoft-success" /> : <Copy size={14} />}
                    <span className="mt-1">{copyFeedback ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadQR('sidebar-qr-svg')}
                    title="Download PNG"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/40 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2.5 rounded-xl text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="mt-1">Download</span>
                  </button>
                  <button
                    onClick={handleShareSession}
                    title="Share Link"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/40 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2.5 rounded-xl text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span className="mt-1">Share</span>
                  </button>
                </div>
                <div className="w-full h-px bg-zinc-100"></div>
                <div className="w-full">
                  <p className="text-[9px] font-bold text-zinc-450 uppercase tracking-widest">Join Code</p>
                  <h2 className="text-3xl font-black text-microsoft-blue tracking-widest select-all mt-0.5">{activeQuiz.join_code}</h2>
                </div>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full text-center border border-microsoft-blue/20 bg-microsoft-blue/5 hover:bg-microsoft-blue hover:text-white text-microsoft-blue font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Eye size={13} />
                  <span>Project Fullscreen QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Participant Monitoring Table */}
          <div className="lg:col-span-3 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4">
              <h3 className="text-lg font-black text-zinc-800 tracking-tight">Connected Participants Telemetry</h3>
              <span className="bg-microsoft-blue/5 border border-microsoft-blue/10 text-microsoft-blue text-xs font-bold px-3 py-1 rounded-full">
                {participants.length} Active Players
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-150">
              <table className="min-w-full divide-y divide-zinc-250 text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 uppercase text-[9px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Rank</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">College</th>
                    <th className="px-6 py-3.5">Current Score</th>
                    <th className="px-6 py-3.5">Tab Violations</th>
                    <th className="px-6 py-3.5">Telemetry Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-700 bg-white">
                  {participants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-500">#{p.score ? idx + 1 : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-microsoft-blue/5 text-microsoft-blue border border-microsoft-blue/10 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-zinc-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{p.college}</td>
                      <td className="px-6 py-4 font-extrabold text-microsoft-blue">{p.score || 0} pts</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          p.tab_switch_count >= 3
                            ? 'bg-red-50 text-red-655 border border-red-100 animate-pulse'
                            : p.tab_switch_count >= 1
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-zinc-50 text-zinc-400 border border-zinc-100'
                        }`}>
                          {p.tab_switch_count || 0} switches
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          p.connection_status === 'connected'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.connection_status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <span>{p.connection_status === 'connected' ? 'Active' : 'Offline'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => kickParticipant(p.id)}
                          className="text-red-600 hover:text-white border border-red-200 hover:bg-red-600 hover:border-red-600 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          Kick
                        </button>
                      </td>
                    </tr>
                  ))}

                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                        No participants joined yet. Share the code and wait.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Selector / Inactive Session Center */
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 md:p-8 shadow-lg shadow-zinc-150/30 space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-800 tracking-tight">Launch Quiz Session</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Select an existing quiz below to open the session waiting lobby for participants.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {quizzes.map((quiz) => {
              const isDraft = quiz.status === 'draft';
              return (
                <div
                  key={quiz.id}
                  className="bg-white border border-zinc-200 hover:border-microsoft-blue/30 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Hover glow effect background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-microsoft-lightBlue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  <div className="space-y-3.5 relative z-10">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">{quiz.event_name}</span>
                      <div className="flex space-x-1 bg-zinc-50 border border-zinc-100 p-0.5 rounded-lg shadow-sm">
                        {/* Edit */}
                        <button
                          onClick={() => handleOpenCreate(quiz)}
                          className="p-1.5 hover:bg-white text-zinc-400 hover:text-zinc-700 rounded-md transition-all cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit2 size={12} />
                        </button>
                        
                        {/* Share QR */}
                        <button
                          onClick={() => handleOpenCatalogQR(quiz)}
                          className="p-1.5 hover:bg-white text-zinc-400 hover:text-microsoft-blue rounded-md transition-all cursor-pointer"
                          title="Share & QR Code Card"
                        >
                          <QrCode size={12} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1.5 hover:bg-white text-zinc-400 hover:text-red-650 rounded-md transition-all cursor-pointer"
                          title="Delete Quiz"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-800 leading-snug group-hover:text-microsoft-blue transition-colors duration-200 truncate" title={quiz.title}>{quiz.title}</h3>
                      <p className="text-xs text-zinc-550 line-clamp-2 mt-1 leading-relaxed">{quiz.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  {/* Counts section pill */}
                  <div className="bg-zinc-50/50 border border-zinc-100/80 rounded-xl my-4 py-2.5 grid grid-cols-2 text-center text-xs relative z-10">
                    <div className="border-r border-zinc-150">
                      <span className="font-extrabold text-zinc-755 text-sm block">{quiz.questionCount || 0}</span>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Questions</span>
                    </div>
                    <div>
                      <span className="font-extrabold text-zinc-755 text-sm block">{quiz.participantCount || 0}</span>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Plays</span>
                    </div>
                  </div>

                  {/* Actions section */}
                  <div className="flex justify-between items-center space-x-2.5 mt-auto pt-2.5 border-t border-zinc-100 relative z-10">
                    {/* Questions Sheet */}
                    <button
                      onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}
                      className="flex items-center space-x-1 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-650 hover:text-zinc-800 rounded-xl transition-all text-xs font-semibold select-none cursor-pointer"
                      title="Manage Questions"
                    >
                      <ListCollapse size={13} />
                      <span>Sheet</span>
                    </button>

                    {/* Launch Lobby */}
                    <button
                      onClick={() => handleLoadActiveQuiz(quiz.id)}
                      className="flex-grow flex items-center justify-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue hover:from-microsoft-darkBlue hover:to-microsoft-darkBlue text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                      title="Launch Lobby"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Launch Lobby</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {quizzes.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center text-zinc-400 text-sm bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                No quizzes created yet. Navigate to "Manage Quizzes" to create one.
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* QR CODE SHARE MODAL */}
      {activeQuiz && showQRModal && (
        <div
          onClick={() => setShowQRModal(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-[280px] w-full relative cursor-default overflow-hidden animate-fade-in"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ background: branding?.primary_color || '#0078d4' }} />

            {/* Close button — fixed top-right inside the card */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer z-20"
            >
              <X size={12} strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="px-4 pt-4 pb-3 text-center space-y-3">
              {/* Event name */}
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate pr-6">{activeQuiz.event_name}</p>

              {/* QR Code */}
              <div className="inline-block bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                <QRCodeSVG
                  id="modal-qr-svg"
                  value={`${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`}
                  size={160}
                  level="H"
                  includeMargin={false}
                  imageSettings={branding?.logo_path ? {
                    src: `/${branding.logo_path}`,
                    x: undefined,
                    y: undefined,
                    height: branding?.qr_logo_size || 28,
                    width: branding?.qr_logo_size || 28,
                    excavate: true,
                  } : undefined}
                />
              </div>

              {/* Join Code */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg py-2 px-3">
                <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Code</span>
                <span className="block text-2xl font-black tracking-[0.25em] mt-0.5 select-all" style={{ color: branding?.primary_color || '#0078d4' }}>{activeQuiz.join_code}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="border-t border-zinc-100 px-3 py-2.5 grid grid-cols-3 gap-1.5">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 transition-all text-[9px] font-bold cursor-pointer"
              >
                {copyFeedback ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copyFeedback ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleDownloadQR('modal-qr-svg')}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700 transition-all text-[9px] font-bold cursor-pointer"
              >
                <Download size={13} />
                Save
              </button>
              <button
                onClick={handleShareSession}
                className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-white transition-all text-[9px] font-bold cursor-pointer"
                style={{ backgroundColor: branding?.primary_color || '#0078d4' }}
              >
                <Share2 size={13} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL (DASHBOARD) */}
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
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-3">
              {selectedQuiz ? 'Edit Quiz Metadata' : 'Create New Quiz'}
            </h3>

            {formError && (
              <div className="mt-4 bg-red-50 text-red-750 p-2.5 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveQuiz} className="mt-4 space-y-4 text-sm text-zinc-700">
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

      {/* FULLSCREEN QR CODE / SHARE MODAL (DASHBOARD CATALOG) */}
      {qrQuiz && showCatalogQRModal && (
        <div
          onClick={() => {
            setShowCatalogQRModal(false);
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
                setShowCatalogQRModal(false);
                setQrQuiz(null);
              }}
              className="absolute top-4 right-4 bg-zinc-850 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white p-2 rounded-full transition-all cursor-pointer"
              title="Close Modal"
            >
              <X size={16} />
            </button>

            {/* Branded Card Container */}
            <div className="bg-white bg-azure-mesh text-zinc-800 p-4 rounded-xl shadow-inner border-2 border-zinc-200 max-w-xs mx-auto space-y-3.5 text-center relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1.5 animate-[azureFlow_4s_ease_infinite]"
                style={{
                  background: `linear-gradient(90deg, ${branding?.primary_color || '#0078d4'}, ${branding?.primary_color || '#0078d4'}CC, ${branding?.primary_color || '#0078d4'})`,
                  backgroundSize: '200% 200%'
                }}
              ></div>
              
              {/* Decorative dot pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(${branding?.primary_color || '#0078d4'} 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }}></div>

              {/* Floating Azure AI styled nodes */}
              <div className="absolute top-8 left-4 w-2 h-2 rounded-full pointer-events-none decor-node opacity-20" style={{ backgroundColor: branding?.primary_color || '#0078d4' }}></div>
              <div className="absolute bottom-16 right-8 w-3 h-3 rounded-full pointer-events-none decor-node-delay-1 opacity-20" style={{ backgroundColor: branding?.primary_color || '#0078d4' }}></div>

              {/* Logo / Club Name */}
              <div className="flex flex-col items-center space-y-1 pt-1 relative z-10">
                {branding?.logo_path ? (
                  <img src={`/${branding.logo_path}`} alt="Logo" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                    <div className="bg-[#f25022]"></div>
                    <div className="bg-[#7fba00]"></div>
                    <div className="bg-[#00a4ef]"></div>
                    <div className="bg-[#ffb900]"></div>
                  </div>
                )}
                <h2 className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500">{branding?.club_name || 'Microsoft Student Club'}</h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ color: branding?.primary_color || '#0078d4', backgroundColor: (branding?.primary_color || '#0078d4') + '14' }}>
                  {branding?.chapter_name || 'MSC-PRPCEM CHAPTER'}
                </span>
              </div>

              <div className="border-t border-b border-zinc-100 py-2 my-0.5 relative z-10">
                <h1 className="text-sm font-black text-zinc-800 leading-tight uppercase truncate" title={qrQuiz.title}>{qrQuiz.title}</h1>
                <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5 truncate" title={qrQuiz.event_name}>{qrQuiz.event_name}</p>
              </div>

              {/* QR Code Container */}
              <div className="inline-block bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 relative z-10">
                <QRCodeSVG
                  id="dashboard-catalog-qr-svg"
                  value={`${window.location.protocol}//${window.location.host}/join/${qrQuiz.join_code}`}
                  size={130}
                  level="H"
                  includeMargin={false}
                  imageSettings={branding?.logo_path ? {
                    src: `/${branding.logo_path}`,
                    x: undefined,
                    y: undefined,
                    height: 26,
                    width: 26,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="space-y-1.5 text-zinc-700 relative z-10">
                <div className="text-[10px] font-semibold text-zinc-500">
                  <p>Scan with camera or visit:</p>
                  <p className="font-bold underline select-all mt-0.5 break-all" style={{ color: branding?.primary_color || '#005a9e' }}>
                    {window.location.origin}/join/{qrQuiz.join_code}
                  </p>
                </div>
                
                <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-lg">
                  <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest text-center">Unique Join Code</span>
                  <span className="block text-xl font-black tracking-widest select-all mt-0.5 text-center" style={{ color: branding?.primary_color || '#0078d4' }}>{qrQuiz.join_code}</span>
                </div>
              </div>
            </div>

            {/* Actions for Modal */}
            <div className="flex flex-col space-y-2.5 max-w-xs mx-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCatalogCopyLink}
                  className="flex items-center justify-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md border border-zinc-750"
                >
                  {catalogCopyFeedback ? <Check size={14} className="text-microsoft-success animate-scale-up" /> : <Copy size={14} />}
                  <span>{catalogCopyFeedback ? 'Copied' : 'Copy URL'}</span>
                </button>
                <button
                  onClick={() => handleCatalogDownloadQR('dashboard-catalog-qr-svg')}
                  className="flex items-center justify-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold py-2.5 rounded-lg text-xs transition-all cursor-pointer shadow-md border border-zinc-750"
                >
                  <Download size={14} />
                  <span>Download Card</span>
                </button>
              </div>
              <button
                onClick={handleCatalogShareSession}
                className="w-full flex items-center justify-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-bold py-3 rounded-lg text-xs transition-all cursor-pointer shadow-lg"
              >
                <Share2 size={14} />
                <span>Share Join Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
