import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail, ShieldCheck, ExternalLink } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const location = useLocation();

  // Show footer only on the Home page (exact path "/")
  if (location.pathname !== '/') {
    return null;
  }

  return (
    <footer className="app-footer">
      {/* Top accent gradient line */}
      <div className="footer-top-accent"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 pb-10 border-b border-zinc-100">
          
          {/* Column 1: Brand (Col span 4) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              {/* Microsoft Colors Custom Grid Logo */}
              <div className="grid grid-cols-2 gap-[2px] w-5 h-5 flex-shrink-0">
                <div className="bg-red-500 rounded-[1px] w-2 h-2"></div>
                <div className="bg-emerald-500 rounded-[1px] w-2 h-2"></div>
                <div className="bg-blue-500 rounded-[1px] w-2 h-2"></div>
                <div className="bg-amber-500 rounded-[1px] w-2 h-2"></div>
              </div>
              <div className="text-left">
                <span className="font-black text-sm tracking-wide text-brand-textMain uppercase block leading-none">MSCPRPCEM</span>
                <span className="font-extrabold text-[9px] text-brand-blue tracking-widest uppercase block mt-1">Live Quiz Platform</span>
              </div>
            </div>
            <p className="text-xs text-brand-textMuted leading-relaxed max-w-xs">
              A secure platform for conducting live quizzes during club events.
            </p>
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <ShieldCheck size={12} className="text-blue-600" />
              <span>Verified Campus Portal</span>
            </div>
          </div>

          {/* Column 2: Club Ecosystem (Col span 2) */}
          <div className="md:col-span-2 space-y-4">
            <span className="footer-section-title">Club Ecosystem</span>
            <ul className="space-y-2.5">
              <li>
                <a href="https://www.mscprpcem.tech" target="_blank" rel="noopener noreferrer" className="footer-link flex items-center gap-1">
                  <span>Main Website</span>
                  <ExternalLink size={10} className="text-zinc-400" />
                </a>
              </li>
              <li>
                <Link to="/" className="footer-link">Live Quiz</Link>
              </li>
              <li>
                <a href="#cert-verify" className="footer-link">Certificate Verify</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources (Col span 2) */}
          <div className="md:col-span-2 space-y-4">
            <span className="footer-section-title">Resources</span>
            <ul className="space-y-2.5">
              <li>
                <Link to="/rules" className="footer-link">Quiz Rules</Link>
              </li>
              <li>
                <Link to="/faq-details" className="footer-link">FAQ</Link>
              </li>
              <li>
                <Link to="/user-guide" className="footer-link">User Guide</Link>
              </li>
              <li>
                <Link to="/support-sla" className="footer-link">Support</Link>
              </li>
              <li>
                <Link to="/report-issue" className="footer-link">Report Issue</Link>
              </li>
              <li>
                <Link to="/documentation" className="footer-link">Documentation</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal (Col span 2) */}
          <div className="md:col-span-2 space-y-4">
            <span className="footer-section-title">Legal</span>
            <ul className="space-y-2.5">
              <li>
                <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">Terms</Link>
              </li>
              <li>
                <Link to="/cookies" className="footer-link">Cookie Policy</Link>
              </li>
              <li>
                <Link to="/code-of-conduct" className="footer-link">Code of Conduct</Link>
              </li>
              <li>
                <Link to="/disclaimer" className="footer-link">Disclaimer</Link>
              </li>
              <li>
                <Link to="/accessibility" className="footer-link">Accessibility</Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Connect (Col span 2) */}
          <div className="md:col-span-2 space-y-4">
            <span className="footer-section-title">Connect</span>
            <ul className="space-y-2.5">
              <li>
                <a href="https://linktr.ee/mscprpcem" target="_blank" rel="noopener noreferrer" className="footer-link font-bold text-brand-blue">Linktree</a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
              </li>
              <li>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-link">YouTube</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-zinc-400" />
              <span>Technical Support:</span>
              <a href="mailto:support@mscprpcem.tech" className="text-zinc-500 hover:text-brand-blue normal-case font-bold transition-colors">support@mscprpcem.tech</a>
            </div>
            <span className="hidden md:inline text-zinc-200">|</span>
            <span>Version 1.0.0</span>
            <span className="hidden md:inline text-zinc-200">|</span>
            <span className="text-zinc-500 font-bold">Powered by Azure</span>
          </div>
          <p className="text-zinc-400">© {new Date().getFullYear()} MSCPRPCEM. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
