import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, Award, Layers, Trophy, BookOpen, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleQuickJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode) {
      setError('Please enter a join code.');
      return;
    }
    if (joinCode.length !== 6) {
      setError('Code must be exactly 6 characters.');
      return;
    }
    navigate(`/join/${joinCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-microsoft-lightBlue/20 via-zinc-50 to-white">
      <div className="max-w-6xl mx-auto w-full space-y-14 sm:space-y-16 animate-fade-in">

        {/* ── Hero & Quick Join ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-4">

          {/* Left: Text */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 bg-microsoft-lightBlue text-microsoft-darkBlue px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-microsoft-blue animate-ping flex-shrink-0" />
              <span>Microsoft Student Club · Event Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              Real-Time Quiz &{' '}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue">
                Practice Arena
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-500 max-w-xl leading-relaxed">
              Join live-hosted quizzes, compete on real-time leaderboards, or practice
              at your own pace in our self-paced Practice Arena!
            </p>

            <div className="flex flex-col xs:flex-row flex-wrap gap-3 pt-1">
              <button
                onClick={() => navigate('/practice')}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-sm"
              >
                <Trophy size={17} />
                Enter Practice Arena
              </button>
              <button
                onClick={() => navigate('/admin/login')}
                className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold py-3 px-6 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all active:scale-95 shadow-sm cursor-pointer text-sm"
              >
                Organize Quiz (Admin)
              </button>
            </div>
          </div>

          {/* Right: Quick Join Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white border border-microsoft-border p-6 sm:p-8 rounded-2xl shadow-xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue" />

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-800">Quick Join Session</h3>
                <p className="text-xs text-zinc-400">Got an active event code? Join immediately below.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="joinCode" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    6-Digit Join Code
                  </label>
                  <input
                    id="joinCode"
                    type="text"
                    maxLength={6}
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    className="block w-full border border-zinc-200 rounded-lg bg-zinc-50 py-3 px-4 text-center font-bold text-xl tracking-widest text-zinc-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-semibold py-3.5 rounded-lg transition-all active:scale-95 shadow-md cursor-pointer text-sm"
                >
                  <span>Join Live Lobby</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Quiz Modes ── */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Choose Your Quiz Mode
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">
              Explore multiplayer live competition or test your skills at your own pace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Mode 1: Live Event */}
            <div className="bg-white border border-microsoft-border hover:border-microsoft-blue/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-3">
                <div className="w-11 h-11 bg-microsoft-lightBlue text-microsoft-blue rounded-xl flex items-center justify-center shadow-inner">
                  <Play size={20} fill="currentColor" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-microsoft-blue uppercase tracking-widest bg-microsoft-lightBlue px-2.5 py-0.5 rounded-full">
                    Multiplayer
                  </span>
                  <h3 className="text-base font-bold text-zinc-800 mt-1.5">Live Sync Events</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                    Compete in real-time. Questions are pushed instantly by the admin host with speed bonuses and anti-cheat protection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/join')}
                className="mt-5 w-full text-center border border-zinc-200 group-hover:border-microsoft-blue/50 group-hover:bg-microsoft-blue group-hover:text-white text-zinc-600 font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Join Event Lobby
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Mode 2: Practice Arena */}
            <div className="bg-white border border-microsoft-border hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-3">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Trophy size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Self-Paced
                  </span>
                  <h3 className="text-base font-bold text-zinc-800 mt-1.5">Practice Arena</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                    Solve quizzes at your own speed. Choose from Frontend, Algorithms, or Cloud tracks with detailed explanation scorecards.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/practice')}
                className="mt-5 w-full text-center border border-zinc-200 group-hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:text-white text-zinc-600 font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Start Practice Test
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Mode 3: Coming Soon */}
            <div className="bg-white border border-microsoft-border rounded-2xl p-5 sm:p-6 shadow-sm text-left flex flex-col justify-between opacity-75 select-none sm:col-span-2 lg:col-span-1">
              <div className="space-y-3">
                <div className="w-11 h-11 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shadow-inner">
                  <BookOpen size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest bg-purple-50 px-2.5 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                  <h3 className="text-base font-bold text-zinc-800 mt-1.5">Skill Challenges</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                    Unlock weekly competitive assignments, challenge topics, and downloadable tasks.
                  </p>
                </div>
              </div>
              <div className="mt-5 w-full text-center border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400 font-semibold py-2.5 rounded-lg text-xs">
                Available in Next Release
              </div>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-zinc-150 pt-10 sm:pt-12">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-microsoft-lightBlue text-microsoft-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Live Synchronization</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Questions appear instantly on all screens via WebSockets — no refresh needed.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Speed Scoring</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Correct answers earn base points. Faster answers earn an extra speed bonus.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-red-50 text-microsoft-error rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Anti-Cheat Controls</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tab monitoring, fullscreen lock, and focus tracking ensure competitive fairness.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
