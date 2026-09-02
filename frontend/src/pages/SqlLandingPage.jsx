import React from 'react';
import { BookOpen, Target, ArrowRight, Filter, TrendingUp, Trophy, BookMarked, Map } from 'lucide-react';

export default function SqlLandingPage({
  onSelectMode,
  completedTopicsCount = 0,
  solvedChallengesCount = 0
}) {
  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 font-segoe text-slate-800 flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-emerald-50/20 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* =========================================================================
          HERO SECTION & CTA CARDS
         ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 flex flex-col items-center">
        
        {/* TOP ROADMAP PILL BUTTON */}
        <div className="mb-3 relative z-10">
          <button
            type="button"
            onClick={() => onSelectMode('roadmap')}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-50/90 hover:bg-blue-100/90 text-blue-700 border border-blue-200/80 shadow-2xs text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <Map size={13} className="text-blue-600 group-hover:rotate-6 transition-transform" />
            <span>30-Day Guided SQL Roadmap</span>
            <ArrowRight size={13} className="text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* HERO TITLE WRAPPER WITH CLEAN 2D VECTOR ASSETS */}
        <div className="w-full relative flex items-center justify-center min-h-[150px]">
          
          {/* LEFT FLANKING GRAPHIC: 2D MAC CODE SNIPPET (VISIBLE ON XL+) */}
          <div className="hidden xl:block absolute left-2 lg:left-8 top-1 select-none pointer-events-none transition-transform hover:scale-105 duration-300">
            <span className="absolute -top-3 left-12 text-blue-400 font-black text-base opacity-70 animate-pulse">+</span>
            <span className="absolute top-20 -left-4 text-blue-300 font-bold text-xs opacity-50">+</span>
            <div className="absolute -bottom-3 left-6 w-2 h-2 rounded-full border border-blue-300 opacity-60" />

            <div className="w-60 lg:w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 space-y-2.5 transform -rotate-1">
              <div className="flex items-center space-x-1.5 pb-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>

              <div className="font-mono text-[11px] space-y-1 text-slate-800 leading-relaxed">
                <div>
                  <span className="text-blue-600 font-black">SELECT</span> <span className="text-slate-600 font-bold">*</span>
                </div>
                <div>
                  <span className="text-blue-600 font-black">FROM</span> <span className="text-slate-700 font-bold">users</span>
                </div>
                <div>
                  <span className="text-blue-600 font-black">WHERE</span> <span className="text-slate-700">salary</span> <span className="text-slate-500">&gt;</span> <span className="text-amber-500 font-black">50000</span>
                </div>
                <div>
                  <span className="text-blue-600 font-black">ORDER BY</span> <span className="text-slate-700">salary</span> <span className="text-slate-700 font-black">DESC;</span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER HERO TEXT */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5 relative z-10 px-2">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-tight">
              Master <span className="text-blue-600">SQL</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-600 tracking-tight">
              From Basics to Advanced Interview Queries
            </p>

            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xl mx-auto">
              Learn SQL step by step or practice with a wide range of questions.
              Build strong skills, solve real-world problems and crack your next interview.
            </p>
          </div>

          {/* RIGHT FLANKING GRAPHIC: CLEAN 2D FLAT VECTOR DATABASE & BADGES (100% SEAMLESS BLEND) */}
          <div className="hidden xl:block absolute right-2 lg:right-8 -top-1 select-none pointer-events-none transition-transform hover:scale-105 duration-300">
            <div className="relative w-56 h-48 flex items-center justify-center">
              
              {/* Dashed Orbit & Sparkle Vector Accents */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 220 190" fill="none">
                <ellipse cx="110" cy="95" rx="85" ry="50" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.55" transform="rotate(-10 110 95)" />
                <path d="M190 35v10M185 40h10" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                <path d="M25 130v8M21 134h8" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <circle cx="200" cy="110" r="2.5" fill="#3B82F6" opacity="0.5" />
                <circle cx="20" cy="55" r="2" fill="#60A5FA" opacity="0.5" />
              </svg>

              {/* 2D Flat Vector Database Discs */}
              <div className="relative z-10 filter drop-shadow-[0_8px_20px_rgba(37,99,235,0.12)]">
                <svg className="w-28 h-32" viewBox="0 0 110 120" fill="none">
                  {/* Top Disc */}
                  <path d="M12 24v16c0 8.5 19 15 43 15s43-6.5 43-15V24" fill="url(#db2dGrad1)" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="24" rx="43" ry="15" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="23.5" rx="35" ry="11" fill="#DBEAFE" />
                  <ellipse cx="55" cy="23" rx="26" ry="8" fill="#2563EB" />

                  {/* Middle Disc */}
                  <path d="M12 52v18c0 8.5 19 15 43 15s43-6.5 43-15V52" fill="url(#db2dGrad2)" stroke="#2563EB" strokeWidth="1.5" />
                  <ellipse cx="55" cy="52" rx="43" ry="14" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="51.5" rx="34" ry="10" fill="#93C5FD" opacity="0.5" />

                  {/* Bottom Disc */}
                  <path d="M12 80v20c0 9 19 16 43 16s43-7 43-16V80" fill="url(#db2dGrad3)" stroke="#1D4ED8" strokeWidth="1.5" />
                  <ellipse cx="55" cy="80" rx="43" ry="14" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />

                  <defs>
                    <linearGradient id="db2dGrad1" x1="12" y1="24" x2="98" y2="48" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EFF6FF" />
                      <stop offset="0.5" stopColor="#DBEAFE" />
                      <stop offset="1" stopColor="#BFDBFE" />
                    </linearGradient>
                    <linearGradient id="db2dGrad2" x1="12" y1="52" x2="98" y2="76" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#DBEAFE" />
                      <stop offset="0.5" stopColor="#BFDBFE" />
                      <stop offset="1" stopColor="#93C5FD" />
                    </linearGradient>
                    <linearGradient id="db2dGrad3" x1="12" y1="80" x2="98" y2="106" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#BFDBFE" />
                      <stop offset="0.5" stopColor="#93C5FD" />
                      <stop offset="1" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Floating 2D Badge 1: Bar Chart (Top Left) */}
              <div className="absolute top-1 left-0 bg-white/95 backdrop-blur-md rounded-xl p-2 border border-blue-200/90 shadow-[0_4px_16px_rgba(37,99,235,0.12)] z-20 transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="w-5 h-5 flex items-end justify-between space-x-0.5 px-0.5 pb-0.5">
                  <div className="w-1.5 h-2.5 bg-blue-400 rounded-xs" />
                  <div className="w-1.5 h-3.5 bg-blue-500 rounded-xs" />
                  <div className="w-1.5 h-5 bg-blue-600 rounded-xs" />
                </div>
              </div>

              {/* Floating 2D Badge 2: Code Brackets (Top Right) */}
              <div className="absolute top-3 -right-2 bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-indigo-200/90 shadow-[0_4px_16px_rgba(99,102,241,0.12)] z-20 transform rotate-3 hover:rotate-0 transition-transform">
                <span className="font-mono text-indigo-600 font-black text-xs">{`{ }`}</span>
              </div>

              {/* Floating 2D Badge 3: Data Table Grid (Bottom Right) */}
              <div className="absolute -bottom-1 right-0 bg-white/95 backdrop-blur-md rounded-xl p-2 border border-blue-200/90 shadow-[0_4px_16px_rgba(37,99,235,0.12)] z-20 transform -rotate-2 hover:rotate-0 transition-transform">
                <div className="w-7 h-5 border border-blue-200 rounded-xs grid grid-cols-2 divide-x divide-blue-200 bg-blue-50/50">
                  <div className="divide-y divide-blue-100 flex flex-col justify-around px-0.5">
                    <div className="w-full h-1 bg-blue-500 rounded-xs" />
                    <div className="w-full h-1 bg-blue-300 rounded-xs" />
                  </div>
                  <div className="divide-y divide-blue-100 flex flex-col justify-around px-0.5">
                    <div className="w-full h-1 bg-blue-500 rounded-xs" />
                    <div className="w-full h-1 bg-blue-300 rounded-xs" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* =========================================================================
            TWO MAIN CALL-TO-ACTION CARDS
           ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto mt-8 sm:mt-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            
            {/* CARD 1: LEARNING */}
            <div
              onClick={() => onSelectMode('learn')}
              className="group bg-white hover:bg-gradient-to-b hover:from-blue-50/40 hover:to-white border-2 border-blue-100/90 hover:border-blue-400 rounded-3xl p-7 sm:p-9 flex flex-col items-center text-center shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 mb-5 group-hover:scale-105 transition-transform duration-300">
                <BookOpen size={34} strokeWidth={2.2} className="text-white" />
              </div>

              <h2 className="text-2xl sm:text-[26px] font-black text-blue-600 tracking-tight mb-2.5">
                Learning
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mb-7 max-w-[280px]">
                Learn SQL concepts step by step with clear explanations, syntax, examples and sample queries.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('learn');
                }}
                className="w-full max-w-[220px] py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all cursor-pointer mt-auto"
              >
                <span>Start Learning</span>
                <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* CARD 2: PRACTICE */}
            <div
              onClick={() => onSelectMode('practice')}
              className="group bg-white hover:bg-gradient-to-b hover:from-emerald-50/40 hover:to-white border-2 border-emerald-100/90 hover:border-emerald-400 rounded-3xl p-7 sm:p-9 flex flex-col items-center text-center shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 mb-5 group-hover:scale-105 transition-transform duration-300">
                <Target size={34} strokeWidth={2.2} className="text-white" />
              </div>

              <h2 className="text-2xl sm:text-[26px] font-black text-emerald-600 tracking-tight mb-2.5">
                Practice
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed mb-7 max-w-[280px]">
                Practice SQL questions and challenges with powerful filters and track your progress.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('practice');
                }}
                className="w-full max-w-[220px] py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/35 transition-all cursor-pointer mt-auto"
              >
                <span>Start Practice</span>
                <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

        {/* =========================================================================
            BOTTOM HIGHLIGHTS BAR
           ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto mt-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Feature 1 */}
            <div className="flex items-center space-x-3 pt-1 sm:pt-0 sm:px-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                <BookMarked size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Learn at Your Pace
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                  Beginner to Advanced
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-3 pt-3 sm:pt-0 sm:px-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shrink-0">
                <Filter size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Smart Practice
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                  Filter by topic, type, difficulty
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-3 pt-3 sm:pt-0 sm:px-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 border border-amber-100/80 flex items-center justify-center shrink-0">
                <TrendingUp size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Track Progress
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                  Monitor your improvement
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center space-x-3 pt-3 sm:pt-0 sm:px-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0">
                <Trophy size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Crack Interviews
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                  Prepare and get confident
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

    </div>
  );
}
