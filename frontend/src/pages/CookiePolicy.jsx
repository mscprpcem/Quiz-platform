import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Check } from 'lucide-react';

export default function CookiePolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-blue uppercase tracking-wider transition-colors duration-200">
            <ArrowLeft size={14} />
            <span>Back to Portal</span>
          </Link>
          <div className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-3 py-1 rounded-full border border-blue-100/60 shadow-sm flex items-center gap-1">
            <Check size={10} className="stroke-[3]" />
            <span>Verified Doc</span>
          </div>
        </div>

        {/* Main Document Block */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-soft text-left space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-lightBlue/10 to-transparent pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 text-brand-blue bg-brand-lightBlue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Eye size={12} className="stroke-[3]" />
              <span>Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Cookie Policy</h1>
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Last Updated: July 15, 2026</p>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 italic leading-relaxed">
              Information regarding local session storage, state retention, and anti-cheat tracking.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-6">
            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">1. Session Persistence</h3>
              <p>
                Browser cookies and local storage tokens keep you logged in to the live quiz lobby if a network drop or page reload occurs.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">2. Cheating Prevention</h3>
              <p>
                Focus tracking records tab shifts using local focus event APIs to maintain test integrity. No external tabs or browser history is inspected.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">3. Admin Panel Analytics</h3>
              <p>
                Standard cookies are used to validate active administrator authentication states.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">4. Preference Trackers</h3>
              <p>
                No tracking cookies or advertising pixels are integrated. We use purely functional developer tokens.
              </p>
            </section>
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Microsoft Student Club PRPCEM</span>
            <span>Doc Ref: COOKIES-2026</span>
          </div>
        </div>

      </div>
    </div>
  );
}
