import React, { useEffect, useState } from 'react';
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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  ArrowLeft,
  Users,
  Clock,
  HelpCircle,
  TrendingUp,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export default function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/analytics/quiz/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const handleExport = (endpoint, format) => {
    // Navigate or trigger download by opening file in a new window with credentials
    // We will append token in query parameter if needed, but since it's a GET file download,
    // let's fetch it using axios and download it via blob so headers are attached.
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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-brand-textMuted font-semibold animate-pulse text-sm">
        Compiling analytics dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-brand-border p-6 rounded-2xl shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
        <div className="flex items-center space-x-4 relative z-10">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 border border-brand-border hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain rounded-xl transition-all cursor-pointer bg-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">{data?.eventName}</span>
            <h1 className="text-xl sm:text-2xl font-black text-brand-textMain tracking-tight mt-0.5">{data?.quizTitle} Analytics</h1>
          </div>
        </div>



          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">
              <FileSpreadsheet size={14} />
              <span>Export Scoreboard</span>
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-lg hidden group-hover:block w-36 z-50 text-left py-1 text-xs text-zinc-850">
              <button onClick={() => handleExport('results', 'excel')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-650 font-medium cursor-pointer">Excel (.xlsx)</button>
              <button onClick={() => handleExport('results', 'csv')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-650 font-medium cursor-pointer">CSV (.csv)</button>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">
              <FileSpreadsheet size={14} />
              <span>Export Responses</span>
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-lg hidden group-hover:block w-36 z-50 text-left py-1 text-xs text-zinc-850">
              <button onClick={() => handleExport('responses', 'excel')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-650 font-medium cursor-pointer">Excel (.xlsx)</button>
              <button onClick={() => handleExport('responses', 'csv')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-650 font-medium cursor-pointer">CSV (.csv)</button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary statistics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Joined */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-brand-lightBlue text-brand-blue rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-textMuted uppercase">Joined</span>
            <p className="text-xl font-black text-brand-textMain leading-none mt-1">{data?.totalParticipants}</p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-textMuted uppercase">Avg Response</span>
            <p className="text-xl font-black text-brand-textMain leading-none mt-1">{data?.averageResponseTime}s</p>
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-textMuted uppercase">Highest Score</span>
            <p className="text-xl font-black text-brand-textMain leading-none mt-1">{data?.highestScore}</p>
          </div>
        </div>

        {/* Completion % */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center">
            <Percent size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-textMuted uppercase">Completion Rate</span>
            <p className="text-xl font-black text-brand-textMain leading-none mt-1">{data?.completionPercentage}%</p>
          </div>
        </div>
      </div>

      {data?.totalParticipants > 0 ? (
        <>
          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy chart */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-brand-textMain flex items-center">
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
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-brand-textMain flex items-center">
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

            {/* Score distribution */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-brand-textMain flex items-center">
                <TrendingUp size={16} className="text-purple-650 mr-1.5" />
                <span>Score Distribution Ranges</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="range" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b' }} formatter={(value) => [value, 'Players']} />
                    <Bar dataKey="Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* General Highlights */}
            <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-brand-textMain border-b border-brand-border pb-3 flex items-center">
                <AlertTriangle className="text-amber-500 mr-1.5" size={16} />
                <span>Quiz Highlights & Flags</span>
              </h3>
              <div className="divide-y divide-brand-border flex-grow py-2 text-sm text-zinc-650">
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-brand-textMuted">Most Missed Question:</span>
                  <span className="font-bold text-brand-textMain text-right max-w-[200px] truncate" title={data?.mostMissedQuestion}>
                    {data?.mostMissedQuestion}
                  </span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-brand-textMuted">Lowest Score Registered:</span>
                  <span className="font-bold text-brand-textMain">{data?.lowestScore} points</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-brand-textMuted">Total Questions released:</span>
                  <span className="font-bold text-brand-textMain">{data?.totalQuestions} Questions</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/quizzes/${id}`)}
                className="w-full text-center border border-brand-border hover:bg-zinc-50 text-zinc-650 hover:text-brand-textMain font-semibold py-2 rounded-xl text-xs transition-all mt-4 cursor-pointer bg-white"
              >
                Review Question Set
              </button>
            </div>
          </div>

          {/* Details Table accuracy */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-brand-textMain border-b border-brand-border pb-4 mb-4">Question-by-Question Diagnostics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border text-sm text-left">
                <thead className="bg-zinc-50 text-brand-textMuted uppercase text-[9px] font-bold tracking-wider border-b border-brand-border">
                  <tr>
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Question Text</th>
                    <th className="px-6 py-3">Accuracy</th>
                    <th className="px-6 py-3">Avg Response Time</th>
                    <th className="px-6 py-3">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-zinc-650">
                  {data?.questionAccuracy.map((q) => (
                    <tr key={q.questionId} className="hover:bg-zinc-50/80 transition-colors border-b border-brand-border">
                      <td className="px-6 py-4 font-bold text-brand-textMuted">Q{q.index}</td>
                      <td className="px-6 py-4 font-semibold text-brand-textMain max-w-sm truncate" title={q.questionText}>{q.questionText}</td>
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
        <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-brand-textMuted font-semibold shadow-sm">
          No participants joined or submitted answers. Run a quiz session first to capture statistical analytics.
        </div>
      )}


    </div>
  );
}
