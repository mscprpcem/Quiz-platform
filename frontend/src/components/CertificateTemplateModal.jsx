import React, { useState, useEffect } from 'react';
import { X, Upload, RefreshCw, Save, Download, FileCode, CheckCircle2, Copy, Eye, HelpCircle } from 'lucide-react';
import api from '../services/api';

const DEFAULT_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="1000" height="700" fill="url(#bgGrad)"/>
  <rect x="25" y="25" width="950" height="650" fill="none" stroke="url(#accentGrad)" stroke-width="4" rx="16"/>
  <rect x="35" y="35" width="930" height="630" fill="none" stroke="#334155" stroke-width="1" rx="12"/>

  <!-- Brand Header -->
  <g transform="translate(60, 70)">
    <rect x="0" y="0" width="18" height="18" fill="#f25022"/>
    <rect x="22" y="0" width="18" height="18" fill="#7fba00"/>
    <rect x="0" y="22" width="18" height="18" fill="#00a4ef"/>
    <rect x="22" y="22" width="18" height="18" fill="#ffb900"/>
    <text x="54" y="28" fill="#f8fafc" font-family="'Segoe UI', sans-serif" font-size="20" font-weight="800" letter-spacing="1">MICROSOFT STUDENT CLUB</text>
    <text x="54" y="48" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" letter-spacing="2">PRPCEM CHAPTER • OFFICIAL CREDENTIAL</text>
  </g>

  <!-- Title -->
  <text x="500" y="200" fill="#93c5fd" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="4">CERTIFICATE OF ACHIEVEMENT</text>
  <text x="500" y="240" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="400" text-anchor="middle">PROUDLY PRESENTED TO</text>

  <!-- Recipient Name -->
  <text x="500" y="310" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="38" font-weight="900" text-anchor="middle" filter="url(#shadow)">{{name}}</text>
  <line x1="300" y1="330" x2="700" y2="330" stroke="url(#accentGrad)" stroke-width="2"/>

  <!-- Achievement Details -->
  <text x="500" y="375" fill="#cbd5e1" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="400" text-anchor="middle">For outstanding performance in {{event_name}}</text>
  <text x="500" y="420" fill="#60a5fa" font-family="'Segoe UI', sans-serif" font-size="26" font-weight="800" text-anchor="middle">{{title}}</text>
  <text x="500" y="460" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" text-anchor="middle">Category: {{category}} | Rank: #{{rank}} | Score: {{score}} pts</text>

  <!-- Footer -->
  <g transform="translate(80, 560)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">DATE ISSUED</text>
    <text x="0" y="20" fill="#f8fafc" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="700">{{date}}</text>
  </g>

  <g transform="translate(500, 560)">
    <circle cx="0" cy="0" r="30" fill="#1e3a8a" stroke="url(#accentGrad)" stroke-width="3"/>
    <path d="M-10,-4 L0,12 L12,-10" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="0" y="45" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" text-anchor="middle">VERIFIED</text>
  </g>

  <g transform="translate(920, 560)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" text-anchor="end">CREDENTIAL ID</text>
    <text x="0" y="20" fill="#60a5fa" font-family="Consolas, monospace" font-size="14" font-weight="800" text-anchor="end">{{credential_id}}</text>
  </g>
