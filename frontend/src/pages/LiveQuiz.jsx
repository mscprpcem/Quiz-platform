import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import FullscreenHandler from '../components/FullscreenHandler';
import { Clock, ShieldAlert, Award, ArrowRight } from 'lucide-react';

export default function LiveQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  // Retrieve player details
  const initialData = location.state || {
    participantId: sessionStorage.getItem('msc_participant_id'),
    quizId: sessionStorage.getItem('msc_quiz_id'),
    title: sessionStorage.getItem('msc_quiz_title'),
    eventName: sessionStorage.getItem('msc_event_name')
  };

  // State Management
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null); // { isCorrect, points, correctAnswer }
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Anti-Cheat State
  const [disqualified, setDisqualified] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [violationMessage, setViolationMessage] = useState('');

  // Performance timer reference
  const questionStartTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (!socket || !initialData.quizId) {
      navigate('/join');
      return;
    }

    // Connect socket if closed
    if (!socket.connected) {
      socket.connect();
    }

    const handleRejoin = () => {
      const participantId = sessionStorage.getItem('msc_participant_id');
      const quizId = sessionStorage.getItem('msc_quiz_id');
      if (participantId && quizId && socket.connected) {
        socket.emit('rejoin_quiz', { participantId, quizId });
      }
    };

    socket.on('connect', handleRejoin);

    if (socket.connected) {
      handleRejoin();
    }

    socket.on('rejoin_success', (data) => {
      if (data.disqualified) {
        setDisqualified(true);
        setViolationCount(data.tabSwitchCount || 0);
        return;
      }

      setViolationCount(data.tabSwitchCount || 0);

      if (data.currentQuestion) {
        setCurrentQuestion(data.currentQuestion);
        setSelectedOption(data.selectedAnswer);
        setSubmitted(data.submitted);
        setTimer(data.remainingTime);
        setIsPaused(data.isPaused || false);

        if (data.feedbackData) {
          setFeedbackData(data.feedbackData);
          setShowFeedback(data.currentQuestionStatus === 'timer_ended');
        } else {
          setFeedbackData(null);
          setShowFeedback(false);
        }

        // Restart local countdown timer if question is active
        if (data.currentQuestionStatus === 'released' && data.remainingTime > 0) {
          questionStartTimeRef.current = performance.now() - ((data.currentQuestion.timer - data.remainingTime) * 1000);
          
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = setInterval(() => {
            setTimer((prev) => {
              if (prev <= 1) {
                clearInterval(timerIntervalRef.current);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        // Check if there is a pending answer to submit
        const pendingAnswerStr = localStorage.getItem('msc_pending_answer');
        if (pendingAnswerStr) {
          try {
            const pending = JSON.parse(pendingAnswerStr);
            if (
              pending.questionId === data.currentQuestion.questionId &&
              !data.submitted &&
              data.currentQuestionStatus === 'released' &&
              data.remainingTime > 0
            ) {
              console.log('Syncing offline cached answer with server:', pending);
              socket.emit('submit_answer', pending);
              setSelectedOption(pending.selectedAnswer);
              setSubmitted(true);
            }
            localStorage.removeItem('msc_pending_answer');
          } catch (e) {
            console.error('Error parsing pending answer:', e);
            localStorage.removeItem('msc_pending_answer');
          }
        }
      } else {
        setCurrentQuestion(null);
        setSelectedOption(null);
        setSubmitted(false);
        setShowFeedback(false);
        setFeedbackData(null);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    });

    socket.on('rejoin_error', (data) => {
      console.error('Rejoin error:', data.message);
      if (data.message.includes('not found') || data.message.includes('ended')) {
        sessionStorage.clear();
        navigate('/', { state: { message: data.message } });
      }
    });

    // 1. Question released event
    socket.on('question_released', (q) => {
      setCurrentQuestion(q);
      setSelectedOption(null);
      setSubmitted(false);
      setShowFeedback(false);
      setFeedbackData(null);
      setTimer(q.timer);
      setIsPaused(false);

      // Record high resolution start time
      questionStartTimeRef.current = performance.now();

      // Start Countdown Timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 2. Submissions closed (timer ended or host skipped)
    socket.on('question_ended', ({ correctAnswer, leaderboard }) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimer(0);
      setShowFeedback(true);

      // Identify player's current standings and score
      const playerStats = leaderboard.find((p) => p.id === initialData.participantId);

      setFeedbackData((prev) => ({
        ...prev,
        correctAnswer,
        rank: playerStats ? leaderboard.indexOf(playerStats) + 1 : 'N/A',
        totalScore: playerStats ? playerStats.score : 0
      }));
    });

    // 3. Answer successfully registered feedback
    socket.on('answer_received', ({ points, isCorrect }) => {
      setFeedbackData({
        isCorrect,
        points,
        correctAnswer: null // Will be populated when question ends
      });
    });

    // 4. Handle quiz paused/resumed
    socket.on('quiz_paused', () => {
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    });

    socket.on('quiz_resumed', () => {
      setIsPaused(false);
      // Restart countdown
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 5. Handle complete quiz end
    socket.on('quiz_ended', ({ leaderboard }) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const playerStats = leaderboard.find((p) => p.id === initialData.participantId);

      navigate('/results', {
        state: {
          title: initialData.title,
          eventName: initialData.eventName,
          rank: playerStats ? leaderboard.indexOf(playerStats) + 1 : 'N/A',
          totalParticipants: leaderboard.length,
          score: playerStats ? playerStats.score : 0,
          correctAnswers: playerStats ? playerStats.correctAnswers : 0,
          avgResponseTime: playerStats ? playerStats.avgResponseTime : 0
        }
      });
    });

    // 6. Handle host skip question
    socket.on('question_skipped', () => {
      setCurrentQuestion(null);
      setShowFeedback(false);
      setFeedbackData(null);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    });

    // 7. Handle participant kicked
    socket.on('participant_kicked', ({ participantId }) => {
      if (participantId === initialData.participantId) {
        sessionStorage.clear();
        navigate('/', { state: { message: 'You have been removed from the quiz by the host.' } });
      }
    });

    return () => {
      socket.off('connect', handleRejoin);
      socket.off('rejoin_success');
      socket.off('rejoin_error');
      socket.off('question_released');
      socket.off('question_ended');
      socket.off('answer_received');
      socket.off('quiz_paused');
      socket.off('quiz_resumed');
      socket.off('quiz_ended');
      socket.off('question_skipped');
      socket.off('participant_kicked');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [socket, navigate, initialData]);

  // Handle Answer Selection
  const handleSelectOption = (optionKey) => {
    if (submitted || timer === 0 || isPaused || disqualified) return;

    setSelectedOption(optionKey);
    setSubmitted(true);

    const responseTimeMs = Math.round(performance.now() - questionStartTimeRef.current);

    if (socket && socket.connected) {
      socket.emit('submit_answer', {
        questionId: currentQuestion.questionId,
        selectedAnswer: optionKey,
        responseTime: responseTimeMs
      });
    } else {
      console.log('Socket offline. Caching answer locally for sync.');
      const pendingAnswer = {
        questionId: currentQuestion.questionId,
        selectedAnswer: optionKey,
        responseTime: responseTimeMs
      };
      localStorage.setItem('msc_pending_answer', JSON.stringify(pendingAnswer));
    }
  };

  // Handle Violations telemetry alerts
  const handleViolationAlert = ({ count, disqualified: isDQ, message }) => {
    setViolationCount(count);
    setDisqualified(isDQ);
    setViolationMessage(message);

    // Auto close violation banner after 6 seconds
    setTimeout(() => {
      setViolationMessage('');
    }, 6000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5FAFF' }}>
      {/* Security Fullscreen Enforcer Hook - Disabled for now */}
      {/*
      <FullscreenHandler
        quizStarted={currentQuestion !== null}
        participantId={initialData.participantId}
        quizId={initialData.quizId}
        disqualified={disqualified}
        onViolationAlert={handleViolationAlert}
      />
      */}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Connection status banner */}
        {!connected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800 animate-fade-in animate-pulse">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full flex-shrink-0 animate-ping"></span>
            <div>
              <h4 className="font-bold text-sm">Connection Interrupted</h4>
              <p className="text-xs text-amber-700 mt-0.5">We've lost connection to the server. Attempting to reconnect... Your answers will be saved offline and synced immediately once connection is restored.</p>
            </div>
          </div>
        )}

        {/* Anti-Cheat Banner Alert */}
        {violationMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800 animate-fade-in">
            <ShieldAlert size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Security Violation Detected</h4>
              <p className="text-xs text-red-700 mt-1">{violationMessage}</p>
            </div>
          </div>
        )}

        {/* Disqualified overlay */}
        {disqualified && (
          <div className="bg-red-950 text-white rounded-lg p-6 text-center border border-red-900 shadow-lg animate-fade-in">
            <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold">Disqualified</h2>
            <p className="text-zinc-300 text-sm mt-2">
              You have exceeded the maximum of 3 tab switches/focus violations and have been disqualified.
            </p>
          </div>
        )}

        {!disqualified && (
          <>
            {/* Header info */}
            <div className="flex justify-between items-center bg-white border border-brand-border px-6 py-4 rounded-xl shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-brand-textMuted uppercase tracking-wider">Playing</h3>
                <h1 className="text-lg font-bold text-brand-textMain">{initialData.title}</h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Timer Clock */}
                {currentQuestion && !showFeedback && (
                  <div className="flex items-center space-x-2 bg-brand-lightBlue text-brand-dark px-4 py-2 rounded-lg font-bold">
                    <Clock size={20} className={timer <= 5 ? 'text-red-600 animate-pulse' : ''} />
                    <span className={timer <= 5 ? 'text-red-600 font-extrabold text-xl' : 'text-xl'}>
                      {isPaused ? 'Paused' : `${timer}s`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Stage Panel */}
            {currentQuestion === null ? (
              /* Standby Card */
              <div className="bg-white border border-brand-border rounded-xl p-12 text-center shadow-sm space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-brand-lightBlue text-brand-blue rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Clock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-brand-textMain">Prepare for the next question</h2>
                <p className="text-brand-textMuted max-w-sm mx-auto text-sm">
                  The host has not released the next question. Please remain focused and wait in fullscreen.
                </p>
              </div>
            ) : showFeedback ? (
              /* Question Feedback Phase */
              <div className="bg-white border border-brand-border rounded-xl p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <div className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-zinc-100 text-zinc-600">
                    Question Completed
                  </div>
                  <h2 className="text-2xl font-bold text-brand-textMain">{currentQuestion.question}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  {/* Correct Answer Display */}
                  <div className="bg-brand-bgLight p-6 rounded-lg border border-brand-border text-center space-y-1">
                    <span className="text-xs font-semibold text-brand-textMuted uppercase">Correct Option</span>
                    <h3 className="text-2xl font-extrabold text-brand-success">
                      Option {feedbackData?.correctAnswer}
                    </h3>
                  </div>

                  {/* Player Status Display */}
                  <div className={`p-6 rounded-lg border text-center space-y-1 ${
                    feedbackData?.isCorrect 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-red-50 border-red-100 text-red-800'
                  }`}>
                    <span className="text-xs font-semibold text-brand-textMuted uppercase">Your Result</span>
                    <h3 className="text-2xl font-extrabold">
                      {feedbackData?.isCorrect 
                        ? `+${feedbackData?.points} Points` 
                        : '0 Points (Wrong/No Answer)'}
                    </h3>
                  </div>
                </div>

                {/* Score and rank display */}
                <div className="border-t border-zinc-100 pt-6 flex justify-around text-center">
                  <div>
                    <span className="text-xs font-semibold text-brand-textMuted uppercase">Current Score</span>
                    <p className="text-xl font-bold text-brand-textMain mt-1">{feedbackData?.totalScore || 0}</p>
                  </div>
                  <div className="w-px bg-zinc-200"></div>
                  <div>
                    <span className="text-xs font-semibold text-brand-textMuted uppercase">Current Standings</span>
                    <p className="text-xl font-bold text-brand-blue mt-1">Rank #{feedbackData?.rank || 'N/A'}</p>
                  </div>
                </div>

                <div className="text-center text-sm font-semibold text-zinc-500 pt-4">
                  Waiting for host to release next question...
                </div>
              </div>
            ) : (
              /* Active Gameplay Question Card */
              <div className="space-y-6 animate-fade-in">
                {/* Question */}
                <div className="bg-white border border-brand-border p-8 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-brand-textMuted text-xs font-semibold uppercase tracking-wider">
                    <span>Question {currentQuestion.questionIndex + 1}</span>
                    <span>{currentQuestion.marks} Points</span>
                  </div>
                  <h2 className="text-2xl font-bold text-brand-textMain leading-tight">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'A', text: currentQuestion.option_a },
                    { key: 'B', text: currentQuestion.option_b },
                    { key: 'C', text: currentQuestion.option_c },
                    { key: 'D', text: currentQuestion.option_d }
                  ].map((option) => {
                    const isSelected = selectedOption === option.key;
                    const canSelect = !submitted && timer > 0 && !isPaused;

                    return (
                      <button
                        key={option.key}
                        onClick={() => handleSelectOption(option.key)}
                        disabled={!canSelect}
                        className={`w-full text-left p-5 rounded-xl border transition-all relative flex items-center space-x-4 ${
                          isSelected
                            ? 'bg-brand-lightBlue border-brand-blue text-brand-dark ring-2 ring-brand-blue/20'
                            : canSelect
                            ? 'bg-white border-brand-border hover:border-brand-blue/50 hover:bg-brand-bgLight'
                            : 'bg-brand-bgLight border-brand-border text-brand-textMuted cursor-not-allowed'
                        }`}
                      >
                        {/* Option tag circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isSelected
                            ? 'bg-brand-blue text-white'
                            : 'bg-brand-lightBlue text-brand-textMain'
                        }`}>
                          {option.key}
                        </div>
                        <span className="font-semibold text-lg">{option.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Submission State Info overlay */}
                {submitted && (
                  <div className="bg-brand-lightBlue border border-brand-blue/10 rounded-xl p-4 text-center text-brand-dark font-semibold animate-fade-in flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin text-brand-blue" size={18} />
                    <span>Answer submitted! Waiting for other participants or timer to finish.</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Inline Loader2 SVG component since lucide-react could miss it
function Loader2(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
