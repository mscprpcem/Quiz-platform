import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ArrowRight, Home, Play, RefreshCw, Sparkles, BookOpen, 
  HelpCircle, Hash, AlertOctagon, Compass, CheckCircle2 
} from 'lucide-react';

export default function NotFoundCard({ 
  title = "Quiz Link Not Found", 
  message = "We couldn't locate an active quiz session for this URL.",
  attemptedSlug = "",
  onRetry = null
}) {
  const navigate = useNavigate();
  const [inputCode, setInputCode] = useState('');
  const [searching, setSearching] = useState(false);

  const handleQuickJoin = (e) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) return;
    
    setSearching(true);
    // If it's a 6-digit code or number
    if (/^\d{4,8}$/.test(clean)) {
      navigate(`/join/${clean}`);
    } else {
      navigate(`/q/${clean.replace(/^\//, '')}`);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-10 sm:py-16 px-4 font-segoe text-left relative">
      {/* Ambient Backdrop Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-rose-500/10 via-indigo-500/15 to-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-300/40 space-y-6 text-left relative transition-all">
        
        {/* Top Floating Badge & Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0 animate-bounce-short">
            <Compass size={28} className="animate-pulse" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-rose-100/80 text-rose-800 border border-rose-200 rounded-full flex items-center space-x-1 shadow-2xs">
              <AlertOctagon size={11} className="text-rose-600" />
              <span>404 • Not Found</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
              Quiz Portal
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
            {message}
          </p>

          {attemptedSlug && (
            <div className="pt-1">
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                Attempted: <span className="text-indigo-600">/{attemptedSlug}</span>
              </span>
            </div>
          )}
        </div>

        {/* Possible Causes Box */}
        <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs text-slate-600 font-semibold">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
            <HelpCircle size={14} className="text-indigo-600" />
            <span>Why is this happening?</span>
          </span>
          <ul className="space-y-1.5 text-[11px] text-slate-600 pl-1">
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>The link URL or vanity slug may have a typo or incorrect spelling.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>The scheduled assessment has ended, is paused, or not yet published.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>The quiz organizer might have generated a newer join link or code.</span>
            </li>
          </ul>
        </div>

        {/* Quick Join Code / Slug Finder */}
        <form onSubmit={handleQuickJoin} className="space-y-2 pt-1">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
            Have a Quiz Code or Custom Link?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter 6-digit PIN or slug (e.g. 123456 or visionx)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!inputCode.trim() || searching}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer active:scale-95 flex-shrink-0"
            >
              <span>{searching ? 'Finding...' : 'Go to Quiz'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-98"
          >
            <Home size={15} />
            <span>Return to Homepage</span>
          </button>

          <button
            onClick={() => navigate('/join')}
            className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs border border-slate-200 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-98"
          >
            <Play size={14} className="text-indigo-600 fill-indigo-600" />
            <span>Join Live Lobby</span>
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs border border-slate-200 flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-98"
              title="Refresh and check again"
            >
              <RefreshCw size={14} className="text-slate-600" />
              <span>Retry</span>
            </button>
          )}
        </div>

        {/* Quick Discovery Links */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Quick Navigation:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/courses')}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
            >
              <BookOpen size={12} />
              <span>All Courses</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigate('/practice')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
            >
              <Sparkles size={12} />
              <span>Practice Mode</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
