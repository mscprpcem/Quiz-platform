import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, Award, Layers, Trophy, BookOpen, Clock, ArrowRight } from 'lucide-react';

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
      <div className="max-w-6xl mx-auto space-y-16 animate-fade-in">
        
        {/* Hero & Quick Join Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
          
          {/* Left: Text Contents */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-microsoft-lightBlue text-microsoft-darkBlue px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-microsoft-blue animate-ping"></span>
              <span>Microsoft Student Club Event Hub</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              Real-Time Quiz & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue">
                Practice Arena
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-500 max-w-xl leading-relaxed">
              Join club live-hosted quizzes, compete on real-time speed scoring leaderboards, or practice independently in our brand new self-paced Arena!
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/practice')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 active:scale-98 cursor-pointer"
              >
                <Trophy size={18} />
                <span>Enter Practice Arena</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/login')}
                className="flex items-center space-x-2 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold py-3 px-6 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all duration-155 active:scale-98 shadow-sm cursor-pointer"
              >
                <span>Organize Quiz (Admin)</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Join Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-microsoft-border p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-microsoft-blue to-microsoft-darkBlue"></div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-zinc-800">Quick Join Session</h3>
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
                  className="w-full flex items-center justify-center space-x-2 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-semibold py-3.5 rounded-lg transition-all active:scale-98 shadow-md cursor-pointer"
                >
                  <span>Join Live Lobby</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quiz Categories / Modes Section */}
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Choose Your Quiz Mode</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">Explore multiplayer active competition or test your skills offline at your own pace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mode 1: Live Event */}
            <div className="bg-white border border-microsoft-border hover:border-microsoft-blue/40 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-microsoft-lightBlue text-microsoft-blue rounded-xl flex items-center justify-center shadow-inner">
                  <Play size={22} fill="currentColor" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-microsoft-blue uppercase tracking-widest bg-microsoft-lightBlue px-2.5 py-0.5 rounded-full">Multiplayer</span>
                  <h3 className="text-lg font-bold text-zinc-800">Live Sync Events</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Compete live in real-time. Questions are pushed instantly by the admin host. Features speed bonuses and tab violations security.
                </p>
              </div>
              <button
                onClick={() => navigate('/join')}
                className="mt-6 w-full text-center border border-zinc-200 group-hover:border-microsoft-blue/50 group-hover:bg-microsoft-blue group-hover:text-white text-zinc-600 font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Join Event Lobby</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Mode 2: Practice Arena */}
            <div className="bg-white border border-microsoft-border hover:border-emerald-500/40 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Trophy size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full">Self-Paced</span>
                  <h3 className="text-lg font-bold text-zinc-800">Practice Arena</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Solve quizzes at your own speed. Choose between Frontend Mastery, Algorithms, or Cloud Infrastructure. Features explanation scorecards.
                </p>
              </div>
              <button
                onClick={() => navigate('/practice')}
                className="mt-6 w-full text-center border border-zinc-200 group-hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:text-white text-zinc-600 font-semibold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Start Practice Test</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Mode 3: Challenges */}
            <div className="bg-white border border-microsoft-border opacity-90 rounded-2xl p-6 shadow-sm text-left flex flex-col justify-between select-none">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                  <BookOpen size={22} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-0.5 rounded-full">Offline Challenges</span>
                  <h3 className="text-lg font-bold text-zinc-800">Skill Challenges</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Unlock weekly competitive assignments, challenge topics, and download assignments. 
                </p>
              </div>
              <div className="mt-6 w-full text-center border border-dashed border-zinc-250 bg-zinc-50 text-zinc-400 font-semibold py-2.5 rounded-lg text-xs">
                Coming Soon in Next Release
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-zinc-150 pt-12">
          {/* Card 1 */}
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-microsoft-lightBlue text-microsoft-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Live Synchronization</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Questions are released by the host and appear instantly on all screens via WebSockets.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Speed Scoring</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Correct answers earn base points. Answering faster rewards you with an extra decaying speed bonus.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-red-50 text-microsoft-error rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-800 mb-1">Anti-Cheat Controls</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Browser focus monitoring, tab switch limits, and fullscreen locks help ensure competitive integrity.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
