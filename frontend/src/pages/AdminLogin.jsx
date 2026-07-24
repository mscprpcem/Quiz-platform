import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate('/admin/dashboard');
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_50%_40%_at_70%_20%,_rgba(37,99,235,0.06)_0%,_transparent_55%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_45%_at_25%_80%,_rgba(139,92,246,0.04)_0%,_transparent_55%)]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="form-card p-5 sm:p-9 rounded-2xl space-y-6 sm:space-y-7 relative overflow-hidden">
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: 'linear-gradient(90deg, #2563EB, #0EA5E9, #8B5CF6)' }}></div>

          {/* Header */}
          <div className="text-center space-y-3 pt-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-brand-blue"
                 style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', boxShadow: '0 2px 8px rgba(37,99,235,0.1)' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-textMain tracking-tight">Admin Portal</h2>
            <p className="text-[13px] text-brand-textMuted">
              Sign in to manage and launch event quizzes.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
                 style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.05)' }}>
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
                  Administrator Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted/60 group-focus-within:text-brand-blue transition-colors duration-200">
                    <Mail size={17} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@mscprpcem.edu"
                    className="input-enhanced pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-textMuted/60 group-focus-within:text-brand-blue transition-colors duration-200">
                    <Lock size={17} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-enhanced pl-10"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="border-t pt-5 text-center" style={{ borderColor: 'rgba(229,240,255,0.6)' }}>
            <p className="text-xs text-brand-textMuted/80 leading-relaxed">
              Default administrator credentials: <br />
              <span className="font-semibold text-brand-textMain">admin@microsoftclub.edu</span> or <span className="font-semibold text-brand-textMain">admin@mscprpcem.tech</span>
              <br />
              Password: <span className="font-semibold text-brand-textMain">Admin@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
