import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Clock, CheckSquare, AlertTriangle, Trophy, CheckCircle, 
  Square, ShieldCheck, ArrowRight, RefreshCw, User, Lock, Award
} from 'lucide-react';

export default function ScheduledQuizTake() {
  const { occurrenceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [occData, setOccData] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const timerRef = useRef(null);

  useEffect(() => {
    fetchOccurrence();
  }, [occurrenceId]);

  const fetchOccurrence = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/scheduled-quizzes/occurrences/${occurrenceId}`);
      setOccData(res.data);
    } catch (err) {
      console.error('Fetch occurrence error:', err);
    } finally {
      setLoading(false);
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
    e.preventDefault();
    if (!name) {
      setStartError('Please enter your name.');
      return;
    }
    try {
      setStartError('');
      setLoading(true);
      const res = await api.post(`/api/scheduled-quizzes/occurrences/${occurrenceId}/start`, {
        name,
        email
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
    if (!attempt || quizSubmitted) return;
    if (!isAuto && !window.confirm('Are you sure you want to submit your quiz?')) return;

    try {
      setLoading(true);
      const res = await api.post(`/api/scheduled-quizzes/attempts/${attempt.id}/submit`);
      setResultData(res.data);
      setQuizSubmitted(true);
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

  if (loading && !attempt) {
    return (
      <div className="py-20 text-center text-slate-400 font-extrabold animate-pulse">
        Checking quiz availability...
      </div>
    );
  }

  // ════════ RENDER RESULT SCREEN ════════
  if (quizSubmitted && resultData) {
    const att = resultData.attempt;
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6 font-segoe">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md space-y-6">
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

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-blue-600 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // ════════ RENDER PRE-QUIZ AVAILABILITY CARD ════════
  if (!attempt) {
    const status = occData?.status;
    const message = occData?.message;

    return (
      <div className="max-w-md mx-auto py-12 px-4 font-segoe text-left">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full inline-block">
              Scheduled Quiz Session
            </span>
            <h2 className="text-xl font-black text-slate-900">{occData?.quiz?.title || 'Scheduled Quiz'}</h2>
            <p className="text-xs text-slate-500 font-medium">{occData?.quiz?.description}</p>
          </div>

          {status !== 'AVAILABLE' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center space-x-3">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleStartAttempt} className="space-y-4 pt-2 border-t">
              {startError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
                  {startError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <span>Start Quiz Attempt</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ════════ RENDER ACTIVE ATTEMPT INTERFACE ════════
  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-segoe text-left space-y-6">
      
      {/* Top Bar with Server Timer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">{occData?.quiz?.title}</h3>
          <span className="text-[10px] font-bold text-slate-400">Question {currentQIndex + 1} of {questions.length}</span>
        </div>

        {/* Server Authoritative Timer Display */}
        <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2 text-xs font-black ${
          timeLeftSeconds < 180 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <Clock size={16} />
          <span>{formatTime(timeLeftSeconds)}</span>
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
              className="px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>

            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 bg-blue-600 text-white font-extrabold rounded-xl text-xs"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => handleFinalSubmit(false)}
                className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-xs shadow-md"
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
