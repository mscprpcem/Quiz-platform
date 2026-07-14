import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BookOpen, Trophy, Play, User, Menu, X } from 'lucide-react';

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

  const linkBase =
    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer';
  const activeLink = `${linkBase} text-microsoft-blue bg-microsoft-lightBlue`;
  const inactiveLink = `${linkBase} text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100`;

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ── */}
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            onClick={() => navTo('/')}
          >
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 flex-shrink-0">
              <div className="bg-[#f25022]"></div>
              <div className="bg-[#7fba00]"></div>
              <div className="bg-[#00a4ef]"></div>
              <div className="bg-[#ffb900]"></div>
            </div>
            <span className="font-semibold text-base sm:text-lg text-microsoft-darkGray tracking-tight leading-none">
              Microsoft{' '}
              <span className="font-normal text-zinc-500 hidden xs:inline">Student Club</span>
              <span className="font-normal text-zinc-500 xs:hidden"> MSC</span>
            </span>
          </div>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {user && isAdminPath && (
              <>
                <button
                  onClick={() => navTo('/admin/dashboard')}
                  className={isActive('/admin/dashboard') ? activeLink : inactiveLink}
                >
                  <Home size={16} />
                  Dashboard
                </button>
                <button
                  onClick={() => navTo('/admin/quizzes')}
                  className={isActive('/admin/quizzes') ? activeLink : inactiveLink}
                >
                  <BookOpen size={16} />
                  Quizzes
                </button>
                <div className="h-6 w-px bg-zinc-200 mx-1" />
                <span className="text-sm font-medium text-zinc-600 px-2">
                  Hi, {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            )}

            {!user && isAdminPath && location.pathname !== '/admin/login' && (
              <button
                onClick={() => navTo('/admin/login')}
                className="bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                Admin Access
              </button>
            )}

            {!isAdminPath && (
              <>
                <button
                  onClick={() => navTo('/')}
                  className={isActive('/') ? activeLink : inactiveLink}
                >
                  <Home size={16} />
                  Home
                </button>
                <button
                  onClick={() => navTo('/practice')}
                  className={isActive('/practice') ? activeLink : inactiveLink}
                >
                  <Trophy size={16} />
                  Practice
                </button>
                <button
                  onClick={() => navTo('/join')}
                  className={isActive('/join') ? activeLink : inactiveLink}
                >
                  <Play size={16} />
                  Join Live
                </button>
                <div className="h-6 w-px bg-zinc-200 mx-1" />
                <button
                  onClick={() => navTo('/admin/login')}
                  className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-sm font-semibold text-zinc-700 transition-all shadow-sm"
                >
                  <User size={15} />
                  Admin
                </button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden p-2 rounded-md text-zinc-600 hover:bg-zinc-100 transition-all"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-fade-in">
          {!isAdminPath && (
            <>
              <button
                onClick={() => navTo('/')}
                className={`w-full text-left ${isActive('/') ? activeLink : inactiveLink}`}
              >
                <Home size={16} />
                Home
              </button>
              <button
                onClick={() => navTo('/practice')}
                className={`w-full text-left ${isActive('/practice') ? activeLink : inactiveLink}`}
              >
                <Trophy size={16} />
                Practice Arena
              </button>
              <button
                onClick={() => navTo('/join')}
                className={`w-full text-left ${isActive('/join') ? activeLink : inactiveLink}`}
              >
                <Play size={16} />
                Join Live Quiz
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
                className={`w-full text-left ${isActive('/admin/dashboard') ? activeLink : inactiveLink}`}
              >
                <Home size={16} />
                Dashboard
              </button>
              <button
                onClick={() => navTo('/admin/quizzes')}
                className={`w-full text-left ${isActive('/admin/quizzes') ? activeLink : inactiveLink}`}
              >
                <BookOpen size={16} />
                Quizzes
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
              className="w-full bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2.5 rounded-md text-sm font-semibold transition-all"
            >
              Admin Access
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
