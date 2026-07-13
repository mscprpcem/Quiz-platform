import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart2, BookOpen, Trophy, Play, User, Palette } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const NavButton = ({ onClick, isActive, icon: Icon, label, className = '' }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-microsoft-blue bg-microsoft-lightBlue shadow-sm'
          : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
      } ${className}`}
    >
      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <nav className="bg-white/85 backdrop-blur-xl border-b border-zinc-200/60 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[60px]">
          {/* Logo Section */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            {/* Microsoft Logo Icon */}
            <div className="grid grid-cols-2 gap-[3px] w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <div className="bg-[#f25022] rounded-[1px]"></div>
              <div className="bg-[#7fba00] rounded-[1px]"></div>
              <div className="bg-[#00a4ef] rounded-[1px]"></div>
              <div className="bg-[#ffb900] rounded-[1px]"></div>
            </div>
            <span className="font-bold text-base text-zinc-800 tracking-tight flex items-center">
              Microsoft <span className="font-normal text-zinc-400 ml-1.5 hidden sm:inline">Student Club</span>
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {user && isAdminPath && (
              <div className="flex items-center space-x-1">
                <NavButton
                  onClick={() => navigate('/admin/dashboard')}
                  isActive={location.pathname === '/admin/dashboard'}
                  icon={Home}
                  label="Dashboard"
                />
                <NavButton
                  onClick={() => navigate('/admin/quizzes')}
                  isActive={location.pathname.startsWith('/admin/quizzes')}
                  icon={BookOpen}
                  label="Quizzes"
                />
                <NavButton
                  onClick={() => navigate('/admin/branding')}
                  isActive={location.pathname === '/admin/branding'}
                  icon={Palette}
                  label="Branding"
                />

                <div className="h-5 w-px bg-zinc-200/80 mx-2"></div>

                <div className="text-sm font-medium text-zinc-600 hidden md:inline px-2">
                  {user.name}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            {!user && isAdminPath && location.pathname !== '/admin/login' && (
              <button
                onClick={() => navigate('/admin/login')}
                className="bg-gradient-to-b from-[#0A84FF] to-[#0068D6] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                Admin Access
              </button>
            )}

            {!isAdminPath && (
              <div className="flex items-center space-x-1">
                <NavButton
                  onClick={() => navigate('/')}
                  isActive={location.pathname === '/'}
                  icon={Home}
                  label="Home"
                />
                <NavButton
                  onClick={() => navigate('/practice')}
                  isActive={location.pathname.startsWith('/practice')}
                  icon={Trophy}
                  label="Practice Arena"
                />
                <NavButton
                  onClick={() => navigate('/join')}
                  isActive={location.pathname.startsWith('/join')}
                  icon={Play}
                  label="Join Live"
                />

                <div className="h-5 w-px bg-zinc-200/80 mx-2"></div>

                <button
                  onClick={() => navigate('/admin/login')}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-lg text-sm font-semibold text-zinc-600 hover:text-zinc-800 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <User size={15} />
                  <span className="hidden md:inline">Admin Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
