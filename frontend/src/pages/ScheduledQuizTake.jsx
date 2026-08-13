import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StudentAuthModal from '../components/StudentAuthModal';
import {
  Clock, CheckSquare, AlertTriangle, Trophy, CheckCircle, 
  Square, ShieldCheck, ArrowRight, RefreshCw, User, Lock, Award, LogIn, ExternalLink, Sparkles, Maximize, KeyRound
} from 'lucide-react';
import DigitalBadgeCard from '../components/DigitalBadgeCard';

export default function ScheduledQuizTake() {
  const { occurrenceId, slug, identifier } = useParams();
  const targetIdentifier = slug || occurrenceId || identifier;
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
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  useEffect(() => {
    if (targetIdentifier) {
      fetchOccurrence();
    }
  }, [targetIdentifier]);

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

  const fetchOccurrence = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await api.get(`/api/scheduled-quizzes/occurrences/${targetIdentifier}`);
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
    if (!attempt || quizSubmitted || submittingRef.current) return;
    try {
      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/violation`, {
        violationType: type
      });
      setViolationsCount(res.data.violationCount);
      if (res.data.autoSubmit && !submittingRef.current) {
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
      const targetOccId = occData?.occurrence?.id || targetIdentifier;
      const res = await api.post(`/api/scheduled-quizzes/occurrences/${targetOccId}/start`, {
        name: targetName,
        email: targetEmail
      });

      setAttempt(res.data.attempt);
      if (res.data.questions) {
        setQuestions(res.data.questions);
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
    if (!attempt || quizSubmitted || submittingRef.current) return;
    if (!isAuto && !window.confirm('Are you sure you want to submit your quiz?')) return;

    try {
      submittingRef.current = true;
      setLoading(true);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/submit`);
      setResultData(res.data || {});
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
      submittingRef.current = false;
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

  // ════════ RENDER RESULT SCREEN (SCORE BOARD + TOP 10 LEADERBOARD) ════════
  if (quizSubmitted && resultData) {
    const att = resultData.attempt;
    const totalQuestions = resultData.totalQuestions || questions.length || 1;
    const accuracyPercent = Math.round(((att?.correct_count || 0) / totalQuestions) * 100);
    const userEmail = email || studentAccount?.email || user?.email || '';
    const myRank = resultData?.rank || 1;
    const totalParticipants = resultData?.totalParticipants || leaderboardList.length || 1;
    const top10List = leaderboardList.slice(0, 10);
    const isInsideTop10 = top10List.some(p => userEmail && p.email && p.email.toLowerCase() === userEmail.toLowerCase());

    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center space-y-7 font-segoe animate-fade-in">
        
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
                const isCurrentPlayer = userEmail && player.email && player.email.toLowerCase() === userEmail.toLowerCase();
                
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

                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {player.participant_name ? player.participant_name.substring(0, 2).toUpperCase() : 'ST'}
                      </div>

                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {player.participant_name || 'Participant'}
                          </span>
                          {isCurrentPlayer && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 truncate">
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
                      <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {(name || 'You').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {name || studentAccount?.name || 'You'}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md">
                            You
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-500 truncate">
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

        {/* 3. Official Digital Credential & Badge */}
        <div className="pt-1">
          <DigitalBadgeCard
            quizTitle={occData?.occurrence?.title || occData?.quiz?.title || 'Scheduled Challenge'}
            eventName={occData?.quiz?.event_name || 'MSC Scheduled Challenge'}
            badgeTitle={occData?.quiz?.badge_title || `${occData?.occurrence?.title || occData?.quiz?.title || 'Scheduled Challenge'} Certified Master`}
            score={att?.score || 100}
            studentName={name || studentAccount?.name || 'Student'}
            studentEmail={email || studentAccount?.email || ''}
          />
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
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
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
