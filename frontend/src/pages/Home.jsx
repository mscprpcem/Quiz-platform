import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, Award, Layers, Trophy, BookOpen, Clock, ArrowRight, Sparkles, Zap } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-60px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,120,212,0.06)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_rgba(16,124,65,0.04)_0%,_transparent_50%)] pointer-events-none"></div>
      
      {/* Decorative orbs */}
      <div className="absolute top-20 right-[15%] w-72 h-72 bg-microsoft-blue/[0.03] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-[10%] w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-20 animate-fade-in relative z-10">
        
        {/* Hero & Quick Join Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
          
          {/* Left: Text Contents */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center space-x-2 bg-microsoft-lightBlue/80 text-microsoft-darkBlue px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-microsoft-blue/10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-microsoft-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-microsoft-blue"></span>
              </span>
              <span>Microsoft Student Club Event Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.1]">
              Real-Time Quiz & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-microsoft-blue via-[#0091EA] to-microsoft-darkBlue">
                Practice Arena
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-500 max-w-xl leading-relaxed">
              Join club live-hosted quizzes, compete on real-time speed scoring leaderboards, or practice independently in our brand new self-paced Arena!
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => navigate('/practice')}
                className="group flex items-center space-x-2 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.97] cursor-pointer"
              >
                <Trophy size={18} />
                <span>Enter Practice Arena</span>
                <ArrowRight size={15} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
              </button>
              
              <button
                onClick={() => navigate('/admin/login')}
                className="flex items-center space-x-2 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-800 font-semibold py-3 px-6 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all duration-200 active:scale-[0.97] shadow-sm cursor-pointer"
              >
                <span>Organize Quiz (Admin)</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Join Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-zinc-200/80 p-8 rounded-2xl shadow-soft space-y-6 relative overflow-hidden group hover:shadow-soft-lg transition-shadow duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-microsoft-blue via-[#00a4ef] to-microsoft-darkBlue"></div>
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-zinc-800 tracking-tight">Quick Join Session</h3>
                <p className="text-sm text-zinc-400">Got an active event code? Join immediately below.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-semibold animate-fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                <div className="space-y-2">
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
                    className="block w-full border border-zinc-200 rounded-xl bg-zinc-50/80 py-3.5 px-4 text-center font-bold text-xl tracking-[0.25em] text-zinc-800 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-microsoft-blue/30 focus:border-microsoft-blue transition-all duration-200 placeholder:text-zinc-300 placeholder:tracking-[0.25em]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-b from-[#0A84FF] to-[#0068D6] hover:from-[#007AE6] hover:to-[#005FC0] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.97] shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Join Live Lobby</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quiz Categories / Modes Section */}
        <div className="space-y-8 text-center">
          <div className="space-y-2.5">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Choose Your Quiz Mode</h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto">Explore multiplayer active competition or test your skills offline at your own pace.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode 1: Live Event */}
            <div className="bg-white border border-zinc-200/80 hover:border-microsoft-blue/30 rounded-2xl p-6 shadow-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer" onClick={() => navigate('/join')}>
              <div className="space-y-4">
                <div className="w-11 h-11 bg-gradient-to-br from-microsoft-lightBlue to-blue-100 text-microsoft-blue rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Play size={20} fill="currentColor" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-microsoft-blue uppercase tracking-widest bg-microsoft-lightBlue px-2.5 py-0.5 rounded-full">Multiplayer</span>
                  <h3 className="text-lg font-bold text-zinc-800 group-hover:text-microsoft-blue transition-colors duration-200">Live Sync Events</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Compete live in real-time. Questions are pushed instantly by the admin host. Features speed bonuses and tab violations security.
                </p>
              </div>
              <div className="mt-6 w-full text-center border border-zinc-200/80 group-hover:border-microsoft-blue/30 group-hover:bg-gradient-to-b group-hover:from-[#0A84FF] group-hover:to-[#0068D6] group-hover:text-white text-zinc-500 font-semibold py-2.5 rounded-xl text-xs transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-sm">
                <span>Join Event Lobby</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            {/* Mode 2: Practice Arena */}
            <div className="bg-white border border-zinc-200/80 hover:border-emerald-400/40 rounded-2xl p-6 shadow-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer" onClick={() => navigate('/practice')}>
              <div className="space-y-4">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Trophy size={20} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full">Self-Paced</span>
                  <h3 className="text-lg font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors duration-200">Practice Arena</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Solve quizzes at your own speed. Choose between Frontend Mastery, Algorithms, or Cloud Infrastructure. Features explanation scorecards.
                </p>
              </div>
              <div className="mt-6 w-full text-center border border-zinc-200/80 group-hover:border-emerald-400/30 group-hover:bg-gradient-to-b group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white text-zinc-500 font-semibold py-2.5 rounded-xl text-xs transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-sm">
                <span>Start Practice Test</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            {/* Mode 3: Challenges */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm text-left flex flex-col justify-between select-none opacity-80">
              <div className="space-y-4">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-50 to-violet-100 text-purple-500 rounded-xl flex items-center justify-center shadow-inner">
                  <BookOpen size={20} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest bg-purple-50 px-2.5 py-0.5 rounded-full">Offline Challenges</span>
                  <h3 className="text-lg font-bold text-zinc-800">Skill Challenges</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Unlock weekly competitive assignments, challenge topics, and download assignments. 
                </p>
              </div>
              <div className="mt-6 w-full text-center border border-dashed border-zinc-200 bg-zinc-50/80 text-zinc-400 font-semibold py-2.5 rounded-xl text-xs">
                Coming Soon in Next Release
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-zinc-100 pt-12 pb-4">
          {/* Card 1 */}
          <div className="flex space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-microsoft-lightBlue to-blue-100 text-microsoft-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-200">
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
          <div className="flex space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-200">
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
          <div className="flex space-x-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-rose-100 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-200">
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
