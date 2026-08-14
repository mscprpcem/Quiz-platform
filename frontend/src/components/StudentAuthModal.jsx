import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, X, Sparkles, Search, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

export default function StudentAuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }) {
  const { studentLogin, studentRegister, checkUsername, forgotPassword, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register' | 'forgot-password'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password / OTP State
  const [resetStep, setResetStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Registration OTP State
  const [regStep, setRegStep] = useState(1); // 1 = Form, 2 = Enter Verification OTP
  const [registerOtp, setRegisterOtp] = useState('');

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

  // Handle Send Reset OTP (Step 1)
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || `Verification code sent to ${email.trim()}. Please enter your code.`);
      setResetStep(2);
    } else {
      setErrorMessage(res.error || 'Failed to send verification code. Check your email address.');
    }
  };

  // Handle Verify Reset OTP (Step 2)
  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await verifyOtp(email.trim(), resetOtp.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Verification code confirmed! Please enter your new password.');
      setResetStep(3);
    } else {
      setErrorMessage(res.error || 'Invalid or expired verification code. Please try again.');
    }
  };

  // Handle Complete Password Reset (Step 3)
  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await resetPassword(email.trim(), resetOtp.trim(), newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Password updated successfully! Redirecting to Sign In...');
      setTimeout(() => {
        setActiveTab('login');
        setPassword('');
        setResetStep(1);
        setResetOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Failed to update password. Please try again.');
    }
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
        username: username.trim(),
        otp: regStep === 2 ? registerOtp.trim() : undefined
      });
      setLoading(false);

      if (res.requireVerification) {
        setRegStep(2);
        setSuccessMessage(res.message || `Verification code sent to ${email.trim()}. Please enter your 6-digit code below.`);
      } else if (res.success) {
        setSuccessMessage('Email verified and account created successfully!');
        setRegStep(1);
        setRegisterOtp('');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else if (activeTab === 'login') {
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

        {/* Left Banner */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-300">
              <Sparkles size={12} />
              <span>MSC PRPCEM Unified ID</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {activeTab === 'forgot-password' ? 'Instant Account Recovery.' : 'Your Achievements, Verified.'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {activeTab === 'forgot-password'
                  ? 'Reset your password'
                  : ''}
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
                <span className="text-[10px] text-slate-300">Connected with verify.mscprpcem.tech</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center space-y-5">
          
          {/* Header Tabs */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {activeTab === 'forgot-password'
                  ? 'Reset Password'
                  : activeTab === 'register'
                  ? 'Create Your Account'
                  : 'Sign In to Your Account'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {activeTab === 'forgot-password'
                  ? resetStep === 1
                    ? 'Enter your email to receive an OTP code'
                    : 'Enter OTP and your new password'
                  : activeTab === 'register'
                  ? 'Fill in the details to get started'
                  : 'Enter your credentials to continue'}
              </p>
            </div>

            {activeTab !== 'forgot-password' ? (
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
            ) : (
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </button>
            )}
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

          {/* FORGOT PASSWORD FLOW */}
          {activeTab === 'forgot-password' ? (
            resetStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Registered Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending OTP Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : resetStep === 2 ? (
              /* RESET STEP 2: VERIFY OTP CODE */
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 truncate">Email: {email}</span>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-[11px] text-blue-700 font-extrabold underline cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">6-Digit Verification OTP Code</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-black tracking-widest bg-slate-50 focus:bg-white focus:border-blue-600 transition-all text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || resetOtp.length < 6}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* RESET STEP 3: UPDATE PASSWORD */
              <form onSubmit={handleCompletePasswordReset} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 truncate">OTP Confirmed for {email}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-700">Verified</span>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Must be at least 8 characters</span>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold bg-slate-50 focus:bg-white focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password & Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* LOGIN & REGISTER FORMS */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Registration OTP Verification Step 2 */}
              {activeTab === 'register' && regStep === 2 ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-blue-900">Email Verification Required</p>
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      We sent a 6-digit verification code to <span className="font-extrabold text-blue-950">{email}</span>.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">6-Digit Verification OTP</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={registerOtp}
                        onChange={(e) => setRegisterOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 123456"
                        required
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-black tracking-widest bg-slate-50 focus:bg-white focus:border-blue-600 transition-all text-center"
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
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Create Account</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
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

                  {/* Username Handle Field (Register only) */}
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
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      {activeTab === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('forgot-password');
                            setResetStep(1);
                            setErrorMessage('');
                            setSuccessMessage('');
                          }}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                    <span>{loading ? 'Authenticating...' : activeTab === 'register' ? 'Send Verification Code' : 'Sign In'}</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              )}

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
          )}

        </div>
      </div>
    </div>
  );
}
