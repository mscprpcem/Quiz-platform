import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart2, BookOpen, Trophy, Play, User, Palette, Menu, X, FileCode, ShieldCheck, CheckCircle2, ExternalLink, Lock } from 'lucide-react';

export default function Navbar() {
  const { user, logout, studentAccount, studentLogin, studentLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath) {
    return null;
  }

  const confirmLogout = () => {
    setShowConfirm(true);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowConfirm(false);
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentEmailInput || !studentPasswordInput) return;
    setLoadingLogin(true);
    await studentLogin(studentEmailInput, studentEmailInput.split('@')[0], studentPasswordInput);
    setLoadingLogin(false);
    setShowStudentModal(false);
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

  const verificationPortalUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VERIFICATION_PORTAL_URL) || 'https://verify.mscprpcem.tech';

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
              <img
                src="/logo.png"
                alt="MSC-PRPCEM Logo"
                className="w-8 h-8 rounded-md object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="font-black text-brand-textMain tracking-tight text-base">MSC-PRPCEM</span>
            </div>

            {/* Navigation Items (Desktop) */}
            <div className="hidden md:flex items-center space-x-2">
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

              <div className="h-5 w-px mx-2 bg-slate-200"></div>

              {/* Student Account Status Button */}
              {studentAccount ? (
                <div className="flex items-center space-x-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs">
                  <ShieldCheck size={14} className="text-purple-600 flex-shrink-0" />
                  <span className="font-bold text-purple-900 truncate max-w-[140px]">{studentAccount.email}</span>
                  <a
                    href={verificationPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:text-purple-800 font-extrabold flex items-center gap-0.5 ml-1 border-l border-purple-200 pl-2"
                    title="View Account on Verification Portal"
                  >
                    <span>Portal</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-extrabold shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <User size={14} />
                  <span>Student Login</span>
                </button>
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
          <div className="md:hidden border-t px-4 py-3 space-y-2 shadow-lg animate-fade-in bg-white border-brand-border text-brand-textMain">
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

            <div className="border-t border-slate-200 pt-2 mt-2">
              {studentAccount ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-900">
                    <ShieldCheck size={15} className="text-purple-600" />
                    <span>Logged in: {studentAccount.email}</span>
                  </div>
                  <a
                    href={verificationPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-extrabold text-purple-700 hover:underline flex items-center gap-1"
                  >
                    <span>Open Verification Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowStudentModal(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-left flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-extrabold text-white bg-purple-600"
                >
                  <User size={16} />
                  Student Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Student Account Email & Password Login Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Student Login</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Enter your credentials to sign in and proceed</p>
                </div>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Email Address / Gmail *</label>
                <input
                  type="email"
                  required
                  value={studentEmailInput}
                  onChange={(e) => setStudentEmailInput(e.target.value)}
                  placeholder="e.g. student@gmail.com or student@prpcem.ac.in"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Password *</label>
                <input
                  type="password"
                  required
                  value={studentPasswordInput}
                  onChange={(e) => setStudentPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer active:scale-95"
                >
                  {loadingLogin ? 'Signing In...' : 'Sign In & Proceed'}
                </button>
              </div>
            </form>

            {/* Create Account Link to Verification Portal */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-1">
              <p className="text-[11px] text-slate-500 font-medium">Don't have an account yet?</p>
              <a
                href={`${verificationPortalUrl}/register`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-black text-purple-700 hover:text-purple-900 hover:underline"
              >
                <span>Create Account on verify.mscprpcem.tech</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-brand-border rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-scale-in space-y-5 text-zinc-800">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner">
                <LogOut size={20} />
              </div>
              <h3 className="text-lg font-black tracking-tight text-brand-textMain">Confirm Sign Out</h3>
              <p className="text-xs sm:text-sm text-brand-textMuted max-w-xs leading-relaxed">
                Are you sure you want to log out of the administration portal?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] bg-brand-bgLight hover:bg-zinc-100 border border-brand-border text-zinc-655 hover:text-brand-textMain"
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
