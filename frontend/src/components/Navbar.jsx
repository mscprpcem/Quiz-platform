import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart2, BookOpen, Trophy, Play, User, Palette, Menu, X, FileCode } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminPath = location.pathname.startsWith('/admin');

  const [showConfirm, setShowConfirm] = useState(false);

  const confirmLogout = () => {
    setShowConfirm(true);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowConfirm(false);
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
          ? 'text-brand-blue bg-brand-lightBlue shadow-sm'
          : 'text-brand-textMuted hover:text-brand-textMain hover:bg-brand-lightBlue/60'
      } ${className}`}
    >
      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b transition-all duration-200 bg-white/90 backdrop-blur-xl border-brand-border text-brand-textMain shadow-[0_2px_8px_rgba(0,120,212,0.06)]">
        {/* Microsoft Signature 4-Quadrant Color Strip */}
        <div className="ms-quadrant-bar"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[60px] items-center">
            {/* Logo Section */}
            <div
              className="flex items-center space-x-2.5 cursor-pointer group"
              onClick={() => navTo('/')}
            >
              {/* MSC-PRPCEM Logo */}
              <img
                src="/logo.png"
                alt="MSC-PRPCEM Logo"
                className="w-8 h-8 rounded-md object-contain group-hover:scale-110 transition-transform duration-200"
              />
            
              <span className="font-black text-brand-textMain tracking-tight">MSC-PRPCEM</span>

              {/* Microsoft 4-Color Grid Badge */}
              <div className="grid grid-cols-2 gap-[1.5px] w-3.5 h-3.5 flex-shrink-0 opacity-85 group-hover:opacity-100 transition-opacity">
                <div className="bg-[#F25022] rounded-[0.5px]"></div>
                <div className="bg-[#7FBA00] rounded-[0.5px]"></div>
                <div className="bg-[#00A4EF] rounded-[0.5px]"></div>
                <div className="bg-[#FFB900] rounded-[0.5px]"></div>
              </div>
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

                <div className="h-5 w-px mx-2 bg-brand-border"></div>

                <div className="text-sm font-medium px-2 text-brand-textMuted">
                  Hi, {user.name}
                </div>

                <button
                  onClick={confirmLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-red-500 hover:text-red-650 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            {!user && isAdminPath && location.pathname !== '/admin/login' && (
              <button
                onClick={() => navTo('/admin/login')}
                className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-glow-blue active:scale-[0.97]"
                style={{ background: 'linear-gradient(to bottom, #2563EB, #1E3A8A)' }}
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
                  onClick={() => navTo('/courses')}
                  isActive={isActive('/courses')}
                  icon={BookOpen}
                  label="Courses"
                />
                <NavButton
                  onClick={() => navTo('/join')}
                  isActive={isActive('/join')}
                  icon={Play}
                  label="Join Quiz"
                />
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md transition-all text-brand-textMuted hover:bg-brand-lightBlue"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 shadow-lg animate-fade-in bg-white border-brand-border text-brand-textMain">
          {!isAdminPath && (
            <>
              <button
                onClick={() => navTo('/')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <Home size={16} />
                Home
              </button>

              <button
                onClick={() => navTo('/courses')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/courses') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <BookOpen size={16} />
                Courses
              </button>

              <button
                onClick={() => navTo('/join')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/join') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <Play size={16} />
                Join Quiz
              </button>
            </>
          )}

          {user && isAdminPath && (
            <>
              <button
                onClick={() => navTo('/admin/dashboard')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/admin/dashboard') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <Home size={16} />
                Dashboard
              </button>
              <button
                onClick={() => navTo('/admin/quizzes')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/admin/quizzes') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <BookOpen size={16} />
                Quizzes
              </button>
              <div className="border-t border-brand-border pt-2 mt-2">
                <p className="text-xs text-brand-textMuted px-3 mb-1">Signed in as {user.name}</p>
                <button
                  onClick={confirmLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </>
          )}

          {!user && isAdminPath && (
            <>
              <button
                onClick={() => navTo('/')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <Home size={16} />
                Home
              </button>

              <button
                onClick={() => navTo('/join')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/join') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <Play size={16} />
                Join Quiz
              </button>

              <div className="border-t border-brand-border pt-2 mt-2">
                <button
                  onClick={() => navTo('/admin/login')}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                    isActive('/admin/login') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                  }`}
                >
                  <User size={15} />
                  Admin Portal
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </nav>

      {/* Custom Logout Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-brand-border rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-scale-in space-y-5 text-zinc-800">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
                <LogOut size={20} />
              </div>
              <h3 className="text-lg font-black tracking-tight text-brand-textMain">Confirm Sign Out</h3>
              <p className="text-xs sm:text-sm text-brand-textMuted max-w-xs leading-relaxed">
                Are you sure you want to end your active session and log out of the administration portal?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] bg-brand-bgLight hover:bg-zinc-100 border border-brand-border text-zinc-650 hover:text-brand-textMain"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-grow flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer select-none"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
