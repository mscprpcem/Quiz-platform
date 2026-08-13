import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function VanityRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    resolveSlug();
  }, [slug]);

  const resolveSlug = async () => {
    try {
      setError('');
      const res = await api.get(`/api/scheduled-quizzes/slug/${slug}`);
      const { activeOccurrenceId, quiz } = res.data;

      if (activeOccurrenceId) {
        navigate(`/scheduled-quiz/${activeOccurrenceId}`, { replace: true });
      } else if (quiz?.join_code) {
        navigate('/join', { state: { code: quiz.join_code }, replace: true });
      } else {
        setError(`No active session found for link '/${slug}'.`);
      }
    } catch (err) {
      console.error('Vanity redirect error:', err);
      setError(err.response?.data?.error || `Could not find quiz associated with '/${slug}'.`);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-segoe">
      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-md max-w-md w-full space-y-4">
        {error ? (
          <>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Quiz Link Not Found</h2>
            <p className="text-xs text-slate-500 font-semibold">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-blue-600 text-white font-extrabold rounded-xl text-xs cursor-pointer"
            >
              Return to Homepage
            </button>
          </>
        ) : (
          <>
            <RefreshCw size={36} className="text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-900">Connecting to Quiz...</h2>
            <p className="text-xs text-slate-500 font-semibold">Resolving custom link <span className="font-mono text-blue-600">/{slug}</span></p>
          </>
        )}
      </div>
    </div>
  );
}
