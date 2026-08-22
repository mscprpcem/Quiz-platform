import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Keyboard, User, School, Mail, ArrowRight, Zap, QrCode, X } from 'lucide-react';
import api from '../services/api';
import QRScanner from '../components/QRScanner';
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
        maxLength={name === 'joinCode' ? 30 : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-enhanced ${className.includes('text-center') ? 'px-10' : 'pl-10'} ${className}`}
      />
    </div>
  </div>
);

export default function JoinQuiz() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, connectSocket } = useSocket();

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('msc_saved_form_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          joinCode: code || (parsed.joinCode || ''),
          name: parsed.name || '',
          college: parsed.college || '',
          email: parsed.email || ''
        };
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    return {
      joinCode: code || '',
      name: '',
      college: '',
      email: ''
    };
  });
  const [error, setError] = useState('');
  const [regEventSlug, setRegEventSlug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    if (code) {
      setFormData((prev) => {
        const updated = { ...prev, joinCode: code };
        localStorage.setItem('msc_saved_form_data', JSON.stringify(updated));
        return updated;
      });
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
      if (data.requireRegistration && data.eventSlug) {
        setRegEventSlug(data.eventSlug);
      } else {
        setRegEventSlug(null);
      }
    });

    return () => {
      socket.off('join_success');
      socket.off('join_error');
    };
  }, [socket, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'joinCode') {
      // If user pasted a full URL (e.g. https://mscprpcem.tech/q/visionXS2 or /visionXS2)
      if (value.includes('/q/')) {
        val = value.split('/q/')[1].split('/')[0].split('?')[0];
      } else if (value.startsWith('http://') || value.startsWith('https://')) {
        const parts = value.split('/').filter(Boolean);
        val = parts[parts.length - 1].split('?')[0];
      }
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      localStorage.setItem('msc_saved_form_data', JSON.stringify(updated));
      return updated;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { joinCode, name, college, email } = formData;

    if (!joinCode || !name || !college || !email) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanCode = joinCode.trim();
    if (cleanCode.length < 3 || cleanCode.length > 30) {
      setError('Join code or link slug must be between 3 and 30 characters.');
      return;
    }

    setLoading(true);
    setError('');

    // Save student details to localStorage for scheduled quiz pre-fill
    localStorage.setItem('msc_student_name', name);
    localStorage.setItem('msc_student_email', email);
    localStorage.setItem('msc_participant_name', name);
    localStorage.setItem('msc_participant_email', email);

    // 1. Try resolving as a Scheduled Quiz or Vanity Slug (/visionXS2)
    try {
      const slugRes = await api.get(`/api/scheduled-quizzes/slug/${cleanCode}`);
      if (slugRes.data?.quiz) {
        const slugName = slugRes.data.quiz.custom_slug || slugRes.data.quiz.join_code || cleanCode;
        setLoading(false);
        navigate(`/q/${slugName}`);
        return;
      }
    } catch (err) {
      // Not a scheduled quiz slug; continue to live socket join below
    }

    // 2. Fallback to Live Quiz Socket Lobby Join
    connectSocket();

    setTimeout(() => {
      if (socket) {
        socket.emit('join_quiz', { name, college, email, joinCode: cleanCode.toUpperCase() });
      } else {
        setLoading(false);
        setError('Connection issues. Please try again.');
      }
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,_rgba(37,99,235,0.06)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_40%_at_75%_80%,_rgba(139,92,246,0.04)_0%,_transparent_55%)]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="form-card p-5 sm:p-9 rounded-2xl space-y-6 sm:space-y-7 relative overflow-hidden">
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 w-full h-[3px] join-quiz-gradient"></div>

          {/* Title */}
          <div className="text-center space-y-1.5 pt-1">
            <div className="inline-flex items-center space-x-1.5 bg-brand-lightBlue text-brand-blue text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
              <Zap size={10} />
              <span>Event Session</span>
            </div>
            <h2 className="text-2xl font-extrabold text-brand-textMain tracking-tight">Join Quiz</h2>
            <p className="text-[13px] text-brand-textMuted">
              Enter your details and the event code to join the lobby.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold animate-fade-in join-quiz-error-shadow space-y-2">
              <div>{error}</div>
              {regEventSlug && (
                <div className="pt-1">
                  <a
                    href={`/events/${regEventSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Register for Event Now</span>
                    <ArrowRight size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <InputRow
                  id="joinCode" name="joinCode" icon={Keyboard}
                  label="Join Code" required placeholder="ABC123"
                  value={formData.joinCode}
                  onChange={handleChange}
                  className="text-center font-bold uppercase tracking-[0.2em] text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="mt-2 w-full py-2 bg-brand-lightBlue/60 hover:bg-brand-lightBlue text-brand-blue border border-brand-blue/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                >
                  <QrCode size={14} />
                  <span>Scan QR Code or Upload Image</span>
                </button>
              </div>
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
                label="Email Address" required={true} placeholder="student@example.com"
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

      {/* QR Scanner Modal Overlay */}
      {showScannerModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowScannerModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div className="flex items-center space-x-2 text-brand-textMain">
                <QrCode size={18} className="text-brand-blue" />
                <h3 className="font-extrabold text-sm sm:text-base">Scan QR Code or Upload Image</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <QRScanner
              onScanSuccess={(scannedCode) => {
                setFormData((prev) => {
                  const updated = { ...prev, joinCode: scannedCode };
                  localStorage.setItem('msc_saved_form_data', JSON.stringify(updated));
                  return updated;
                });
                setShowScannerModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
