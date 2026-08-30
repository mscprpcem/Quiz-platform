import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Trophy, Sparkles, Medal, Search, RefreshCw, Download,
  ExternalLink, CheckCircle2, Clock, Award, ShieldAlert,
  ChevronRight, Calendar, ArrowRight, Layers, FileSpreadsheet
} from 'lucide-react';

export default function EventCombinedLeaderboard({
  eventIdOrSlug,
  currentUserEmail = '',
  currentUserName = '',
  showQuizSeriesHeader = true,
  compact = false,
  className = ''
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuizFilter, setActiveQuizFilter] = useState('all'); // 'all' or quizId
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchLeaderboard = async () => {
    if (!eventIdOrSlug) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/api/events/${encodeURIComponent(eventIdOrSlug)}/leaderboard`);
      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.error || 'Failed to load combined event leaderboard.');
      }
    } catch (err) {
      console.warn('Error fetching event combined leaderboard:', err.message);
      setError(err.response?.data?.error || 'Could not load event combined leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [eventIdOrSlug]);

  useEffect(() => {
    if (data?.event && Array.isArray(data?.quizzes) && data.quizzes.length > 0) {
      const defaultView = data.default_view || data.event.leaderboard_default_view || 'all';
      if (defaultView === 'first_quiz' || defaultView === 'week_1') {
        setActiveQuizFilter(data.quizzes[0].id);
      } else if (defaultView === 'current_quiz' || defaultView === 'latest') {
        const liveOrLast = data.quizzes.find(q => q.status === 'in_progress' || q.status === 'waiting_lobby') || data.quizzes[data.quizzes.length - 1];
        if (liveOrLast) setActiveQuizFilter(liveOrLast.id);
      } else if (defaultView !== 'all') {
        const match = data.quizzes.find(q => q.id === defaultView || String(q.week_number) === String(defaultView));
        if (match) {
          setActiveQuizFilter(match.id);
        } else {
          setActiveQuizFilter('all');
        }
      } else {
        setActiveQuizFilter('all');
      }
    }
  }, [data]);

  const handleExport = async (format = 'xlsx') => {
    if (!eventIdOrSlug) return;
    try {
      setExporting(true);
      const response = await api.get(`/api/export/event/${encodeURIComponent(eventIdOrSlug)}/leaderboard?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanEventName = (data?.event?.name || 'event').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Combined_Leaderboard_${cleanEventName}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export combined leaderboard.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className={`p-8 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs ${className}`}>
        <RefreshCw size={28} className="text-purple-600 animate-spin mx-auto" />
        <div className="text-xs font-extrabold text-slate-600">Calculating combined multi-week standings...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`p-6 text-center space-y-2 bg-rose-50 border border-rose-200 rounded-3xl ${className}`}>
        <div className="text-xs font-black text-rose-700">Combined Standings Notice</div>
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { event, quizzes = [], leaderboard = [], summary } = data || {};

  // Check if current user is logged in
  const cleanUserEmail = (currentUserEmail || '').toLowerCase().trim();
  const cleanUserName = (currentUserName || '').toLowerCase().trim();

  // Filter leaderboard based on activeQuizFilter and search query
  let displayedLeaderboard = [...leaderboard];

  if (activeQuizFilter !== 'all') {
    // Show only the score for that specific quiz and re-rank
    displayedLeaderboard = displayedLeaderboard.map(p => {
      const qPerf = (p.breakdown || []).find(b => b.quiz_id === activeQuizFilter);
      return {
        ...p,
        displayScore: qPerf ? qPerf.score : 0,
        displayCorrect: qPerf ? qPerf.correct_count : 0,
        displayTime: qPerf ? qPerf.time_taken_seconds : 0,
        displayAttempted: qPerf ? qPerf.attempted : false
      };
    }).sort((a, b) => {
      if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore;
      if (b.displayCorrect !== a.displayCorrect) return b.displayCorrect - a.displayCorrect;
      return a.displayTime - b.displayTime;
    }).map((item, idx) => ({ ...item, displayRank: idx + 1 }));
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    displayedLeaderboard = displayedLeaderboard.filter(p =>
      (p.name || p.participant_name || '').toLowerCase().includes(q) ||
      (p.email || p.participant_email || '').toLowerCase().includes(q)
    );
  }

  // Find current user's entry
  const myEntry = leaderboard.find(p =>
    (cleanUserEmail && (p.email?.toLowerCase() === cleanUserEmail || p.participant_email?.toLowerCase() === cleanUserEmail)) ||
    (cleanUserName && (p.name?.toLowerCase() === cleanUserName || p.participant_name?.toLowerCase() === cleanUserName))
  );

  return (
    <div className={`space-y-6 text-left font-segoe ${className}`}>
      
      {/* ════════ EVENT BANNER & QUIZ SERIES OVERVIEW ════════ */}
      {showQuizSeriesHeader && event && (
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-purple-900/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>{event.category || 'Official Event Series'}</span>
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {quizzes.length} {quizzes.length === 1 ? 'Round / Week' : 'Rounds / Weeks'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={exporting}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-2xs"
                  title="Export Combined Scoreboard to Excel (.xlsx)"
                >
                  <FileSpreadsheet size={13} className="text-emerald-400" />
                  <span>Export .xlsx</span>
                </button>
                <button
                  onClick={fetchLeaderboard}
                  disabled={loading}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all cursor-pointer"
                  title="Refresh Standings"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{event.name}</span>
                <span className="text-amber-400 text-sm font-extrabold">🏆 Combined Leaderboard</span>
              </h2>
              <p className="text-xs text-purple-200/80 font-medium max-w-2xl mt-1 leading-relaxed">
                Cumulative score aggregated across all official weeks and quiz challenges. Points are updated automatically as new quiz rounds are completed.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider block">Total Quizzes</span>
                <div className="text-lg font-black text-white mt-0.5">{quizzes.length}</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider block">Total Participants</span>
                <div className="text-lg font-black text-white mt-0.5">{summary?.total_participants || leaderboard.length}</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider block">Highest Combined</span>
                <div className="text-lg font-black text-amber-300 mt-0.5">{summary?.highest_combined_score || 0} pts</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xs">
                <span className="text-[9px] font-black uppercase text-purple-300 tracking-wider block">Avg Score</span>
                <div className="text-lg font-black text-emerald-300 mt-0.5">{summary?.average_combined_score || 0} pts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ LIST OF QUIZZES PART OF THIS EVENT ════════ */}
      {quizzes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-1.5">
              <Layers size={15} className="text-purple-600" />
              <span>Event Quiz Series ({quizzes.length} Quizzes)</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Click a quiz to filter or take part</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizzes.map((q, idx) => {
              const isSelected = activeQuizFilter === q.id;
              const isLive = q.status === 'in_progress' || q.status === 'waiting_lobby';

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                        Week {idx + 1}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : q.status === 'completed'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isLive ? 'Live Now' : q.status || 'Active'}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2">
                      {q.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span>{q.total_questions} Questions</span>
                      <span>•</span>
                      <span>Max: {q.max_score} pts</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveQuizFilter(isSelected ? 'all' : q.id)}
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Viewing Round' : 'View Standings'}
                    </button>

                    <a
                      href={q.direct_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <span>Take Quiz</span>
                      <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════ LEADERBOARD CONTROLS & TABLE ════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-md space-y-5">
        
        {/* Header & Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-black">
                <Trophy size={16} />
              </div>
              <h3 className="text-base font-black text-slate-900">
                {activeQuizFilter === 'all' ? 'Cumulative Event Standings' : `Round Standings: ${quizzes.find(q => q.id === activeQuizFilter)?.title || 'Selected Round'}`}
              </h3>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {activeQuizFilter === 'all'
                ? 'Scores combined across all completed quiz weeks with speed & accuracy tie-breaking.'
                : 'Standings for this specific quiz round in the event.'}
            </p>
          </div>

          {/* Quick Round Toggle Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveQuizFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeQuizFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Weeks Combined
            </button>
            {quizzes.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setActiveQuizFilter(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeQuizFilter === q.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search participant name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:bg-white transition-all"
            />
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            {displayedLeaderboard.length} {displayedLeaderboard.length === 1 ? 'Participant' : 'Participants'}
          </span>
        </div>

        {/* Current Student's Standings Banner (if found) */}
        {myEntry && activeQuizFilter === 'all' && (
          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                #{myEntry.rank}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
                  Your Cumulative Standing
                </span>
                <span className="text-xs font-bold text-slate-800">
                  You are currently ranked <strong className="text-purple-700 font-black">#{myEntry.rank}</strong> with <strong className="text-emerald-700 font-black">{myEntry.total_score} pts</strong> ({myEntry.quizzes_attempted}/{quizzes.length} weeks completed).
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-purple-700 bg-white border border-purple-200 px-3 py-1.5 rounded-full shadow-2xs shrink-0">
              Verified Candidate
            </span>
          </div>
        )}

        {/* Standings List */}
        {displayedLeaderboard.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-2xl">🏆</div>
            <p className="text-xs text-slate-500 font-bold">
              {search ? 'No participants found matching your search.' : 'No completed attempts recorded yet for this event series.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedLeaderboard.map((p) => {
              const rank = activeQuizFilter === 'all' ? p.rank : p.displayRank;
              const score = activeQuizFilter === 'all' ? p.total_score : p.displayScore;
              const correct = activeQuizFilter === 'all' ? p.total_correct : p.displayCorrect;
              const timeSecs = activeQuizFilter === 'all' ? p.total_time_taken : p.displayTime;

              const isCurrentUser =
                (cleanUserEmail && (p.email?.toLowerCase() === cleanUserEmail || p.participant_email?.toLowerCase() === cleanUserEmail)) ||
                (cleanUserName && (p.name?.toLowerCase() === cleanUserName || p.participant_name?.toLowerCase() === cleanUserName));

              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs border border-slate-200 shrink-0">
                  {rank}
                </span>
              );

              let cardStyle = "bg-white hover:bg-slate-50/80 border-slate-200";

              if (rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                    🥇
                  </span>
                );
                cardStyle = "bg-amber-50/40 border-amber-200";
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shrink-0">
                    🥈
                  </span>
                );
                cardStyle = "bg-slate-50 border-slate-300";
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs shrink-0">
                    🥉
                  </span>
                );
                cardStyle = "bg-amber-50/20 border-amber-200/60";
              }

              if (isCurrentUser) {
                cardStyle += " ring-2 ring-purple-500 bg-purple-50/70 border-purple-300 font-bold";
              }

              return (
                <div
                  key={p.user_key || p.id || rank}
                  className={`p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${cardStyle}`}
                >
                  {/* Left: Rank & Participant */}
                  <div className="flex items-center space-x-3 truncate">
                    {rankBadge}

                    <div className="truncate text-left">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {p.name || p.participant_name || 'Participant'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-md shrink-0">
                            You
                          </span>
                        )}
                        {p.sso_user_id && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded shrink-0">
                            SSO Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                        {p.email && <span className="truncate max-w-[180px]">{p.email}</span>}
                        <span>•</span>
                        <span>{correct || 0} Correct</span>
                        <span>•</span>
                        <span>{Math.floor((timeSecs || 0) / 60)}m {(timeSecs || 0) % 60}s</span>
                        {activeQuizFilter === 'all' && (
                          <>
                            <span>•</span>
                            <span className="text-purple-700 font-bold">
                              {p.quizzes_attempted || 0}/{quizzes.length} Weeks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Weekly Score Tags & Total Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Weekly Breakdown Pills */}
                    {activeQuizFilter === 'all' && p.breakdown && p.breakdown.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.breakdown.map((b, idx) => (
                          <span
                            key={b.quiz_id || idx}
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                              b.attempted
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'
                            }`}
                            title={`${b.quiz_title}: ${b.attempted ? `${b.score} pts` : 'Not Attempted'}`}
                          >
                            W{idx + 1}: <strong className={b.attempted ? 'text-purple-700 font-black' : 'text-slate-400'}>{b.score}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Total Combined Score Badge */}
                    <div className="text-right">
                      <span className="font-black text-xs sm:text-sm text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full inline-block shadow-2xs whitespace-nowrap">
                        {score || 0} <span className="text-[9px] font-bold text-slate-500 uppercase">pts</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
