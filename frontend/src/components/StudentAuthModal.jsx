import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, KeyRound, ArrowLeft, X } from 'lucide-react';

export default function StudentAuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }) {
  const { studentLogin, studentRegister, forgotPassword, verifyOtp, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register' | 'forgot-password'
  
  // Login & Register Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameCustomized, setIsUsernameCustomized] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Registration OTP State
  const [regStep, setRegStep] = useState(1);
  const [registerOtp, setRegisterOtp] = useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password Flow State
  const [resetStep, setResetStep] = useState(1); // 1 = Email, 2 = OTP, 3 = New Password
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Handle Send Reset OTP
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
      setSuccessMessage(res.message || `Verification code sent to ${email.trim()}.`);
      setResetStep(2);
    } else {
      setErrorMessage(res.error || 'Failed to send reset code. Check your email address.');
    }
  };

  // Handle Verify Reset OTP
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
      setSuccessMessage('Code verified! Enter your new password.');
      setResetStep(3);
    } else {
      setErrorMessage(res.error || 'Invalid or expired verification code.');
    }
  };

  // Handle Complete Password Reset
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

    if (res.success) {
      setSuccessMessage('Password updated! Signing you in...');
      const loginRes = await studentLogin(email.trim(), newPassword);
      setLoading(false);

      if (loginRes.success) {
        setTimeout(() => {
          if (onSuccess) onSuccess(loginRes.user);
          if (onClose) onClose();
        }, 800);
      } else {
        setActiveTab('login');
        setPassword('');
      }
    } else {
      setLoading(false);
      setErrorMessage(res.error || 'Failed to update password. Please try again.');
    }
  };

  // Handle Login & Registration Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (activeTab === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setLoading(true);
      const finalUsername = (username || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).replace(/[^a-z0-9_-]/g, '');
      const res = await studentRegister({
        name: name.trim(),
        username: finalUsername,
        email: email.trim(),
        password,
        otp: regStep === 2 ? registerOtp.trim() : undefined
      });
      setLoading(false);

      if (res.requireVerification) {
        setRegStep(2);
        setSuccessMessage(res.message || `Verification code sent to ${email.trim()}.`);
      } else if (res.success) {
        setSuccessMessage('Account verified & created! Unlocking quiz...');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } else {
      // Login
      if (!email.trim() || !password) {
        setErrorMessage('Please enter your email and password.');
        return;
      }

      setLoading(true);
      const res = await studentLogin(email.trim(), password);
      setLoading(false);

      if (res.success) {
        setSuccessMessage('Signed in! Unlocking quiz...');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          if (onClose) onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in font-segoe">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 text-left">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeTab === 'forgot-password'
              ? 'Reset Password'
              : activeTab === 'register'
              ? 'Create Account'
              : 'Sign In to Continue'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {activeTab === 'forgot-password'
              ? 'Restore access to your account'
              : 'Sign in to access your assessment'}
          </p>
        </div>

        {/* Mode Switcher */}
        {activeTab !== 'forgot-password' ? (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'register' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center space-x-2">
            <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FLOW */}
        {activeTab === 'forgot-password' ? (
          resetStep === 1 ? (
            <form onSubmit={handleSendResetOtp} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Send Code</span>}
              </button>
            </form>
          ) : resetStep === 2 ? (
            <form onSubmit={handleVerifyResetOtp} className="space-y-3.5">
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
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-center bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resetOtp.length < 6}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Verify Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompletePasswordReset} className="space-y-3.5">
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
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
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
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Update & Continue</span>}
              </button>
            </form>
          )
        ) : (
          /* LOGIN & REGISTER FORMS */
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === 'register' && regStep === 2 ? (
              <div className="space-y-3 animate-fade-in">
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
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Verify & Continue</span>}
                </button>
              </div>
            ) : (
              <>
                {/* Name (Register only) */}
                {activeTab === 'register' && (
                  <>
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                      <div className="relative flex items-center">
                        <User size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Amit Yadav"
                          value={name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setName(newName);
                            if (!isUsernameCustomized) {
                              setUsername(newName.toLowerCase().replace(/[^a-z0-9]/g, ''));
                            }
                          }}
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Username Handle */}
                    <div className="space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">Username Handle</label>
                        <span className="text-[10px] text-slate-400 font-mono">unique handle</span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-black text-slate-400 select-none">@</span>
                        <input
                          type="text"
                          required
                          placeholder="amityadav"
                          value={username}
                          onChange={(e) => {
                            setIsUsernameCustomized(true);
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                          }}
                          className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    {activeTab === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('forgot-password');
                          setResetStep(1);
                          setErrorMessage('');
                          setSuccessMessage('');
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
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
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
                {activeTab === 'register' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs bg-slate-50/50 focus:bg-white focus:border-blue-600 outline-none"
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
                    <span>{activeTab === 'register' ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>
              </>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
