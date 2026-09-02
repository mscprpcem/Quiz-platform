import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Map, CheckCircle2, Circle, Clock, Sparkles,
  Calendar, BookOpen, Target, Filter, Search, Trophy, Layers, Award,
  ChevronRight, ExternalLink, Check, RotateCcw
} from 'lucide-react';
import { SQL_30_DAY_ROADMAP } from '../data/sqlRoadmapData';

export default function SqlRoadmapView({
  onSelectTopic,
  onSelectMode,
  onBackToOverview,
  completedTopics = []
}) {
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Completed days state stored in localStorage
  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const saved = localStorage.getItem('msc_sql_completed_roadmap_days');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleDayCompleted = (day) => {
    setCompletedDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      try {
        localStorage.setItem('msc_sql_completed_roadmap_days', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save completed roadmap days', e);
      }
      return next;
    });
  };

  const resetAllProgress = () => {
    if (window.confirm('Reset your 30-Day Roadmap progress?')) {
      setCompletedDays([]);
      try {
        localStorage.removeItem('msc_sql_completed_roadmap_days');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filtered Roadmap Days
  const filteredDays = useMemo(() => {
    return SQL_30_DAY_ROADMAP.filter(item => {
      // Week filter
      if (selectedWeek !== 'all' && item.week !== Number(selectedWeek)) return false;

      const isCompleted = completedDays.includes(item.day) || completedTopics.includes(item.topicId);
      
      // Status filter
      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'pending' && isCompleted) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesSummary = item.summary?.toLowerCase().includes(q);
        const matchesPhase = item.phase?.toLowerCase().includes(q);
        const matchesGoals = item.goals?.some(g => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesPhase && !matchesGoals) return false;
      }

      return true;
    });
  }, [selectedWeek, statusFilter, searchQuery, completedDays, completedTopics]);

  const totalDays = SQL_30_DAY_ROADMAP.length;
  const completedCount = SQL_30_DAY_ROADMAP.filter(
    item => completedDays.includes(item.day) || completedTopics.includes(item.topicId)
  ).length;
  const progressPercent = Math.round((completedCount / totalDays) * 100);

  const handleStudyDay = (item) => {
    if (onSelectTopic && item.moduleId && item.topicId) {
      onSelectTopic(item.moduleId, item.topicId);
    } else if (onSelectMode) {
      onSelectMode('learn');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-segoe flex flex-col pb-24">
      
      {/* =========================================================================
          TOP STICKY / HEADER BAR
         ========================================================================= */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToOverview || (() => onSelectMode?.('overview'))}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
              title="Return to Overview"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Overview</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold">
                <Map size={16} />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-none">
                  30-Day SQL Mastery Roadmap
                </h1>
                <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
                  Guided day-by-day learning & interview preparation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onSelectMode?.('practice')}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Target size={13} className="text-emerald-600" />
              <span>Practice Lab</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode?.('learn')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <BookOpen size={13} />
              <span>All Modules</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER
         ========================================================================= */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* HERO BANNER & PROGRESS SUMMARY */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black tracking-wider uppercase">
              <Sparkles size={12} className="text-blue-600" />
              <span>Structured 4-Week Career Pathway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Master SQL in 30 Days
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              Step through database foundations, relational multi-table joins, subqueries, Common Table Expressions (CTEs), Window Functions, and query optimization for FAANG interviews.
            </p>
          </div>

          {/* PROGRESS METRICS CARD */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 shrink-0 flex flex-col justify-between space-y-4 min-w-[260px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Progress</span>
                <div className="text-2xl font-black text-slate-900 flex items-baseline space-x-1">
                  <span>{progressPercent}%</span>
                  <span className="text-xs font-bold text-slate-400">({completedCount}/{totalDays} Days)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shadow-blue-500/20">
                <Trophy size={20} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
              <span>{totalDays - completedCount} Days Left</span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllProgress}
                  className="text-slate-400 hover:text-rose-600 text-[10.5px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4 PHASES OVERVIEW STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              week: 1,
              title: 'Week 1: Fundamentals & CRUD',
              days: 'Days 1–7',
              color: 'border-blue-200 bg-blue-50/40 text-blue-700',
              desc: 'Relational concepts, DDL (CREATE/ALTER), DML (INSERT/UPDATE), basic SELECT filtering.'
            },
            {
              week: 2,
              title: 'Week 2: Relational Joins',
              days: 'Days 8–14',
              color: 'border-indigo-200 bg-indigo-50/40 text-indigo-700',
              desc: 'INNER, LEFT, RIGHT, FULL, SELF, and CROSS Joins with schema normalization & keys.'
            },
            {
              week: 3,
              title: 'Week 3: Grouping & CTEs',
              days: 'Days 15–21',
              color: 'border-amber-200 bg-amber-50/40 text-amber-800',
              desc: 'GROUP BY & HAVING, nested Subqueries, Correlated Subqueries, and WITH CTEs.'
            },
            {
              week: 4,
              title: 'Week 4: Window Funcs & FAANG',
              days: 'Days 22–30',
              color: 'border-emerald-200 bg-emerald-50/40 text-emerald-800',
              desc: 'RANK, DENSE_RANK, LEAD, LAG, Indexes, Execution Plans, and Capstone Interviews.'
            }
          ].map((ph) => (
            <div
              key={ph.week}
              onClick={() => setSelectedWeek(String(ph.week))}
              className={`border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-xs hover:border-slate-300 ${ph.color} ${
                selectedWeek === String(ph.week) ? 'ring-2 ring-blue-600 shadow-xs' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs font-black mb-1">
                <span>{ph.days}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/80 border border-current">
                  Week {ph.week}
                </span>
              </div>
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 leading-snug">
                {ph.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {ph.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Week Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
            {[
              { id: 'all', label: 'All 30 Days' },
              { id: '1', label: 'Week 1 (D1-7)' },
              { id: '2', label: 'Week 2 (D8-14)' },
              { id: '3', label: 'Week 3 (D15-21)' },
              { id: '4', label: 'Week 4 (D22-30)' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedWeek(tab.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedWeek === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Incomplete</option>
              <option value="completed">Completed</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>

        {/* =========================================================================
            ROADMAP DAYS LIST
           ========================================================================= */}
        <div className="space-y-3.5">
          {filteredDays.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="text-base font-black text-slate-800">No Roadmap Days Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No days matched your current filter criteria. Try selecting "All 30 Days" or clearing your search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedWeek('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredDays.map((item) => {
              const isDone = completedDays.includes(item.day) || completedTopics.includes(item.topicId);

              return (
                <div
                  key={item.day}
                  className={`bg-white border rounded-2xl p-5 sm:p-6 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5 group ${
                    isDone ? 'border-emerald-300/80 bg-emerald-50/10' : 'border-slate-200/90 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    
                    {/* Day Number Badge with Complete Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleDayCompleted(item.day)}
                      title={isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 transition-all cursor-pointer shadow-xs ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-emerald-500/25 hover:bg-emerald-700'
                          : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700 group-hover:scale-105'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check size={18} strokeWidth={3} />
                          <span className="text-[8px] uppercase tracking-wider font-bold">Done</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] uppercase opacity-80 leading-none">Day</span>
                          <span className="text-base font-black leading-none mt-0.5">{item.day}</span>
                        </>
                      )}
                    </button>

                    {/* Day Content */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Week {item.week} • {item.phase}
                        </span>
                        
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          item.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                          item.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                          'bg-rose-50 text-rose-700 border border-rose-200/80'
                        }`}>
                          {item.difficulty}
                        </span>

                        {item.estimatedMinutes && (
                          <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={11} />
                            <span>~{item.estimatedMinutes} mins</span>
                          </span>
                        )}

                        {item.milestone && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center space-x-1">
                            <Award size={11} />
                            <span>Milestone Day</span>
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base sm:text-lg font-black transition-colors ${
                        isDone ? 'text-slate-700 line-through' : 'text-slate-900 group-hover:text-blue-600'
                      }`}>
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed max-w-3xl">
                        {item.summary}
                      </p>

                      {/* Goals / Learning Outcomes */}
                      {item.goals && item.goals.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {item.goals.map((g, gIdx) => (
                            <div key={gIdx} className="flex items-center space-x-1.5 text-[11.5px] text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{g}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Action CTAs */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => toggleDayCompleted(item.day)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 border ${
                        isDone
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <RotateCcw size={12} />
                          <span>Undo</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStudyDay(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shadow-blue-500/20"
                    >
                      <span>Study Day {item.day}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </main>

    </div>
  );
}
