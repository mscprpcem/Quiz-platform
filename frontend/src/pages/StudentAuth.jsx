import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, CheckCircle2, ArrowRight,
  AlertTriangle, Loader2, BookOpen, Eye, EyeOff, KeyRound, ArrowLeft, ShieldCheck
} from 'lucide-react';

export default function StudentAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentAccount, studentLogin, studentRegister, studentLogout, forgotPassword, verifyOtp, resetPassword } = useAuth();

  // Mode: 'login' | 'register' | 'forgot-password'
  const isRegisterInitial = location.pathname.includes('register');
  const [mode, setMode] = useState(isRegisterInitial ? 'register' : 'login');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
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

  // Auto-redirect if student is already authenticated
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
      setSuccessMsg(res.message || `Verification code sent to ${formData.email.trim()}.`);
      setResetStep(2);
    } else {
      setError(res.error || 'Failed to send verification code. Check your email.');
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
      setSuccessMsg('Code verified! Enter your new password.');
      setResetStep(3);
    } else {
      setError(res.error || 'Invalid or expired code. Please try again.');
    }
  };

  // Handle Complete Password Reset (Step 3: Update & Auto-Login)
  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await resetPassword(formData.email.trim(), resetOtp.trim(), newPassword);

    if (res.success) {
      setSuccessMsg('Password updated! Signing you in...');
      
      const loginRes = await studentLogin(formData.email.trim(), newPassword);
      setLoading(false);

      const destination = getReturnUrl();
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 800);
    } else {
      setLoading(false);
      setError(res.error || 'Failed to update password.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const { name, email, password, confirmPassword } = formData;
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
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
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
        const usernameAuto = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
        const res = await studentRegister({
          name: name.trim(),
          email: cleanEmail,
          password,
          username: usernameAuto,
          otp: regStep === 2 ? registerOtp.trim() : undefined
        });

        if (res.requireVerification) {
          setRegStep(2);
          setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}.`);
        } else if (res.success) {
          setSuccessMsg('Account created successfully! Redirecting...');
          setRegStep(1);
          setRegisterOtp('');
          const destination = getReturnUrl();
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 800);
        } else {
          setError(res.error || 'Failed to create account.');
        }
      } else {
        const res = await studentLogin(cleanEmail, password);
        if (res.success) {
          setSuccessMsg('Signed in successfully! Redirecting...');
          const destination = getReturnUrl();
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 600);
        } else {
          setError(res.error || 'Invalid email or password.');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, show simple session card
  if (studentAccount) {
    const returnUrl = getReturnUrl();

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 bg-slate-50 font-segoe">
        <div className="max-w-md w-full animate-fade-in">
          <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-sm space-y-6 text-center">
            
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck size={26} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{studentAccount.name}</h2>
              <p className="text-xs text-slate-500">{studentAccount.email}</p>
            </div>

            <div className="space-y-2.5 pt-2">
              {returnUrl && returnUrl !== '/courses' && (
                <button
                  onClick={() => navigate(returnUrl, { replace: true })}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Continue Back to Quiz</span>
                  <ArrowRight size={15} />
                </button>
              )}

              <button
                onClick={() => navigate('/courses')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <BookOpen size={15} />
                <span>Browse Quizzes & Courses</span>
              </button>

              <button
                onClick={studentLogout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 bg-slate-50 font-segoe">
      <div className="max-w-md w-full animate-fade-in">
        
        {/* Clean, Focused White Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm space-y-6 text-left">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <img src="/logo.png" alt="MSC Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">MSC PRPCEM</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'forgot-password'
                ? 'Reset Password'
                : mode === 'register'
                ? 'Create an Account'
                : 'Sign In'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {mode === 'forgot-password'
                ? 'Enter your details to restore account access'
                : mode === 'register'
                ? 'Enter your information to get started'
                : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot-password' ? (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center space-x-2">
              <AlertTriangle size={15} className="flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot-password' ? (
            resetStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      name="email"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            ) : resetStep === 2 ? (
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-700">6-Digit Code</label>
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-center bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || resetOtp.length < 6}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Sign In</span>
                  )}
                </button>
              </form>
            )
          ) : (
            /* LOGIN & REGISTER FORMS */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && regStep === 2 ? (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Verification Code</label>
                    <div className="relative flex items-center">
                      <KeyRound size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={6}
                        value={registerOtp}
                        onChange={(e) => setRegisterOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-center bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      ← Change Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(new Event('submit'))}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || registerOtp.length < 6}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Complete Registration</span>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {/* Name (Register only) */}
                  {mode === 'register' && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                      <div className="relative flex items-center">
                        <User size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Amit Yadav"
                          required={mode === 'register'}
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-password');
                            setResetStep(1);
                            setError('');
                            setSuccessMsg('');
                          }}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••••••"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (Register only) */}
                  {mode === 'register' && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                      <div className="relative flex items-center">
                        <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm password"
                          required={mode === 'register'}
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                    )}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Footer Switch */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            {mode === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : mode === 'forgot-password' ? (
              <span>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </span>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
