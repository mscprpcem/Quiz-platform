import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Loader2, Users, HelpCircle, Calendar } from 'lucide-react';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  // Retrieve state or sessionStorage backup
  const initialData = location.state || {
    participantId: sessionStorage.getItem('msc_participant_id'),
    quizId: sessionStorage.getItem('msc_quiz_id'),
    title: sessionStorage.getItem('msc_quiz_title'),
    eventName: sessionStorage.getItem('msc_event_name'),
    scheduledStart: sessionStorage.getItem('msc_scheduled_start')
  };

  const [totalParticipants, setTotalParticipants] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket || !initialData.quizId) {
      navigate('/join');
      return;
    }

    // Join room just in case (e.g. on page refresh)
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

    // Rejoin handlers
    socket.on('rejoin_success', (data) => {
      setError('');
      setTotalParticipants(data.totalParticipants || 1);
      if (data.quizStatus === 'completed' || data.isCompleted) {
        const playerStats = data.playerStats || {};
        navigate('/results', {
          replace: true,
          state: {
            title: data.title || sessionStorage.getItem('msc_quiz_title') || 'Quiz Session',
            eventName: data.eventName || sessionStorage.getItem('msc_event_name') || 'MSC Event',
            rank: playerStats.rank || 'N/A',
            totalParticipants: data.leaderboard ? data.leaderboard.length : 1,
            score: playerStats.score || 0,
            correctAnswers: playerStats.correctAnswers || 0,
            avgResponseTime: playerStats.avgResponseTime || 0
          }
        });
        return;
      }
      if (data.quizStatus === 'in_progress') {
        navigate('/live-quiz', { state: data, replace: true });
      }
    });

    socket.on('rejoin_error', (data) => {
      console.error('Rejoin error:', data.message);
      if (data.message.includes('not found') || data.message.includes('ended')) {
        sessionStorage.clear();
        navigate('/', { state: { message: data.message } });
      } else {
        setError(data.message);
      }
    });

    socket.on('connect', handleRejoin);

    if (socket.connected) {
      handleRejoin();
    }

    // Listen for quiz started
    socket.on('quiz_started', () => {
      navigate('/live-quiz', { state: initialData });
    });

    // Listen for lobby updates (e.g. total count)
    socket.on('lobby_participants_update', (participants) => {
      setTotalParticipants(participants.length);
    });

    // Listen if kicked by admin
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
      socket.off('quiz_started');
      socket.off('lobby_participants_update');
      socket.off('participant_kicked');
    };
  }, [socket, navigate, initialData]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5FAFF' }}>
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white border border-brand-border p-5 sm:p-8 rounded-xl shadow-soft text-center animate-fade-in">
        {!connected && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 animate-pulse mb-4">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span>Connection lost. Attempting to reconnect...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center mb-4">
            <span>{error}</span>
          </div>
        )}
        {/* Animated loader */}
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="animate-spin text-brand-blue" size={60} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-brand-lightBlue flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-ping"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3 flex flex-col items-center">
          <span className="text-xs font-semibold text-brand-blue bg-brand-lightBlue px-3 py-1 rounded-full uppercase tracking-wider">
            Lobby Active
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-textMain tracking-tight">Waiting for Host...</h2>
          <p className="text-brand-textMuted font-medium">{initialData.eventName}</p>
          <p className="text-brand-textMuted text-sm">{initialData.title}</p>
          {initialData.scheduledStart && (
            <div className="bg-brand-lightBlue text-brand-dark rounded-lg px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 mt-2 border border-brand-blue/10">
              <Calendar size={14} />
              <span>Starts at: {new Date(initialData.scheduledStart).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          )}
        </div>

        <div className="border-t border-brand-border my-6 pt-6 grid grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-brand-bgLight p-4 rounded-lg border border-brand-border flex flex-col items-center">
            <Users className="text-brand-blue mb-1" size={20} />
            <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Joined</span>
            <span className="text-xl font-bold text-brand-textMain">{totalParticipants} Players</span>
          </div>

          {/* Card 2 */}
          <div className="bg-brand-bgLight p-4 rounded-lg border border-brand-border flex flex-col items-center">
            <HelpCircle className="text-brand-textMuted mb-1" size={20} />
            <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider">Scoring</span>
            <span className="text-xs font-bold text-brand-textMain leading-tight">Speed Bonus Active</span>
          </div>
        </div>

        <p className="text-xs text-brand-textMuted">
          Tip: Once the quiz starts, you must enter and remain in fullscreen. Tab switching or exiting fullscreen will result in warnings and score penalties!
        </p>
      </div>
    </div>
  );
}
