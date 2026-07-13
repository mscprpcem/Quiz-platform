import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Keyboard, User, School, Mail, ArrowRight } from 'lucide-react';

export default function JoinQuiz() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, connectSocket } = useSocket();

  const [formData, setFormData] = useState({
    joinCode: code ? code.toUpperCase() : '',
    name: '',
    college: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Re-fill code if present in URL
  useEffect(() => {
    if (code) {
      setFormData((prev) => ({ ...prev, joinCode: code.toUpperCase() }));
    }
  }, [code]);

  useEffect(() => {
    if (!socket) return;

    // Handle join success
    socket.on('join_success', (data) => {
      setLoading(false);
      // Save session details to sessionStorage for persistence on page refresh
      sessionStorage.setItem('msc_participant_id', data.participantId);
      sessionStorage.setItem('msc_quiz_id', data.quizId);
      sessionStorage.setItem('msc_quiz_title', data.title);
      sessionStorage.setItem('msc_event_name', data.eventName);
      sessionStorage.setItem('msc_scheduled_start', data.scheduledStart || '');
      sessionStorage.setItem('msc_participant_name', data.name);
      sessionStorage.setItem('msc_participant_college', data.college);
      sessionStorage.setItem('msc_participant_email', data.email || '');
      sessionStorage.setItem('msc_join_code', data.joinCode);

      navigate('/waiting-room', {
        state: {
          participantId: data.participantId,
          quizId: data.quizId,
          title: data.title,
          eventName: data.eventName,
          quizStatus: data.quizStatus,
          currentQuestionIndex: data.currentQuestionIndex,
          currentQuestionStatus: data.currentQuestionStatus,
          scheduledStart: data.scheduledStart
        }
      });
    });

    // Handle join error
    socket.on('join_error', (data) => {
      setLoading(false);
      setError(data.message);
    });

    return () => {
      socket.off('join_success');
      socket.off('join_error');
    };
  }, [socket, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'joinCode' ? value.toUpperCase() : value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { joinCode, name, college, email } = formData;

    if (!joinCode || !name || !college) {
      setError('Please fill in all required fields.');
      return;
    }

    if (joinCode.length !== 6) {
      setError('Join code must be exactly 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    // Ensure socket is connected before sending join event
    connectSocket();

    // Small delay to ensure connection state is synchronized
    setTimeout(() => {
      if (socket) {
        socket.emit('join_quiz', { name, college, email, joinCode });
      } else {
        setLoading(false);
        setError('Connection issues. Please try again.');
      }
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-microsoft-lightBlue/20 via-zinc-50 to-white">
      <div className="max-w-md w-full bg-white border border-microsoft-border p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden group animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue"></div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-zinc-850 tracking-tight">Join Live Quiz</h2>
          <p className="text-xs text-zinc-400">
            Enter your details and the event code to join the lobby.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Join Code */}
            <div className="space-y-1.5">
              <label htmlFor="joinCode" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Join Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Keyboard size={18} />
                </div>
                <input
                  id="joinCode"
                  name="joinCode"
                  type="text"
                  required
                  maxLength={6}
                  value={formData.joinCode}
                  onChange={handleChange}
                  placeholder="ABC123"
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-800 placeholder-zinc-400 font-bold uppercase tracking-widest text-center text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Amit Sharma"
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-850 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* College Name */}
            <div className="space-y-1.5">
              <label htmlFor="college" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                College / Institution <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <School size={18} />
                </div>
                <input
                  id="college"
                  name="college"
                  type="text"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="PCEM"
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-850 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Email Address <span className="text-zinc-400">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="amit@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-lg bg-zinc-50/50 text-zinc-850 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue hover:brightness-105 disabled:bg-zinc-450 text-white font-bold py-3.5 rounded-lg transition-all active:scale-98 shadow-md cursor-pointer"
          >
            <span>{loading ? 'Joining Lobby...' : 'Join Quiz Lobby'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
