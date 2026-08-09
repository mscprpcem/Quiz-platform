import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, CheckSquare, FileText, Trophy, Hourglass, Award, 
  Calendar, ChevronDown, Plus, BookOpen, UserCheck, ShieldCheck, 
  Radio, Play, ArrowUpRight, ArrowRight, ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('May 11 – May 17, 2025');

  // Top 6 Metric Cards Data
  const metrics = [
    { title: 'Total Participants', value: '1,248', change: '+ 18.6%', isPositive: true, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { title: 'Total Attempts', value: '2,531', change: '+ 22.4%', isPositive: true, icon: CheckSquare, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Quizzes Conducted', value: '18', change: '+ 12.5%', isPositive: true, icon: FileText, color: 'bg-orange-100 text-orange-600' },
    { title: 'Average Score', value: '72.4%', change: '+ 8.3%', isPositive: true, icon: Trophy, color: 'bg-blue-100 text-blue-600' },
    { title: 'Completion Rate', value: '78.6%', change: '+ 9.1%', isPositive: true, icon: Hourglass, color: 'bg-red-100 text-red-600' },
    { title: 'Certificates Issued', value: '634', change: '+ 16.7%', isPositive: true, icon: Award, color: 'bg-purple-100 text-purple-600' }
  ];

  // Quiz Overview Line Chart Data
  const lineData = [
    { day: 'May 11', Participants: 880, Attempts: 460, Score: 220 },
    { day: 'May 12', Participants: 1150, Attempts: 730, Score: 385 },
    { day: 'May 13', Participants: 1010, Attempts: 580, Score: 275 },
    { day: 'May 14', Participants: 1280, Attempts: 850, Score: 520 },
    { day: 'May 15', Participants: 1190, Attempts: 770, Score: 400 },
    { day: 'May 16', Participants: 1350, Attempts: 940, Score: 500 },
    { day: 'May 17', Participants: 1340, Attempts: 900, Score: 440 }
  ];

  // Participants Donut Chart Data
  const donutData = [
    { name: 'New This Week', value: 324, percentage: '25.9%', color: '#3b82f6' },
    { name: 'Active', value: 652, percentage: '52.2%', color: '#10b981' },
    { name: 'Inactive', value: 198, percentage: '15.9%', color: '#f59e0b' },
    { name: 'Completed', value: 74, percentage: '5.9%', color: '#a855f7' }
  ];

  // Quiz Types Overview Data
  const quizTypes = [
    { name: 'Live Quiz', count: 4, percentage: 22.2, color: 'bg-blue-500' },
    { name: 'Scheduled Quiz', count: 6, percentage: 33.3, color: 'bg-emerald-500' },
    { name: 'Custom (Weekly)', count: 5, percentage: 27.8, color: 'bg-purple-500' },
    { name: 'Custom (Biweekly)', count: 2, percentage: 11.1, color: 'bg-orange-500' },
    { name: 'One Time Quiz', count: 1, percentage: 5.6, color: 'bg-red-500' }
  ];

  // Active Quizzes List Data
  const activeQuizzesList = [
    { title: 'DSA Rapid Fire', badge: 'LIVE', badgeColor: 'bg-red-500 text-white', status: '45 Participants' },
    { title: 'Web Development Basics', badge: 'Scheduled', badgeColor: 'bg-blue-50 text-blue-600', status: 'Starts in 6h 15m' },
    { title: 'Database Concepts Quiz', badge: 'Scheduled', badgeColor: 'bg-blue-50 text-blue-600', status: 'Starts in 1d 2h' },
    { title: 'AI & ML Fundamentals', badge: 'Custom (Weekly)', badgeColor: 'bg-purple-50 text-purple-600', status: 'Week 3 of 8' },
    { title: 'Cloud Computing Essentials', badge: 'Custom (Biweekly)', badgeColor: 'bg-orange-50 text-orange-600', status: 'Week 2 of 4' }
  ];

  return (
    <div className="space-y-8 text-left font-segoe">
      
      {/* ════════ HEADER ROW ════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Here's an overview of your quiz platform.</p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative">
          <button className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
            <Calendar size={15} className="text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>
        </div>
      </div>

      {/* ════════ TOP 6 METRIC CARDS ════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3 hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center font-bold`}>
                <Icon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block leading-tight">{m.title}</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-xl font-black text-slate-900">{m.value}</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 block mt-0.5">{m.change} vs last 7 days</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ MIDDLE SECTION: LINE CHART + NEXT QUIZ CARD ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Quiz Overview Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-900">Quiz Overview</h3>
            <select className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>

          {/* Chart Legends */}
          <div className="flex items-center space-x-6 text-xs font-extrabold text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Participants</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Attempts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Average Score (%)</span>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-64 text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="Participants" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Attempts" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Score" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (1/3 width) - Next Quiz Countdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">Next Quiz</h3>
              <button 
                onClick={() => navigate('/admin/weekly-league')}
                className="text-xs font-extrabold text-slate-400 hover:text-purple-600 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full inline-block">
                Scheduled Quiz
              </span>
              <h4 className="text-lg font-black text-slate-900">Azure Fundamentals Challenge</h4>
              <p className="text-xs text-slate-500 font-bold">May 19, 2025  •  10:00 AM</p>
            </div>

            {/* Countdown Box */}
            <div className="p-5 bg-purple-50 rounded-2xl text-center border border-purple-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Starts in</span>
              <div className="text-2xl font-black text-purple-600 tracking-tight">2d 14h 30m</div>
            </div>

            {/* Quick Stat Pills */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-extrabold">
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Duration</span>
                <span className="text-slate-900">30 Min</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Questions</span>
                <span className="text-slate-900">25</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Participants</span>
                <span className="text-slate-900">126</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Max Marks</span>
                <span className="text-slate-900">100</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/weekly-league')}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            View Quiz Details
          </button>
        </div>

      </div>

      {/* ════════ BOTTOM SECTION GRID 1: 3 EQUAL COLUMNS ════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Active Quizzes List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-900">Active Quizzes</h3>
            <button 
              onClick={() => navigate('/admin/quizzes')}
              className="text-xs font-extrabold text-slate-400 hover:text-purple-600 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {activeQuizzesList.map((quiz, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1 truncate pr-2">
                  <div className="text-xs font-extrabold text-slate-900 truncate">{quiz.title}</div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block ${quiz.badgeColor}`}>
                    {quiz.badge}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold text-slate-500 flex-shrink-0">{quiz.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Participants Overview Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-black text-slate-900">Participants Overview</h3>

          <div className="flex items-center justify-between">
            {/* Donut chart */}
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
                <span className="text-xs font-black text-slate-900">1,248</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 text-xs font-bold flex-1 pl-4">
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

          {/* Top Participant Box */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Top Participant</span>
                <span className="text-xs font-black text-slate-900">Amit Kumar</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-purple-700 block">Score: 96.4%</span>
              <span className="text-[9px] text-slate-400 font-semibold">Quizzes: 12</span>
            </div>
          </div>
        </div>

        {/* Card 3: Quiz Types Overview Progress Bars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-900">Quiz Types Overview</h3>
            <button 
              onClick={() => navigate('/admin/quizzes')}
              className="text-xs font-extrabold text-slate-400 hover:text-purple-600 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {quizTypes.map((qt, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{qt.name}</span>
                  <div className="space-x-2">
                    <span className="text-slate-900 font-extrabold">{qt.count}</span>
                    <span className="text-slate-400 font-medium">{qt.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${qt.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${qt.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ════════ BOTTOM SECTION GRID 2: QUICK ACTIONS ROW ════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-slate-900">Quick Actions</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-4 bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Create Live Quiz</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Start real-time quiz</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/weekly-league')}
            className="p-4 bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Schedule Quiz</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Create non-live quiz</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/weekly-league')}
            className="p-4 bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Create Custom Quiz</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Weekly, biweekly & more</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/courses')}
            className="p-4 bg-orange-50/60 hover:bg-orange-100/80 border border-orange-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Create Course</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Build learning content</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-4 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Add Questions</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Add to question bank</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="p-4 bg-red-50/60 hover:bg-red-100/80 border border-red-100 rounded-2xl text-left space-y-2 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black group-hover:scale-105 transition-transform">
              <Award size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 leading-snug">Issue Certificate</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Create & issue credentials</div>
            </div>
          </button>

        </div>
      </div>

    </div>
  );
}
