import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';

export default function Disclaimer() {
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
              <AlertTriangle size={12} className="stroke-[3]" />
              <span>Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Disclaimer</h1>
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Last Updated: July 15, 2026</p>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 italic leading-relaxed">
              General limitations of liabilities, grading accuracy, and connection logs validity.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-6">
            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">1. Content Accuracy</h3>
              <p>
                Quiz questions, developer guides, and workshop slides are compiled by student leads. The club is not liable for errors in grading.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">2. Service Availability</h3>
              <p>
                The portal is provided on an 'as-is' basis. While we strive to maintain uninterrupted server logs, we are not liable for session drops due to internet lags.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">3. External Resources</h3>
              <p>
                External references or workshop links provided during events are managed by third parties.
              </p>
            </section>
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Microsoft Student Club PRPCEM</span>
            <span>Doc Ref: DISCLAIMER-2026</span>
          </div>
        </div>

      </div>
    </div>
  );
}
