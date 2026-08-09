import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, LayoutDashboard, Radio, Calendar, HelpCircle, 
  BookOpen, FileText, Users, Trophy, Award, ShieldCheck, 
  Settings, UserCheck, BarChart3, ExternalLink, LogOut, 
  Menu, X, Search, Bell, HelpCircle as QuestionIcon
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPath = location.pathname;

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of the Admin Portal?')) {
      logout();
      navigate('/admin/login');
    }
  };

  const menuSections = [
    {
      title: null,
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }
      ]
    },
    {
      title: 'QUIZ MANAGEMENT',
      items: [
        { label: 'Live Quiz', icon: Radio, path: '/admin/quizzes', badge: 'LIVE', badgeColor: 'bg-red-500 text-white' },
        { label: 'Scheduled Quiz', icon: Calendar, path: '/admin/weekly-league' },
        { label: 'Custom Quiz', icon: HelpCircle, path: '/admin/quizzes?tab=custom' }
      ]
    },
    {
      title: 'CONTENT MANAGEMENT',
      items: [
        { label: 'Courses', icon: BookOpen, path: '/admin/courses' },
        { label: 'Question Bank', icon: FileText, path: '/admin/quizzes' }
      ]
    },
    {
      title: 'PARTICIPANTS & RESULTS',
      items: [
        { label: 'Participants', icon: Users, path: '/admin/analytics' },
        { label: 'Leaderboards', icon: Trophy, path: '/admin/analytics' },
        { label: 'Attempts', icon: Calendar, path: '/admin/weekly-league' },
        { label: 'Certificates & Badges', icon: Award, path: '/admin/analytics' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', icon: Settings, path: '/admin/dashboard' },
        { label: 'Users & Roles', icon: UserCheck, path: '/admin/dashboard' },
        { label: 'Reports', icon: BarChart3, path: '/admin/analytics' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-segoe text-slate-800 text-left">
      
      {/* ════════ SIDEBAR ════════ */}
      <aside 
        className={`bg-white text-slate-800 flex flex-col justify-between transition-all duration-300 z-40 sticky top-0 h-screen border-r border-slate-200 shadow-xs ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-90px)]">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">Quiz Platform</h2>
                  <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Admin Panel</span>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold mx-auto shadow-md">
                <GraduationCap size={22} />
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-5 pt-1">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed && section.title && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-1">
                    {section.title}
                  </span>
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path || 
                    (item.path.includes('/admin/weekly-league') && currentPath.includes('/admin/weekly-league')) ||
                    (item.path === '/admin/quizzes' && currentPath === '/admin/quizzes') ||
                    (item.path.includes('/admin/analytics') && currentPath.includes('/admin/analytics'));

                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center ${collapsed ? 'justify-center py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-purple-50 text-purple-600 font-extrabold shadow-2xs' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={17} className={isActive ? 'text-purple-600' : 'text-slate-400'} />
                        {!collapsed && <span>{item.label}</span>}
                      </div>

                      {!collapsed && item.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor || 'bg-purple-100 text-purple-700'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          {!collapsed && (
            <button
              onClick={() => window.open('/', '_blank')}
              className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>View Public Platform</span>
              <ExternalLink size={14} />
            </button>
          )}

          {collapsed && (
            <button
              onClick={() => window.open('/', '_blank')}
              className="w-full p-2.5 bg-purple-50 text-purple-600 rounded-xl flex justify-center cursor-pointer"
              title="View Public Platform"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>

      </aside>

      {/* ════════ MAIN WORKSPACE ════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4 flex-1 max-w-xl">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Search input */}
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quizzes, participants, courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 bg-slate-50 focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-4">
            {/* Bell Icon */}
            <div className="relative cursor-pointer">
              <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                <Bell size={18} />
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                12
              </span>
            </div>

            {/* Help Icon */}
            <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
              <QuestionIcon size={18} />
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Admin Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name || 'Admin'}</div>
                <div className="text-[10px] font-bold text-slate-400">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
