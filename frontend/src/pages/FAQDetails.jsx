import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Check } from 'lucide-react';

export default function FAQDetails() {
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
              <HelpCircle size={12} className="stroke-[3]" />
              <span>Resources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Frequently Asked Questions</h1>
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Last Updated: July 15, 2026</p>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 italic leading-relaxed">
              Troubleshooting guide for login, focus locking, and certificate downloads.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium space-y-6 divide-y divide-slate-100">
            {/* 1. Joining & Event Sessions */}
            <div className="space-y-4 pt-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                1. Joining & Event Sessions
              </span>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: How do I join a live quiz or scheduled assessment?</h3>
                <p>
                  Enter the 6-digit room code or vanity link slug in the Join Quiz section on the home page, or scan the official event QR code displayed on presentation slides. No software installation is required.
                </p>
              </section>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: Can I join after a live round has already started?</h3>
                <p>
                  Yes, late joiners can enter active lobbies at any point. You will automatically receive questions from the active round onward; however, points for previously expired questions will not be awarded.
                </p>
              </section>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: What happens if my internet connection drops?</h3>
                <p>
                  Our WebSocket connection layer automatically handles reconnect handshakes. Simply refresh your browser tab or re-enter the 6-digit code to resume immediately from the current question without losing your previous score.
                </p>
              </section>
            </div>

            {/* 2. Verification & Certificates */}
            <div className="space-y-4 pt-6">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                2. Verification & Certificates
              </span>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: How do I verify and download my certificate?</h3>
                <p>
                  Once organizers finalize and approve the event scorecard, navigate to the Official Verification Portal section on the homepage or visit <strong className="text-slate-800">verify.mscprpcem.tech</strong>. Enter your student handle (e.g. <span className="font-mono text-blue-600">@amityadav</span>) or Credential ID to download your cryptographically verified PDF.
                </p>
              </section>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: Do guest participants receive certificates?</h3>
                <p>
                  Guest players receive instant on-screen score reports. To earn permanently verifiable credentials, create or link an MSC Student Account before or immediately after the event.
                </p>
              </section>
            </div>

            {/* 3. Anti-Cheat & Proctoring */}
            <div className="space-y-4 pt-6">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                3. Anti-Cheat & Academic Integrity
              </span>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: Why did my quiz lock or flag a violation?</h3>
                <p>
                  Competitions require strict academic focus. The system tracks tab-switching, window minimizing, and exiting full-screen mode. If the violation counter exceeds the event limit, your session is automatically locked. Venue proctors or event admins can review and reset your status if necessary.
                </p>
              </section>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: How are leaderboard ties broken?</h3>
                <p>
                  Ties are resolved hierarchically: first by total score, then by question accuracy count, third by lowest cumulative response time (in seconds), and finally by fewest focus violations.
                </p>
              </section>
            </div>

            {/* 4. Course Tracks & Practice */}
            <div className="space-y-4 pt-6">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                4. Practice & Learning Hub
              </span>
              <section className="space-y-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">Q: Is the In-Browser SQL Lab free to practice?</h3>
                <p>
                  Yes, the SQL Course Hub and interactive browser lab are 100% free for all students. You can execute real queries against mock database schemas, practice FAANG interview questions, and receive automated syntax validation.
                </p>
              </section>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Microsoft Student Club PRPCEM</span>
            <span>Doc Ref: FAQ-2026</span>
          </div>
        </div>

      </div>
    </div>
  );
}
