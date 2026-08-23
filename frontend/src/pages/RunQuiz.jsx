import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Top10Leaderboard from '../components/Top10Leaderboard';
import { QRCodeSVG } from 'qrcode.react';
import {
  Play,
  Pause,
  ArrowRight,
  SkipForward,
  Users,
  Award,
  BookOpen,
  AlertTriangle,
  Lock,
  X,
  Copy,
  Download,
  Share2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Trophy,
  HelpCircle,
  Clock,
  Sparkles,
  Globe
} from 'lucide-react';

export default function RunQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connectSocket } = useSocket();

  // Quiz details & states
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [currentQuestionStatus, setCurrentQuestionStatus] = useState('closed'); // 'closed', 'released', 'timer_ended'
  const [timerCount, setTimerCount] = useState(0);
  const [submissionStats, setSubmissionStats] = useState({ submittedCount: 0, totalCount: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [leaderboardReleased, setLeaderboardReleased] = useState(false);
  const [branding, setBranding] = useState(null);

  // Load quiz details
  const loadQuizDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quizzes/${id}`);
      setActiveQuiz(response.data);
      setCurrentQuestionIndex(response.data.current_question_index);
      setCurrentQuestionStatus(response.data.current_question_status);
    } catch (err) {
      console.error('Error loading quiz details:', err);
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
    loadQuizDetails();
    loadBranding();
  }, [id]);

  // Set up WebSocket events
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

    socket.on('lobby_participants_update', (data) => {
      setParticipants(data);
      setSubmissionStats((prev) => ({ ...prev, totalCount: data.length }));
    });

    socket.on('question_progress_update', (data) => {
      setSubmissionStats(data);
    });

    socket.on('question_ended', ({ correctAnswer, leaderboard }) => {
      setCurrentQuestionStatus('timer_ended');
      if (timerIntervalId) clearInterval(timerIntervalId);
      setTimerCount(0);
      setParticipants(leaderboard);
    });

    socket.on('leaderboard_status', ({ released }) => {
      setLeaderboardReleased(released);
    });

    return () => {
      socket.off('connect', joinAdmin);
      socket.off('lobby_participants_update');
      socket.off('question_progress_update');
      socket.off('question_ended');
      socket.off('leaderboard_status');
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [socket, activeQuiz, timerIntervalId]);

  // Copy URL Helper
  const handleCopyLink = () => {
    if (!activeQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleCopyCode = () => {
    if (!activeQuiz) return;
    navigator.clipboard.writeText(activeQuiz.join_code).then(() => {
      setCopyCodeFeedback(true);
      setTimeout(() => setCopyCodeFeedback(false), 2000);
    });
  };

  // Share invite helper
  const handleShareSession = () => {
    if (!activeQuiz) return;
    const url = `${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`;
    if (navigator.share) {
      navigator.share({
        title: activeQuiz.title,
        text: `Join my live quiz "${activeQuiz.title}" using the link!`,
        url: url
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      handleCopyLink();
    }
  };

  // Helper: draw branded QR card and download
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
    const rawClub = (brandData?.club_name || 'Microsoft Student Club').trim();
    const rawChap = (brandData?.chapter_name || 'PRPCEM Chapter').trim();

    let clubName = rawClub.replace(/\s+PRPCEM$/i, '').trim();
    if (!clubName) clubName = 'Microsoft Student Club';

    let chapterName = rawChap
      .replace(/^Microsoft\s+Student\s+Club\s*/i, '')
      .replace(/^MSC[-\s]*/i, '')
      .trim();

    if (!chapterName) chapterName = 'PRPCEM';
    if (!chapterName.toLowerCase().includes('chapter')) {
      chapterName = `${chapterName} CHAPTER`;
    }

    clubName = clubName.toUpperCase();
    chapterName = chapterName.toUpperCase();
    const footerText = brandData?.footer_text || 'Powered by Microsoft Student Club PRPCEM Quiz Platform';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

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

    ctx.fillStyle = colorToRgba(primaryColor, 0.06);
    ctx.beginPath();
    ctx.arc(40, 180, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(360, 520, 12, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(0.5, colorToRgba(primaryColor, 0.8));
    grad.addColorStop(1, primaryColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 8);

    if (logoImg) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(200, 34, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(logoImg, 178, 12, 44, 44);
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
    const titleText = quizData.title.toUpperCase();
    ctx.fillText(titleText.length > 35 ? titleText.slice(0, 35) + '...' : titleText, 200, 140);

    ctx.fillStyle = '#605e5c';
    ctx.font = '600 10px Inter, "Segoe UI", sans-serif';
    ctx.fillText(quizData.event_name.toUpperCase(), 200, 160);

    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(80, 185, 240, 240);
    ctx.strokeStyle = '#edebe9';
    ctx.strokeRect(80, 185, 240, 240);

    ctx.drawImage(qrImage, 90, 195, 220, 220);

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

    ctx.fillStyle = '#605e5c';
    ctx.font = '600 11px Inter, "Segoe UI", sans-serif';
    ctx.fillText('Scan with camera or visit:', 200, 455);

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 12px Inter, "Segoe UI", sans-serif';
    const joinUrl = `${window.location.origin}/join/${quizData.join_code}`;
    ctx.fillText(joinUrl, 200, 478);

    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(80, 505, 240, 70);
    ctx.strokeStyle = '#edebe9';
    ctx.strokeRect(80, 505, 240, 70);

    ctx.fillStyle = '#605e5c';
    ctx.font = 'bold 9px Inter, "Segoe UI", sans-serif';
    ctx.fillText('UNIQUE JOIN CODE', 200, 525);

    ctx.fillStyle = primaryColor;
    ctx.font = '900 28px Inter, "Segoe UI", sans-serif';
    ctx.fillText(quizData.join_code, 200, 560);

    ctx.fillStyle = '#a19f9d';
    ctx.font = 'bold 8px Inter, "Segoe UI", sans-serif';
    ctx.fillText(footerText, 200, 610);

    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 4, W, 4);
  };

  const handleDownloadQR = (elementId) => {
    if (!activeQuiz) return;
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

  // Controller functions
  const publishQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const res = await api.put(`/api/quizzes/${activeQuiz.id}/publish`);
      if (socket) {
        socket.emit('start_lobby', { quizId: activeQuiz.id });
      }
      setActiveQuiz(res.data.quiz || { ...activeQuiz, status: 'waiting_lobby' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish quiz. Please make sure questions are added.');
    }
  };

  const startLobby = () => {
    if (socket && activeQuiz) {
      socket.emit('start_lobby', { quizId: activeQuiz.id });
      setActiveQuiz((prev) => ({ ...prev, status: 'waiting_lobby' }));
    }
  };

  const startQuiz = () => {
    if (socket && activeQuiz) {
      socket.emit('start_quiz', { quizId: activeQuiz.id });
      setActiveQuiz((prev) => ({ ...prev, status: 'in_progress' }));
      setCurrentQuestionIndex(0);
      setCurrentQuestionStatus('closed');
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

      if (timerIntervalId) clearInterval(timerIntervalId);
      const interval = setInterval(() => {
        setTimerCount((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Auto lock submissions and calculate leaderboard when timer ends
            socket.emit('end_question', { quizId: activeQuiz.id });
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
      if (confirm('Are you sure you want to end the quiz session? This will finalize scores and standings.')) {
        socket.emit('end_quiz', { quizId: activeQuiz.id });
        setActiveQuiz((prev) => ({ ...prev, status: 'completed' }));
        setLeaderboardReleased(false);
        if (timerIntervalId) clearInterval(timerIntervalId);
      }
    }
  };

  const releaseLeaderboard = () => {
    if (socket && activeQuiz) {
      socket.emit('release_leaderboard', { quizId: activeQuiz.id });
      setLeaderboardReleased(true);
    }
  };

  const kickParticipant = (participantId) => {
    if (socket && activeQuiz) {
      if (confirm('Are you sure you want to kick this participant?')) {
        socket.emit('kick_participant', { quizId: activeQuiz.id, participantId });
      }
    }
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const correctA = a.correctAnswers || 0;
    const correctB = b.correctAnswers || 0;
    if (correctB !== correctA) return correctB - correctA;
    return (a.avgResponseTime || 0) - (b.avgResponseTime || 0);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-brand-textMuted">Compiling Control Room...</span>
        </div>
      </div>
    );
  }

  if (!activeQuiz) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4 p-8 bg-white border border-brand-border rounded-3xl shadow-soft">
        <AlertTriangle size={42} className="text-brand-error mx-auto" />
        <h2 className="text-xl font-bold text-brand-textMain">Session Unresolved</h2>
        <p className="text-sm text-brand-textMuted">The requested quiz session identifier could not be validated.</p>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="px-6 py-2.5 bg-brand-blue hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
        
        {/* Cockpit Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-brand-border/60 p-5 rounded-2xl shadow-soft gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2.5 bg-brand-lightBlue hover:bg-brand-blue/15 text-brand-blue rounded-xl transition-all cursor-pointer border border-brand-blue/10 active:scale-95"
              title="Back to Dashboard"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <div>
              <span className="text-[9px] font-extrabold text-brand-blue uppercase tracking-widest bg-brand-lightBlue px-2.5 py-0.5 rounded-full border border-brand-blue/10">{activeQuiz.event_name}</span>
              <h1 className="text-lg sm:text-xl font-black text-brand-textMain tracking-tight mt-1">{activeQuiz.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {activeQuiz.status !== 'draft' && (
              <div className="flex items-center gap-1.5 bg-brand-lightBlue px-3 py-1.5 rounded-xl border border-brand-blue/10 shadow-inner">
                <span className="text-[10px] text-brand-textMuted font-bold uppercase tracking-wider">Lobby Code:</span>
                <span className="text-sm font-black text-brand-blue select-all tracking-wider">{activeQuiz.join_code}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-brand-blue/10 text-brand-blue rounded transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title="Copy Join Code Only"
                >
                  {copyCodeFeedback ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            )}
            <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              activeQuiz.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' :
              activeQuiz.status === 'waiting_lobby' ? 'bg-amber-50 text-amber-700 border-amber-100' :
              activeQuiz.status === 'completed' ? 'bg-zinc-100 text-brand-textMuted border-brand-border' :
              'bg-blue-50 text-brand-blue border-blue-100'
            }`}>
              {activeQuiz.status === 'in_progress' ? 'Live Session' : activeQuiz.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* --- STATE 1: DRAFT --- */}
        {activeQuiz.status === 'draft' && (
          <div className="bg-white border border-brand-border/80 rounded-3xl p-8 shadow-soft max-w-lg mx-auto text-center space-y-6 animate-scale-in">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-100">
              <Globe size={26} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-brand-textMain tracking-tight">Quiz in Draft Mode</h2>
              <p className="text-xs text-brand-textMuted mt-2 leading-relaxed max-w-sm mx-auto">
                Publishing this quiz generates the official Join Code, broadcasts the sharable QR Code card, and lists the event publicly across the website!
              </p>
            </div>
            
            <div className="border border-brand-border/60 bg-brand-bgLight/40 rounded-xl p-4 text-[11px] text-brand-textMuted text-left space-y-2.5">
              <div className="flex justify-between items-center">
                <span>Questions Count</span>
                <span className="font-bold text-brand-textMain">{activeQuiz.questions.length} Loaded</span>
              </div>
              <div className="h-px bg-zinc-100" />
              <div className="flex justify-between items-center">
                <span>Public Status</span>
                <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider text-[9px]">Hidden (Draft)</span>
              </div>
            </div>

            <button
              onClick={publishQuiz}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Globe size={16} />
              <span>Publish Quiz & Generate QR Code</span>
            </button>
          </div>
        )}

        {/* --- STATE 2: LOBBY --- */}
        {activeQuiz.status === 'waiting_lobby' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lobby Projection Box */}
            <div className="lg:col-span-2 bg-white border border-brand-border rounded-3xl p-6 text-zinc-800 flex flex-col justify-between shadow-sm min-h-[420px] relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Presentation View</span>
                  <h3 className="text-sm font-bold text-brand-textMuted mt-0.5">Project this screen to participants</h3>
                </div>
                <button
                  onClick={endQuiz}
                  className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                >
                  End Session
                </button>
              </div>

              {/* Large Projection Guide */}
              <div className="text-center my-6 space-y-4 z-10 flex flex-col items-center">
                <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">Join instructions</span>
                <h2 className="text-2xl font-black tracking-wide leading-tight">
                  Go to <span className="text-brand-blue select-all">{window.location.origin}/join</span>
                </h2>
                <div className="py-2.5 px-6 bg-brand-bgLight/60 border border-brand-border rounded-2xl inline-block relative group">
                  <span className="block text-[8px] font-bold text-brand-textMuted uppercase tracking-wider">Lobby Join Code</span>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <span className="text-2xl xs:text-3xl sm:text-4xl font-black text-brand-blue tracking-wider select-all">{activeQuiz.join_code}</span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 hover:bg-zinc-150 text-zinc-500 hover:text-brand-blue rounded-lg border border-zinc-200 cursor-pointer transition-all active:scale-95 flex items-center justify-center bg-white"
                      title="Copy Join Code Only"
                    >
                      {copyCodeFeedback ? <Check size={14} className="text-emerald-500 animate-fade-in" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* QR and sharing options */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-brand-border z-10">
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-brand-border text-zinc-650 hover:text-brand-textMain rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {copyFeedback ? <Check size={12} className="text-emerald-500 animate-fade-in" /> : <Copy size={12} />}
                    <span>{copyFeedback ? 'Copied URL' : 'Copy Invite Link'}</span>
                  </button>
                  <button
                    onClick={handleShareSession}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-brand-border text-zinc-650 hover:text-brand-textMain rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Share2 size={12} />
                    <span>Share</span>
                  </button>
                </div>
                <div className="text-xs text-brand-textMuted">
                  Waiting for players to connect...
                </div>
              </div>
            </div>

            {/* QR Card & Stats */}
            <div className="lg:col-span-1 flex flex-col justify-between gap-6">
              {/* Scan Card */}
              <div className="bg-white border border-brand-border/80 rounded-3xl p-6 shadow-soft flex flex-col items-center justify-center text-center gap-4 flex-grow">
                <div className="bg-brand-lightBlue p-3 rounded-2xl border border-brand-border/60">
                  <QRCodeSVG
                    id="lobby-control-qr"
                    value={`${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`}
                    size={140}
                    level="H"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-textMain">Quick Join QR Card</h4>
                  <p className="text-[11px] text-brand-textMuted mt-1">Download and display or share to join catalog directly.</p>
                </div>
                <button
                  onClick={() => handleDownloadQR('lobby-control-qr')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-brand-border hover:bg-brand-bgLight text-brand-textMuted hover:text-brand-textMain rounded-xl text-xs font-bold transition-all cursor-pointer shadow-inner bg-white active:scale-98"
                >
                  <Download size={13} />
                  <span>Download QR Card</span>
                </button>
              </div>

              {/* Joined Count Card */}
              <div className="bg-white border border-brand-border/80 rounded-3xl p-6 shadow-soft text-center space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-textMuted uppercase tracking-wider">Lobby Status</span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Lobby open</span>
                  </span>
                </div>
                
                <div className="py-2">
                  <p className="text-4xl font-black text-brand-textMain tracking-tight">{participants.length}</p>
                  <span className="text-[10px] font-extrabold text-brand-textMuted uppercase tracking-widest mt-1 block">Connected Players</span>
                </div>

                <button
                  onClick={startQuiz}
                  disabled={participants.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-dark disabled:from-zinc-200 disabled:to-zinc-200 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Start Gameplay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STATE 3: LIVE PLAY --- */}
        {activeQuiz.status === 'in_progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Controller Column */}
            <div className="lg:col-span-2 bg-white border border-brand-border/80 rounded-3xl p-6 shadow-soft space-y-6 flex flex-col justify-between">
              
              {/* Question Tracking details */}
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest block">Gameplay Console</span>
                    {activeQuiz && currentQuestionIndex >= 0 && currentQuestionIndex === activeQuiz.questions.length - 1 && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-500 text-white px-2.5 py-0.5 rounded-full animate-pulse">
                        🚨 Final Question ({currentQuestionIndex + 1}/{activeQuiz.questions.length})
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-brand-textMain tracking-tight mt-0.5">
                    {currentQuestionIndex >= 0 ? `Question ${currentQuestionIndex + 1} of ${activeQuiz.questions.length}` : 'Preparing first question...'}
                  </h2>
                </div>

                <button
                  onClick={endQuiz}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5 ${
                    activeQuiz && currentQuestionIndex >= 0 && currentQuestionIndex === activeQuiz.questions.length - 1 && currentQuestionStatus === 'timer_ended'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white ring-4 ring-red-200 animate-bounce'
                      : 'bg-red-50 hover:bg-red-100 border border-red-150 text-red-600 hover:text-red-700'
                  }`}
                >
                  <Trophy size={14} />
                  <span>
                    {activeQuiz && currentQuestionIndex >= 0 && currentQuestionIndex === activeQuiz.questions.length - 1 && currentQuestionStatus === 'timer_ended'
                      ? 'End Quiz & Finalize'
                      : 'End Quiz'}
                  </span>
                </button>
              </div>

              {/* Visual Stats Row */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 py-2">
                {/* Visual Timer */}
                <div className="border border-brand-border/80 bg-brand-bgLight/40 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-inner min-h-[140px]">
                  <Clock size={20} className="text-brand-blue opacity-85 mb-1" />
                  <span className="text-[9px] font-bold text-brand-textMuted uppercase tracking-widest">Visual Timer</span>
                  {currentQuestionStatus === 'released' ? (
                    <div className="mt-2 text-3xl font-black text-red-600 animate-pulse">
                      {timerCount}s
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-extrabold text-amber-800 uppercase tracking-wider bg-amber-100 px-3.5 py-1 rounded-full border border-amber-200">
                      ⌛ {currentQuestionStatus === 'timer_ended' ? 'Timer Finished' : currentQuestionStatus.replace('_', ' ')}
                    </div>
                  )}
                </div>

                {/* Submission progress */}
                <div className="border border-brand-border/80 bg-brand-bgLight/40 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-inner min-h-[140px]">
                  <Users size={20} className="text-brand-blue opacity-85 mb-1" />
                  <span className="text-[9px] font-bold text-brand-textMuted uppercase tracking-widest">Responses</span>
                  {currentQuestionStatus === 'released' ? (
                    <div className="mt-1 w-full flex flex-col items-center">
                      <div className="text-2xl font-black text-brand-textMain">
                        {submissionStats.submittedCount} <span className="text-xs text-brand-textMuted font-medium">/ {submissionStats.totalCount}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mt-2 max-w-[120px]">
                        <div
                          className="bg-brand-blue h-full transition-all duration-300"
                          style={{
                            width: `${submissionStats.totalCount > 0 ? (submissionStats.submittedCount / submissionStats.totalCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs font-bold text-brand-textMuted">
                      No active submissions
                    </div>
                  )}
                </div>
              </div>

              {/* Last Question Prompt Banner for Admin */}
              {activeQuiz && currentQuestionIndex >= 0 && currentQuestionIndex === activeQuiz.questions.length - 1 && currentQuestionStatus === 'timer_ended' && (
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-500/30 shadow-md text-center space-y-2 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 font-black text-sm text-amber-300">
                    <Sparkles size={18} className="animate-spin" />
                    <span>🎉 FINAL QUESTION COMPLETED!</span>
                  </div>
                  <p className="text-xs text-purple-200 font-medium max-w-md mx-auto">
                    This was the last question of the quiz! Please tell admin to click <strong>"End Quiz"</strong> to conclude the session and publish the final standings.
                  </p>
                  <button
                    onClick={endQuiz}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <Trophy size={16} />
                    <span>End Quiz & Show Final Standings</span>
                  </button>
                </div>
              )}

              {/* Main Controls Card */}
              <div className="border border-brand-border/80 bg-brand-bgLight/60 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-brand-textMuted uppercase tracking-wider">Lobby Director</span>
                  {isPaused && (
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-bold uppercase border border-red-100">
                      Timer Paused
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {/* Primary Release Action */}
                  <button
                    onClick={releaseQuestion}
                    disabled={currentQuestionStatus === 'released' || (activeQuiz && currentQuestionIndex === activeQuiz.questions.length - 1 && currentQuestionStatus === 'timer_ended')}
                    className="flex-grow sm:flex-grow-0 flex items-center justify-center space-x-2 bg-brand-blue hover:bg-brand-dark disabled:bg-zinc-200 text-white px-6 py-3 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <ArrowRight size={14} />
                    <span>
                      {activeQuiz && currentQuestionIndex === activeQuiz.questions.length - 1 && currentQuestionStatus === 'timer_ended' ? 'All Questions Finished' :
                       currentQuestionStatus === 'timer_ended' ? 'Release Next Question' :
                       currentQuestionIndex === -1 ? 'Release First Question' : 'Release Current'}
                    </span>
                  </button>

                  {/* Live Timer Extensions (+10s, +30s) */}
                  <button
                    onClick={() => {
                      if (socket && activeQuiz) {
                        socket.emit('extend_timer', { quizId: activeQuiz.id, additionalSeconds: 10 });
                        setTimerCount((prev) => prev + 10);
                      }
                    }}
                    disabled={currentQuestionStatus !== 'released'}
                    className="flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white px-3.5 py-3 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                    title="Add 10 extra seconds to active question timer"
                  >
                    <Clock size={13} />
                    <span>+10s</span>
                  </button>

                  <button
                    onClick={() => {
                      if (socket && activeQuiz) {
                        socket.emit('extend_timer', { quizId: activeQuiz.id, additionalSeconds: 30 });
                        setTimerCount((prev) => prev + 30);
                      }
                    }}
                    disabled={currentQuestionStatus !== 'released'}
                    className="flex items-center justify-center space-x-1 bg-teal-600 hover:bg-teal-700 disabled:bg-zinc-100 disabled:text-zinc-400 text-white px-3.5 py-3 rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                    title="Add 30 extra seconds to active question timer"
                  >
                    <Clock size={13} />
                    <span>+30s</span>
                  </button>

                  {/* Lock Answers */}
                  <button
                    onClick={lockSubmissions}
                    disabled={currentQuestionStatus !== 'released'}
                    className="flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-100 disabled:text-zinc-400 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <Lock size={13} />
                    <span>Lock Submissions</span>
                  </button>

                  {/* Pause / Resume */}
                  {isPaused ? (
                    <button
                      onClick={resumeQuiz}
                      disabled={currentQuestionStatus !== 'released'}
                      className="flex items-center justify-center space-x-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-100 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseQuiz}
                      disabled={currentQuestionStatus !== 'released'}
                      className="flex items-center justify-center space-x-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-100 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                    >
                      <Pause size={13} fill="currentColor" />
                      <span>Pause</span>
                    </button>
                  )}

                  {/* Skip */}
                  <button
                    onClick={skipQuestion}
                    className="flex items-center justify-center space-x-1 px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-700 border border-brand-border rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <SkipForward size={13} />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Presentation Box Preview (Right) */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl min-h-[350px] relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center z-10">
                <span className="text-[9px] font-black text-brand-cyan uppercase tracking-widest">Question Slide Screen</span>
                <HelpCircle size={15} className="text-slate-400" />
              </div>

              {currentQuestionIndex >= 0 && activeQuiz.questions[currentQuestionIndex] ? (
                <div className="py-4 space-y-4 flex-grow flex flex-col justify-between z-10">
                  <p className="font-extrabold text-sm text-slate-100 leading-snug">
                    {activeQuiz.questions[currentQuestionIndex].question}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    {['a', 'b', 'c', 'd'].map((opt) => {
                      const isCorrect = activeQuiz.questions[currentQuestionIndex].correct_answer === opt;
                      const labelText = activeQuiz.questions[currentQuestionIndex][`option_${opt}`];
                      return (
                        <div
                          key={opt}
                          className={`p-2.5 border rounded-xl flex items-center justify-between transition-all ${
                            isCorrect
                              ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-800 bg-slate-850 text-slate-400'
                          }`}
                        >
                          <span className="font-semibold">{opt.toUpperCase()}: {labelText}</span>
                          {isCorrect && <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2.5 rounded-xl text-[10px] font-extrabold flex justify-between items-center">
                    <span>Correct Answer:</span>
                    <span className="bg-emerald-500/25 px-2 py-0.5 rounded text-white font-black uppercase">Option {activeQuiz.questions[currentQuestionIndex].correct_answer}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs flex-grow flex items-center justify-center z-10">
                  Release the question to display slide details here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- STATE 4: COMPLETED --- */}
        {activeQuiz.status === 'completed' && (
          <div className="space-y-6 animate-scale-in">
            <div className="bg-white border border-brand-border/80 rounded-3xl p-8 shadow-soft text-center max-w-lg mx-auto space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan"></div>
              
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Trophy size={26} />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-brand-textMain tracking-tight">Quiz Session Concluded</h2>
                <p className="text-xs text-brand-textMuted max-w-xs mx-auto">
                  Leaderboard final standings compiled. Telemetry logs saved.
                </p>
              </div>

              {/* Release Leaderboard Action Container */}
              <div className="border border-brand-border bg-brand-bgLight/40 rounded-2xl p-4 space-y-3">
                {!leaderboardReleased ? (
                  <>
                    <div className="text-xs text-amber-700 font-bold flex items-center justify-center gap-1.5 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-100 animate-pulse">
                      <AlertTriangle size={13} />
                      <span>Leaderboard is currently hidden from student devices</span>
                    </div>
                    <button
                      onClick={releaseLeaderboard}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={14} fill="currentColor" />
                      <span>Release Leaderboard to Students</span>
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-emerald-700 font-extrabold flex items-center justify-center gap-1.5 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-150">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Leaderboard released successfully to all student devices!</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-zinc-100 py-3 text-center text-xs">
                <div>
                  <span className="block text-lg font-black text-brand-blue">{participants.length}</span>
                  <span className="text-[9px] text-brand-textMuted font-bold uppercase tracking-wider">Players</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-brand-blue">{activeQuiz.questions.length}</span>
                  <span className="text-[9px] text-brand-textMuted font-bold uppercase tracking-wider">Questions</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-brand-blue">
                    {participants.length > 0
                      ? Math.round(participants.reduce((sum, p) => sum + (p.score || 0), 0) / participants.length)
                      : 0}
                  </span>
                  <span className="text-[9px] text-brand-textMuted font-bold uppercase tracking-wider">Avg Score</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => navigate(`/admin/analytics/${activeQuiz.id}`)}
                  className="flex-grow py-3 bg-brand-blue hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  View Performance Analytics
                </button>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="py-3 px-5 border border-brand-border hover:bg-brand-bgLight text-brand-textMuted rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Exit Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- ANIMATED TOP 10 LIVE LEADERBOARD --- */}
        {activeQuiz.status !== 'draft' && (
          <Top10Leaderboard leaderboard={sortedParticipants} title="Top 10 Live Standings" />
        )}

        {/* --- PARTICIPANTS TELEMETRY TABLE --- */}
        {activeQuiz.status !== 'draft' && (
          <div className="bg-white border border-brand-border/60 rounded-2xl p-6 shadow-soft">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-brand-textMain tracking-tight">Connected Participants</h3>
                <p className="text-[11px] text-brand-textMuted mt-0.5">Real-time connection, ranking, score telemetry monitor</p>
              </div>
              <span className="bg-brand-blue/5 border border-brand-blue/10 text-brand-blue text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {participants.length} Active
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-150">
              <table className="min-w-full divide-y divide-zinc-250 text-xs text-left">
                <thead className="bg-brand-bgLight text-brand-textMuted uppercase text-[9px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Rank</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">College</th>
                    <th className="px-6 py-3.5">Score</th>
                    <th className="px-6 py-3.5">Tab Violations</th>
                    <th className="px-6 py-3.5">Telemetry</th>
                    {activeQuiz.status !== 'completed' && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-zinc-700 bg-white">
                  {sortedParticipants.map((p, idx) => {
                    const isConnected = p.connection_status === 'connected' || p.connectionStatus === 'connected';
                    return (
                      <tr key={p.id} className="hover:bg-brand-bgLight/30 transition-colors duration-150">
                        <td className="px-6 py-4 font-bold text-brand-textMuted">#{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-brand-textMain">{p.name}</span>
                        </td>
                        <td className="px-6 py-4 text-brand-textMuted truncate max-w-[150px]">{p.college}</td>
                        <td className="px-6 py-4 font-extrabold text-brand-blue">{p.score || 0} pts</td>
                        <td className="px-6 py-4">
                          {(() => {
                            const vCount = p.tab_switch_count !== undefined
                              ? Number(p.tab_switch_count)
                              : (p.violation_count !== undefined ? Number(p.violation_count) : (Array.isArray(p.violations) ? p.violations.length : (Number(p.violations) || 0)));
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                vCount >= 3
                                  ? 'bg-red-50 text-red-655 border border-red-100'
                                  : vCount >= 1
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                  : 'bg-brand-bgLight text-brand-textMuted border border-zinc-100'
                              }`}>
                                {vCount} {vCount === 1 ? 'violation' : 'violations'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-350'}`} />
                            <span>{isConnected ? 'Active' : 'Offline'}</span>
                          </span>
                        </td>
                        {activeQuiz.status !== 'completed' && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => kickParticipant(p.id)}
                              className="text-red-600 hover:text-white border border-red-200 hover:bg-red-600 hover:border-red-600 px-3 py-1 rounded-lg font-bold text-[10px] transition-all active:scale-95 cursor-pointer shadow-sm bg-white"
                            >
                              Kick
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={activeQuiz.status !== 'completed' ? 7 : 6} className="px-6 py-12 text-center text-brand-textMuted text-xs">
                        No participants joined yet. Share the invitation URL to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
