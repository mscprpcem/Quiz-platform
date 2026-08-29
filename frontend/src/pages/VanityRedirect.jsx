import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RefreshCw, Sparkles, Compass } from 'lucide-react';
import NotFoundCard from '../components/NotFoundCard';

export default function VanityRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    resolveSlug();
  }, [slug]);

  const resolveSlug = async () => {
    try {
      setLoading(true);
      setError('');
      const cleanSlug = slug.trim().replace(/^\//, '');
      const res = await api.get(`/api/scheduled-quizzes/slug/${cleanSlug}`);
      const { activeOccurrenceId, quiz, isLive } = res.data;

      if (isLive && quiz?.join_code) {
        navigate(`/join/${quiz.join_code}`, { replace: true });
        return;
      }

      const targetSlug = quiz?.custom_slug || cleanSlug;
      navigate(`/q/${targetSlug}`, { replace: true });
    } catch (err) {
      console.error('Vanity redirect error:', err);
      setError(err.response?.data?.error || `Could not find any active quiz associated with "/${slug}".`);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <NotFoundCard
          title="Quiz Link Not Found"
          message={error}
          attemptedSlug={slug}
          onRetry={resolveSlug}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center font-segoe relative">
      {/* Ambient Backdrop Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 max-w-md w-full space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
          <RefreshCw size={28} className="animate-spin text-white" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900">Connecting to Quiz...</h2>
          <p className="text-xs text-slate-500 font-semibold">
            Resolving custom link <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">/{slug}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
