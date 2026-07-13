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
      <div className="text-center py-20 text-zinc-500 font-semibold">
        Compiling analytics dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-microsoft-border p-6 rounded-xl shadow-sm gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data?.eventName}</span>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-0.5">{data?.quizTitle} Analytics</h1>
          </div>
        </div>

        {/* Exports Dropdowns */}
        <div className="flex flex-wrap gap-2.5">
          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-microsoft-success hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer">
              <FileSpreadsheet size={14} />
              <span>Export Scoreboard</span>
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg hidden group-hover:block w-36 z-50 text-left py-1 text-xs">
              <button onClick={() => handleExport('results', 'excel')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-700 font-medium">Excel (.xlsx)</button>
              <button onClick={() => handleExport('results', 'csv')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-700 font-medium">CSV (.csv)</button>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-microsoft-success hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer">
              <FileSpreadsheet size={14} />
              <span>Export Responses</span>
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg hidden group-hover:block w-36 z-50 text-left py-1 text-xs">
              <button onClick={() => handleExport('responses', 'excel')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-700 font-medium">Excel (.xlsx)</button>
              <button onClick={() => handleExport('responses', 'csv')} className="w-full text-left px-4 py-2 hover:bg-zinc-50 text-zinc-700 font-medium">CSV (.csv)</button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary statistics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Joined */}
        <div className="bg-white border border-microsoft-border p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-microsoft-lightBlue text-microsoft-blue rounded-lg flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Joined</span>
            <p className="text-xl font-bold text-zinc-800 leading-none mt-1">{data?.totalParticipants}</p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-microsoft-border p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-zinc-100 text-zinc-500 rounded-lg flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Avg Response</span>
            <p className="text-xl font-bold text-zinc-800 leading-none mt-1">{data?.averageResponseTime}s</p>
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white border border-microsoft-border p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-emerald-50 text-microsoft-success rounded-lg flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Highest Score</span>
            <p className="text-xl font-bold text-zinc-800 leading-none mt-1">{data?.highestScore}</p>
          </div>
        </div>

        {/* Completion % */}
        <div className="bg-white border border-microsoft-border p-5 rounded-xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <Percent size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Completion Rate</span>
            <p className="text-xl font-bold text-zinc-800 leading-none mt-1">{data?.completionPercentage}%</p>
          </div>
        </div>
      </div>

      {data?.totalParticipants > 0 ? (
        <>
          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy chart */}
            <div className="bg-white border border-microsoft-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center">
                <CheckCircle size={16} className="text-microsoft-success mr-1.5" />
                <span>Accuracy Rate Per Question</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.accuracyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis unit="%" stroke="#a1a1aa" domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                    <Bar dataKey="Accuracy" fill="#0078d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Response Time chart */}
            <div className="bg-white border border-microsoft-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center">
                <Clock size={16} className="text-microsoft-blue mr-1.5" />
                <span>Average Response Speed Per Question</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.speedChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="speedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                    <XAxis dataKey="name" stroke="#a1a1aa" />
                    <YAxis unit="s" stroke="#a1a1aa" />
                    <Tooltip formatter={(value) => [`${value}s`, 'Avg Response Time']} />
                    <Area type="monotone" dataKey="Avg Speed (s)" stroke="#0078d4" fillOpacity={1} fill="url(#speedColor)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score distribution */}
            <div className="bg-white border border-microsoft-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center">
                <TrendingUp size={16} className="text-purple-600 mr-1.5" />
                <span>Score Distribution Ranges</span>
              </h3>
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f2f1" />
                    <XAxis dataKey="range" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip formatter={(value) => [value, 'Players']} />
                    <Bar dataKey="Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* General Highlights */}
            <div className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 flex items-center">
                <AlertTriangle className="text-microsoft-warning mr-1.5" size={16} />
                <span>Quiz Highlights & Flags</span>
              </h3>
              <div className="divide-y divide-zinc-100 flex-grow py-2 text-sm text-zinc-700">
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-zinc-500">Most Missed Question:</span>
                  <span className="font-bold text-zinc-800 text-right max-w-[200px] truncate" title={data?.mostMissedQuestion}>
                    {data?.mostMissedQuestion}
                  </span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-zinc-500">Lowest Score Registered:</span>
                  <span className="font-bold text-zinc-800">{data?.lowestScore} points</span>
                </div>
                <div className="py-3.5 flex justify-between">
                  <span className="font-semibold text-zinc-500">Total Questions released:</span>
                  <span className="font-bold text-zinc-800">{data?.totalQuestions} Questions</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/admin/quizzes/${id}`)}
                className="w-full text-center border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-semibold py-2 rounded text-xs transition-all mt-4"
              >
                Review Question Set
              </button>
            </div>
          </div>

          {/* Details Table accuracy */}
          <div className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-4 mb-4">Question-by-Question Diagnostics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Question Text</th>
                    <th className="px-6 py-3">Accuracy</th>
                    <th className="px-6 py-3">Avg Response Time</th>
                    <th className="px-6 py-3">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {data?.questionAccuracy.map((q) => (
                    <tr key={q.questionId} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-500">Q{q.index}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-800 max-w-sm truncate" title={q.questionText}>{q.questionText}</td>
                      <td className="px-6 py-4 font-bold text-microsoft-blue">{q.accuracy}%</td>
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
        <div className="bg-white border border-microsoft-border rounded-xl p-12 text-center text-zinc-500 font-semibold">
          No participants joined or submitted answers. Run a quiz session first to capture statistical analytics.
        </div>
      )}
    </div>
  );
}
