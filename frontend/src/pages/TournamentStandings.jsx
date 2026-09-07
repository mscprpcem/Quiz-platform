import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Trophy,
  Award,
  Medal,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  Check,
  Zap,
  Flame,
  BarChart3,
  Calendar,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';

export default function TournamentStandings() {
  const navigate = useNavigate();

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedQuizzesMeta, setSelectedQuizzesMeta] = useState([]);
  const [summary, setSummary] = useState({
    totalParticipants: 0,
    completedCount: 0,
    notAttendedCount: 0,
    totalQuizzes: 0,
    highestScore: 0,
    averageScore: 0,
    perfectAttendanceCount: 0
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all', 'completed', 'not_attended'
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'score', 'time', 'attendance'
  const [showQuizSelector, setShowQuizSelector] = useState(false);

  // Fetch available quizzes list on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get('/api/analytics/public/cumulative-leaderboard');
      if (res.data) {
        if (Array.isArray(res.data.availableQuizzes)) {
          setAvailableQuizzes(res.data.availableQuizzes);
        }
        if (Array.isArray(res.data.selectedQuizzes) && res.data.selectedQuizzes.length > 0) {
          const defaultIds = res.data.selectedQuizzes.map((q) => q.id);
          setSelectedQuizIds(defaultIds);
          setSelectedQuizzesMeta(res.data.selectedQuizzes);
        }
        if (Array.isArray(res.data.leaderboard)) {
          setLeaderboardData(res.data.leaderboard);
        }
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load initial tournament standings:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCumulativeLeaderboard = async (quizIdsToFetch) => {
    if (!quizIdsToFetch || quizIdsToFetch.length === 0) {
      setLeaderboardData([]);
      setSelectedQuizzesMeta([]);
      setSummary({
        totalParticipants: 0,
        completedCount: 0,
        notAttendedCount: 0,
        totalQuizzes: 0,
        highestScore: 0,
        averageScore: 0,
        perfectAttendanceCount: 0
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/analytics/public/cumulative-leaderboard', {
        quizIds: quizIdsToFetch
      });

      if (res.data?.success) {
        setLeaderboardData(res.data.leaderboard || []);
        setSelectedQuizzesMeta(res.data.selectedQuizzes || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Failed to calculate public tournament standings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuiz = (quizId) => {
    const updated = selectedQuizIds.includes(quizId)
      ? selectedQuizIds.filter((id) => id !== quizId)
      : [...selectedQuizIds, quizId];

    setSelectedQuizIds(updated);
    fetchCumulativeLeaderboard(updated);
  };

  const handleSelectAllQuizzes = () => {
    const allIds = availableQuizzes.map((q) => q.id);
    setSelectedQuizIds(allIds);
    fetchCumulativeLeaderboard(allIds);
  };

  const handleClearSelection = () => {
    setSelectedQuizIds([]);
    fetchCumulativeLeaderboard([]);
  };

  const handleResetDefaults = () => {
    const defaultIds = availableQuizzes
      .filter((q) => q.hasInjectedData || q.status === 'completed')
      .map((q) => q.id);
    const toSelect = defaultIds.length > 0 ? defaultIds : availableQuizzes.slice(0, 3).map((q) => q.id);
    setSelectedQuizIds(toSelect);
    fetchCumulativeLeaderboard(toSelect);
  };

  // Format seconds into readable m:ss
  const formatSeconds = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Filter and Sort Leaderboard rows
  const filteredLeaderboard = useMemo(() => {
    return leaderboardData
      .filter((item) => {
        // Text search
        const q = searchTerm.toLowerCase().trim();
        const matchesQuery =
          !q ||
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.college && item.college.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        // Attendance filter
        if (attendanceFilter === 'completed') {
          return item.quizzesAttendedCount > 0;
        }
        if (attendanceFilter === 'not_attended') {
          return item.quizzesAttendedCount === 0;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.totalScore - a.totalScore;
        if (sortBy === 'time') return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
        if (sortBy === 'attendance') return b.quizzesAttendedCount - a.quizzesAttendedCount;
        return a.rank - b.rank; // default by rank
      });
  }, [leaderboardData, searchTerm, attendanceFilter, sortBy]);

  // Top 3 from completed participants only
  const completedList = leaderboardData.filter((s) => s.quizzesAttendedCount > 0);
  const top3 = completedList.slice(0, 3);
  const gold = top3[0] || null;
  const silver = top3[1] || null;
  const bronze = top3[2] || null;

  const filteredQuizOptions = availableQuizzes.filter((q) => {
    if (!quizSearchQuery) return true;
    const s = quizSearchQuery.toLowerCase();
    return (
      (q.title && q.title.toLowerCase().includes(s)) ||
      (q.event_name && q.event_name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back navigation */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-purple-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-blue-50/60 border border-purple-200/80 p-6 sm:p-8 rounded-3xl shadow-soft relative overflow-hidden text-left">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs">
                <Sparkles size={13} className="text-purple-600" />
                MSC PRPCEM Tech Championship
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                Tournament Standings
                <Trophy size={32} className="text-amber-500 shrink-0" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
                Live cumulative rankings across weekly challenges and hackathon assessments. Ranked by verified points with total response time tie-breaking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowQuizSelector(!showQuizSelector)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>{showQuizSelector ? 'Hide Quiz Filter' : 'Filter Quizzes'}</span>
                <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-md text-[10px] font-black">
                  {selectedQuizIds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => fetchCumulativeLeaderboard(selectedQuizIds)}
                disabled={loading || selectedQuizIds.length === 0}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Quiz Multi-Select Section */}
        {showQuizSelector && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Select Quizzes to Compare & Aggregate
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select 1 or more quizzes (e.g. VisionX Season 2 Week 1, Live Challenges) to aggregate standings.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg">
                  {selectedQuizIds.length} Quiz{selectedQuizIds.length === 1 ? '' : 'zes'} Selected
                </span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer border border-slate-200"
                >
                  Active Only
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllQuizzes}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer border border-slate-200"
                >
                  Select All
                </button>
                {selectedQuizIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer border border-rose-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Search for Quizzes */}
            <div className="mt-3.5 mb-3">
              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quizzes by title..."
                  value={quizSearchQuery}
                  onChange={(e) => setQuizSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>
            </div>

            {/* Quiz Checkbox Chips */}
            {initialLoading ? (
              <div className="py-6 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-purple-600" />
                Loading available quizzes...
              </div>
            ) : filteredQuizOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 font-medium">
                No quizzes matched your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredQuizOptions.map((q) => {
                  const isSelected = selectedQuizIds.includes(q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => handleToggleQuiz(q.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-purple-950' : 'text-slate-900'}`}>
                          {q.title}
                        </p>
                        {q.event_name && (
                          <p className="text-[10px] text-purple-700 font-semibold truncate mt-0.5">
                            {q.event_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar size={9} />
                            {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                          {q.hasInjectedData && (
                            <span className="px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black flex items-center gap-0.5">
                              <Zap size={8} className="text-amber-700" /> Week 1
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* When no quiz is selected */}
        {selectedQuizIds.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center my-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Quizzes Selected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Please choose 1 or more quizzes to view the cumulative tournament leaderboard.
            </p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl transition shadow-sm cursor-pointer"
            >
              Load Active Tournament Quizzes
            </button>
          </div>
        )}

        {/* Content View when quizzes selected */}
        {selectedQuizIds.length > 0 && (
          <>
            {/* KPI Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Contenders
                  </span>
                  <Users size={16} className="text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {summary.totalParticipants || 0}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Total registered cohort</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Active
                  </span>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {summary.completedCount || 0}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Completed tests</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Quizzes
                  </span>
                  <Layers size={16} className="text-purple-600" />
                </div>
                <div className="text-2xl font-black text-purple-700">
                  {selectedQuizzesMeta.length}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Selected in tournament</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    High Score
                  </span>
                  <Flame size={16} className="text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {summary.highestScore || 0} pts
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Tournament top score</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Avg Score
                  </span>
                  <BarChart3 size={16} className="text-teal-600" />
                </div>
                <div className="text-2xl font-black text-teal-700">
                  {summary.averageScore || 0} pts
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Mean completed score</p>
              </div>
            </div>

            {/* Top 3 Champions Podium */}
            {top3.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="text-center mb-6">
                  <span className="px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                    <Trophy size={13} className="text-amber-600" />
                    Tournament Podium
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-slate-900">Top 3 Overall Performers</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Ranked by highest cumulative score with aggregate response speed tie-breaking.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-2">
                  {/* Silver - 2nd Place */}
                  {silver ? (
                    <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300 rounded-2xl p-5 text-center flex flex-col items-center shadow-sm hover:shadow-md transition">
                      <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center text-slate-800 mb-2 font-black text-base shadow-xs">
                        2
                      </div>
                      <Medal size={28} className="text-slate-500 mb-1" />
                      <h4 className="text-sm font-black text-slate-900 truncate max-w-full">{silver.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-full font-semibold">{silver.college || 'PRPCEM Amravati'}</p>
                      <div className="mt-3 pt-3 border-t border-slate-200 w-full flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Score</span>
                          <span className="font-black text-slate-900 text-base">{silver.totalScore} pts</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Time</span>
                          <span className="font-extrabold text-slate-700">{formatSeconds(silver.totalTimeTakenSeconds)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="order-2 md:order-1 hidden md:block" />
                  )}

                  {/* Gold - 1st Place */}
                  {gold ? (
                    <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100/60 border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col items-center shadow-md relative -translate-y-2">
                      <div className="absolute -top-3 bg-amber-500 text-white font-black text-[10px] px-3.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Trophy size={11} /> Overall #1
                      </div>
                      <div className="w-14 h-14 rounded-full bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-slate-950 mb-2 font-black text-xl shadow-md mt-1">
                        1
                      </div>
                      <Trophy size={34} className="text-amber-500 mb-1" />
                      <h4 className="text-base font-black text-slate-950 truncate max-w-full">{gold.name}</h4>
                      <p className="text-xs text-amber-900 truncate max-w-full font-bold">{gold.college || 'PRPCEM Amravati'}</p>
                      <div className="mt-4 pt-3 border-t border-amber-300/80 w-full flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-amber-800 block uppercase font-black">Total Score</span>
                          <span className="font-black text-amber-950 text-xl">{gold.totalScore} pts</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-amber-800 block uppercase font-black">Total Time</span>
                          <span className="font-black text-slate-900 text-sm">{formatSeconds(gold.totalTimeTakenSeconds)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Attended {gold.quizzesAttendedCount} / {selectedQuizzesMeta.length} Quizzes
                      </div>
                    </div>
                  ) : null}

                  {/* Bronze - 3rd Place */}
                  {bronze ? (
                    <div className="order-3 bg-gradient-to-b from-orange-50 to-amber-50 border border-amber-300 rounded-2xl p-5 text-center flex flex-col items-center shadow-sm hover:shadow-md transition">
                      <div className="w-12 h-12 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center text-amber-950 mb-2 font-black text-base shadow-xs">
                        3
                      </div>
                      <Award size={28} className="text-amber-700 mb-1" />
                      <h4 className="text-sm font-black text-slate-900 truncate max-w-full">{bronze.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-full font-semibold">{bronze.college || 'PRPCEM Amravati'}</p>
                      <div className="mt-3 pt-3 border-t border-amber-200 w-full flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Score</span>
                          <span className="font-black text-slate-900 text-base">{bronze.totalScore} pts</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Total Time</span>
                          <span className="font-extrabold text-slate-700">{formatSeconds(bronze.totalTimeTakenSeconds)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="order-3 hidden md:block" />
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard Table Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by participant name or college..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Attendance Filter Tabs */}
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        attendanceFilter === 'all'
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({leaderboardData.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('completed')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        attendanceFilter === 'completed'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Active ({summary.completedCount || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('not_attended')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                        attendanceFilter === 'not_attended'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Absent ({summary.notAttendedCount || 0})
                    </button>
                  </div>

                  {/* Sort dropdown */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="rank">Rank (Score + Time)</option>
                      <option value="score">Highest Score</option>
                      <option value="time">Fastest Time</option>
                      <option value="attendance">Most Attended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table Render */}
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-purple-600" />
                  Calculating cumulative standings...
                </div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  No participants matched your current search or filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] bg-slate-50/70">
                        <th className="py-3 px-3 w-14 text-center">Rank</th>
                        <th className="py-3 px-3 min-w-[180px]">Participant</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Time</th>
                        <th className="py-3 px-3 text-center">Attendance</th>
                        <th className="py-3 px-3 text-center">Accuracy</th>
                        {selectedQuizzesMeta.map((quiz, idx) => (
                          <th key={quiz.id} className="py-3 px-3 text-center min-w-[120px]">
                            <span className="block truncate max-w-[130px] mx-auto text-purple-900" title={quiz.title}>
                              Q{idx + 1}: {quiz.title}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeaderboard.map((student) => {
                        const isGold = student.rank === 1 && student.quizzesAttendedCount > 0;
                        const isSilver = student.rank === 2 && student.quizzesAttendedCount > 0;
                        const isBronze = student.rank === 3 && student.quizzesAttendedCount > 0;
                        const isAbsent = student.quizzesAttendedCount === 0;

                        return (
                          <tr
                            key={student.key || student.id || student.name}
                            className={`transition hover:bg-slate-50/80 ${
                              isGold ? 'bg-amber-50/40 font-semibold' : ''
                            } ${isAbsent ? 'opacity-60 bg-slate-50/30' : ''}`}
                          >
                            {/* Rank Medal / Badge */}
                            <td className="py-3 px-3 text-center font-black">
                              {isGold ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                                  🥇
                                </span>
                              ) : isSilver ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                                  🥈
                                </span>
                              ) : isBronze ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-200 text-amber-950 font-black text-xs shadow-xs">
                                  🥉
                                </span>
                              ) : (
                                <span className="text-slate-500 font-extrabold text-xs">
                                  #{student.rank}
                                </span>
                              )}
                            </td>

                            {/* Participant Name & College */}
                            <td className="py-3 px-3">
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span className="truncate max-w-[200px]" title={student.name}>
                                    {student.name}
                                  </span>
                                  {student.quizzesAttendedCount > 0 && (
                                    <ShieldCheck size={13} className="text-purple-600 shrink-0" title="Verified Participant" />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                                  {student.college || 'PRPCEM Amravati'}
                                </div>
                              </div>
                            </td>

                            {/* Cumulative Score */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-900 font-black rounded-lg border border-purple-200 text-xs shadow-2xs">
                                {student.totalScore} pts
                              </span>
                            </td>

                            {/* Total Time */}
                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                              {student.totalTimeTakenSeconds > 0 ? (
                                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                  <Clock size={11} className="text-slate-400" />
                                  {formatSeconds(student.totalTimeTakenSeconds)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Attendance */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`text-[11px] font-extrabold ${
                                    student.quizzesAttendedCount === selectedQuizzesMeta.length
                                      ? 'text-emerald-700'
                                      : student.quizzesAttendedCount > 0
                                      ? 'text-blue-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {student.quizzesAttendedCount} / {selectedQuizzesMeta.length}
                                </span>
                                <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full ${
                                      student.quizzesAttendedCount === selectedQuizzesMeta.length
                                        ? 'bg-emerald-500'
                                        : student.quizzesAttendedCount > 0
                                        ? 'bg-blue-500'
                                        : 'bg-transparent'
                                    }`}
                                    style={{ width: `${student.attendancePercentage || 0}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Accuracy */}
                            <td className="py-3 px-3 text-center font-bold">
                              {student.quizzesAttendedCount > 0 ? (
                                <span className="text-slate-800">
                                  {student.accuracyPercentage}%
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Per-Quiz Breakdown */}
                            {selectedQuizzesMeta.map((quiz) => {
                              const breakdown = student.quizBreakdown?.[quiz.id];
                              const isQuizAttended = breakdown && breakdown.status !== 'not_attended';

                              return (
                                <td key={quiz.id} className="py-3 px-3 text-center">
                                  {isQuizAttended ? (
                                    <div className="space-y-0.5">
                                      <span className="font-extrabold text-slate-900 block">
                                        {breakdown.score} pts
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold block">
                                        {formatSeconds(breakdown.timeTakenSeconds)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                                      Absent
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