</svg>`;

export default function CertificateTemplateModal({ quiz, onClose, onSaveSuccess }) {
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedTag, setCopiedTag] = useState(null);

  // Sample data for live preview
  const [sampleData, setSampleData] = useState({
    name: 'Amit Yadav',
    title: quiz?.title || 'Web Development Master Quiz',
    event_name: quiz?.event_name || 'Spark26 Tech Fest',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    score: '185',
    rank: '1',
    category: '1st Place Winner',
    credential_id: 'MSC-BDG-88291'
  });

  const placeholders = [
    { tag: '{{name}}', label: 'Recipient Name' },
    { tag: '{{title}}', label: 'Quiz Title' },
    { tag: '{{event_name}}', label: 'Event Name' },
    { tag: '{{date}}', label: 'Issue Date' },
    { tag: '{{score}}', label: 'Total Score' },
    { tag: '{{rank}}', label: 'Leaderboard Rank' },
    { tag: '{{category}}', label: 'Certificate Category' },
    { tag: '{{credential_id}}', label: 'Credential ID' }
  ];

  useEffect(() => {
    if (quiz?.id) {
      loadTemplate();
    }
  }, [quiz]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${quiz.id}/template`);
      setSvgContent(res.data.svg_template || DEFAULT_SVG);
    } catch (err) {
      console.error('Error loading SVG template:', err);
      setSvgContent(DEFAULT_SVG);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setFeedback({ type: 'error', message: 'Please upload a valid .svg file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setSvgContent(content);
        setFeedback({ type: 'success', message: `Uploaded "${file.name}" successfully!` });
      }
    };
    reader.readAsText(file);
  };

  const insertPlaceholder = (tag) => {
    setSvgContent((prev) => prev + `\n${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      await api.post(`/api/quizzes/${quiz.id}/template`, {
        svg_template: svgContent
      });
      setFeedback({ type: 'success', message: 'SVG Certificate template saved successfully to quiz!' });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to render live SVG with substituted placeholders
  const renderLiveSvg = () => {
    let svg = svgContent || DEFAULT_SVG;
    const escapeXml = (unsafe) => String(unsafe || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    svg = svg.replace(/\{\{\s*(RECIPIENT_NAME|NAME|name)\s*\}\}/g, escapeXml(sampleData.name));
    svg = svg.replace(/\{\{\s*(QUIZ_TITLE|TITLE|title)\s*\}\}/g, escapeXml(sampleData.title));
    svg = svg.replace(/\{\{\s*(EVENT_NAME|event_name)\s*\}\}/g, escapeXml(sampleData.event_name));
    svg = svg.replace(/\{\{\s*(ISSUE_DATE|DATE|date)\s*\}\}/g, escapeXml(sampleData.date));
    svg = svg.replace(/\{\{\s*(SCORE|score)\s*\}\}/g, escapeXml(sampleData.score));
    svg = svg.replace(/\{\{\s*(RANK|rank)\s*\}\}/g, escapeXml(sampleData.rank));
    svg = svg.replace(/\{\{\s*(CATEGORY|category)\s*\}\}/g, escapeXml(sampleData.category));
    svg = svg.replace(/\{\{\s*(CREDENTIAL_ID|ID|credential_id|id)\s*\}\}/g, escapeXml(sampleData.credential_id));

    return svg;
  };

  const handleDownloadPreview = () => {
    const svgStr = renderLiveSvg();
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate_${quiz?.title?.replace(/\s+/g, '_') || 'Preview'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <FileCode size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                SVG Certificate Template & Live Previewer
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Quiz: <strong className="text-blue-600">{quiz?.title}</strong> • Event: <strong className="text-blue-600">{quiz?.event_name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Split view */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Code Editor & Upload (5 Cols) */}
          <div className="lg:col-span-5 border-r border-slate-200 p-5 flex flex-col space-y-4 bg-slate-50/50 overflow-y-auto">
            
            {/* Upload & Actions */}
            <div className="flex items-center justify-between gap-2">
              <label className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">
                <Upload size={14} />
                <span>Upload .SVG Template</span>
                <input type="file" accept=".svg" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={() => setSvgContent(DEFAULT_SVG)}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Reset to Default Vector Template"
              >
                <RefreshCw size={13} />
                <span>Default</span>
              </button>
            </div>

            {/* Clickable Placeholders Toolbar */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <HelpCircle size={12} className="text-blue-500" />
                Available Dynamic Placeholders (Click to insert):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map((p) => (
                  <button
                    key={p.tag}
                    onClick={() => insertPlaceholder(p.tag)}
                    className="text-[11px] font-mono font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title={`Insert ${p.label}`}
                  >
                    <span>{p.tag}</span>
                    {copiedTag === p.tag ? <CheckCircle2 size={11} className="text-emerald-600" /> : <Copy size={10} className="text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-h-[260px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">SVG Code Editor</span>
                <span className="text-[10px] text-slate-500 font-mono">{svgContent.length} chars</span>
              </div>
              <textarea
                value={svgContent}
                onChange={(e) => setSvgContent(e.target.value)}
                placeholder="Paste or edit SVG code here..."
                className="flex-1 w-full bg-slate-900 text-blue-300 font-mono text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Sample Data Inputs for Live Testing */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye size={13} className="text-blue-600" /> Live Preview Sample Controls:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Student Name</label>
                  <input
                    type="text"
                    value={sampleData.name}
                    onChange={(e) => setSampleData({ ...sampleData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Rank</label>
                  <input
                    type="text"
                    value={sampleData.rank}
                    onChange={(e) => setSampleData({ ...sampleData, rank: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Score</label>
                  <input
                    type="text"
                    value={sampleData.score}
                    onChange={(e) => setSampleData({ ...sampleData, score: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Category</label>
                  <input
                    type="text"
                    value={sampleData.category}
                    onChange={(e) => setSampleData({ ...sampleData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Rendered Preview (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-900/95 text-white overflow-hidden relative">
            
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye size={15} className="text-blue-400" />
                Live Rendered Preview
              </span>

              <button
                onClick={handleDownloadPreview}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Download Preview (.svg)"
              >
                <Download size={13} />
                <span>Export SVG</span>
              </button>
            </div>

            {/* Live SVG Rendering Display Box */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-center overflow-hidden shadow-2xl relative group">
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <RefreshCw size={28} className="animate-spin text-blue-500" />
                  <span className="text-xs font-medium">Loading SVG preview...</span>
                </div>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:drop-shadow-2xl"
                  dangerouslySetInnerHTML={{ __html: renderLiveSvg() }}
                />
              )}
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' : 'bg-red-950/80 border border-red-700 text-red-300'
              }`}>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{saving ? 'Saving Template...' : 'Save Template to Quiz'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
