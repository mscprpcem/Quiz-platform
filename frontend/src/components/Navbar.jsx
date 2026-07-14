import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart2, BookOpen, Trophy, Play, User, Palette, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    setMobileOpen(false);
  };

  const navTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

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
        <div className="flex justify-between h-[60px] items-center">
          {/* Logo Section */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navTo('/')}
          >
            {/* Microsoft Logo Icon */}
            <div className="grid grid-cols-2 gap-[3px] w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              <div className="bg-[#f25022] rounded-[1px]"></div>
              <div className="bg-[#7fba00] rounded-[1px]"></div>
              <div className="bg-[#00a4ef] rounded-[1px]"></div>
              <div className="bg-[#ffb900] rounded-[1px]"></div>
            </div>
            <span className="font-bold text-base text-zinc-800 tracking-tight flex items-center">
              Microsoft <span className="font-normal text-zinc-400 ml-1.5 hidden xs:inline">Student Club</span>
              <span className="font-normal text-zinc-400 ml-1.5 xs:hidden"> MSC</span>
            </span>
          </div>

          {/* Navigation Items (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {user && isAdminPath && (
              <div className="flex items-center space-x-1">
                <NavButton
                  onClick={() => navTo('/admin/dashboard')}
                  isActive={isActive('/admin/dashboard')}
                  icon={Home}
                  label="Dashboard"
                />
                <NavButton
                  onClick={() => navTo('/admin/quizzes')}
                  isActive={isActive('/admin/quizzes')}
                  icon={BookOpen}
                  label="Quizzes"
                />
                <NavButton
                  onClick={() => navTo('/admin/branding')}
                  isActive={isActive('/admin/branding')}
                  icon={Palette}
                  label="Branding"
                />

                <div className="h-5 w-px bg-zinc-200/80 mx-2"></div>

                <div className="text-sm font-medium text-zinc-600 px-2">
                  Hi, {user.name}
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
                onClick={() => navTo('/admin/login')}
                className="bg-gradient-to-b from-[#0A84FF] to-[#0068D6] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                Admin Access
              </button>
            )}

            {!isAdminPath && (
              <div className="flex items-center space-x-1">
                <NavButton
                  onClick={() => navTo('/')}
                  isActive={isActive('/')}
                  icon={Home}
                  label="Home"
                />
                <NavButton
                  onClick={() => navTo('/join')}
                  isActive={isActive('/join')}
                  icon={Play}
                  label="Join Live"
                />

                <div className="h-5 w-px bg-zinc-200/80 mx-2"></div>

                <button
                  onClick={() => navTo('/admin/login')}
                  className="flex items-center space-x-1.5 px-3 py-2 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 rounded-lg text-sm font-semibold text-zinc-600 hover:text-zinc-800 transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <User size={15} />
                  <span className="hidden md:inline">Admin Portal</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-zinc-600 hover:bg-zinc-100 transition-all"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-fade-in">
          {!isAdminPath && (
            <>
              <button
                onClick={() => navTo('/')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/') ? 'text-microsoft-blue bg-microsoft-lightBlue' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Home size={16} />
                Home
              </button>

              <button
                onClick={() => navTo('/join')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/join') ? 'text-microsoft-blue bg-microsoft-lightBlue' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Play size={16} />
                Join Live
              </button>
              <div className="border-t border-zinc-100 pt-2 mt-2">
                <button
                  onClick={() => navTo('/admin/login')}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-all"
                >
                  <User size={15} />
                  Admin Portal
                </button>
              </div>
            </>
          )}

          {user && isAdminPath && (
            <>
              <button
                onClick={() => navTo('/admin/dashboard')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/admin/dashboard') ? 'text-microsoft-blue bg-microsoft-lightBlue' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Home size={16} />
                Dashboard
              </button>
              <button
                onClick={() => navTo('/admin/quizzes')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/admin/quizzes') ? 'text-microsoft-blue bg-microsoft-lightBlue' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <BookOpen size={16} />
                Quizzes
              </button>
              <button
                onClick={() => navTo('/admin/branding')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/admin/branding') ? 'text-microsoft-blue bg-microsoft-lightBlue' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Palette size={16} />
                Branding
              </button>
              <div className="border-t border-zinc-100 pt-2 mt-2">
                <p className="text-xs text-zinc-400 px-3 mb-1">Signed in as {user.name}</p>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </>
          )}

          {!user && isAdminPath && location.pathname !== '/admin/login' && (
            <button
              onClick={() => navTo('/admin/login')}
              className="w-full bg-gradient-to-b from-[#0A84FF] to-[#0068D6] text-white px-4 py-2.5 rounded-md text-sm font-semibold transition-all"
            >
              Admin Access
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
