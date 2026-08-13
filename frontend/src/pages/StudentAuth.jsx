import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, ShieldCheck, CheckCircle2, ArrowRight,
  ExternalLink, Sparkles, AlertTriangle, Loader2, BookOpen, Trophy, Search, Eye, EyeOff, X
} from 'lucide-react';

export default function StudentAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentAccount, studentLogin, studentRegister, studentLogout, checkUsername } = useAuth();

  // Mode: 'login' or 'register'
  const isRegisterInitial = location.pathname.includes('register');
  const [mode, setMode] = useState(isRegisterInitial ? 'register' : 'login');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Username Availability State
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const verificationPortalUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VERIFICATION_PORTAL_URL) || 'https://verify.mscprpcem.tech';

  useEffect(() => {
    if (location.pathname.includes('register')) {
      setMode('register');
    } else if (location.pathname.includes('login')) {
      setMode('login');
    }
  }, [location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    if (name === 'username') {
      setUsernameAvailable(null);
      setUsernameError('');
    }
  };

  const handleCheckHandle = async (handleVal) => {
    const clean = (handleVal || '').toLowerCase().trim();
    if (!clean || clean.length < 3) {
      setUsernameAvailable(false);
      setUsernameError('Username handle must be at least 3 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(clean)) {
      setUsernameAvailable(false);
      setUsernameError('Only letters, numbers, underscores, or hyphens allowed.');
      return false;
    }

    setUsernameChecking(true);
    setUsernameError('');
    try {
      const res = await checkUsername(clean);
      if (res.available) {
        setUsernameAvailable(true);
        setUsernameError('');
        return true;
      } else {
        setUsernameAvailable(false);
        setUsernameError(res.error || 'Username handle is already taken.');
        return false;
      }
    } catch (err) {
      setUsernameAvailable(false);
      setUsernameError('Error verifying username availability.');
      return false;
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const { name, email, username, password, confirmPassword } = formData;
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (username.trim()) {
        if (usernameAvailable === false) {
          setError('Please choose an available username handle before registering.');
          return;
        }
        if (usernameAvailable === null) {
          const available = await handleCheckHandle(username);
          if (!available) return;
        }
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);
      if (mode === 'register') {
        const res = await studentRegister({
          name: name.trim(),
          email: cleanEmail,
          password,
          username: username.trim()
        });
        if (res.success) {
          setSuccessMsg('Account created successfully and synchronized with Verification Portal!');
        } else {
          setError(res.error || 'Failed to create account.');
        }
      } else {
        const res = await studentLogin(cleanEmail, password);
        if (res.success) {
          setSuccessMsg('Logged in successfully!');
        } else {
          setError(res.error || 'Failed to log in.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show authenticated dashboard card
  if (studentAccount) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 relative overflow-hidden font-segoe">
        <div className="max-w-md w-full relative z-10 animate-fade-in">
          <div className="bg-white border border-slate-200 p-7 sm:p-9 rounded-3xl shadow-xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                Active Student Session
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">{studentAccount.name}</h2>
              <p className="text-xs text-slate-500 font-semibold">{studentAccount.email}</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl text-left space-y-2">
              <div className="flex items-center space-x-2 text-xs font-black text-purple-900">
                <Sparkles size={16} className="text-purple-600" />
                <span>Cross-Portal Synchronized</span>
              </div>
              <p className="text-[11px] text-purple-700 font-medium leading-relaxed">
                Your student profile is linked across both the <strong>Quiz Platform</strong> and the <strong>Official Verification Portal</strong>. All quiz attempts and badges sync in real time.
              </p>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => navigate('/courses')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <BookOpen size={16} />
                <span>Browse Quizzes & Courses</span>
              </button>

              <a
                href={verificationPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer block text-center"
              >
                <ShieldCheck size={16} />
                <span>Direct Open Verification Portal</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>

              <button
                onClick={studentLogout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Sign Out from Student Account
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 relative overflow-hidden font-segoe">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_40%_at_70%_20%,_rgba(37,99,235,0.06)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_45%_at_25%_80%,_rgba(139,92,246,0.04)_0%,_transparent_55%)]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="bg-white border border-slate-200 p-6 sm:p-9 rounded-3xl shadow-xl space-y-6 relative overflow-hidden text-left">
          
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-sky-500 to-purple-600"></div>

          {/* Header */}
          <div className="text-center space-y-2 pt-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'register' ? 'Create Your Account' : 'Sign In to Your Account'}
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              {mode === 'register' ? 'Fill in the details to get started' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Mode Tabs (Sign In vs Register) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your Full Name"
                    required={mode === 'register'}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Username Handle (Register only) */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Username Handle</label>
                  <span className="text-[10px] text-slate-400 font-semibold">(for public profile URL)</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-black text-slate-400 select-none">@</span>
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. amityadav"
                    value={formData.username}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckHandle(formData.username);
                      }
                    }}
                    required={mode === 'register'}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-12 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                  />
                  <div className="absolute right-3 flex items-center space-x-1.5">
                    {usernameChecking ? (
                      <Loader2 size={15} className="animate-spin text-blue-600" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : usernameAvailable === false ? (
                      <X size={15} className="text-red-500" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleCheckHandle(formData.username)}
                      disabled={usernameChecking || !formData.username.trim()}
                      className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer disabled:opacity-30"
                      title="Check handle availability"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </div>
                {usernameAvailable === true && (
                  <span className="text-[10px] font-bold text-emerald-600 block">Available</span>
                )}
                {usernameError && (
                  <span className="text-[10px] font-bold text-red-500 block">{usernameError}</span>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-400 font-semibold block">Password must be at least 8 characters</span>
              )}
            </div>

            {/* Confirm Password for Register */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required={mode === 'register'}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer Switch Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            {mode === 'register' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
              >
                Already have an account? <span className="text-blue-600 font-extrabold underline">Sign In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
              >
                Don't have an account? <span className="text-blue-600 font-extrabold underline">Create Account</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
