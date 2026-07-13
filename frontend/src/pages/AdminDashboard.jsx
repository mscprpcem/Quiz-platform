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
  Check
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

  useEffect(() => {
    loadQuizzes();
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

  // Download QR Code Helper
  const handleDownloadQR = (elementId) => {
    if (!activeQuiz) return;
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
      ctx.fillText(activeQuiz.title.toUpperCase(), 200, 140);
      
      // Event name
      ctx.fillStyle = '#605e5c';
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillText(activeQuiz.event_name.toUpperCase(), 200, 158);
      
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
      ctx.fillText(`${window.location.origin}/join/${activeQuiz.join_code}`, 200, 475);
      
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
      ctx.fillText(activeQuiz.join_code, 200, 555);
      
      // Footnote
      ctx.fillStyle = '#a19f9d';
      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.fillText('Powered by Microsoft Student Club Quiz Platform', 200, 600);
      
      // Export as PNG
      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `msc-prpcem-quiz-${activeQuiz.join_code}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white border border-microsoft-border p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Quiz Control Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage live quiz sessions, monitor participants, and release questions.</p>
        </div>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="flex items-center space-x-1.5 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Manage Quizzes</span>
        </button>
      </div>

      {/* Live Active Session Panel */}
      {activeQuiz ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls Section */}
          <div className="lg:col-span-2 bg-white border border-microsoft-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
              <div>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-microsoft-lightBlue text-microsoft-darkBlue">
                  <span className="w-1.5 h-1.5 rounded-full bg-microsoft-blue animate-ping"></span>
                  <span>Live: {activeQuiz.status.replace('_', ' ')}</span>
                </span>
                <h2 className="text-xl font-bold text-zinc-800 mt-2">{activeQuiz.title}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Join Code: <span className="font-bold text-zinc-700 select-all">{activeQuiz.join_code}</span></p>
              </div>

              {/* Top Control Action */}
              <button
                onClick={endQuiz}
                className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all"
              >
                Abort Quiz Session
              </button>
            </div>

            {/* Dashboard status indicators */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border text-center">
                <Users className="text-microsoft-blue mx-auto mb-1" size={18} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Joined</span>
                <p className="text-lg font-bold text-zinc-800 mt-0.5">{participants.length}</p>
              </div>

              <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border text-center">
                <BookOpen className="text-zinc-500 mx-auto mb-1" size={18} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Question Progress</span>
                <p className="text-lg font-bold text-zinc-800 mt-0.5">
                  {currentQuestionIndex >= 0 ? `${currentQuestionIndex + 1}/${activeQuiz.questions.length}` : `0/${activeQuiz.questions.length}`}
                </p>
              </div>

              <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border text-center">
                <Award className="text-microsoft-success mx-auto mb-1" size={18} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Status</span>
                <p className="text-xs font-bold text-microsoft-success mt-1.5 capitalize">
                  {currentQuestionStatus.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Session Actions Panel */}
            <div className="bg-zinc-50 border border-microsoft-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-zinc-700">Quiz Control Actions</h3>
              
              <div className="flex flex-wrap gap-3">
                {activeQuiz.status === 'draft' && (
                  <button
                    onClick={startLobby}
                    className="flex items-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Start Session Lobby</span>
                  </button>
                )}

                {activeQuiz.status === 'waiting_lobby' && (
                  <button
                    onClick={startQuiz}
                    className="flex items-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
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
                      className="flex items-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue disabled:bg-zinc-300 text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
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
                      className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
                    >
                      <Lock size={16} />
                      <span>Lock Answers</span>
                    </button>

                    {/* Pause / Resume */}
                    {isPaused ? (
                      <button
                        onClick={resumeQuiz}
                        disabled={currentQuestionStatus !== 'released'}
                        className="flex items-center space-x-2 bg-zinc-700 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
                      >
                        <Play size={16} fill="currentColor" />
                        <span>Resume Question</span>
                      </button>
                    ) : (
                      <button
                        onClick={pauseQuiz}
                        disabled={currentQuestionStatus !== 'released'}
                        className="flex items-center space-x-2 bg-zinc-700 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-sm transition-all"
                      >
                        <Pause size={16} fill="currentColor" />
                        <span>Pause Question</span>
                      </button>
                    )}

                    {/* Skip question */}
                    <button
                      onClick={skipQuestion}
                      className="flex items-center space-x-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-5 py-3 rounded-lg text-sm font-semibold border border-zinc-300 transition-all"
                    >
                      <SkipForward size={16} />
                      <span>Skip Question</span>
                    </button>
                  </>
                )}
              </div>

              {/* Submissions feedback progress */}
              {currentQuestionStatus === 'released' && (
                <div className="border-t border-zinc-200 pt-4 space-y-2 animate-fade-in">
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>Active Timer: <span className="font-bold text-red-600">{timerCount}s</span></span>
                    <span>Submissions: <span className="font-bold text-zinc-700">{submissionStats.submittedCount} / {submissionStats.totalCount}</span></span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-microsoft-blue h-full transition-all duration-300"
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
            <div className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-md font-bold text-zinc-800 border-b border-zinc-100 pb-3">Active Question Details</h3>
              
              {currentQuestionIndex >= 0 && activeQuiz.questions[currentQuestionIndex] ? (
                <div className="space-y-4 py-4 flex-grow animate-fade-in text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question Text</span>
                    <p className="font-bold text-zinc-800 leading-snug mt-1">
                      {activeQuiz.questions[currentQuestionIndex].question}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-zinc-50 p-2 border border-zinc-100 rounded">
                      <span className="font-semibold text-zinc-400 uppercase">Option A</span>
                      <p className="font-bold text-zinc-700 mt-0.5 truncate">{activeQuiz.questions[currentQuestionIndex].option_a}</p>
                    </div>
                    <div className="bg-zinc-50 p-2 border border-zinc-100 rounded">
                      <span className="font-semibold text-zinc-400 uppercase">Option B</span>
                      <p className="font-bold text-zinc-700 mt-0.5 truncate">{activeQuiz.questions[currentQuestionIndex].option_b}</p>
                    </div>
                    <div className="bg-zinc-50 p-2 border border-zinc-100 rounded">
                      <span className="font-semibold text-zinc-400 uppercase">Option C</span>
                      <p className="font-bold text-zinc-700 mt-0.5 truncate">{activeQuiz.questions[currentQuestionIndex].option_c}</p>
                    </div>
                    <div className="bg-zinc-50 p-2 border border-zinc-100 rounded">
                      <span className="font-semibold text-zinc-400 uppercase">Option D</span>
                      <p className="font-bold text-zinc-700 mt-0.5 truncate">{activeQuiz.questions[currentQuestionIndex].option_d}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 font-bold text-xs flex justify-between">
                    <span>Correct Answer:</span>
                    <span className="text-sm font-extrabold uppercase">Option {activeQuiz.questions[currentQuestionIndex].correct_answer}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-400 text-sm flex-grow flex items-center justify-center">
                  Release first question to show details.
                </div>
              )}

              <button
                onClick={() => navigate(`/admin/quizzes/${activeQuiz.id}`)}
                className="w-full text-center border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-semibold py-2 rounded-md text-xs transition-all mt-4"
              >
                Configure Question Sheet
              </button>
            </div>

            {/* Session QR Code Card */}
            <div className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm space-y-4 text-center">
              <h3 className="text-md font-bold text-zinc-800 border-b border-zinc-100 pb-3">Session Share Link</h3>
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 shadow-inner">
                  <QRCodeSVG
                    id="sidebar-qr-svg"
                    value={`${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="w-full">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Join URL</p>
                  <p className="text-xs text-zinc-500 font-medium select-all truncate max-w-[200px] mx-auto bg-zinc-50 border border-zinc-100 rounded px-2 py-1 mt-1">
                    {window.location.origin}/join/{activeQuiz.join_code}
                  </p>
                </div>
                <div className="w-full grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCopyLink}
                    title="Copy Link"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/50 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2 rounded-lg text-[10px] font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    {copyFeedback ? <Check size={14} className="text-microsoft-success" /> : <Copy size={14} />}
                    <span className="mt-1">{copyFeedback ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadQR('sidebar-qr-svg')}
                    title="Download PNG"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/50 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2 rounded-lg text-[10px] font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="mt-1">Download</span>
                  </button>
                  <button
                    onClick={handleShareSession}
                    title="Share Link"
                    className="flex flex-col items-center justify-center border border-zinc-200 hover:border-microsoft-blue/50 hover:bg-zinc-50 text-zinc-600 hover:text-microsoft-blue p-2 rounded-lg text-[10px] font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span className="mt-1">Share</span>
                  </button>
                </div>
                <div className="w-full h-px bg-zinc-100"></div>
                <div className="w-full">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Join Code</p>
                  <h2 className="text-2xl font-extrabold text-microsoft-blue tracking-wider select-all mt-0.5">{activeQuiz.join_code}</h2>
                </div>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="w-full text-center border border-microsoft-blue bg-microsoft-blue/5 hover:bg-microsoft-blue hover:text-white text-microsoft-blue font-bold py-2.5 rounded-md text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Eye size={12} />
                  <span>Project Fullscreen QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Participant Monitoring Table */}
          <div className="lg:col-span-3 bg-white border border-microsoft-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-zinc-800">Connected Participants Telemetry</h3>
              <span className="bg-zinc-100 text-zinc-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                {participants.length} Active Users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">College</th>
                    <th className="px-6 py-3">Current Score</th>
                    <th className="px-6 py-3">Tab Switches</th>
                    <th className="px-6 py-3">Telemetry Connection</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {participants.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-500">#{p.score ? idx + 1 : 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-800">{p.name}</td>
                      <td className="px-6 py-4">{p.college}</td>
                      <td className="px-6 py-4 font-bold text-microsoft-blue">{p.score || 0} pts</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          p.tab_switch_count >= 3
                            ? 'bg-red-50 text-red-600'
                            : p.tab_switch_count >= 1
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-zinc-50 text-zinc-400'
                        }`}>
                          {p.tab_switch_count || 0} switches
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.connection_status === 'connected'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.connection_status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <span>{p.connection_status === 'connected' ? 'Active' : 'Offline'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => kickParticipant(p.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-xs border border-transparent hover:border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-md transition-all"
                        >
                          Kick Out
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
        <div className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-zinc-800">Launch Quiz Session</h2>
          <p className="text-sm text-zinc-500">Select an existing quiz below to open the session waiting lobby for participants.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {quizzes.map((quiz) => {
              const isDraft = quiz.status === 'draft';
              return (
                <div
                  key={quiz.id}
                  className="bg-zinc-50 border border-microsoft-border rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{quiz.event_name}</span>
                    <h3 className="text-lg font-bold text-zinc-800 leading-tight truncate">{quiz.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2">{quiz.description || 'No description provided.'}</p>
                  </div>

                  <div className="border-t border-zinc-200 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-500">
                      {quiz.questionCount || 0} Questions
                    </span>
                    
                    <button
                      onClick={() => handleLoadActiveQuiz(quiz.id)}
                      className="flex items-center space-x-1 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white text-xs font-bold px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Launch Lobby</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {quizzes.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-zinc-400 text-sm bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
                No quizzes created yet. Navigate to "Manage Quizzes" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN QR CODE MODAL FOR PROJECTORS */}
      {activeQuiz && showQRModal && (
        <div className="fixed inset-0 bg-zinc-955 bg-opacity-95 bg-zinc-950/98 z-50 flex flex-col items-center justify-center text-white p-8 overflow-y-auto">
          <button
            onClick={() => setShowQRModal(false)}
            className="absolute top-6 right-6 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white p-3 rounded-full transition-all cursor-pointer shadow-lg"
          >
            <X size={24} />
          </button>

          <div className="max-w-md w-full text-center space-y-6 animate-fade-in text-sm">
            
            {/* Branded Card Container */}
            <div className="bg-white text-zinc-800 p-8 rounded-2xl shadow-2xl border-4 border-microsoft-blue/20 max-w-sm mx-auto space-y-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue"></div>
              
              {/* Microsoft Logo Icon */}
              <div className="flex flex-col items-center space-y-1.5 pt-2">
                <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                  <div className="bg-[#f25022]"></div>
                  <div className="bg-[#7fba00]"></div>
                  <div className="bg-[#00a4ef]"></div>
                  <div className="bg-[#ffb900]"></div>
                </div>
                <h2 className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-650">Microsoft Student Club</h2>
                <span className="text-[10px] font-bold text-microsoft-blue bg-microsoft-lightBlue px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  MSC-PRPCEM CHAPTER
                </span>
              </div>

              <div className="border-t border-b border-zinc-100 py-3 my-2">
                <h1 className="text-lg font-black text-zinc-850 leading-tight uppercase">{activeQuiz.title}</h1>
                <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-widest mt-1">{activeQuiz.event_name}</p>
              </div>

              {/* QR Code Container */}
              <div className="inline-block bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-inner">
                <QRCodeSVG
                  id="modal-qr-svg"
                  value={`${window.location.protocol}//${window.location.host}/join/${activeQuiz.join_code}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-3.5">
                <div className="text-xs font-semibold text-zinc-500">
                  <p>Scan with camera or visit:</p>
                  <p className="text-microsoft-darkBlue font-bold underline select-all mt-0.5">
                    {window.location.origin}/join/{activeQuiz.join_code}
                  </p>
                </div>
                
                <div className="bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Unique Join Code</span>
                  <span className="block text-2xl font-black text-microsoft-blue tracking-widest select-all mt-0.5">{activeQuiz.join_code}</span>
                </div>
              </div>
            </div>

            {/* Projector-level Actions */}
            <div className="flex justify-center space-x-4 max-w-sm mx-auto pt-2">
              <button
                onClick={handleCopyLink}
                className="flex-grow flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                {copyFeedback ? <Check size={14} className="text-microsoft-success" /> : <Copy size={14} />}
                <span>{copyFeedback ? 'Copied Link' : 'Copy Join Link'}</span>
              </button>
              <button
                onClick={() => handleDownloadQR('modal-qr-svg')}
                className="flex-grow flex items-center justify-center space-x-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>Download Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
