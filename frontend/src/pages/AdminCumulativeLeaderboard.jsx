import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import {
  Trophy,
  Award,
  Medal,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  Check,
  Zap,
  Flame,
  BarChart3,
  Calendar
} from 'lucide-react';

export default function AdminCumulativeLeaderboard() {
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuizIds, setSelectedQuizIds] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedQuizzesMeta, setSelectedQuizzesMeta] = useState([]);
  const [summary, setSummary] = useState({
    totalParticipants: 0,
    totalQuizzes: 0,
    highestScore: 0,
    averageScore: 0,
    perfectAttendanceCount: 0
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all', 'perfect', 'partial'
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'score', 'time', 'attendance'

  // Fetch available quizzes list on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get('/api/analytics/admin/cumulative-leaderboard');
      if (res.data?.availableQuizzes) {
        setAvailableQuizzes(res.data.availableQuizzes);

        // By default, if quizzes exist, pre-select up to 3 most recent quizzes (e.g. Week 1, 2, 3)
        const initialSelection = res.data.availableQuizzes.slice(0, 3).map((q) => q.id);
        if (initialSelection.length > 0) {
          setSelectedQuizIds(initialSelection);
          fetchCumulativeLeaderboard(initialSelection);
        }
      }
    } catch (err) {
      console.error('Failed to load initial quiz data for cumulative leaderboard:', err);
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
        totalQuizzes: 0,
        highestScore: 0,
        averageScore: 0,
        perfectAttendanceCount: 0
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/analytics/admin/cumulative-leaderboard', {
        quizIds: quizIdsToFetch
      });

      if (res.data?.success) {
        setLeaderboardData(res.data.leaderboard || []);
        setSelectedQuizzesMeta(res.data.selectedQuizzes || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Failed to calculate cumulative leaderboard:', err);
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

  const handleSelectLatest3 = () => {
    const latest3 = availableQuizzes.slice(0, 3).map((q) => q.id);
    setSelectedQuizIds(latest3);
    fetchCumulativeLeaderboard(latest3);
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
          (item.email && item.email.toLowerCase().includes(q)) ||
          (item.college && item.college.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        // Attendance filter
        if (attendanceFilter === 'perfect') {
          return item.quizzesAttendedCount === selectedQuizzesMeta.length;
        }
        if (attendanceFilter === 'partial') {
          return item.quizzesAttendedCount < selectedQuizzesMeta.length;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.totalScore - a.totalScore;
        if (sortBy === 'time') return a.totalTimeTakenSeconds - b.totalTimeTakenSeconds;
        if (sortBy === 'attendance') return b.quizzesAttendedCount - a.quizzesAttendedCount;
        return a.rank - b.rank; // default by rank
      });
  }, [leaderboardData, searchTerm, attendanceFilter, sortBy, selectedQuizzesMeta.length]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!leaderboardData || leaderboardData.length === 0) {
      alert('No leaderboard data to export.');
      return;
    }

    const exportRows = filteredLeaderboard.map((item) => {
      const row = {
        'Rank': item.rank,
        'Name': item.name,
        'Email': item.email,
        'College': item.college,
        'Total Cumulative Score': item.totalScore,
        'Total Time Taken': formatSeconds(item.totalTimeTakenSeconds),
        'Total Seconds': item.totalTimeTakenSeconds,
        'Quizzes Attended': `${item.quizzesAttendedCount} / ${selectedQuizzesMeta.length}`,
        'Attendance %': `${item.attendancePercentage}%`,
        'Total Correct Answers': item.totalCorrectAnswers,
        'Accuracy %': `${item.accuracyPercentage}%`
      };

      // Append per-quiz columns
      selectedQuizzesMeta.forEach((quiz, idx) => {
        const breakdown = item.quizBreakdown?.[quiz.id];
        const colPrefix = `Quiz ${idx + 1} (${quiz.title})`;
        if (breakdown && breakdown.status !== 'not_attended') {
          row[`${colPrefix} Score`] = breakdown.score;
          row[`${colPrefix} Time`] = formatSeconds(breakdown.timeTakenSeconds);
        } else {
          row[`${colPrefix} Score`] = 'Not Attended';
          row[`${colPrefix} Time`] = '-';
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cumulative Leaderboard');
    XLSX.writeFile(workbook, `Cumulative_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const top3 = leaderboardData.slice(0, 3);
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header Banner */}
      <div className="mb-6 bg-linear-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles size={13} className="text-purple-300" />
              Tournament Analytics & Aggregation
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Multi-Quiz Cumulative Leaderboard
              <Trophy size={32} className="text-amber-400" />
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-medium">
              Select multiple quizzes (e.g. Week 1, Week 2, Week 3) to aggregate participant scores, total time taken, and determine tournament champions with automated tie-breaking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchCumulativeLeaderboard(selectedQuizIds)}
              disabled={loading || selectedQuizIds.length === 0}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 backdrop-blur-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Recalculate
            </button>
            <button
              onClick={handleExportExcel}
              disabled={leaderboardData.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              Export to Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Multi-Select Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-purple-600" />
              Select Quizzes to Compare & Aggregate
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose 2 or more quizzes to calculate the overall rankings and aggregate time taken.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
              {selectedQuizIds.length} Quiz{selectedQuizIds.length === 1 ? '' : 'zes'} Selected
            </span>
            <button
              onClick={handleSelectLatest3}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Select Latest 3
            </button>
            <button
              onClick={handleSelectAllQuizzes}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Select All
            </button>
            {selectedQuizIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Search for Quizzes */}
        <div className="mt-4 mb-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quizzes by title or event..."
              value={quizSearchQuery}
              onChange={(e) => setQuizSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Quiz Checkbox Chips */}
        {initialLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-purple-600" />
            Loading available quizzes...
          </div>
        ) : filteredQuizOptions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No quizzes matched your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {filteredQuizOptions.map((q) => {
              const isSelected = selectedQuizIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleQuiz(q.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/10 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>
                      {q.title}
                    </p>
                    {q.event_name && (
                      <p className="text-[11px] text-purple-600 font-semibold truncate mt-0.5">
                        {q.event_name}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* When no quiz is selected */}
      {selectedQuizIds.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center my-6">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} />
          </div>
          <h3 className="text-base font-black text-slate-800">Select At Least One Quiz</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
            Please choose 2 or more quizzes above (e.g. Week 1, Week 2, Week 3) to view the combined tournament leaderboard with score and time rankings.
          </p>
        </div>
      )}

      {selectedQuizIds.length > 0 && (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Participants
                </span>
                <Users size={16} className="text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {summary.totalParticipants || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Unique student competitors</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quizzes Aggregated
                </span>
                <Layers size={16} className="text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-600">
                {selectedQuizzesMeta.length}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Included in score total</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Highest Total Score
                </span>
                <Flame size={16} className="text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600">
                {summary.highestScore || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Tournament high score</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Average Score
                </span>
                <BarChart3 size={16} className="text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">
                {summary.averageScore || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Mean participant total</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Full Attendance
                </span>
                <CheckCircle2 size={16} className="text-teal-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-teal-600">
                {summary.perfectAttendanceCount || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Took all {selectedQuizzesMeta.length} quizzes</p>
            </div>
          </div>

          {/* Top 3 Champions Podium */}
          {leaderboardData.length > 0 && (
            <div className="bg-linear-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-400" />
                  Tournament Podium
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">Top 3 Overall Performers</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ranked by highest cumulative score with aggregate response speed tie-breaking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
                {/* Silver - 2nd Place */}
                {silver ? (
                  <div className="order-2 md:order-1 bg-white/10 backdrop-blur-md border border-slate-400/30 rounded-2xl p-5 text-center flex flex-col items-center hover:bg-white/15 transition">
                    <div className="w-12 h-12 rounded-full bg-slate-300/20 border-2 border-slate-300 flex items-center justify-center text-slate-200 mb-2 font-black text-base shadow-md">
                      2
                    </div>
                    <Medal size={28} className="text-slate-300 mb-1" />
                    <h4 className="text-sm font-extrabold text-white truncate max-w-full">{silver.name}</h4>
                    <p className="text-[11px] text-slate-300 truncate max-w-full">{silver.college || 'PRPCEM'}</p>
                    <div className="mt-3 pt-3 border-t border-white/10 w-full flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Score</span>
                        <span className="font-black text-white text-base">{silver.totalScore}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Time</span>
                        <span className="font-bold text-slate-200">{formatSeconds(silver.totalTimeTakenSeconds)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="order-2 md:order-1 hidden md:block" />
                )}

                {/* Gold - 1st Place */}
                {gold ? (
                  <div className="order-1 md:order-2 bg-linear-to-b from-amber-500/25 to-yellow-600/15 backdrop-blur-md border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col items-center shadow-2xl relative -translate-y-2">
                    <div className="absolute -top-3 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Trophy size={11} /> Champion
                    </div>
                    <div className="w-14 h-14 rounded-full bg-amber-400/30 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-2 font-black text-xl shadow-lg mt-1">
                      1
                    </div>
                    <Trophy size={34} className="text-amber-400 mb-1 drop-shadow-md" />
                    <h4 className="text-base font-black text-white truncate max-w-full">{gold.name}</h4>
                    <p className="text-xs text-amber-200 truncate max-w-full font-semibold">{gold.college || 'PRPCEM'}</p>
                    <div className="mt-4 pt-3 border-t border-amber-400/30 w-full flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-amber-200/80 block uppercase font-bold">Total Score</span>
                        <span className="font-black text-amber-300 text-xl">{gold.totalScore}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-amber-200/80 block uppercase font-bold">Total Time</span>
                        <span className="font-black text-white text-sm">{formatSeconds(gold.totalTimeTakenSeconds)}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Attended {gold.quizzesAttendedCount} / {selectedQuizzesMeta.length} Quizzes
                    </div>
                  </div>
                ) : null}

                {/* Bronze - 3rd Place */}
                {bronze ? (
                  <div className="order-3 bg-white/10 backdrop-blur-md border border-amber-700/30 rounded-2xl p-5 text-center flex flex-col items-center hover:bg-white/15 transition">
                    <div className="w-12 h-12 rounded-full bg-amber-700/20 border-2 border-amber-600 flex items-center justify-center text-amber-400 mb-2 font-black text-base shadow-md">
                      3
                    </div>
                    <Award size={28} className="text-amber-500 mb-1" />
                    <h4 className="text-sm font-extrabold text-white truncate max-w-full">{bronze.name}</h4>
                    <p className="text-[11px] text-slate-300 truncate max-w-full">{bronze.college || 'PRPCEM'}</p>
                    <div className="mt-3 pt-3 border-t border-white/10 w-full flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Score</span>
                        <span className="font-black text-white text-base">{bronze.totalScore}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Time</span>
                        <span className="font-bold text-slate-200">{formatSeconds(bronze.totalTimeTakenSeconds)}</span>
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by student name, email, or college..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Attendance Filter */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      attendanceFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({leaderboardData.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('perfect')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      attendanceFilter === 'perfect'
                        ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    100% Attendance
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('partial')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      attendanceFilter === 'partial'
                        ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Partial Attendance
                  </button>
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="score">Sort by Highest Score</option>
                  <option value="time">Sort by Fastest Time</option>
                  <option value="attendance">Sort by Attendance</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-purple-600" />
                Aggregating multi-quiz results and calculating tournament ranks...
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {leaderboardData.length === 0
                    ? 'No completed participant attempts found for the selected quizzes.'
                    : 'No participants match your filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-4 sm:px-6 w-16">Rank</th>
                      <th className="py-3 px-4 min-w-[200px]">Participant</th>
                      <th className="py-3 px-4 text-center">Total Score</th>
                      <th className="py-3 px-4 text-center">Total Time</th>
                      <th className="py-3 px-4 text-center">Attendance</th>
                      {/* Dynamic Columns for Selected Quizzes */}
                      {selectedQuizzesMeta.map((q, idx) => (
                        <th key={q.id} className="py-3 px-3 text-center min-w-[120px]">
                          <span className="block truncate font-extrabold text-purple-700" title={q.title}>
                            {q.title}
                          </span>
                          <span className="text-[10px] text-slate-400 lowercase font-normal">score / time</span>
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLeaderboard.map((student) => {
                      const isPodium = student.rank <= 3;
                      return (
                        <tr
                          key={student.key || student.email || student.name}
                          className={`hover:bg-slate-50/80 transition ${
                            student.rank === 1
                              ? 'bg-amber-50/30'
                              : student.rank === 2
                              ? 'bg-slate-100/30'
                              : student.rank === 3
                              ? 'bg-amber-100/20'
                              : ''
                          }`}
                        >
                          {/* Rank Badge */}
                          <td className="py-3.5 px-4 sm:px-6 font-black">
                            {student.rank === 1 ? (
                              <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                                1
                              </span>
                            ) : student.rank === 2 ? (
                              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs shadow-xs">
                                2
                              </span>
                            ) : student.rank === 3 ? (
                              <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold px-2">#{student.rank}</span>
                            )}
                          </td>

                          {/* Participant Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs shrink-0">
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                                  {student.name}
                                  {student.quizzesAttendedCount === selectedQuizzesMeta.length && (
                                    <span title="Attended all quizzes" className="text-emerald-600">
                                      <CheckCircle2 size={12} />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {student.email || 'No email registered'}
                                </div>
                                <div className="text-[10px] text-purple-600 font-semibold truncate">
                                  {student.college || 'PRPCEM'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Cumulative Total Score */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-slate-900 text-sm sm:text-base px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                              {student.totalScore}
                            </span>
                          </td>

                          {/* Total Time Taken */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-700 flex items-center justify-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              {formatSeconds(student.totalTimeTakenSeconds)}
                            </span>
                          </td>

                          {/* Attendance Progress */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  student.quizzesAttendedCount === selectedQuizzesMeta.length
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {student.quizzesAttendedCount} / {selectedQuizzesMeta.length}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {student.attendancePercentage}%
                              </span>
                            </div>
                          </td>

                          {/* Dynamic Quiz Columns */}
                          {selectedQuizzesMeta.map((q) => {
                            const bd = student.quizBreakdown?.[q.id];
                            const attended = bd && bd.status !== 'not_attended';
                            return (
                              <td key={q.id} className="py-3.5 px-3 text-center">
                                {attended ? (
                                  <div className="inline-block px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-left">
                                    <div className="font-extrabold text-slate-900 text-xs">
                                      {bd.score} pts
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Clock size={9} />
                                      {formatSeconds(bd.timeTakenSeconds)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] font-medium">
                                    Absent
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Accuracy */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-700">
                              {student.accuracyPercentage}%
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {student.totalCorrectAnswers} correct
                            </span>
                          </td>
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
  );
}
