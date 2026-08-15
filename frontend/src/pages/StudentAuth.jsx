import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, ShieldCheck, CheckCircle2, ArrowRight,
  Sparkles, AlertTriangle, Loader2, BookOpen, Search, Eye, EyeOff, KeyRound, ArrowLeft
} from 'lucide-react';

export default function StudentAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentAccount, studentLogin, studentRegister, studentLogout, checkUsername, sendOtp, verifyOtp, forgotPassword, resetPassword } = useAuth();

  // Mode: 'login' | 'register' | 'forgot-password'
  const isRegisterInitial = location.pathname.includes('register');
  const [mode, setMode] = useState(isRegisterInitial ? 'register' : 'login');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // Forgot Password / OTP State
  const [resetStep, setResetStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP, 3 = Enter New Password
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Registration OTP State
  const [regStep, setRegStep] = useState(1); // 1 = Form, 2 = Enter Verification OTP
  const [registerOtp, setRegisterOtp] = useState('');

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

  // Determine target return URL after authentication
  const getReturnUrl = () => {
    const params = new URLSearchParams(location.search);
    const target = params.get('redirect') || params.get('returnUrl') || params.get('from') || location.state?.from || sessionStorage.getItem('msc_quiz_return_url');
    
    if (target && typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/login') && !target.startsWith('/register') && !target.startsWith('/student/login') && !target.startsWith('/student/register')) {
      sessionStorage.removeItem('msc_quiz_return_url');
      return target;
    }
    return '/courses';
  };

  // Auto-redirect if student is already authenticated and has a pending return URL
  useEffect(() => {
    if (studentAccount) {
      const returnUrl = getReturnUrl();
      if (returnUrl && returnUrl !== '/courses') {
        const timer = setTimeout(() => {
          navigate(returnUrl, { replace: true });
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [studentAccount]);

  // Handle Send Reset OTP (Step 1)
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await forgotPassword(formData.email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || `Verification code sent to ${formData.email.trim()}. Please enter your code.`);
      setResetStep(2);
    } else {
      setError(res.error || 'Failed to send verification code. Check your email address.');
    }
  };

  // Handle Verify Reset OTP (Step 2)
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await verifyOtp(formData.email.trim(), resetOtp.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Verification code confirmed! Please enter your new password.');
      setResetStep(3);
    } else {
      setError(res.error || 'Invalid or expired verification code. Please try again.');
    }
  };

  // Handle Complete Password Reset (Step 3: Update & Instant Auto-Login -> Redirect to Quiz)
  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await resetPassword(formData.email.trim(), resetOtp.trim(), newPassword);

    if (res.success) {
      setSuccessMsg('Password updated! Signing you in and redirecting to your quiz...');
      
      // Automatic Login with new password
      const loginRes = await studentLogin(formData.email.trim(), newPassword);
      setLoading(false);

      const destination = getReturnUrl();
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1000);
    } else {
      setLoading(false);
      setError(res.error || 'Failed to update password. Please try again.');
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
          username: username.trim(),
          otp: regStep === 2 ? registerOtp.trim() : undefined
        });

        if (res.requireVerification) {
          setRegStep(2);
          setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}. Please enter your 6-digit code below.`);
        } else if (res.success) {
          setSuccessMsg('Email verified and account created successfully! Redirecting...');
          setRegStep(1);
          setRegisterOtp('');
          const destination = getReturnUrl();
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 1000);
        } else {
          setError(res.error || 'Failed to create account.');
        }
      } else {
        const res = await studentLogin(cleanEmail, password);
        if (res.success) {
          setSuccessMsg('Logged in successfully! Returning to your quiz...');
          const destination = getReturnUrl();
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 800);
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
    const returnUrl = getReturnUrl();

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 bg-slate-50/60 font-segoe relative overflow-hidden">
        <div className="max-w-md w-full relative z-10 animate-fade-in">
          <div className="bg-white border border-slate-200/90 p-7 sm:p-9 rounded-3xl shadow-xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
              <ShieldCheck size={36} />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-emerald-100/80 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                Active Student Session
              </span>
              <h2 className="text-2xl font-black text-slate-900 pt-2">{studentAccount.name}</h2>
              <p className="text-xs text-slate-500 font-semibold">{studentAccount.email}</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl text-left space-y-2">
              <div className="flex items-center space-x-2 text-xs font-black text-blue-900">
                <Sparkles size={16} className="text-blue-600" />
                <span>Single Sign-On Connected</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                Your student profile is linked across the Quiz Platform and Verification Portal.
              </p>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {returnUrl && returnUrl !== '/courses' && (
                <button
                  onClick={() => navigate(returnUrl, { replace: true })}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <ArrowRight size={16} />
                  <span>Continue Back to Quiz Assessment</span>
                </button>
              )}

              <button
                onClick={() => navigate('/courses')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <BookOpen size={16} />
                <span>Browse Quizzes & Courses</span>
              </button>

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/60 font-segoe relative overflow-hidden">
      {/* Soft Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-fade-in">
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row text-left">
          
          {/* Left Brand Panel (Modern Light Gradient Theme) */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-purple-50 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/70 relative">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-blue-200/80 rounded-full text-[11px] font-black uppercase tracking-wider text-blue-700 shadow-2xs">
                <Sparkles size={13} className="text-blue-600" />
                <span>MSC PRPCEM Unified Auth</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {mode === 'forgot-password'
                    ? 'Account Recovery Portal.'
                    : mode === 'register'
                    ? 'Begin Your Learning Journey.'
                    : 'Welcome Back, Learner.'}
                </h2>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {mode === 'forgot-password'
                    ? 'Reset your password securely with a 6-digit OTP sent straight to your email.'
                    : 'Access scheduled assessments, digital badges, and verified certificate credentials.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3 p-3 bg-white/80 border border-slate-200/60 rounded-2xl shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black flex-shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800 block">Single Sign-On (SSO)</span>
                    <span className="text-[10px] text-slate-500">Synced across Quiz & Verification portals</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/80 border border-slate-200/60 rounded-2xl shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black flex-shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="text-xs">
                    <span className="font-extrabold text-slate-800 block">Instant Quiz Resumption</span>
                    <span className="text-[10px] text-slate-500">Redirects back to your assessment</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 text-[11px] text-slate-500 font-semibold flex items-center justify-between">
              <span>Microsoft Student Club PRPCEM</span>
              <span className="px-2 py-0.5 bg-blue-100/80 text-blue-800 rounded-md font-bold text-[10px]">Secure</span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="w-full md:w-7/12 p-6 sm:p-10 flex flex-col justify-center space-y-6">
            
            {/* Header Title & Mode Switcher */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {mode === 'forgot-password'
                      ? 'Reset Password'
                      : mode === 'register'
                      ? 'Create Account'
                      : 'Sign In'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {mode === 'forgot-password'
                      ? resetStep === 1
                        ? 'Enter your registered email to receive an OTP'
                        : resetStep === 2
                        ? 'Verify your 6-digit email OTP code'
                        : 'Choose your new secure password'
                      : mode === 'register'
                      ? 'Create your unified student account'
                      : 'Enter your credentials to continue'}
                  </p>
                </div>

                {mode === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                    className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl"
                  >
                    <ArrowLeft size={13} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Mode Switcher Tabs */}
              {mode !== 'forgot-password' && (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      mode === 'register'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center space-x-2.5 animate-shake">
                <AlertTriangle size={17} className="flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Feedback */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2.5 animate-fade-in">
                <CheckCircle2 size={17} className="flex-shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FORGOT PASSWORD FLOW */}
            {mode === 'forgot-password' ? (
              resetStep === 1 ? (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Registered Email Address</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@gmail.com"
                        value={formData.email}
                        onChange={handleChange}
                        name="email"
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP Code</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : resetStep === 2 ? (
                /* RESET STEP 2: VERIFY OTP CODE */
                <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900 truncate">Email: {formData.email}</span>
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-[11px] text-blue-700 font-extrabold underline cursor-pointer hover:text-blue-900"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">6-Digit Verification Code</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-black tracking-widest bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-center outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || resetOtp.length < 6}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* RESET STEP 3: UPDATE PASSWORD */
                <form onSubmit={handleCompletePasswordReset} className="space-y-3.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 truncate">Verified: {formData.email}</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      Confirmed
                    </span>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">New Password</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 mt-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Continue</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              /* LOGIN & REGISTER FORMS */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Registration OTP Verification Step 2 */}
                {mode === 'register' && regStep === 2 ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-blue-900">Email Verification Required</p>
                      <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        We sent a 6-digit verification code to <span className="font-extrabold text-blue-950">{formData.email}</span>.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">6-Digit Verification Code</label>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound size={16} />
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          value={registerOtp}
                          onChange={(e) => setRegisterOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g. 123456"
                          required
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-black tracking-widest bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all text-center outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="text-slate-500 font-bold hover:underline cursor-pointer"
                      >
                        ← Change Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmit(new Event('submit'))}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || registerOtp.length < 6}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 mt-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Create Account</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Full Name field (Register only) */}
                    {mode === 'register' && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700">Full Name</label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User size={16} />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your Full Name"
                            required={mode === 'register'}
                            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Email Address</label>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your registered email"
                          required
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Username Handle (Register only) */}
                    {mode === 'register' && (
                      <div className="space-y-1.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">Username Handle</label>
                          <span className="text-[10px] text-slate-400 font-semibold">(for public badge profile)</span>
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
                            className="w-full border border-slate-200 rounded-xl pl-8 pr-12 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1.5">
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
                          <span className="text-[10px] font-bold text-emerald-600 block">✓ Available</span>
                        )}
                        {usernameError && (
                          <span className="text-[10px] font-bold text-red-500 block">{usernameError}</span>
                        )}
                      </div>
                    )}

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot-password');
                              setResetStep(1);
                              setError('');
                              setSuccessMsg('');
                            }}
                            className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••••••"
                          required
                          className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password for Register */}
                    {mode === 'register' && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700">Confirm Password</label>
                        <div className="relative flex items-center">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock size={16} />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required={mode === 'register'}
                            className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>{mode === 'register' ? 'Send Verification Code' : 'Sign In'}</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Footer Navigation Switch Link */}
            <div className="text-center pt-3 border-t border-slate-100">
              {mode === 'register' ? (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Already have an account? <span className="text-blue-600 font-extrabold underline">Sign In</span>
                </button>
              ) : mode === 'forgot-password' ? (
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Remember your password? <span className="text-blue-600 font-extrabold underline">Sign In</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Don't have an account? <span className="text-blue-600 font-extrabold underline">Create Account</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
