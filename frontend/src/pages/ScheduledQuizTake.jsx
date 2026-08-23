import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import StudentAuthModal from '../components/StudentAuthModal';
import {
  Clock, CheckSquare, AlertTriangle, Trophy, CheckCircle, 
  Square, ShieldCheck, ArrowRight, RefreshCw, User, Lock, Award, LogIn, LogOut, ExternalLink, Sparkles, Maximize, KeyRound, Timer, AlertOctagon, XCircle, Ticket, Calendar
} from 'lucide-react';

// Helper to accurately match a participant to current user by email and name combo
const isMatchingParticipant = (player, userEmail, userName) => {
  if (!player) return false;
  const pEmail = (player.participant_email || player.email || '').toLowerCase().trim();
  const pName = (player.participant_name || player.name || '').toLowerCase().trim();
  const uEmail = (userEmail || '').toLowerCase().trim();
  const uName = (userName || '').toLowerCase().trim();

  // If email is available on both, email is the primary unique identifier
  if (uEmail && pEmail) {
    return uEmail === pEmail;
  }

  // If email is provided on both but doesn't match, they are definitely different users
  if (uEmail && pEmail && uEmail !== pEmail) {
    return false;
  }

  // If email is missing on either side, match by name
  if (uName && pName) {
    return uName === pName;
  }

  return false;
};

