import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, X, Sparkles, Search, Loader2 } from 'lucide-react';

export default function StudentAuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }) {
  const { studentLogin, studentRegister, checkUsername } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Username availability state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

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

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    setUsernameAvailable(null);
    setUsernameError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (activeTab === 'register') {
      if (!name.trim()) {
        setErrorMessage('Full Name is required.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid Email Address.');
        return;
      }
      if (username.trim()) {
        if (usernameAvailable === false) {
          setErrorMessage('Please choose an available username handle before registering.');
          return;
        }
        if (usernameAvailable === null) {
          const available = await handleCheckHandle(username);
          if (!available) return;
        }
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setLoading(true);
      const res = await studentRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        username: username.trim()
      });
      setLoading(false);

      if (res.success) {
        setSuccessMessage('Account created and synchronized with Verification Portal!');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else {
      if (!email.trim()) {
        setErrorMessage('Please enter your Email Address.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your Password.');
        return;
      }

      setLoading(true);
      const res = await studentLogin(email.trim(), password);
      setLoading(false);

      if (res.success) {
        setSuccessMessage('Welcome back! Account authenticated across portals.');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 1000);
      } else {
        setErrorMessage(res.error || 'Login failed. Please check your email and password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in font-segoe">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-left max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Left Banner (Replica of Verification Portal Auth Banner) */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-300">
              <Sparkles size={12} />
              <span>MSC PRPCEM Unified ID</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Your Achievements, Verified.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Create your account to explore, earn and showcase your achievements. Synchronized across Quiz Platform and Verification Portal.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-3 relative z-10">
            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                <ShieldCheck size={20} />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white block">Single Sign-On (SSO)</span>
                <span className="text-[10px] text-slate-300">Same Account ID on verify.mscprpcem.tech</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form (Exact Replica of Verification Portal Register/Login Form) */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center space-y-5">
          
          {/* Header Tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {activeTab === 'register' ? 'Create Your Account' : 'Sign In to Your Account'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {activeTab === 'register' ? 'Fill in the details to get started' : 'Enter your credentials to continue'}
              </p>
            </div>

            <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'login' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-shake">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Full Name field (Register only) */}
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Username Handle Field (Register only - Exact Replica of Verification Platform) */}
            {activeTab === 'register' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Username Handle</label>
                  <span className="text-[10px] text-slate-400 font-semibold">(for public profile URL)</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-black text-slate-400 select-none">@</span>
                  <input
                    type="text"
                    placeholder="e.g. amityadav"
                    value={username}
                    onChange={handleUsernameChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckHandle(username);
                      }
                    }}
                    required
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
                      onClick={() => handleCheckHandle(username)}
                      disabled={usernameChecking || !username.trim()}
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

            {/* Password field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {activeTab === 'register' && (
                <span className="text-[10px] text-slate-400 font-semibold block">Password must be at least 8 characters</span>
              )}
            </div>

            {/* Confirm Password field (Register only) */}
            {activeTab === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating across portals...' : activeTab === 'register' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Footer Navigation Switch Link */}
            <div className="text-center pt-2 border-t border-slate-100">
              {activeTab === 'register' ? (
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="text-blue-600 font-extrabold underline">Sign In</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="text-blue-600 font-extrabold underline">Create Account</span>
                </button>
              )}
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
