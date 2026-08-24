import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ShieldCheck,
  Award,
  Loader2
} from 'lucide-react';

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'results' | 'responses' | null
  const [exportLoading, setExportLoading] = useState(null); // 'results_excel' | 'results_csv' | 'responses_excel' | 'responses_csv' | null

  const scoreboardRef = useRef(null);
  const responsesRef = useRef(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/analytics/quiz/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        scoreboardRef.current && !scoreboardRef.current.contains(e.target) &&
        responsesRef.current && !responsesRef.current.contains(e.target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (endpoint, format) => {
    const exportKey = `${endpoint}_${format}`;
    try {
      setExportLoading(exportKey);
      const response = await api.get(`/api/export/quiz/${id}/${endpoint}?format=${format}`, {
        responseType: 'blob'
      });
      const fileExt = format === 'csv' ? 'csv' : 'xlsx';
      const cleanQuizName = (data?.quizTitle || 'quiz').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${endpoint === 'results' ? 'Leaderboard' : 'Responses'}_${cleanQuizName}.${fileExt}`;

      const blob = new Blob([response.data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setActiveDropdown(null);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to generate export file. Please ensure there is data to export.');
    } finally {
      setExportLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-semibold text-sm">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span>Compiling analytics dashboard...</span>
        </div>
      </div>
    );
  }

  const isScheduled = Boolean(data?.isScheduled);

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* ════════ HEADER ════════ */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs relative">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-3xl"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pt-1">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(isScheduled ? `/admin/scheduled-quizzes/${id}` : '/admin/quizzes')}
              className="p-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl transition-all cursor-pointer bg-white shadow-2xs"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {isScheduled ? 'Scheduled Assessment' : (data?.eventName || 'Live Quiz')}
                </span>
                {isScheduled && data?.category && (
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {data.category}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                {data?.quizTitle} Analytics
              </h1>
            </div>
          </div>

          {/* Export Action Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* 1. Export Scoreboard Dropdown */}
            <div className="relative" ref={scoreboardRef}>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'results' ? null : 'results')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {exportLoading?.startsWith('results') ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={15} />
                )}
                <span>Export Scoreboard</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'results' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'results' && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-44 py-1.5 text-left text-xs font-bold text-slate-800 animate-fade-in divide-y divide-slate-100">
                  <button
                    onClick={() => handleExport('results', 'excel')}
                    disabled={Boolean(exportLoading)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('results', 'csv')}
                    disabled={Boolean(exportLoading)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-blue-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Export Detailed Responses Dropdown */}
            <div className="relative" ref={responsesRef}>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'responses' ? null : 'responses')}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {exportLoading?.startsWith('responses') ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={15} />
                )}
                <span>Export Responses</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === 'responses' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'responses' && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-44 py-1.5 text-left text-xs font-bold text-slate-800 animate-fade-in divide-y divide-slate-100">
                  <button
                    onClick={() => handleExport('responses', 'excel')}
                    disabled={Boolean(exportLoading)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('responses', 'csv')}
                    disabled={Boolean(exportLoading)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-blue-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ════════ SUMMARY KPI CARDS ════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Participants / Attempts */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs flex items-center space-x-4">
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {isScheduled ? 'Unique Students' : 'Joined'}
            </span>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1">{data?.totalParticipants || 0}</p>
            {isScheduled && data?.totalAttempts > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">{data.totalAttempts} total attempts</span>
            )}
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs flex items-center space-x-4">
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Duration</span>
            <p className="text-2xl font-black text-slate-900 leading-none mt-1">
              {data?.averageResponseTime || 0}s
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">Per participant</span>
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs flex items-center space-x-4">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Top Score</span>
            <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{data?.highestScore || 0}</p>
            <span className="text-[10px] text-slate-400 font-semibold">Lowest: {data?.lowestScore || 0}</span>
          </div>
        </div>

        {/* Completion % */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs flex items-center space-x-4">
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black">
            <Percent size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completion</span>
            <p className="text-2xl font-black text-purple-700 leading-none mt-1">{data?.completionPercentage || 0}%</p>
            <span className="text-[10px] text-slate-400 font-semibold">{data?.totalQuestions || 0} Questions</span>
          </div>
        </div>

        {/* Proctoring Violations */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs flex items-center space-x-4 col-span-2 md:col-span-1">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${
            (data?.violationCount || 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Violations</span>
            <p className={`text-2xl font-black leading-none mt-1 ${
              (data?.violationCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {data?.violationCount || 0}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">Tab switches & blur</span>
          </div>
        </div>
      </div>

      {/* ════════ CHARTS & BREAKDOWN ════════ */}
      {(data?.totalParticipants > 0 || (data?.totalAttempts || 0) > 0 || (data?.accuracyChart && data.accuracyChart.length > 0)) ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Accuracy Rate Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <CheckCircle size={17} className="text-emerald-500" />
                  <span>Accuracy Rate Per Question</span>
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase">Correct Submission %</span>
              </div>
              
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.accuracyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis unit="%" stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    <Bar dataKey="Accuracy" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Speed Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Clock size={17} className="text-blue-600" />
                  <span>Average Time Per Question (seconds)</span>
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase">Speed Analysis</span>
              </div>

              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.speedChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis unit="s" stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value) => [`${value}s`, 'Avg Time']}
                    />
                    <Area type="monotone" dataKey="Avg Speed (s)" stroke="#6366f1" fillOpacity={1} fill="url(#speedGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution Ranges */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <TrendingUp size={17} className="text-purple-600" />
                  <span>Score Distribution Ranges</span>
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase">Candidate Spread</span>
              </div>

              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(value) => [value, 'Participants']}
                    />
                    <Bar dataKey="Count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assessment Highlights & Flags */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                  <Award className="text-amber-500" size={17} />
                  <span>Performance Highlights & Summary</span>
                </h3>

                <div className="divide-y divide-slate-100 py-2 text-xs font-medium text-slate-700">
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Most Missed Question:</span>
                    <span className="font-extrabold text-slate-900 text-right max-w-[220px] truncate" title={data?.mostMissedQuestion}>
                      {data?.mostMissedQuestion || 'None'}
                    </span>
                  </div>

                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Lowest Score Recorded:</span>
                    <span className="font-extrabold text-rose-600">{data?.lowestScore || 0} pts</span>
                  </div>

                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Total Questions in Bank:</span>
                    <span className="font-extrabold text-slate-900">{data?.totalQuestions || 0} Questions</span>
                  </div>

                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Proctoring Violations Logged:</span>
                    <span className={`font-extrabold ${(data?.violationCount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {data?.violationCount || 0} Recorded
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(isScheduled ? `/admin/scheduled-quizzes/${id}` : `/admin/quizzes/${id}`)}
                className="w-full text-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer bg-white"
              >
                {isScheduled ? 'Manage Scheduled Occurrences & Attempts' : 'Review Live Question Set'}
              </button>
            </div>

          </div>

          {/* Question-by-Question Diagnostics Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Question-by-Question Detailed Diagnostics</h3>
                <p className="text-xs text-slate-500 font-medium">Individual item difficulty, accuracy rate, and response speeds.</p>
              </div>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                {data?.questionAccuracy?.length || 0} Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Question Text</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Avg Speed</th>
                    <th className="py-3 px-4">Correct Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.questionAccuracy || []).map((q) => (
                    <tr key={q.questionId || q.index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-400">Q{q.index}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-md truncate" title={q.questionText}>
                        {q.questionText}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                          q.accuracy >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          q.accuracy >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {q.accuracy}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{q.avgResponseTime}s</td>
                      <td className="py-3.5 px-4 text-slate-700 font-bold">
                        {q.correctCount} / {q.totalSubmissions} submitted
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scheduled Occurrences Stats (if scheduled quiz) */}
          {isScheduled && Array.isArray(data?.occurrences) && data.occurrences.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900">Occurrence Slot Performance Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Occurrence</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Attempts</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.occurrences.map((occ) => (
                      <tr key={occ.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{occ.title}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700">
                            {occ.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{occ.attemptCount}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">{occ.completedCount}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">{occ.averageScore} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-medium shadow-2xs space-y-2">
          <p className="font-bold text-slate-700 text-sm">No attempts or participant answers recorded yet.</p>
          <p className="text-xs text-slate-400">
            {isScheduled
              ? 'Share the short link or direct QR code with students to start collecting submissions.'
              : 'Launch a live session from the quiz catalog to begin capturing metrics.'}
          </p>
        </div>
      )}

      </div>
    </div>
  );
}