export default function ScheduledQuizTake() {
  const { toast } = useToast();
  const { occurrenceId, slug, identifier } = useParams();
  const targetIdentifier = slug || occurrenceId || identifier;
  const navigate = useNavigate();
  const location = useLocation();
  const { studentAccount, user, studentLogin, studentLogout, studentRegister } = useAuth();

  const [loading, setLoading] = useState(true);
  const [occData, setOccData] = useState(null);
  const [loadError, setLoadError] = useState('');
  
  // Student input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [startError, setStartError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active Attempt State
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const timerRef = useRef(null);
  const submittingRef = useRef(false);

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

  // Persist current quiz URL so authentication / password reset flows return here directly
  useEffect(() => {
    if (location.pathname) {
      sessionStorage.setItem('msc_quiz_return_url', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (targetIdentifier) {
      fetchOccurrence();
    }
  }, [targetIdentifier, studentAccount?.email, user?.email]);

  useEffect(() => {
    if (quizSubmitted) {
      fetchLeaderboard();
    }
  }, [quizSubmitted]);

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const targetOccId = occData?.occurrence?.id || targetIdentifier;
      const res = await api.get(`/api/scheduled-quizzes/occurrences/${targetOccId}/leaderboard`);
      if (Array.isArray(res.data)) {
        setLeaderboardList(res.data);
      }
    } catch (err) {
      console.warn('Fetch leaderboard error:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleSignOut = () => {
    if (studentLogout) studentLogout();
    if (logout) logout();
    setEmail('');
    setName('');
    localStorage.removeItem('msc_student_email');
    localStorage.removeItem('msc_student_name');
    localStorage.removeItem('msc_participant_email');
    localStorage.removeItem('msc_participant_name');
    setUserAttempt(null);
    fetchOccurrence('', '');
  };

  const fetchOccurrence = async (overrideEmail, overrideName) => {
    try {
      setLoading(true);
      setLoadError('');
      const targetEmail = overrideEmail !== undefined ? overrideEmail : (email || studentAccount?.email || user?.email || localStorage.getItem('msc_student_email') || '');
      const targetName = overrideName !== undefined ? overrideName : (name || studentAccount?.name || user?.name || localStorage.getItem('msc_student_name') || '');
      const queryParams = new URLSearchParams();
      if (targetEmail) queryParams.append('email', targetEmail);
      if (targetName) queryParams.append('name', targetName);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const res = await api.get(`/api/scheduled-quizzes/occurrences/${targetIdentifier}${queryString}`);
      setOccData(res.data);

      // If user has already completed/submitted an attempt for this quiz, immediately show the result and top 10 leaderboard!
      if (res.data?.userAttempt && res.data.userAttempt.status === 'completed') {
        setResultData({
          attempt: res.data.userAttempt,
          rank: res.data.userRank || 1,
          totalParticipants: res.data.totalParticipants || 1,
          totalQuestions: res.data.totalQuestions || res.data.quiz?.questions?.length || 10
        });
        setQuizSubmitted(true);
        fetchLeaderboard();
      } else if (res.data?.status === 'CLOSED' || (res.data?.occurrence?.end_time && new Date(res.data.occurrence.end_time) < new Date())) {
        fetchLeaderboard();
      }
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
      const finalPass = password || 'student123';
      let res = await studentLogin(email, finalPass);
      if (!res.success) {
        res = await studentRegister({ name, email, password: finalPass });
      }

      if (res.success) {
        localStorage.setItem('msc_student_name', name);
        localStorage.setItem('msc_student_email', email);
      } else {
        setStartError(res.error || 'Failed to authenticate student account.');
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

      if (remaining <= 0 && !submittingRef.current) {
        handleFinalSubmit(true);
      }
    };

    calculateRemaining();
    timerRef.current = setInterval(calculateRemaining, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt, quizSubmitted]);

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768) ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
  };

  const isFullscreenSupported = () => {
    if (typeof document === 'undefined') return false;
    const el = document.documentElement;
    return Boolean(
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    );
  };

  // Anti-Cheat Violations Event Listeners (Desktop & Mobile safe)
  useEffect(() => {
    if (!attempt || quizSubmitted) return;

    let blurTimer = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH');
      }
    };

    const handlePageHide = () => {
      recordViolation('APP_SWITCH');
    };

    const handleBlur = () => {
      // On phones, soft keyboard open/touch can trigger a momentary blur.
      // Debounce blur so only genuine unfocus/app-switch triggers a violation.
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus())) {
          recordViolation('WINDOW_BLUR');
        }
      }, isMobile() ? 1500 : 400);
    };

    const handleFocus = () => {
      if (blurTimer) clearTimeout(blurTimer);
    };

    const handleCopy = (e) => {
      e.preventDefault();
      recordViolation('COPY');
    };

    const handleCut = (e) => {
      e.preventDefault();
      recordViolation('CUT');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      recordViolation('PASTE');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation('CONTEXT_MENU');
    };

    const handleSelectStart = (e) => {
      // Prevent text selection on mobile/desktop during quiz
      if (e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [attempt, quizSubmitted]);

  const requireFullscreen = Boolean(occData?.quiz?.require_fullscreen);

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen().catch(() => {});
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen().catch(() => {});
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen().catch(() => {});
      }
      
      // On mobile, scroll to hide browser bar
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 1);
      }
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    } catch (err) {
      console.warn('Fullscreen request rejected or not supported on this phone:', err);
      setIsFullscreen(true);
      setShowFullscreenModal(false);
    }
  };

  // Fullscreen Change & Violation Detection
  useEffect(() => {
    if (!attempt || quizSubmitted) return;

    const handleFullscreenChange = () => {
      // If mobile device without native fullscreen API (e.g. iOS Safari), do not falsely trigger violation
      if (isMobile() && !isFullscreenSupported()) {
        setIsFullscreen(true);
        return;
      }

      const isFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);

      if (requireFullscreen && !isFull && !isMobile()) {
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
    if (!attempt || quizSubmitted || submittingRef.current) return;
    try {
      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/violation`, {
        violationType: type
      });
      setViolationsCount(res.data.violationCount);
      if (res.data.autoSubmit && !submittingRef.current) {
        toast.warning('Anti-cheat limit exceeded. Your quiz is being automatically submitted.', 'Anti-Cheat Notice');
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
      const targetOccId = occData?.occurrence?.id || targetIdentifier;
      const res = await api.post(`/api/scheduled-quizzes/occurrences/${targetOccId}/start`, {
        name: targetName,
        email: targetEmail
      });

      setAttempt(res.data.attempt);
      if (res.data.questions) {
        setQuestions(res.data.questions);
      }

      // Restore previously saved answers if resuming (Session Recovery)
      let restoredMap = {};
      if (res.data.restoredAnswers && Array.isArray(res.data.restoredAnswers)) {
        res.data.restoredAnswers.forEach(a => {
          restoredMap[a.question_id] = a.selected_option;
        });
      }

      // Merge with locally cached answers for resilience
      if (res.data.attempt?.id) {
        try {
          const cached = localStorage.getItem(`msc_attempt_${res.data.attempt.id}_answers`);
          if (cached) {
            const parsed = JSON.parse(cached);
            restoredMap = { ...restoredMap, ...parsed };
          }
        } catch (e) {}
      }

      setSelectedAnswers(restoredMap);
    } catch (err) {
      setStartError(err.response?.data?.error || 'Failed to start quiz attempt.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (questionId, optionKey) => {
    setSelectedAnswers(prev => {
      const updated = { ...prev, [questionId]: optionKey };
      if (attempt?.id) {
        try {
          localStorage.setItem(`msc_attempt_${attempt.id}_answers`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

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
    if (!attempt || quizSubmitted || submittingRef.current) return;
    
    // Non-automated submissions open the polished confirmation modal
    if (!isAuto) {
      setShowSubmitModal(true);
      return;
    }

    await executeSubmit();
  };

  const executeSubmit = async () => {
    if (!attempt || quizSubmitted || submittingRef.current) return;

    try {
      submittingRef.current = true;
      setSubmittingQuiz(true);
      setShowSubmitModal(false);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/submit`);
      setResultData(res.data || {});
      setQuizSubmitted(true);

      // Clean local cache on submit
      if (attempt?.id) {
        try {
          localStorage.removeItem(`msc_attempt_${attempt.id}_answers`);
        } catch (e) {}
      }

      // Cleanly exit fullscreen on finish
      if (document.fullscreenElement) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
        } catch (e) {}
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit quiz attempt.', 'Submission Error');
      submittingRef.current = false;
    } finally {
      setSubmittingQuiz(false);
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

  // ════════ RENDER RESULT SCREEN (SCORE BOARD + TOP 10 LEADERBOARD) ════════
  if (quizSubmitted && resultData) {
    const att = resultData.attempt;
    const totalQuestions = resultData.totalQuestions || questions.length || occData?.quiz?.questions?.length || 1;
    const accuracyPercent = Math.round(((att?.correct_count || 0) / Math.max(1, totalQuestions)) * 100);
    const userEmail = email || studentAccount?.email || user?.email || localStorage.getItem('msc_student_email') || '';
    const userName = name || studentAccount?.name || user?.name || localStorage.getItem('msc_student_name') || '';

    // Find player in real-time leaderboard list if available
    const playerInLeaderboard = leaderboardList.find(p => isMatchingParticipant(p, userEmail, userName));
    const myRank = playerInLeaderboard?.rank || resultData?.rank || 1;
    const totalParticipants = leaderboardList.length > 0 ? leaderboardList.length : (resultData?.totalParticipants || 1);
    const top10List = leaderboardList.slice(0, 10);
    const isInsideTop10 = top10List.some(p => isMatchingParticipant(p, userEmail, userName));

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center space-y-7 font-segoe animate-fade-in">
        
        {/* Already Attempted Alert Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200 rounded-3xl flex items-center justify-between text-left shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">Assessment Already Attempted</h4>
              <p className="text-[11px] text-slate-600 font-semibold">
                You have completed your attempt for this session. Below is your official scorecard and the top 10 participants leaderboard.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex-shrink-0">
            Recorded
          </span>
        </div>

        {/* 1. Official Score Board & Matrix Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 text-left">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black shadow-2xs">
                <CheckCircle size={26} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Assessment Completed</h2>
                <p className="text-xs text-slate-500 font-semibold">{occData?.quiz?.title || 'Scheduled Quiz'} • Submission Recorded</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              Verified Attempt
            </span>
          </div>

          {/* Primary Score Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Total Score Earned</span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                {att?.score || 0} <span className="text-base font-bold text-slate-500">pts</span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Accuracy Rate</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-700">
                {accuracyPercent}%
              </div>
            </div>
          </div>

          {/* Your Official Position / Standing Highlight */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                #{myRank}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                  Your Official Standing
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Position <strong className="text-blue-700 font-black">#{myRank}</strong> of {totalParticipants} Participant{totalParticipants === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-full shadow-2xs">
              Score & Speed Evaluated
            </span>
          </div>

          {/* Performance Matrix 4-Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Performance Evaluation Matrix
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[9px] font-black uppercase">Correct Answers</span>
                <span className="text-emerald-700 text-lg font-black">{att?.correct_count || 0} / {totalQuestions}</span>
                <span className="text-[10px] text-emerald-600 block font-semibold">+{occData?.quiz?.positive_marks || 1} pts each</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[9px] font-black uppercase">Incorrect / Skipped</span>
                <span className="text-rose-600 text-lg font-black">{(att?.incorrect_count || 0) + (att?.unanswered_count || 0)}</span>
                <span className="text-[10px] text-slate-500 block font-semibold">-{occData?.quiz?.negative_marks || 0} deduction</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[9px] font-black uppercase">Time Taken</span>
                <span className="text-blue-700 text-lg font-black">
                  {Math.floor((att?.time_taken_seconds || 0) / 60)}m {(att?.time_taken_seconds || 0) % 60}s
                </span>
                <span className="text-[10px] text-slate-500 block font-semibold">of {occData?.quiz?.time_limit || 30}m limit</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[9px] font-black uppercase">Average Pace</span>
                <span className="text-purple-700 text-lg font-black">
                  {Math.max(1, Math.round((att?.time_taken_seconds || 0) / totalQuestions))}s
                </span>
                <span className="text-[10px] text-slate-500 block font-semibold">per question</span>
              </div>
            </div>
          </div>

        </div>

        {/* 2. Top 10 Leaderboard (Ranked by Score & Speed Matrix) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Top 10 Leaderboard</h3>
                <p className="text-[11px] font-semibold text-slate-500">Ranked by: 1. Total Score  2. Time Taken (Speed)  3. Accuracy</p>
              </div>
            </div>
            
            <button
              onClick={fetchLeaderboard}
              disabled={loadingLeaderboard}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
              title="Refresh Leaderboard Standings"
            >
              <RefreshCw size={15} className={loadingLeaderboard ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingLeaderboard ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw size={24} className="text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-bold">Calculating real-time standings...</p>
            </div>
          ) : top10List.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-semibold">
              No standings recorded yet. Your submission is the first!
            </div>
          ) : (
            <div className="space-y-2">
              {top10List.map((player) => {
                const isCurrentPlayer = isMatchingParticipant(player, userEmail, userName);
                const playerEmailDisplay = player.participant_email || player.email;
                
                let rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs border border-slate-200">
                    {player.rank}
                  </span>
                );

                let cardStyle = "bg-white hover:bg-slate-50/80 border-slate-200";

                if (player.rank === 1) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                      🥇
                    </span>
                  );
                  cardStyle = "bg-amber-50/40 border-amber-200";
                } else if (player.rank === 2) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs">
                      🥈
                    </span>
                  );
                  cardStyle = "bg-slate-50 border-slate-300";
                } else if (player.rank === 3) {
                  rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                      🥉
                    </span>
                  );
                  cardStyle = "bg-amber-50/20 border-amber-200/60";
                }

                if (isCurrentPlayer) {
                  cardStyle += " ring-2 ring-blue-500 bg-blue-50/70 border-blue-300 font-bold";
                }

                return (
                  <div
                    key={player.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${cardStyle}`}
                  >
                    {/* Left Rank & User */}
                    <div className="flex items-center space-x-3 truncate">
                      {rankBadge}

                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {player.participant_name || player.name || 'Participant'}
                          </span>
                          {playerEmailDisplay && (
                            <span className="text-[11px] font-semibold text-slate-500 truncate">
                              ({playerEmailDisplay})
                            </span>
                          )}
                          {isCurrentPlayer && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs flex-shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                          {player.correct_count || 0} Correct • {Math.floor((player.time_taken_seconds || 0) / 60)}m {(player.time_taken_seconds || 0) % 60}s
                        </p>
                      </div>
                    </div>

                    {/* Right Points */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="font-black text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap">
                        {player.score || 0} <span className="text-[9px] font-bold text-slate-500 uppercase">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* If current player is ranked outside Top 10, pin their position below */}
              {!isInsideTop10 && myRank > 10 && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Your Position</span>
                  <div className="p-3 sm:p-3.5 rounded-2xl border ring-2 ring-blue-500 bg-blue-50/70 border-blue-300 flex items-center justify-between gap-3 font-bold">
                    <div className="flex items-center space-x-3 truncate">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                        #{myRank}
                      </span>
                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {userName || name || studentAccount?.name || 'You'}
                          </span>
                          {(userEmail || email || studentAccount?.email) && (
                            <span className="text-[11px] font-semibold text-slate-500 truncate">
                              ({userEmail || email || studentAccount?.email})
                            </span>
                          )}
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs flex-shrink-0">
                            You
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                          {att?.correct_count || 0} Correct • {Math.floor((att?.time_taken_seconds || 0) / 60)}m {(att?.time_taken_seconds || 0) % 60}s
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="font-black text-xs sm:text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap">
                        {att?.score || 0} <span className="text-[9px] font-bold text-slate-500 uppercase">pts</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/courses')}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-98"
          >
            Explore More Quizzes
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>

      </div>
    );
  }

  // ════════ RENDER PRE-QUIZ AVAILABILITY & LOGIN CARD OR ALREADY ENDED SCREEN ════════
  if (!attempt) {
    const status = occData?.status;
    const message = occData?.message;
    const displayName = studentAccount?.name || user?.name || name;
    const displayEmail = studentAccount?.email || user?.email || email;
    const isLoggedIn = Boolean(studentAccount?.email || user?.email || email);
    const endTime = occData?.occurrence?.end_time ? new Date(occData.occurrence.end_time) : null;
    const isQuizEnded = status === 'CLOSED' || (endTime && endTime < new Date());

    if (isQuizEnded) {
      const formattedEndTime = endTime ? endTime.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : 'Scheduled timeframe has expired';
      const userAttempt = occData?.userAttempt;
      const totalQuestions = occData?.quiz?.questions?.length || (userAttempt ? ((userAttempt.correct_count || 0) + (userAttempt.incorrect_count || 0) + (userAttempt.unanswered_count || 0)) : 0) || 10;
      const accuracyPercent = userAttempt ? Math.round(((userAttempt.correct_count || 0) / Math.max(1, totalQuestions)) * 100) : 0;
      const top10List = leaderboardList.slice(0, 10);
      const userEmail = displayEmail || email || studentAccount?.email || user?.email || localStorage.getItem('msc_student_email') || '';
      const userName = displayName || name || studentAccount?.name || user?.name || localStorage.getItem('msc_student_name') || '';

      return (
        <div className="max-w-2xl mx-auto py-10 px-4 font-segoe text-center space-y-7 animate-fade-in">
          {/* Main Already Ended Banner Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-black shadow-xs flex-shrink-0">
                  <AlertOctagon size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100/70 text-rose-700 border border-rose-200 inline-block mb-1">
                    Assessment Concluded
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    This Quiz Has Already Ended
                  </h2>
                </div>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-center">
                Submissions Closed
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">{occData?.quiz?.title || 'Scheduled Quiz'}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The scheduled time window for this assessment has officially concluded. New attempts and submissions are no longer being accepted.
              </p>
            </div>

            {/* End Time Notice Alert */}
            <div className="p-4 bg-gradient-to-r from-rose-50/80 via-amber-50/60 to-orange-50/80 border border-rose-200/80 rounded-2xl flex items-start space-x-3 text-left">
              <Clock size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                  Concluded At
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formattedEndTime}
                </span>
              </div>
            </div>

            {/* Assessment Meta Summary Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Subject / Track</span>
                <span className="text-xs font-extrabold text-slate-800 truncate block mt-0.5">{occData?.quiz?.subject || 'Technical'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Time Limit</span>
                <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{occData?.quiz?.time_limit || 30} mins</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Questions</span>
                <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{occData?.quiz?.questions?.length || 'Full Set'}</span>
              </div>
            </div>

            {/* If the current student took this quiz before it ended, display their official score breakdown! */}
            {userAttempt && (
              <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={18} className="text-blue-600" />
                    <span className="text-xs font-black text-slate-900">Your Recorded Submission</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    Verified Result
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-slate-400 block text-[9px] font-black uppercase">Total Score</span>
                    <span className="text-blue-700 text-lg font-black">{userAttempt.score || 0} <span className="text-xs font-bold text-slate-500">pts</span></span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-slate-400 block text-[9px] font-black uppercase">Accuracy</span>
                    <span className="text-emerald-600 text-lg font-black">{accuracyPercent}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-slate-400 block text-[9px] font-black uppercase">Correct</span>
                    <span className="text-slate-800 text-lg font-black">{userAttempt.correct_count || 0}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-slate-400 block text-[9px] font-black uppercase">Time Taken</span>
                    <span className="text-slate-800 text-lg font-black">{Math.floor((userAttempt.time_taken_seconds || 0) / 60)}m {(userAttempt.time_taken_seconds || 0) % 60}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top 10 Official Final Standings / Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Official Final Standings</h3>
                  <p className="text-[11px] font-semibold text-slate-500">Official winners and rank matrix for this concluded session</p>
                </div>
              </div>

              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                title="Refresh Standings"
              >
                <RefreshCw size={15} className={loadingLeaderboard ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw size={24} className="text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-bold">Loading official standings...</p>
              </div>
            ) : top10List.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-semibold">
                No participant records for this concluded session.
              </div>
            ) : (
              <div className="space-y-2">
                {top10List.map((player) => {
                  const isCurrentPlayer = isMatchingParticipant(player, userEmail, userName);
                  const playerEmailDisplay = player.participant_email || player.email;
                  
                  let rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs border border-slate-200">
                      {player.rank}
                    </span>
                  );

                  let cardStyle = "bg-white hover:bg-slate-50/80 border-slate-200";

                  if (player.rank === 1) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
                        🥇
                      </span>
                    );
                    cardStyle = "bg-amber-50/40 border-amber-200";
                  } else if (player.rank === 2) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs">
                        🥈
                      </span>
                    );
                    cardStyle = "bg-slate-50 border-slate-300";
                  } else if (player.rank === 3) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                        🥉
                      </span>
                    );
                    cardStyle = "bg-amber-50/20 border-amber-200/60";
                  }

                  if (isCurrentPlayer) {
                    cardStyle += " ring-2 ring-blue-500 bg-blue-50/70 border-blue-300 font-bold";
                  }

                  return (
                    <div
                      key={player.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${cardStyle}`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        {rankBadge}

                        <div className="truncate text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {player.participant_name || player.name || 'Participant'}
                            </span>
                            {playerEmailDisplay && (
                              <span className="text-[11px] font-semibold text-slate-500 truncate">
                                ({playerEmailDisplay})
                              </span>
                            )}
                            {isCurrentPlayer && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-2xs flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                            {player.correct_count || 0} Correct • {Math.floor((player.time_taken_seconds || 0) / 60)}m {(player.time_taken_seconds || 0) % 60}s
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="font-black text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap">
                          {player.score || 0} <span className="text-[9px] font-bold text-slate-500 uppercase">pts</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/courses')}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer active:scale-98"
            >
              Explore Active Quizzes & Courses
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs border border-slate-200 transition-all cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      );
    }

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
              <StudentAuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                onSuccess={(u) => { 
                  setName(u.name); 
                  setEmail(u.email); 
                }} 
              />

              {isLoggedIn ? (
                /* Authenticated State: Show verified student badge and 1-click start */
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {((displayName || 'S').charAt(0)).toUpperCase()}
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
                        onClick={handleSignOut}
                        className="flex items-center space-x-1 text-[11px] text-red-600 hover:text-red-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Sign out of current account"
                      >
                        <LogOut size={12} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>

                  {/* ════════ EVENT REGISTRATION CHECK GATE ════════ */}
                  {occData?.requiresEventRegistration && !occData?.isEventRegistered ? (
                    <div className="p-5 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/80 border border-amber-300 rounded-2xl space-y-3.5 animate-fade-in shadow-xs text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                            <Ticket size={20} />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200 block w-fit mb-0.5">
                              Event Registration Required
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              You Have Not Registered for This Event
                            </h4>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        This assessment is exclusively linked to <strong>{occData.linkedEvent?.name || 'VisionX Season 2'}</strong>. You must complete event registration before you can attempt this quiz.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <a
                          href={`https://www.mscprpcem.tech/register/${occData.linkedEvent?.slug || occData.linkedEvent?.id || 'visionx-season-2'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-98 text-center"
                        >
                          <ExternalLink size={14} />
                          <span>Register for {occData.linkedEvent?.name || 'VisionX Season 2'} on MSC Website</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => fetchOccurrence()}
                          className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>Verify Registration</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {occData?.requiresEventRegistration && occData?.isEventRegistered && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                          <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                          <span>Event Registration Verified: <strong>{occData.linkedEvent?.name}</strong></span>
                        </div>
                      )}

                      {occData?.userAttempt?.status === 'in_progress' ? (
                        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1.5 animate-pulse">
                          <div className="flex items-center space-x-2 text-xs font-black text-blue-900">
                            <Sparkles size={15} className="text-blue-600" />
                            <span>Active Session In Progress (Session Recovery)</span>
                          </div>
                          <p className="text-[11px] text-blue-700 font-medium">
                            You have an unfinished attempt for this assessment. All previously answered questions will be automatically restored.
                          </p>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-1.5">
                          <ShieldCheck size={13} className="text-emerald-600 flex-shrink-0" />
                          <span>Your attempt and official certificate will be linked to your student account.</span>
                        </div>
                      )}

                      <button
                        onClick={handleStartAttempt}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
                      >
                        <span>{occData?.userAttempt?.status === 'in_progress' ? 'Resume Quiz Attempt' : 'Start Quiz Attempt'}</span>
                        <ArrowRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Unauthenticated State: Prompt for Student Login / Sign In Modal */
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2 text-xs font-black text-purple-900 bg-purple-50 border border-purple-200 px-3.5 py-2.5 rounded-xl">
                    <LogIn size={16} className="text-purple-600 flex-shrink-0" />
                    <span>Student Login Required to Attempt Quiz</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Please sign in or create an account to verify your identity and start your scheduled quiz attempt.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
                  >
                    <User size={15} />
                    <span>Sign In / Create Account & Unlock Quiz</span>
                  </button>
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
  const answeredCount = questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-segoe text-left space-y-6">
      
      {/* Quiz Time Ended Modal Notification Overlay */}
      {isTimeExpired && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Clock size={32} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">Quiz Time Has Ended!</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                The time limit for this assessment has expired. Your answers are being automatically saved and submitted to compute your standing.
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <RefreshCw size={24} className="text-blue-600 animate-spin" />
            </div>
          </div>
        </div>
      )}

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

      {/* Top Bar with Server Timer & Quick Submit Trigger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-2xs">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[180px] sm:max-w-xs">{occData?.quiz?.title}</h3>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
            <span>Question {currentQIndex + 1} of {questions.length}</span>
            <span>•</span>
            <span className="text-emerald-600 font-extrabold">{answeredCount} Answered</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Submit Assessment Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
            title="Review questions and submit"
          >
            <CheckSquare size={13} className="text-emerald-600" />
            <span>Submit Quiz</span>
          </button>

          {requireFullscreen && (
            <button
              onClick={enterFullscreen}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer transition-all ${
                isFullscreen 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              }`}
              title={isFullscreen ? 'Fullscreen active' : 'Click to re-enter fullscreen'}
            >
              <Maximize size={12} />
              <span className="hidden sm:inline">{isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}</span>
            </button>
          )}

          {/* Server Authoritative Timer Display */}
          <div className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border flex items-center space-x-1.5 text-xs font-black ${
            timeLeftSeconds < 180 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <Clock size={15} />
            <span className="font-mono">{formatTime(timeLeftSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Question Jump Palette Ribbon */}
      {questions.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
            <span>Questions Navigator:</span>
            <span className="text-slate-400 font-semibold">{answeredCount} of {questions.length} completed</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null;
              const isCurrent = currentQIndex === idx;
              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                      : isAnswered
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                  title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Violation Banner if triggered */}
      {violationsCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Anti-Cheat Notice: {violationsCount} violation(s) recorded (Tab Switch / Window Blur).</span>
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Question {currentQIndex + 1}</span>
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-snug">{currentQ.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-2.5 sm:space-y-3">
            {currentQ.options?.map((opt) => {
              const isSelected = selectedAnswers[currentQ.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(currentQ.id, opt.key)}
                  className={`w-full p-3 sm:p-4 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-2.5 cursor-pointer min-h-[50px] active:scale-[0.99] ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs ring-2 ring-blue-500/20' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 sm:mt-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="break-words leading-relaxed flex-1">{opt.text}</span>
                  </div>

                  {isSelected && <CheckSquare size={16} className="text-blue-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 gap-2">
            <button
              onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2.5 border rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer min-h-[44px]"
            >
              Previous
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs cursor-pointer min-h-[44px] border border-slate-200"
              >
                Submit...
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 bg-blue-600 text-white font-extrabold rounded-xl text-xs cursor-pointer hover:bg-blue-700 min-h-[44px] shadow-sm active:scale-98"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer hover:bg-emerald-700 min-h-[44px] active:scale-98"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ SUBMISSION CONFIRMATION MODAL ════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-left relative overflow-hidden animate-scale-up">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100 shadow-inner">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Submit Assessment?</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Review your answered questions summary before final submission.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Summary KPI Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-emerald-700">{answeredCount}</div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Answered</div>
              </div>

              <div className={`p-3.5 rounded-2xl text-center space-y-0.5 border ${
                unansweredCount > 0 
                  ? 'bg-amber-50/70 border-amber-200 text-amber-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <div className="text-xl sm:text-2xl font-black">{unansweredCount}</div>
                <div className="text-[10px] font-black uppercase tracking-wider">Unanswered</div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-center space-y-0.5">
                <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono">{formatTime(timeLeftSeconds)}</div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Time Left</div>
              </div>
            </div>

            {/* Questions Jump Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                <span>Questions Overview (Click to Jump):</span>
                <span className="text-slate-400 font-medium">Green = Answered</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null;
                  const isCurrent = currentQIndex === idx;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => {
                        setCurrentQIndex(idx);
                        setShowSubmitModal(false);
                      }}
                      className={`aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                        isAnswered
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-amber-100 hover:text-amber-800'
                      } ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      title={`Question ${idx + 1}: ${isAnswered ? 'Answered' : 'Not Answered'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Context Warning / Assurance */}
            {unansweredCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold flex items-start space-x-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  You have <strong>{unansweredCount} unanswered question(s)</strong>. Unanswered questions will receive 0 marks. You can still return and answer them before submitting.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center space-x-2.5">
                <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                <div className="leading-relaxed">
                  All <strong>{questions.length} questions</strong> have been answered! Your score and leaderboard ranking will be calculated immediately upon submission.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-colors cursor-pointer text-center"
              >
                Return to Assessment
              </button>
              
              <button
                type="button"
                disabled={submittingQuiz}
                onClick={executeSubmit}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {submittingQuiz ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Submitting Answers...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Submit</span>
                    <ArrowRight size={14} />
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
