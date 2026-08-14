import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setStudentAccount } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');
      const errorDesc = params.get('error_description');

      if (errorParam) {
        setError(errorDesc || errorParam || 'OAuth Authorization failed');
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code provided in URL callback');
        setLoading(false);
        return;
      }

      try {
        const codeVerifier = sessionStorage.getItem('msc_pkce_verifier') || localStorage.getItem('msc_pkce_verifier');
        const redirectUri = `${window.location.origin}/auth/callback`;

        const res = await api.post('/api/student/oauth/exchange', {
          code,
          client_id: 'msc-quiz-web',
          code_verifier: codeVerifier,
          redirect_uri: redirectUri
        });

        if (res.data && res.data.success && res.data.user) {
          localStorage.setItem('msc_student_account', JSON.stringify(res.data.user));
          if (res.data.token) {
            localStorage.setItem('msc_quiz_token', res.data.token);
            localStorage.setItem('msc_quiz_token_time', Date.now().toString());
          }
          if (setStudentAccount) {
            setStudentAccount(res.data.user);
          }

          // Clean up stored PKCE verifier
          sessionStorage.removeItem('msc_pkce_verifier');
          localStorage.removeItem('msc_pkce_verifier');

          // Redirect to stored destination or home
          const returnUrl = sessionStorage.getItem('msc_sso_return_url') || '/';
          sessionStorage.removeItem('msc_sso_return_url');
          setTimeout(() => navigate(returnUrl, { replace: true }), 800);
        } else {
          setError(res.data?.error_description || res.data?.error || 'OAuth token exchange failed');
          setLoading(false);
        }
      } catch (err) {
        console.error('OAuth Callback Processing Error:', err);
        setError(err.response?.data?.error_description || err.response?.data?.error || 'Authentication error during central SSO exchange');
        setLoading(false);
      }
    };

    processCallback();
  }, [location, navigate, setStudentAccount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-segoe text-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Connecting to MSC Central Identity</h2>
            <p className="text-xs font-semibold text-slate-500">Exchanging secure authorization tokens...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">SSO Authentication Error</h2>
            <p className="text-xs font-semibold text-rose-600">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Return to Login Page
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Authenticated via MSC SSO</h2>
            <p className="text-xs font-semibold text-emerald-600">Redirecting to your session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
