import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, BookOpen, ArrowRight, Sparkles, Zap, ChevronRight } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-60px)] flex flex-col justify-center py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* ── Rich ambient background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_70%_50%_at_15%_15%,_rgba(37,99,235,0.07)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_45%_at_85%_85%,_rgba(139,92,246,0.05)_0%,_transparent_55%)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_40%_35%_at_50%_50%,_rgba(14,165,233,0.03)_0%,_transparent_60%)]"></div>
      </div>
      
      {/* Floating orbs */}
      <div className="absolute top-12 right-[10%] w-72 h-72 bg-brand-blue/[0.04] rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute bottom-16 left-[6%] w-80 h-80 bg-brand-purple/[0.035] rounded-full blur-3xl pointer-events-none" style={{ animation: 'float 4s ease-in-out infinite 1s' }}></div>
      <div className="absolute top-1/4 right-[40%] w-48 h-48 bg-brand-cyan/[0.03] rounded-full blur-3xl pointer-events-none" style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}></div>

      <div className="max-w-6xl mx-auto w-full space-y-20 sm:space-y-24 animate-fade-in relative z-10">
        
        {/* ════════ HERO & QUICK JOIN ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left: Hero */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Event badge */}
            <div className="inline-flex items-center space-x-2.5 bg-white/70 backdrop-blur-md text-brand-dark px-4 py-2 rounded-full text-xs font-semibold border border-brand-blue/10"
                 style={{ boxShadow: '0 1px 8px rgba(37,99,235,0.06)' }}>
              
              <span className="tracking-wide">MSC-PRPCEM Event Hub</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold text-brand-textMain tracking-tight leading-[1.08]">
              Real-Time Quiz &{' '}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 45%, #8B5CF6 100%)' }}>
                Practice Arena
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-brand-textMuted max-w-lg leading-relaxed">
              Join live-hosted quizzes, compete on real-time leaderboards, or sharpen your skills at your own pace. Built for MSC-PRPCEM events.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col xs:flex-row flex-wrap gap-3.5 pt-1">
              <button
                onClick={() => navigate('/join')}
                className="btn-primary py-3.5 px-8 rounded-xl text-[15px] group"
              >
                <Play size={18} fill="white" className="group-hover:scale-110 transition-transform" />
                <span>Join Live Quiz</span>
              </button>
              <button
                onClick={() => navigate('/admin/login')}
                className="btn-secondary py-3.5 px-8 rounded-xl text-[15px] group"
              >
                <span>Admin Portal</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right: Quick Join Card */}
          <div className="lg:col-span-5 w-full">
            <div className="form-card p-7 sm:p-8 rounded-2xl space-y-6 relative overflow-hidden group hover:shadow-glow-blue transition-all duration-500">
              {/* Accent stripe */}
              <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: 'linear-gradient(90deg, #2563EB 0%, #0EA5E9 50%, #8B5CF6 100%)' }}></div>
              
              {/* Quick Join badge */}
              <div className="absolute -right-0.5 top-5">
                <div className="bg-brand-lightBlue text-brand-blue text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-l-full border border-brand-blue/10"
                     style={{ boxShadow: '0 2px 6px rgba(37,99,235,0.08)' }}>
                  <Zap size={10} className="inline mr-1" />
                  Quick Join
                </div>
              </div>
              
              <div className="space-y-1.5 pt-3">
                <h3 className="text-lg sm:text-xl font-bold text-brand-textMain tracking-tight">Join a Session</h3>
                <p className="text-[13px] text-brand-textMuted">Got an active event code? Enter below to jump in.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-semibold animate-fade-in"
                     style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.06)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleQuickJoinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="joinCode" className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
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
                    className="block w-full border rounded-xl py-4 px-4 text-center font-bold text-xl tracking-[0.35em] text-brand-textMain uppercase transition-all duration-200 placeholder:text-blue-200/70 placeholder:tracking-[0.35em]"
                    style={{
                      backgroundColor: 'rgba(248,251,255,0.8)',
                      borderColor: 'rgba(229,240,255,0.9)',
                      boxShadow: 'inset 0 2px 4px rgba(15,23,42,0.02), 0 1px 2px rgba(15,23,42,0.03)'
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = '#fff';
                      e.target.style.borderColor = '#2563EB';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12), inset 0 1px 2px rgba(15,23,42,0.02)';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(248,251,255,0.8)';
                      e.target.style.borderColor = 'rgba(229,240,255,0.9)';
                      e.target.style.boxShadow = 'inset 0 2px 4px rgba(15,23,42,0.02), 0 1px 2px rgba(15,23,42,0.03)';
                    }}
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 rounded-xl text-sm group">
                  <span>Enter Quiz</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ════════ QUIZ MODES ════════ */}
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm text-brand-blue px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-blue/8"
                 style={{ boxShadow: '0 1px 6px rgba(37,99,235,0.06)' }}>
              <Sparkles size={12} />
              <span>Explore Modes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-textMain tracking-tight">Choose Your Quiz Mode</h2>
            <p className="text-brand-textMuted text-sm max-w-md mx-auto">Multiplayer competition or self-paced practice — pick your challenge.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Mode 1: Live Event */}
            <div className="glass-card rounded-2xl p-6 hover:shadow-glow-blue transition-all duration-400 flex flex-col justify-between text-left group relative overflow-hidden cursor-pointer"
                 onClick={() => navigate('/join')}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-brand-blue group-hover:scale-110 transition-transform duration-300"
                       style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}>
                    <Play size={22} fill="currentColor" />
                  </div>
                  <span className="text-[9px] font-bold text-brand-blue uppercase tracking-widest bg-brand-lightBlue px-3 py-1 rounded-full border border-brand-blue/5">Multiplayer</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-brand-textMain group-hover:text-brand-blue transition-colors duration-300">Live Sync Events</h3>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    Compete in real-time with speed bonuses and live leaderboards. Questions are pushed instantly by the host.
                  </p>
                </div>
              </div>
              <div className="mt-6 w-full text-center text-brand-blue font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 relative z-10 group-hover:gap-2.5 transition-all duration-300">
                Join Event Lobby
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            {/* Mode 2: Practice Arena */}
            <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between opacity-75 select-none relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-emerald-600"
                       style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' }}>
                    <Trophy size={22} />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Coming Soon</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-brand-textMain">Practice Arena</h3>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    Solve quizzes at your own speed across Frontend, Algorithms, or Cloud tracks with detailed scorecards.
                  </p>
                </div>
              </div>
              <div className="mt-6 w-full text-center border border-dashed border-brand-border bg-brand-bgLight/50 text-brand-textMuted font-semibold py-2.5 rounded-xl text-xs">
                Available in Next Release
              </div>
            </div>

            {/* Mode 3: Challenges */}
            <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between opacity-75 select-none sm:col-span-2 lg:col-span-1 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-brand-purple"
                       style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' }}>
                    <BookOpen size={22} />
                  </div>
                  <span className="text-[9px] font-bold text-brand-purple uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100">Coming Soon</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-brand-textMain">Skill Challenges</h3>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    Unlock weekly competitive assignments, challenge topics, and downloadable tasks.
                  </p>
                </div>
              </div>
              <div className="mt-6 w-full text-center border border-dashed border-brand-border bg-brand-bgLight/50 text-brand-textMuted font-semibold py-2.5 rounded-xl text-xs">
                Available in Next Release
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
