import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Keyboard, User, School, Mail, ArrowRight, Zap } from 'lucide-react';
import './JoinQuiz.css';

const InputRow = ({ id, name, icon: Icon, label, required, type = 'text', placeholder, value, onChange, className = '' }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted/60 group-focus-within:text-brand-blue transition-colors duration-200">
        <Icon size={17} />
      </div>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        maxLength={name === 'joinCode' ? 6 : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-enhanced pl-10 ${className}`}
      />
    </div>
  </div>
);

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

  useEffect(() => {
    if (code) {
      setFormData((prev) => ({ ...prev, joinCode: code.toUpperCase() }));
    }
  }, [code]);

  useEffect(() => {
    if (!socket) return;

    socket.on('join_success', (data) => {
      setLoading(false);
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
    connectSocket();

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,_rgba(37,99,235,0.06)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_40%_at_75%_80%,_rgba(139,92,246,0.04)_0%,_transparent_55%)]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="form-card p-8 sm:p-9 rounded-2xl space-y-7 relative overflow-hidden">
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 w-full h-[3px] join-quiz-gradient"></div>

          {/* Title */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="inline-flex items-center space-x-1.5 bg-brand-lightBlue text-brand-blue text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              <Zap size={10} />
              <span>Live Session</span>
            </div>
            <h2 className="text-2xl font-extrabold text-brand-textMain tracking-tight">Join Live Quiz</h2>
            <p className="text-[13px] text-brand-textMuted">
              Enter your details and the event code to join the lobby.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-semibold animate-fade-in join-quiz-error-shadow">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <InputRow
                id="joinCode" name="joinCode" icon={Keyboard}
                label="Join Code" required placeholder="ABC123"
                value={formData.joinCode}
                onChange={handleChange}
                className="text-center font-bold uppercase tracking-[0.2em] text-lg"
              />
              <InputRow
                id="name" name="name" icon={User}
                label="Full Name" required placeholder="Amit Yadav"
                value={formData.name}
                onChange={handleChange}
              />
              <InputRow
                id="college" name="college" icon={School}
                label="College / Institution" required placeholder="PRPCEM"
                value={formData.college}
                onChange={handleChange}
              />
              <InputRow
                id="email" name="email" icon={Mail} type="email"
                label="Email Address (Optional)" required={false} placeholder="amit@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Joining Lobby...' : 'Join Quiz Lobby'}</span>
              {!loading && <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
