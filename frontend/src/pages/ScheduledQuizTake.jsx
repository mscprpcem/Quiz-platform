import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Clock, CheckSquare, AlertTriangle, Trophy, CheckCircle, 
  Square, ShieldCheck, ArrowRight, RefreshCw, User, Lock, Award, LogIn, ExternalLink, Sparkles, Maximize
} from 'lucide-react';
import DigitalBadgeCard from '../components/DigitalBadgeCard';

export default function ScheduledQuizTake() {
  const { occurrenceId } = useParams();
  const navigate = useNavigate();
  const { studentAccount, user, studentLogin, studentLogout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [occData, setOccData] = useState(null);
  const [loadError, setLoadError] = useState('');
  
  // Student input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [startError, setStartError] = useState('');

  // Active Attempt State
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  const timerRef = useRef(null);

  // Sync user credentials from auth context or local storage
  useEffect(() => {
    if (studentAccount?.email) {
      setEmail(studentAccount.email);
      setName(studentAccount.name || studentAccount.email.split('@')[0]);
    } else if (user?.email) {
      setEmail(user.email);
      setName(user.name || user.email.split('@')[0]);
    } else {
      const storedName = localStorage.getItem('msc_student_name') || localStorage.getItem('msc_participant_name') || '';
      const storedEmail = localStorage.getItem('msc_student_email') || localStorage.getItem('msc_participant_email') || '';
      if (storedName) setName(storedName);
      if (storedEmail) setEmail(storedEmail);
    }
  }, [studentAccount, user]);

  useEffect(() => {
    if (occurrenceId) {
      fetchOccurrence();
    }
  }, [occurrenceId]);

  const fetchOccurrence = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.get(`/api/scheduled-quizzes/occurrences/${occurrenceId}`);
      setOccData(res.data);
    } catch (err) {
      console.error('Fetch occurrence error:', err);
      setLoadError(err.response?.data?.error || 'Scheduled quiz session could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = Boolean(studentAccount || (user && user.email));

  const handleStudentAuth = async (e) => {
    e.preventDefault();
    if (!email || !name) {
      setStartError('Please enter both your name and email.');
      return;
    }

    try {
      setLoggingIn(true);
      setStartError('');
      const res = await studentLogin(email, name, password || 'student123');
      if (res.success) {
        localStorage.setItem('msc_student_name', name);
        localStorage.setItem('msc_student_email', email);
      }
    } catch (err) {
      setStartError(err.message || 'Failed to authenticate student account.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Timer Tick Handler
  useEffect(() => {
    if (!attempt || quizSubmitted) return;

    const calculateRemaining = () => {
      const expiresAt = new Date(attempt.expires_at).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeftSeconds(remaining);

      if (remaining <= 0) {
        handleFinalSubmit(true);
      }
    };

    calculateRemaining();
    timerRef.current = setInterval(calculateRemaining, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, quizSubmitted]);

  // Anti-Cheat Violations Event Listeners
  useEffect(() => {
    if (!attempt || quizSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH');
      }
    };

    const handleBlur = () => {
      recordViolation('WINDOW_BLUR');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      recordViolation('COPY');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      recordViolation('PASTE');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [attempt, quizSubmitted]);

  const requireFullscreen = Boolean(occData?.quiz?.require_fullscreen);

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn('Fullscreen request rejected or not supported:', err);
    }
  };

  // Fullscreen Change & Violation Detection
  useEffect(() => {
    if (!attempt || quizSubmitted) return;

    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);

      if (requireFullscreen && !isFull) {
        recordViolation('FULLSCREEN_EXIT');
        setShowFullscreenModal(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [attempt, quizSubmitted, requireFullscreen]);

  const recordViolation = async (type) => {
    if (!attempt || quizSubmitted) return;
    try {
      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/violation`, {
        violationType: type
      });
      setViolationsCount(res.data.violationCount);
      if (res.data.autoSubmit) {
        alert('Anti-cheat limit exceeded. Your quiz is being automatically submitted.');
        handleFinalSubmit(true);
      }
    } catch (err) {
      console.error('Record violation error:', err);
    }
  };

  const handleStartAttempt = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const targetName = name || studentAccount?.name || user?.name;
    const targetEmail = email || studentAccount?.email || user?.email;

    if (!targetName) {
      setStartError('Please enter your full name or sign in to begin.');
      return;
    }

    try {
      setStartError('');
      setLoading(true);
      const targetOccId = occData?.occurrence?.id || occurrenceId;
      const res = await api.post(`/api/scheduled-quizzes/occurrences/${targetOccId}/start`, {
        name: targetName,
        email: targetEmail
      });

      setAttempt(res.data.attempt);
      if (res.data.questions) {
        setQuestions(res.data.questions);
      }

      // If quiz requires fullscreen, enter fullscreen mode
      if (requireFullscreen) {
        enterFullscreen();
      }

      // Restore previously saved answers if resuming
      if (res.data.restoredAnswers) {
        const restoredMap = {};
        res.data.restoredAnswers.forEach(a => {
          restoredMap[a.question_id] = a.selected_option;
        });
        setSelectedAnswers(restoredMap);
      }
    } catch (err) {
      setStartError(err.response?.data?.error || 'Failed to start quiz attempt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (questionId, optionKey) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionKey }));

    // Continuous Answer Saving to Backend
    try {
      await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/answer`, {
        questionId,
        selectedOption: optionKey
      });
    } catch (err) {
      console.error('Answer saving error:', err);
    }
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!attempt || quizSubmitted) return;
    if (!isAuto && !window.confirm('Are you sure you want to submit your quiz?')) return;

    try {
      setLoading(true);
      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/submit`);
      setResultData(res.data);
      setQuizSubmitted(true);

      // Cleanly exit fullscreen on finish
      if (document.fullscreenElement) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
        } catch (e) {}
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit quiz attempt.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading && !attempt && !occData) {
    return (
      <div className="py-24 text-center space-y-3 font-segoe">
        <RefreshCw size={36} className="text-blue-600 animate-spin mx-auto" />
        <div className="text-sm text-slate-600 font-extrabold">Checking quiz availability...</div>
      </div>
    );
  }

  if (loadError && !occData) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 font-segoe text-center space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md space-y-5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900">Quiz Link Not Found</h2>
            <p className="text-xs text-slate-500 font-semibold">{loadError}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs cursor-pointer"
            >
              Return Home
            </button>
            <button
              onClick={() => navigate('/join')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md"
            >
              Join Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════ RENDER RESULT SCREEN ════════
  if (quizSubmitted && resultData) {
    const att = resultData.attempt;
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 font-segoe">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto font-black shadow-xs">
            <Award size={36} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Quiz Completed!</h2>
            <p className="text-xs text-slate-500 font-semibold">Your responses have been recorded successfully.</p>
          </div>

          {/* Score Box */}
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase">Final Score</span>
            <div className="text-4xl font-black text-emerald-600">{att?.score} pts</div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs font-bold">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[9px] uppercase">Correct</span>
              <span className="text-emerald-600 text-lg font-black">{att?.correct_count}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[9px] uppercase">Incorrect</span>
              <span className="text-red-500 text-lg font-black">{att?.incorrect_count}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[9px] uppercase">Current Rank</span>
              <span className="text-blue-600 text-lg font-black">#{resultData?.rank || 1}</span>
            </div>
          </div>

          {/* Automatically Issued Official Digital Badge */}
          <div className="pt-2">
            <DigitalBadgeCard
              quizTitle={occData?.occurrence?.title || occData?.quiz?.title || 'Scheduled Challenge'}
              eventName={occData?.quiz?.event_name || 'MSC Scheduled Challenge'}
              badgeTitle={occData?.quiz?.badge_title || `${occData?.occurrence?.title || occData?.quiz?.title || 'Scheduled Challenge'} Certified Master`}
              score={att?.score || 100}
              studentName={name || studentAccount?.name || 'Student'}
              studentEmail={email || studentAccount?.email || ''}
            />
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ════════ RENDER PRE-QUIZ AVAILABILITY & LOGIN CARD ════════
  if (!attempt) {
    const status = occData?.status;
    const message = occData?.message;
    const displayName = studentAccount?.name || user?.name || name;
    const displayEmail = studentAccount?.email || user?.email || email;

    return (
      <div className="max-w-md mx-auto py-10 px-4 font-segoe text-left">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full inline-block">
                Scheduled Assessment
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {occData?.quiz?.time_limit || 30} mins limit
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{occData?.quiz?.title || 'Scheduled Quiz'}</h2>
            <p className="text-xs text-slate-500 font-medium">{occData?.quiz?.description || 'Complete the assessment questions within the active time window.'}</p>
          </div>

          {status === 'NOT_STARTED' ? (
            <div className="p-5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-blue-700">
                <Clock size={18} className="animate-spin text-blue-600" />
                <span>Scheduled Start Time:</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {occData?.occurrence?.start_time ? new Date(occData.occurrence.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Upcoming Session'}
              </div>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                This scheduled session will automatically open for attempts at the start time above. Please stay on this page!
              </p>
            </div>
          ) : status === 'CLOSED' ? (
            <div className="p-5 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-800">
                <AlertTriangle size={18} className="text-amber-500" />
                <span>Session Closed</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">This scheduled quiz session has closed. Check back for the next upcoming slot!</p>
            </div>
          ) : status !== 'AVAILABLE' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center space-x-3">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{message}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] font-semibold text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock size={15} className="text-blue-600 flex-shrink-0" />
                  <span>Session Window:</span>
                </div>
                <span className="font-extrabold text-blue-700">
                  {occData?.occurrence?.end_time ? new Date(occData.occurrence.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open Now'}
                </span>
              </div>

              {startError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold">
                  {startError}
                </div>
              )}

              {/* ════════ AUTHENTICATION GATE ════════ */}
              {isLoggedIn ? (
                /* Authenticated State: Show verified student badge and 1-click start */
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {(displayName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                            <span>{displayName}</span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase flex items-center space-x-0.5">
                              <ShieldCheck size={11} />
                              <span>Verified</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold">{displayEmail}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (studentLogout) studentLogout();
                        }}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-extrabold hover:underline cursor-pointer"
                      >
                        Switch
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-1.5">
                    <ShieldCheck size={13} className="text-emerald-600 flex-shrink-0" />
                    <span>Your attempt and official certificate will be linked to your student account.</span>
                  </div>

                  <button
                    onClick={handleStartAttempt}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
                  >
                    <span>Start Quiz Attempt</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                /* Unauthenticated State: Prompt for Student Login / Sign In */
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-xs font-black text-purple-900 bg-purple-50 border border-purple-200 px-3.5 py-2.5 rounded-xl">
                    <LogIn size={16} className="text-purple-600 flex-shrink-0" />
                    <span>Student Login Required to Attempt Quiz</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Please sign in with your student credentials to verify your identity and start your scheduled quiz attempt.
                  </p>

                  <form onSubmit={handleStudentAuth} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amit Sharma"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white focus:border-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="student@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white focus:border-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600">Password</label>
                      <input
                        type="password"
                        placeholder="•••••••• (Optional for guest)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white focus:border-purple-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loggingIn}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      <User size={15} />
                      <span>{loggingIn ? 'Signing In...' : 'Sign In & Unlock Quiz'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════ RENDER ACTIVE ATTEMPT INTERFACE ════════
  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-segoe text-left space-y-6">
      
      {/* Fullscreen Required Modal Overlay */}
      {showFullscreenModal && requireFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Fullscreen Mode Required</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                This quiz has anti-cheat full-screen proctoring enabled. Please re-enter full-screen mode to continue your assessment.
              </p>
            </div>
            <button
              onClick={enterFullscreen}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Maximize size={16} />
              <span>Re-enter Fullscreen Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with Server Timer & Fullscreen Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">{occData?.quiz?.title}</h3>
          <span className="text-[10px] font-bold text-slate-400">Question {currentQIndex + 1} of {questions.length}</span>
        </div>

        <div className="flex items-center space-x-2">
          {requireFullscreen && (
            <button
              onClick={enterFullscreen}
              className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer transition-all ${
                isFullscreen 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              }`}
              title={isFullscreen ? 'Fullscreen active' : 'Click to re-enter fullscreen'}
            >
              <Maximize size={13} />
              <span>{isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}</span>
            </button>
          )}

          {/* Server Authoritative Timer Display */}
          <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2 text-xs font-black ${
            timeLeftSeconds < 180 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <Clock size={16} />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Violation Banner if triggered */}
      {violationsCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <AlertTriangle size={16} />
          <span>Anti-Cheat Notice: {violationsCount} violation(s) recorded (Tab Switch / Window Blur).</span>
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-blue-600 uppercase">Q{currentQIndex + 1}</span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">{currentQ.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options?.map((opt) => {
              const isSelected = selectedAnswers[currentQ.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(currentQ.id, opt.key)}
                  className={`w-full p-4 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opt.key}
                    </span>
                    <span>{opt.text}</span>
                  </div>

                  {isSelected && <CheckSquare size={16} className="text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 bg-blue-600 text-white font-extrabold rounded-xl text-xs cursor-pointer hover:bg-blue-700"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => handleFinalSubmit(false)}
                className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer hover:bg-emerald-700"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
