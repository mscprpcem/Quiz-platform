import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, ShieldAlert, AlertTriangle, CheckCircle, ChevronLeft, 
  ChevronRight, Maximize2, Flag, Lock, Award, Home, RefreshCw 
} from 'lucide-react';
import api from '../services/api';

export default function WeeklyLeagueQuiz() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Attempt Data States
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionKey }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Timer & Security States
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchAttemptData();
  }, [attemptId]);

  // Request Fullscreen on mount
  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request deferred or denied:', err.message);
      }
    };
    requestFullscreen();

    // Attach Anti-Cheat listeners
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logAntiCheatViolation('FULLSCREEN_EXIT', 'Participant exited fullscreen mode');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAntiCheatViolation('VISIBILITY_CHANGE', 'Tab or window hidden');
      }
    };

    const handleBlur = () => {
      logAntiCheatViolation('WINDOW_BLUR', 'Window lost focus');
    };

    const handleCopy = (e) => {
      e.preventDefault();
      logAntiCheatViolation('COPY_ATTEMPT', 'Copy attempt blocked');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logAntiCheatViolation('PASTE_ATTEMPT', 'Paste attempt blocked');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logAntiCheatViolation('RIGHT_CLICK', 'Right click context menu blocked');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const fetchAttemptData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/weekly-league/attempts/${attemptId}`);
      
      if (res.data.success) {
        const att = res.data.attempt;
        setAttempt(att);
        setQuestions(res.data.questions || []);
        setAnswers(res.data.savedAnswers || {});
        setTimerSeconds(att.remainingSeconds || 0);
        setViolations(att.violationCount || 0);

        if (att.status === 'completed' || att.status === 'expired' || att.status === 'auto_submitted') {
          setCompletedResult(att);
        } else {
          startServerAuthoritativeTimer(att.remainingSeconds);
        }
      }
    } catch (err) {
      console.error('Fetch attempt error:', err);
      setError(err.response?.data?.error || 'Failed to load quiz attempt.');
    } finally {
      setLoading(false);
    }
  };

  const startServerAuthoritativeTimer = (initialSeconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let rem = initialSeconds;

    timerRef.current = setInterval(() => {
      rem -= 1;
      setTimerSeconds(rem);

      if (rem <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit('expired');
      }
    }, 1000);
  };

  const logAntiCheatViolation = async (type, desc) => {
    if (completedResult || submitting) return;

    try {
      const res = await api.post(`/api/weekly-league/attempts/${attemptId}/violation`, {
        type,
        metadata: { description: desc, timestamp: new Date().toISOString() }
      });

      if (res.data.success) {
        setViolations(res.data.violationCount);
        setWarningMessage(`Anti-Cheat Warning: ${desc} detected (${res.data.violationCount} violation logged)`);
        setTimeout(() => setWarningMessage(''), 4500);

        if (res.data.autoSubmitted) {
          handleAutoSubmit('auto_submitted');
        }
      }
    } catch (err) {
      console.warn('Violation log error:', err.message);
    }
  };

  const handleSelectOption = async (optionKey) => {
    const currentQ = questions[currentIdx];
    if (!currentQ || completedResult) return;

    const newAnswers = { ...answers, [currentQ.id]: optionKey };
    setAnswers(newAnswers);

    // Continuous Autosave API
    try {
      await api.post(`/api/weekly-league/attempts/${attemptId}/answers`, {
        questionId: currentQ.id,
        selectedOption: optionKey
      });
    } catch (err) {
      console.warn('Autosave error:', err.message);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await api.post(`/api/weekly-league/attempts/${attemptId}/submit`);
      if (res.data.success) {
        setCompletedResult(res.data.attempt);
        setShowSubmitModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async (reason) => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const res = await api.post(`/api/weekly-league/attempts/${attemptId}/submit`);
      if (res.data.success) {
        setCompletedResult(res.data.attempt);
      }
    } catch (err) {
      console.error('Auto submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-extrabold">
        <div className="flex items-center space-x-3 text-amber-400">
          <RefreshCw size={20} className="animate-spin" />
          <span>Initializing Quiz Session...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-white">
          <ShieldAlert size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-black">Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{error}</p>
          <button
            onClick={() => navigate('/weekly-league')}
            className="w-full py-3 bg-brand-blue font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
          >
            Back to Weekly League
          </button>
        </div>
      </div>
    );
  }

  // Render Completed Result Screen
  if (completedResult) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-white py-12 px-4 flex items-center justify-center text-left">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 space-y-8 shadow-2xl animate-fade-in">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              Attempt Finalized
            </span>
            <h2 className="text-3xl font-black tracking-tight">{attempt?.weekTitle || 'Weekly Challenge'}</h2>
            <p className="text-xs text-slate-300 font-medium">Official Performance Summary</p>
          </div>

          {/* Score gauge */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 text-center space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Final Weekly Score</span>
            <div className="text-5xl font-black text-amber-400 tracking-tight">{completedResult.score} pts</div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Correct</span>
              <div className="text-xl font-black text-emerald-400">{completedResult.correctCount}</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Incorrect</span>
              <div className="text-xl font-black text-red-400">{completedResult.incorrectCount}</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Unanswered</span>
              <div className="text-xl font-black text-amber-400">{completedResult.unansweredCount}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-center">
            <button
              onClick={() => navigate('/weekly-league')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer text-center"
            >
              Return to Weekly League
            </button>
          </div>

        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-segoe select-none text-left">
      
      {/* Anti-Cheat Warning Toast */}
      {warningMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white border border-red-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-black animate-bounce">
          <AlertTriangle size={18} />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* ════════ TOP HEADER BAR ════════ */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
            {attempt?.leagueName || 'Weekly Tech League'}
          </span>
          <h2 className="text-base sm:text-lg font-black text-white">{attempt?.weekTitle}</h2>
        </div>

        {/* Server Authoritative Timer Badge */}
        <div className="flex items-center space-x-4">
          {violations > 0 && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-extrabold">
              <ShieldAlert size={14} />
              <span>{violations} Violations</span>
            </div>
          )}

          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-black tracking-wider ${
            timerSeconds < 180 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-amber-400'
          }`}>
            <Clock size={16} />
            <span>{formatTime(timerSeconds)}</span>
          </div>
        </div>
      </header>

      {/* ════════ MAIN QUESTION ARENA ════════ */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center space-y-8">
        
        {/* Question Counter & Marks Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            +{currentQ?.marks || 4} Marks
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-2xl font-black leading-snug text-slate-100">
            {currentQ?.question}
          </h3>
        </div>

        {/* Options List */}
        <div className="space-y-3.5">
          {currentQ?.options?.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.key;

            return (
              <button
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center space-x-4 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-brand-blue text-white ring-2 ring-brand-blue/50 shadow-lg' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border transition-colors ${
                  isSelected ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {opt.key}
                </div>
                <span className="text-xs sm:text-sm font-bold leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>

      </main>

      {/* ════════ BOTTOM NAVIGATION BAR ════════ */}
      <footer className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-40">
        
        {/* Question Palette Indicator */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full py-1">
          {questions.map((q, idx) => {
            const isAns = !!answers[q.id];
            const isCurr = idx === currentIdx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  isCurr ? 'ring-2 ring-amber-400 scale-110' : ''
                } ${
                  isAns ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-blue hover:bg-blue-700 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Submit Quiz
            </button>
          )}
        </div>

      </footer>

      {/* ════════ SUBMIT CONFIRMATION MODAL ════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Submit Weekly Quiz?</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                You have answered {Object.keys(answers).length} out of {questions.length} questions. Once submitted, your score will be calculated and updated on the weekly leaderboard.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Continue Quiz
              </button>
              <button
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
