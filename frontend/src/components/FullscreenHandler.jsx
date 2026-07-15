import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function FullscreenHandler({ quizStarted, participantId, quizId, disqualified, onViolationAlert }) {
  const { socket } = useSocket();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Check if browser is in fullscreen mode
  const checkFullscreen = () => {
    const isFS = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    setIsFullscreen(isFS);
    return isFS;
  };

  // Request browser fullscreen mode
  const enterFullscreen = async () => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowWarningModal(false);
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = checkFullscreen();
      if (quizStarted && !isFS && !disqualified) {
        setShowWarningModal(true);
        setModalMessage('You exited fullscreen! Please return to fullscreen immediately.');
        if (socket) {
          socket.emit('report_violation', { violationType: 'exit_fullscreen' });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted && !disqualified) {
        if (socket) {
          socket.emit('report_violation', { violationType: 'tab_switch' });
        }
      }
    };

    const handleWindowBlur = () => {
      if (quizStarted && !disqualified) {
        if (socket) {
          socket.emit('report_violation', { violationType: 'focus_loss' });
        }
      }
    };

    // Add event listeners when quiz is active
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Initial check
    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [quizStarted, disqualified, socket]);

  // Listen to socket warning messages
  useEffect(() => {
    if (!socket) return;

    socket.on('violation_alert', (data) => {
      if (onViolationAlert) {
        onViolationAlert(data);
      }
    });

    return () => {
      socket.off('violation_alert');
    };
  }, [socket, onViolationAlert]);

  // If quiz is started and participant is NOT in fullscreen, force them to enter it
  if (quizStarted && !isFullscreen && !disqualified) {
    return (
      <div className="fixed inset-0 bg-zinc-950/90 z-50 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full animate-fade-in shadow-2xl">
          <div className="w-16 h-16 bg-red-900/40 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-red-500 mb-2">Fullscreen Required</h2>
          <p className="text-zinc-400 mb-6">
            This quiz is monitored for integrity. You must remain in fullscreen mode to participate.
          </p>
          <button
            onClick={enterFullscreen}
            className="w-full bg-brand-blue hover:bg-brand-dark text-white font-medium py-3 px-6 rounded-md transition-all shadow-md active:scale-95"
          >
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    );
  }

  return null;
}
