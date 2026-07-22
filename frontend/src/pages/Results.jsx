import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, Clock, Home, ExternalLink } from 'lucide-react';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve results stats
  const stats = location.state || {
    title: sessionStorage.getItem('msc_quiz_title') || 'Quiz Session',
    eventName: sessionStorage.getItem('msc_event_name') || 'MSC Event',
    rank: 1,
    totalParticipants: 1,
    score: 0,
    correctAnswers: 0,
    avgResponseTime: 0
  };

  const handleReturnHome = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Determine medal display
  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎖️';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8" style={{ backgroundColor: '#F5FAFF' }}>
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white border border-brand-border p-5 sm:p-8 rounded-xl shadow-soft animate-fade-in text-center">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-lightBlue text-brand-blue rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
            <Award size={28} className="sm:w-8 sm:h-8" />
          </div>
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-widest">{stats.eventName}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-textMain tracking-tight leading-tight">{stats.title}</h1>
        </div>

        {/* Rank Card */}
        <div className="bg-gradient-to-br from-brand-lightBlue/50 to-brand-bgLight border border-brand-border p-5 sm:p-8 rounded-xl space-y-2 relative overflow-hidden shadow-inner">
          {/* Decorative Background Grid */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          <div className="text-4xl sm:text-5xl mb-1.5 relative z-10">{getRankBadge(stats.rank)}</div>
          <span className="text-xs font-bold text-brand-dark uppercase tracking-widest relative z-10">Final Placement</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-textMain tracking-tight relative z-10">
            Rank #{stats.rank} <span className="text-base sm:text-lg font-medium text-brand-textMuted">/ {stats.totalParticipants}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Score */}
          <div className="bg-brand-bgLight p-2.5 sm:p-4 rounded-lg border border-brand-border flex flex-col items-center">
            <Award className="text-brand-blue mb-1" size={16} />
            <span className="text-[9px] sm:text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Score</span>
            <span className="text-sm sm:text-lg font-extrabold text-brand-textMain mt-0.5">{stats.score}</span>
          </div>

          {/* Correct count */}
          <div className="bg-brand-bgLight p-2.5 sm:p-4 rounded-lg border border-brand-border flex flex-col items-center">
            <CheckCircle className="text-brand-success mb-1" size={16} />
            <span className="text-[9px] sm:text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Correct</span>
            <span className="text-sm sm:text-lg font-extrabold text-brand-textMain mt-0.5">{stats.correctAnswers}</span>
          </div>

          {/* Speed */}
          <div className="bg-brand-bgLight p-2.5 sm:p-4 rounded-lg border border-brand-border flex flex-col items-center">
            <Clock className="text-brand-textMuted mb-1" size={16} />
            <span className="text-[9px] sm:text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Speed</span>
            <span className="text-sm sm:text-lg font-extrabold text-brand-textMain mt-0.5">{stats.avgResponseTime}s</span>
          </div>
        </div>

        {/* Certificate of Participation Banner */}
        <div className="bg-emerald-50/90 border border-emerald-200/80 p-4 rounded-xl text-center space-y-2.5 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
            <Award size={16} className="text-emerald-600" />
            <span>Certificate of Participation</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium leading-relaxed">
            Certificates are issued to your registered email. Visit the official verification portal to claim and verify your certificate.
          </p>
          <a
            href={import.meta.env.VITE_VERIFICATION_URL || 'https://verify.mscprpcem.tech'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <span>Claim & Verify Certificate</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Go home buttons */}
        <button
          onClick={handleReturnHome}
          className="w-full flex items-center justify-center space-x-2 text-white font-semibold py-3.5 rounded-lg shadow-sm hover:shadow-glow-blue transition-all active:scale-98 cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, #2563EB, #1E3A8A)' }}
        >
          <Home size={18} />
          <span>Return to Homepage</span>
        </button>
      </div>
    </div>
  );
}
