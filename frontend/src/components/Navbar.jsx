import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart2, BookOpen, Trophy, Play, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            {/* Microsoft Logo Icon */}
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 flex-shrink-0">
              <div className="bg-[#f25022]"></div>
              <div className="bg-[#7fba00]"></div>
              <div className="bg-[#00a4ef]"></div>
              <div className="bg-[#ffb900]"></div>
            </div>
            <span className="font-semibold text-lg text-microsoft-darkGray tracking-tight flex items-center">
              Microsoft <span className="font-normal text-zinc-500 ml-1">Student Club</span>
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {user && isAdminPath && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === '/admin/dashboard'
                      ? 'text-microsoft-blue bg-microsoft-lightBlue'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Home size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/admin/quizzes')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname.startsWith('/admin/quizzes')
                      ? 'text-microsoft-blue bg-microsoft-lightBlue'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <BookOpen size={16} />
                  <span className="hidden sm:inline">Quizzes</span>
                </button>

                <div className="h-6 w-px bg-zinc-200 mx-1"></div>

                <div className="text-sm font-medium text-zinc-700 hidden md:inline px-2">
                  Hi, {user.name}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-zinc-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {!user && isAdminPath && location.pathname !== '/admin/login' && (
              <button
                onClick={() => navigate('/admin/login')}
                className="bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
              >
                Admin Access
              </button>
            )}

            {!isAdminPath && (
              <div className="flex items-center space-x-1 sm:space-x-3">
                <button
                  onClick={() => navigate('/')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    location.pathname === '/'
                      ? 'text-microsoft-blue bg-microsoft-lightBlue'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Home size={16} />
                  <span className="hidden sm:inline">Home</span>
                </button>

                <button
                  onClick={() => navigate('/practice')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    location.pathname.startsWith('/practice')
                      ? 'text-microsoft-blue bg-microsoft-lightBlue'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Trophy size={16} />
                  <span>Practice Arena</span>
                </button>

                <button
                  onClick={() => navigate('/join')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    location.pathname.startsWith('/join')
                      ? 'text-microsoft-blue bg-microsoft-lightBlue'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Play size={16} />
                  <span>Join Live</span>
                </button>

                <div className="h-6 w-px bg-zinc-200 mx-1"></div>

                <button
                  onClick={() => navigate('/admin/login')}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-sm font-semibold text-zinc-700 transition-all cursor-pointer shadow-sm"
                >
                  <User size={16} />
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
