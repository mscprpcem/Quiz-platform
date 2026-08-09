import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Calendar, Clock, Award, ShieldAlert, CheckCircle, 
  ChevronRight, Play, Sparkles, Layers, ArrowRight, User, AlertCircle, RefreshCw 
} from 'lucide-react';
import api from '../services/api';

export default function WeeklyLeague() {
  const navigate = useNavigate();
  const [activeLeague, setActiveLeague] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'weeklyLeaderboard', 'cumulativeLeaderboard', 'myProgress'

  // User Identifiers
  const [userName, setUserName] = useState(localStorage.getItem('msc_user_name') || '');
  const [userId, setUserId] = useState(localStorage.getItem('msc_user_id') || '');
  const [userCollege, setUserCollege] = useState(localStorage.getItem('msc_user_college') || '');
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [pendingStartWeek, setPendingStartWeek] = useState(null);

  // Leaderboard data states
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [cumulativeLeaderboard, setCumulativeLeaderboard] = useState([]);
  const [myProgress, setMyProgress] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    fetchLeagueData();
  }, []);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      const storedUserId = userId || localStorage.getItem('msc_user_id');
      const res = await api.get(`/api/weekly-league/active?userId=${storedUserId || ''}`);
      
      if (res.data.success) {
        setActiveLeague(res.data.activeLeague);
        setWeeks(res.data.weeks || []);
        setCurrentWeek(res.data.currentWeek);
      }
    } catch (err) {
      console.error('Fetch league data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboardData = async (tab) => {
    setActiveTab(tab);
    if (!activeLeague) return;

    try {
      setLoadingLeaderboard(true);
      if (tab === 'weeklyLeaderboard' && currentWeek) {
        const res = await api.get(`/api/weekly-league/weeks/${currentWeek.id}/leaderboard`);
        if (res.data.success) setWeeklyLeaderboard(res.data.leaderboard || []);
      } else if (tab === 'cumulativeLeaderboard') {
        const res = await api.get(`/api/weekly-league/leagues/${activeLeague.id}/leaderboard`);
        if (res.data.success) setCumulativeLeaderboard(res.data.leaderboard || []);
      } else if (tab === 'myProgress') {
        const uid = userId || localStorage.getItem('msc_user_id');
        if (uid) {
          const res = await api.get(`/api/weekly-league/my-progress?userId=${uid}&leagueId=${activeLeague.id}`);
          if (res.data.success) setMyProgress(res.data);
        }
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleStartAttemptClick = (week) => {
    if (!userName || !userId) {
      setPendingStartWeek(week);
      setShowIdentityModal(true);
      return;
    }
    initiateAttempt(week);
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const generatedId = userId || `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('msc_user_name', userName.trim());
    localStorage.setItem('msc_user_id', generatedId);
    localStorage.setItem('msc_user_college', userCollege.trim() || 'MSC Student');

    setUserId(generatedId);
    setShowIdentityModal(false);

    if (pendingStartWeek) {
      initiateAttempt(pendingStartWeek, generatedId);
      setPendingStartWeek(null);
    }
  };

  const initiateAttempt = async (week, explicitUserId = null) => {
    try {
      const uid = explicitUserId || userId;
      const res = await api.post(`/api/weekly-league/weeks/${week.id}/attempt`, {
        userId: uid,
        userName,
        userCollege: userCollege || 'MSC Student'
      });

      if (res.data.success && res.data.attemptId) {
        navigate(`/weekly-league/quiz/${res.data.attemptId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start quiz attempt');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3 text-brand-blue font-extrabold text-sm">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading Weekly Tech League...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5FAFF] py-10 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* ════════ 1. HERO BANNER ════════ */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} className="animate-pulse" />
              <span>Official Flagship Event</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {activeLeague?.name || 'Weekly Tech League'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {activeLeague?.description || 'Compete across 8 weeks of specialized engineering topics. Top scores each week accumulate toward the overall MSC Tech Championship trophy!'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold text-slate-300 pt-2">
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Calendar size={14} className="text-amber-400" />
                <span>8 Weeks Duration</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Award size={14} className="text-emerald-400" />
                <span>Cumulative Standings</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <ShieldAlert size={14} className="text-blue-400" />
                <span>Anti-Cheat Enabled</span>
              </div>
            </div>
          </div>

          {/* Quick Active Week Action Box */}
          {currentWeek && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full md:w-80 text-left space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
                  Week {currentWeek.week_number} Active
                </span>
                <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  OPEN
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">{currentWeek.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{currentWeek.technology} Topic Challenge</p>
              </div>

              <button
                onClick={() => handleStartAttemptClick(currentWeek)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <Play size={14} fill="currentColor" />
                <span>Start Weekly Quiz</span>
              </button>
            </div>
          )}
        </div>

        {/* ════════ 2. NAVIGATION TABS ════════ */}
        <div className="flex border-b border-brand-border space-x-4 sm:space-x-8 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: '8-Week Schedule', icon: Calendar },
            { id: 'weeklyLeaderboard', label: 'Weekly Leaderboard', icon: Trophy },
            { id: 'cumulativeLeaderboard', label: 'Cumulative Standings', icon: Award },
            { id: 'myProgress', label: 'My Progress', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => loadLeaderboardData(tab.id)}
                className={`flex items-center space-x-2 py-3 px-2 font-extrabold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'border-brand-blue text-brand-blue bg-brand-lightBlue/30 rounded-t-lg' 
                    : 'border-transparent text-brand-textMuted hover:text-brand-textMain'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ════════ 3. TAB CONTENT ════════ */}

        {/* TAB 1: OVERVIEW / 8-WEEK ROADMAP */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-brand-textMain">Weekly Schedule & Challenges</h2>
              <span className="text-xs text-brand-textMuted font-medium">Independent session timers apply per attempt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {weeks.map((w) => {
                const isOpen = w.status === 'open';
                const isUpcoming = w.status === 'upcoming';
                const isClosed = w.status === 'closed' || w.status === 'finalized';

                return (
                  <div
                    key={w.id}
                    className={`bg-white border rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                      isOpen ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          Week {w.week_number}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isOpen 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                            : isClosed 
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {w.status}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">{w.technology}</span>
                        <h4 className="text-base font-extrabold text-brand-textMain mt-0.5">{w.title}</h4>
                        <p className="text-xs text-brand-textMuted mt-1.5 leading-relaxed font-medium line-clamp-2">
                          {w.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-brand-textMuted font-bold flex items-center gap-1">
                        <Clock size={12} />
                        {w.settings?.timeLimit || 30} mins
                      </span>

                      {isOpen ? (
                        <button
                          onClick={() => handleStartAttemptClick(w)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Start</span>
                          <ArrowRight size={12} />
                        </button>
                      ) : isClosed ? (
                        <span className="text-xs text-slate-400 font-bold">Closed</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-bold">Upcoming</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY LEADERBOARD */}
        {activeTab === 'weeklyLeaderboard' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-brand-textMain">Weekly Standings</h3>
                <p className="text-xs text-brand-textMuted">{currentWeek?.title || 'Current Active Week'}</p>
              </div>
            </div>

            {loadingLeaderboard ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">Loading standings...</div>
            ) : weeklyLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">No attempts recorded for this week yet. Be the first!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Correct</th>
                      <th className="py-3 px-4">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-brand-textMain">
                    {weeklyLeaderboard.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors font-semibold">
                        <td className="py-3.5 px-4 font-black">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            item.rank === 2 ? 'bg-slate-200 text-slate-800' :
                            item.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-slate-600'
                          }`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.user_name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.user_college || 'Student'}</td>
                        <td className="py-3.5 px-4 font-black text-brand-blue text-sm">{item.score} pts</td>
                        <td className="py-3.5 px-4 text-emerald-600">{item.correct_count}</td>
                        <td className="py-3.5 px-4 text-slate-500">{Math.floor(item.time_taken / 60)}m {item.time_taken % 60}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUMULATIVE LEADERBOARD */}
        {activeTab === 'cumulativeLeaderboard' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-brand-textMain">Overall Cumulative Standings</h3>
                <p className="text-xs text-brand-textMuted">Cumulative points accumulated across all completed weeks</p>
              </div>
            </div>

            {loadingLeaderboard ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">Calculating cumulative standings...</div>
            ) : cumulativeLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">No cumulative standings calculated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Overall Rank</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Weeks Played</th>
                      <th className="py-3 px-4">Total Cumulative Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-brand-textMain">
                    {cumulativeLeaderboard.map((item) => (
                      <tr key={item.user_id} className="hover:bg-slate-50/80 transition-colors font-semibold">
                        <td className="py-3.5 px-4 font-black">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300 font-black' :
                            item.rank === 2 ? 'bg-slate-200 text-slate-800 font-black' :
                            item.rank === 3 ? 'bg-orange-100 text-orange-800 font-black' : 'text-slate-600'
                          }`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.user_name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.user_college || 'Student'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-extrabold">{item.weeksCompleted} / {weeks.length}</td>
                        <td className="py-3.5 px-4 font-black text-amber-600 text-base">{item.totalScore} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY PROGRESS */}
        {activeTab === 'myProgress' && (
          <div className="space-y-6">
            {!userId ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <User size={32} className="mx-auto text-slate-400" />
                <h3 className="text-base font-extrabold text-brand-textMain">Identify Yourself</h3>
                <p className="text-xs text-brand-textMuted max-w-sm mx-auto">
                  Enter your student name and email to view your personalized weekly quiz attempts and cumulative rank.
                </p>
                <button
                  onClick={() => setShowIdentityModal(true)}
                  className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Set Credentials
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Score</span>
                    <div className="text-3xl font-black text-amber-500">{myProgress?.totalScore || 0} pts</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weeks Completed</span>
                    <div className="text-3xl font-black text-brand-blue">{myProgress?.weeksCompleted || 0} / {weeks.length}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-1 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Name</span>
                    <div className="text-lg font-black text-slate-800 truncate">{userName}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-base font-black text-brand-textMain">Attempt History</h3>
                  {(!myProgress?.results || myProgress.results.length === 0) ? (
                    <p className="text-xs text-slate-400">No submitted attempts recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {myProgress.results.map((res) => (
                        <div key={res.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100 text-xs font-bold">
                          <div>
                            <div className="font-extrabold text-slate-900">{res.leagueWeek?.title || 'Weekly Challenge'}</div>
                            <span className="text-slate-400 text-[10px]">Rank #{res.rank || 'N/A'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-brand-blue font-black">{res.score} pts</div>
                            <span className="text-emerald-600 text-[10px]">{res.correct_count} correct</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ IDENTITY MODAL ════════ */}
        {showIdentityModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in text-left">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Participant Credentials</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please enter your student details before starting the weekly challenge attempt.
                </p>
              </div>

              <form onSubmit={handleSaveIdentity} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:border-brand-blue focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">College / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. PRPCEM Amravati"
                    value={userCollege}
                    onChange={(e) => setUserCollege(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:border-brand-blue focus:outline-none bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
                >
                  Save & Continue to Quiz
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
