import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, Clock, Home, RotateCcw } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="max-w-md w-full space-y-8 bg-white border border-microsoft-border p-8 rounded-xl shadow-sm animate-fade-in text-center">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-microsoft-lightBlue text-microsoft-blue rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Award size={32} />
          </div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{stats.eventName}</span>
          <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight leading-tight">{stats.title}</h1>
        </div>

        {/* Rank Card */}
        <div className="bg-gradient-to-br from-microsoft-lightBlue/50 to-zinc-50 border border-microsoft-border p-8 rounded-xl space-y-2 relative overflow-hidden shadow-inner">
          {/* Decorative Background Grid */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          <div className="text-5xl mb-2 relative z-10">{getRankBadge(stats.rank)}</div>
          <span className="text-xs font-bold text-microsoft-darkBlue uppercase tracking-widest relative z-10">Final Placement</span>
          <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight relative z-10">
            Rank #{stats.rank} <span className="text-lg font-medium text-zinc-500">/ {stats.totalParticipants}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Score */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border flex flex-col items-center">
            <Award className="text-microsoft-blue mb-1" size={18} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Score</span>
            <span className="text-lg font-extrabold text-zinc-800 mt-1">{stats.score}</span>
          </div>

          {/* Correct count */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border flex flex-col items-center">
            <CheckCircle className="text-microsoft-success mb-1" size={18} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Correct</span>
            <span className="text-lg font-extrabold text-zinc-800 mt-1">{stats.correctAnswers}</span>
          </div>

          {/* Speed */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-microsoft-border flex flex-col items-center">
            <Clock className="text-zinc-500 mb-1" size={18} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Avg Speed</span>
            <span className="text-lg font-extrabold text-zinc-800 mt-1">{stats.avgResponseTime}s</span>
          </div>
        </div>

        {/* Participation mock certificate or note */}
        <p className="text-xs text-zinc-400 leading-normal max-w-xs mx-auto">
          Thank you for participating! Results have been recorded for the Microsoft Student Club leaderboards.
        </p>

        {/* Go home buttons */}
        <button
          onClick={handleReturnHome}
          className="w-full flex items-center justify-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-semibold py-3.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Home size={18} />
          <span>Return to Homepage</span>
        </button>
      </div>
    </div>
  );
}
