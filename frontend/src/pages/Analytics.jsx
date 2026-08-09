import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  ArrowLeft, Users, Clock, HelpCircle, TrendingUp, Percent, CheckCircle, 
  FileSpreadsheet, AlertTriangle, BookOpen, Trophy, Zap, RefreshCw, BarChart2
} from 'lucide-react';

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      if (!id || id === 'all' || id === 'global') {
        const res = await api.get('/api/analytics/global');
        setData(res.data);
      } else {
        const res = await api.get(`/api/analytics/quiz/${id}`);
        setData(res.data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const handleExport = (endpoint, format) => {
    if (!id || id === 'all') {
      alert('Please select a specific quiz to export scoreboard or response data.');
      return;
    }

    api.get(`/api/export/quiz/${id}/${endpoint}?format=${format}`, {
      responseType: 'blob'
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileExt = format === 'csv' ? 'csv' : 'xlsx';
        link.setAttribute('download', `${endpoint}_report.${fileExt}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((err) => {
        console.error('Error exporting data:', err);
        alert('Failed to generate export file.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-brand-blue font-extrabold text-sm">
        <RefreshCw size={24} className="animate-spin" />
        <span>Compiling Analytics Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-sm my-8">
        <AlertTriangle size={40} className="mx-auto text-amber-500" />
        <h3 className="text-lg font-black text-slate-900">Analytics Load Notice</h3>
        <p className="text-xs text-slate-500 font-medium">{error}</p>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="px-6 py-2.5 bg-brand-blue text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer"
        >
          View Quiz List
        </button>
      </div>
    );
  }

  // ════════ RENDER GLOBAL PLATFORM ANALYTICS ════════
  if (data?.global) {
    return (
      <div className="space-y-8 text-left font-segoe">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500"></div>
          <div>
            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block">System Overview</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Global Platform Analytics</h1>
            <p className="text-xs text-slate-500 font-medium">Aggregated metrics across live realtime quizzes, weekly leagues, and custom tests.</p>
          </div>

          <button
            onClick={() => navigate('/admin/quizzes')}
            className="px-4 py-2.5 bg-brand-blue text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-sm"
          >
            Manage All Quizzes
          </button>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
            <div className="w-10 h-10 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center font-black">
              <Zap size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Quizzes</span>
            <p className="text-3xl font-black text-slate-900">{data.totalQuizzes}</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Participants</span>
            <p className="text-3xl font-black text-slate-900">{data.totalParticipants}</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
              <HelpCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question Submissions</span>
            <p className="text-3xl font-black text-slate-900">{data.totalAnswers}</p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">
              <Percent size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Accuracy Rate</span>
            <p className="text-3xl font-black text-slate-900">{data.accuracyRate}%</p>
          </div>
        </div>

        {/* Recent Quizzes List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900">Recent Quiz Sessions & Stats</h3>

          {data.recentQuizzes?.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No active or historical quiz sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Quiz Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Participants</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentQuizzes?.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{q.title}</td>
                      <td className="py-3.5 px-4 text-slate-600">{q.subject}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          q.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-brand-blue">{q.participants} players</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => navigate(`/admin/analytics/${q.id}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-brand-blue hover:text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          View Analytics
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ════════ RENDER PER-QUIZ ANALYTICS ════════
  return (
    <div className="space-y-8 text-left font-segoe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500"></div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer bg-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data?.eventName || 'Quiz Session'}</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">{data?.quizTitle} Analytics</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('results', 'excel')}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Export Scoreboard</span>
          </button>
        </div>
      </div>

      {/* Summary statistics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-50 text-brand-blue rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Joined</span>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">{data?.totalParticipants}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</span>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">{data?.averageResponseTime}s</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Highest Score</span>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">{data?.highestScore}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center">
            <Percent size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Completion Rate</span>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">{data?.completionPercentage}%</p>
          </div>
        </div>
      </div>

      {data?.totalParticipants > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <CheckCircle size={16} className="text-emerald-500 mr-1.5" />
                <span>Accuracy Rate Per Question</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.accuracyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis unit="%" stroke="#64748b" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => [`${value}%`, 'Accuracy']} />
                    <Bar dataKey="Accuracy" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Time chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Clock size={16} className="text-brand-blue mr-1.5" />
                <span>Average Response Speed Per Question</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.speedChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis unit="s" stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => [`${value}s`, 'Avg Response Time']} />
                    <Area type="monotone" dataKey="Avg Speed (s)" stroke="#2563eb" fillOpacity={1} fill="url(#speedColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Details Table accuracy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 mb-4">Question-by-Question Diagnostics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Question Text</th>
                    <th className="px-6 py-3">Accuracy</th>
                    <th className="px-6 py-3">Avg Response Time</th>
                    <th className="px-6 py-3">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data?.questionAccuracy?.map((q) => (
                    <tr key={q.questionId} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td className="px-6 py-4 font-bold text-slate-400">Q{q.index}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 max-w-sm truncate" title={q.questionText}>{q.questionText}</td>
                      <td className="px-6 py-4 font-bold text-brand-blue">{q.accuracy}%</td>
                      <td className="px-6 py-4">{q.avgResponseTime} seconds</td>
                      <td className="px-6 py-4">{q.correctCount} / {q.totalSubmissions} players correct</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-semibold shadow-sm">
          No participants joined or submitted answers for this quiz session yet.
        </div>
      )}

    </div>
  );
}
