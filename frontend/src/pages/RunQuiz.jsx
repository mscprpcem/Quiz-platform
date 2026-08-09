import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Square, Copy, Check, ExternalLink, Monitor, Share2, Users, 
  CheckSquare, Clock, BarChart2, Target, Trophy, RefreshCw, ChevronRight,
  ArrowLeft, ShieldCheck, Play
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

export default function RunQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${id}`);
      setQuiz(res.data);
    } catch (err) {
      console.error('Fetch quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    const code = quiz?.join_code || 'DSA1725';
    navigator.clipboard.writeText(code);
    setCopyCodeFeedback(true);
    setTimeout(() => setCopyCodeFeedback(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `https://${window.location.host}/join/${quiz?.join_code || 'DSA1725'}`;
    navigator.clipboard.writeText(link);
    setCopyLinkFeedback(true);
    setTimeout(() => setCopyLinkFeedback(false), 2000);
  };

  const handleEndQuiz = async () => {
    if (!window.confirm('Are you sure you want to end this Live Quiz session?')) return;
    try {
      await api.put(`/api/quizzes/${id}/end`);
      fetchQuiz();
    } catch (err) {
      alert('Failed to end quiz.');
    }
  };

  // Mocked/Calculated Values to match exact mockup
  const title = quiz?.title || 'DSA Rapid Fire';
  const joinCode = quiz?.join_code || 'DSA1725';
  const joinLink = `https://${window.location.host}/join/${joinCode}`;

  const topMetrics = [
    { label: 'Total Participants', value: '126', sub: 'Live Now', icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Answered', value: '78', sub: '61.9%', icon: CheckSquare, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Time Elapsed', value: '12m 34s', sub: 'Live Timer', icon: Clock, color: 'bg-orange-100 text-orange-600' },
    { label: 'Average Score', value: '72.4%', sub: 'Avg Accuracy', icon: BarChart2, color: 'bg-blue-100 text-blue-600' },
    { label: 'Questions', value: `${quiz?.questionCount || 15}`, sub: 'MCQ', icon: Target, color: 'bg-red-100 text-red-600' },
    { label: 'Top Score', value: '100/100', sub: 'Amit Kumar', icon: Trophy, color: 'bg-purple-100 text-purple-600' }
  ];

  const donutData = [
    { name: 'Active', value: 98, percentage: '77.8%', color: '#3b82f6' },
    { name: 'Answered', value: 78, percentage: '61.9%', color: '#10b981' },
    { name: 'Not Answered', value: 28, percentage: '22.2%', color: '#f59e0b' },
    { name: 'Left', value: 5, percentage: '4.0%', color: '#ef4444' }
  ];

  const barData = [
    { range: '0-20', count: 5 },
    { range: '21-40', count: 12 },
    { range: '41-60', count: 24 },
    { range: '61-80', count: 38 },
    { range: '81-100', count: 47 }
  ];

  const activityFeed = [
    { text: 'Rohan Kumar joined the quiz', time: '10:12:45 AM', type: 'user' },
    { text: 'Priya Sharma answered Question 5', time: '10:12:30 AM', type: 'answer' },
    { text: 'New participant joined - Total participants: 124', time: '10:12:18 AM', type: 'user' },
    { text: 'Amit Kumar answered Question 4', time: '10:11:58 AM', type: 'answer' },
    { text: 'New participant joined - Total participants: 123', time: '10:11:33 AM', type: 'user' }
  ];

  return (
    <div className="space-y-8 text-left font-segoe">
      
      {/* ════════ TOP HEADER ROW ════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider">
              LIVE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold mt-1">
            <span>Live Quiz</span>
            <span>•</span>
            <span>Started at 10:00 AM, May 17, 2025</span>
            <span>•</span>
            <div className="flex items-center space-x-1 text-slate-600">
              <span>Quiz ID: LQZ-98421</span>
              <button onClick={handleCopyCode} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleEndQuiz}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <Square size={14} fill="currentColor" />
          <span>End Live Quiz</span>
        </button>
      </div>

      {/* ════════ TAB NAVIGATION BAR ════════ */}
      <div className="border-b border-slate-200 flex items-center space-x-8 text-xs font-extrabold text-slate-500">
        {['Overview', 'Questions', 'Participants', 'Live Leaderboard', 'Settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 relative cursor-pointer transition-colors ${
              activeTab === tab ? 'text-purple-600 font-black' : 'hover:text-slate-900'
            }`}
          >
            <span>{tab}</span>
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-purple-600 rounded-t-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* ════════ TOP 6 METRICS CARDS ════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {topMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-2">
              <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center font-bold`}>
                <Icon size={20} />
              </div>
              <span className="text-[11px] font-bold text-slate-400 block">{m.label}</span>
              <div className="text-2xl font-black text-slate-900">{m.value}</div>
              <span className="text-[10px] font-extrabold text-emerald-600 block">{m.sub}</span>
            </div>
          );
        })}
      </div>

      {/* ════════ MIDDLE SECTION GRID (2 COLUMNS) ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Live Quiz Status & Join Codes */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900">Live Quiz Status</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Quiz is Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">The quiz is currently live. Participants can join using the Join Code or Link.</p>
          </div>

          {/* Two Big Code Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Box 1: Join Code */}
            <div className="p-5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Join Code</span>
                <button onClick={handleCopyCode} className="text-purple-600 hover:text-purple-800 cursor-pointer">
                  {copyCodeFeedback ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="text-3xl font-black text-purple-600 tracking-wider uppercase">{joinCode}</div>
              <span className="text-[10px] font-bold text-slate-400 block">Share this code with participants</span>
            </div>

            {/* Box 2: Join Link */}
            <div className="p-5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Join Link</span>
                <button onClick={handleCopyLink} className="text-purple-600 hover:text-purple-800 cursor-pointer">
                  {copyLinkFeedback ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="text-xs font-black text-purple-600 truncate pt-2">{joinLink}</div>
              <span className="text-[10px] font-bold text-slate-400 block">Share this link with participants</span>
            </div>

          </div>

          {/* Three Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => window.open(`/join/${joinCode}`, '_blank')}
              className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
            >
              <span>View Public Quiz Page</span>
              <ExternalLink size={14} />
            </button>

            <button
              onClick={() => window.open(`/join/${joinCode}`, '_blank')}
              className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
            >
              <Monitor size={14} />
              <span>Display Join Code</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share Quiz</span>
            </button>
          </div>
        </div>

        {/* Right Column (1/3 width) - Live Activity Stream */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Live Activity</h3>
              <button className="text-xs font-extrabold text-purple-600 hover:text-purple-800 cursor-pointer">
                View All Activity &gt;
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {activityFeed.map((act, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-start space-x-3 text-xs">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                    act.type === 'answer' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {act.type === 'answer' ? <CheckSquare size={14} /> : <Users size={14} />}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="font-bold text-slate-800 truncate block">{act.text}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full text-center text-xs font-extrabold text-purple-600 hover:text-purple-800 border-t pt-3 border-slate-100 cursor-pointer">
            View All Activity
          </button>
        </div>

      </div>

      {/* ════════ BOTTOM SECTION GRID (3 EQUAL COLUMNS) ════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Participants Status Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Participants Status</h3>

          <div className="flex items-center justify-between">
            <div className="w-32 h-32 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius={36}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-slate-900">126</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold flex-1 pl-4">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{item.value} ({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Score Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Score Distribution</h3>
          <div className="h-44 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Quiz Information Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Quiz Information</h3>
          
          <div className="divide-y divide-slate-100 text-xs font-bold space-y-2">
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Quiz Type</span>
              <span className="text-slate-900 font-extrabold">Live Quiz</span>
            </div>
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Time Limit</span>
              <span className="text-slate-900 font-extrabold">15 Minutes</span>
            </div>
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Questions</span>
              <span className="text-slate-900 font-extrabold">15</span>
            </div>
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Total Marks</span>
              <span className="text-slate-900 font-extrabold">150</span>
            </div>
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Negative Marking</span>
              <span className="text-red-500 font-extrabold">✕ No</span>
            </div>
            <div className="pt-2 flex justify-between text-slate-600">
              <span>Show Leaderboard</span>
              <span className="text-emerald-600 font-extrabold">✓ Yes</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
