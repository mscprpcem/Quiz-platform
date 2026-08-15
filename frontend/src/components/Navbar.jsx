import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentAuthModal from './StudentAuthModal';
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

              {/* Student Account Status / Sign Out vs Login */}
              {studentAccount ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navTo('/login')}
                    className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all"
                    title="View Student Profile"
                  >
                    <ShieldCheck size={14} className="text-blue-600 flex-shrink-0" />
                    <span className="font-bold text-blue-900 truncate max-w-[130px]">
                      {studentAccount.name || studentAccount.email.split('@')[0]}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      studentLogout();
                      navigate('/');
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                    <span className="hidden lg:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <NavButton
                  onClick={() => navTo('/login')}
                  isActive={isActive('/login')}
                  icon={User}
                  label="Login"
                />
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

            {studentAccount ? (
              <div className="border-t border-slate-200 pt-2 mt-2 space-y-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-extrabold text-blue-900">
                    <ShieldCheck size={15} className="text-blue-600" />
                    <span>Signed In: {studentAccount.name || studentAccount.email}</span>
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium">{studentAccount.email}</p>
                </div>

                <button
                  onClick={() => {
                    studentLogout();
                    setMobileOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => navTo('/login')}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive('/login') ? 'text-brand-blue bg-brand-lightBlue' : 'text-brand-textMuted hover:bg-brand-lightBlue/60'
                }`}
              >
                <User size={16} />
                Login / Register
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Student Account Email & Password Auth Modal */}
      <StudentAuthModal 
        isOpen={showStudentModal} 
        onClose={() => setShowStudentModal(false)} 
      />

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
