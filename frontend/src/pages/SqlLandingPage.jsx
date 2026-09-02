import React from 'react';
import {
  BookOpen, Target, ArrowRight, Filter, TrendingUp, Trophy, BookMarked,
  Briefcase, FileCode2, Building2, Timer, Map
} from 'lucide-react';

export default function SqlLandingPage({
  onSelectMode,
  completedTopicsCount = 0,
  solvedChallengesCount = 0
}) {
  return (
    <div className="w-full min-h-screen bg-slate-50/60 font-segoe text-slate-800 flex flex-col pb-20">
      
      {/* =========================================================================
          HERO SECTION & CTA CARDS
         ========================================================================= */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 flex flex-col items-center">
        
        {/* HERO TITLE & GRAPHICS */}
        <div className="w-full relative flex items-center justify-center min-h-[150px]">
          
          {/* LEFT FLANKING GRAPHIC: 2D MAC CODE SNIPPET (VISIBLE ON XL+) */}
          <div className="hidden xl:block absolute left-2 lg:left-4 top-1 select-none pointer-events-none transition-transform hover:scale-105 duration-300">
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
              Learn SQL step by step with interactive lessons, execute queries in-browser, solve 66+ practice challenges, and prepare for top tech interviews.
            </p>
          </div>

          {/* RIGHT FLANKING GRAPHIC: 2D VECTOR DATABASE */}
          <div className="hidden xl:block absolute right-2 lg:right-4 -top-1 select-none pointer-events-none transition-transform hover:scale-105 duration-300">
            <div className="relative w-56 h-48 flex items-center justify-center">
              
              {/* Dashed Orbit & Sparkles */}
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
                  <path d="M12 24v16c0 8.5 19 15 43 15s43-6.5 43-15V24" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="24" rx="43" ry="15" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="23.5" rx="35" ry="11" fill="#DBEAFE" />
                  <ellipse cx="55" cy="23" rx="26" ry="8" fill="#2563EB" />

                  {/* Middle Disc */}
                  <path d="M12 52v18c0 8.5 19 15 43 15s43-6.5 43-15V52" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
                  <ellipse cx="55" cy="52" rx="43" ry="14" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
                  <ellipse cx="55" cy="51.5" rx="34" ry="10" fill="#93C5FD" opacity="0.5" />

                  {/* Bottom Disc */}
                  <path d="M12 80v20c0 9 19 16 43 16s43-7 43-16V80" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.5" />
                  <ellipse cx="55" cy="80" rx="43" ry="14" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Floating 2D Badge: Bar Chart */}
              <div className="absolute top-1 left-0 bg-white/95 backdrop-blur-md rounded-xl p-2 border border-blue-200/90 shadow-[0_4px_16px_rgba(37,99,235,0.12)] z-20 transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="w-5 h-5 flex items-end justify-between space-x-0.5 px-0.5 pb-0.5">
                  <div className="w-1.5 h-2.5 bg-blue-400 rounded-xs" />
                  <div className="w-1.5 h-3.5 bg-blue-500 rounded-xs" />
                  <div className="w-1.5 h-5 bg-blue-600 rounded-xs" />
                </div>
              </div>

              {/* Floating 2D Badge: Code Brackets */}
              <div className="absolute top-3 -right-2 bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-indigo-200/90 shadow-[0_4px_16px_rgba(99,102,241,0.12)] z-20 transform rotate-3 hover:rotate-0 transition-transform">
                <span className="font-mono text-indigo-600 font-black text-xs">{`{ }`}</span>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            TWO MAIN CALL-TO-ACTION CARDS (LEARNING & PRACTICE)
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
                Learn SQL concepts step by step with clear explanations, syntax, examples, and sample queries.
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
                Solve 66+ SQL challenges with instant in-browser SQLite execution, query diffing, and test cases.
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
            SECTION: INTERVIEW QUESTIONS & TECHNICAL RESOURCES (FIXED HEIGHTS & NO CUTOFFS)
           ========================================================================= */}
        <div id="interview-section" className="w-full max-w-5xl mx-auto mt-16 sm:mt-20 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black tracking-wider uppercase">
                <Briefcase size={12} className="text-amber-600" />
                <span>Interview Readiness & Advanced Tracks</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                Curated SQL Interview Questions & Tracks
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              FAANG patterns, company screening problems, and reference materials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            
            {/* Card 1: 30-Day SQL Roadmap (Active!) */}
            <div
              onClick={() => onSelectMode('roadmap')}
              className="bg-white hover:bg-blue-50/20 border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-h-[190px] group"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold">
                  <Map size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    30-Day SQL Roadmap
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed">
                    Structured day-by-day learning pathway from database basics to advanced queries and FAANG prep.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>View Roadmap</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Top 50 Interview Questions */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 min-h-[190px]">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center font-bold">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    Top 50 Interview Questions
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed">
                    Second highest salary, consecutive logins, running totals, and department top earners.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-amber-800">FAANG Track</span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200/60">Coming Soon</span>
              </div>
            </div>

            {/* Card 3: Company-Wise SQL Sets */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 min-h-[190px]">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    Company SQL Sets
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed">
                    Curated technical screening questions asked at Amazon, Google, Microsoft, Meta, and Uber.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-blue-800">Tech Giants</span>
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200/60">Coming Soon</span>
              </div>
            </div>

            {/* Card 4: Syntax & Cheatsheet Reference (Active!) */}
            <div
              onClick={() => onSelectMode('learn')}
              className="bg-white hover:bg-indigo-50/20 border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-h-[190px] group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center font-bold">
                    <FileCode2 size={18} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                    SQL Syntax Reference
                  </h4>
                  <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed">
                    Quick-lookup guide for Window Functions (RANK, LEAD, LAG), CTEs, and date math.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>Open Cheatsheet</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            BOTTOM HIGHLIGHTS BAR
           ========================================================================= */}
        <div className="w-full max-w-5xl mx-auto mt-14 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Feature 1 */}
            <div className="flex items-center space-x-3.5 pt-1 sm:pt-0 sm:px-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                <BookMarked size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Learn at Your Pace
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Beginner to Advanced
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shrink-0">
                <Filter size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Smart Practice
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Filter by topic, type, difficulty
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 border border-amber-100/80 flex items-center justify-center shrink-0">
                <TrendingUp size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Track Progress
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Monitor your improvement
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0">
                <Trophy size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight">
                  Crack Interviews
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
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
