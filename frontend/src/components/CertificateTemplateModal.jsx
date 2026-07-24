import React, { useState, useEffect } from 'react';
import { X, Upload, RefreshCw, Save, Download, FileCode, CheckCircle2, Copy, Eye, HelpCircle, Move, QrCode, Link } from 'lucide-react';
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

  <!-- Dynamic QR Code Container -->
  <g id="svg-qr-group" transform="translate(500, 535)">
    <g transform="translate(-32, -32)">
      {{qr_code}}
    </g>
  </g>

  <!-- Dynamic Verification Link -->
  <text id="svg-verification-url" x="500" y="618" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" text-anchor="middle">Verify Credential: {{verification_url}}</text>

  <!-- Footer -->
  <g transform="translate(80, 640)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">DATE ISSUED</text>
    <text x="0" y="18" fill="#f8fafc" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700">{{date}}</text>
  </g>

  <g transform="translate(920, 640)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" text-anchor="end">CREDENTIAL ID</text>
    <text x="0" y="18" fill="#60a5fa" font-family="Consolas, monospace" font-size="13" font-weight="800" text-anchor="end">{{credential_id}}</text>
  </g>
</svg>`;

export default function CertificateTemplateModal({ quiz, allQuizzes, onSelectQuiz, onClose, onSaveSuccess, isInline = false }) {
  const [currentQuiz, setCurrentQuiz] = useState(quiz || (allQuizzes && allQuizzes[0]) || null);
  const [svgContent, setSvgContent] = useState(DEFAULT_SVG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedTag, setCopiedTag] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'positioning'

  // Interactive Positioning Controls State
  const [posConfig, setPosConfig] = useState({
    qrX: 500,
    qrY: 535,
    qrSize: 64,
    urlX: 500,
    urlY: 618,
    urlFontSize: 11,
    urlColor: '#94a3b8',
    urlAnchor: 'middle'
  });

  // Sample data for live preview
  const [sampleData, setSampleData] = useState({
    name: 'Amit Yadav',
    title: currentQuiz?.title || 'Web Development Master Quiz',
    event_name: currentQuiz?.event_name || 'Spark26 Tech Fest',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    score: '185',
    rank: '1',
    category: '1st Place Winner',
    credential_id: 'MSC-BDG-88291',
    verification_url: 'https://verify.mscprpcem.tech/verify/MSC-BDG-88291'
  });

  const placeholders = [
    { tag: '{{name}}', label: 'Recipient Name' },
    { tag: '{{title}}', label: 'Quiz Title' },
    { tag: '{{event_name}}', label: 'Event Name' },
    { tag: '{{date}}', label: 'Issue Date' },
    { tag: '{{score}}', label: 'Total Score' },
    { tag: '{{rank}}', label: 'Leaderboard Rank' },
    { tag: '{{category}}', label: 'Certificate Category' },
    { tag: '{{credential_id}}', label: 'Credential ID' },
    { tag: '{{qr_code}}', label: 'QR Code Box' },
    { tag: '{{verification_url}}', label: 'Verification Link' }
  ];

  useEffect(() => {
    if (quiz) {
      setCurrentQuiz(quiz);
    }
  }, [quiz]);

  useEffect(() => {
    if (currentQuiz?.id) {
      loadTemplate(currentQuiz.id);
      setSampleData((prev) => ({
        ...prev,
        title: currentQuiz.title || 'Master Quiz',
        event_name: currentQuiz.event_name || 'Tech Event'
      }));
    }
  }, [currentQuiz]);

  const loadTemplate = async (quizId) => {
    if (!quizId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${quizId}/template`);
      const loadedSvg = (res.data && typeof res.data.svg_template === 'string' && res.data.svg_template.trim())
        ? res.data.svg_template
        : DEFAULT_SVG;
      setSvgContent(loadedSvg);
      extractPositionsFromSvg(loadedSvg);
    } catch (err) {
      console.error('Error loading SVG template:', err);
      setSvgContent(DEFAULT_SVG);
      extractPositionsFromSvg(DEFAULT_SVG);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract QR and URL X/Y positions safely
  const extractPositionsFromSvg = (content) => {
    if (!content || typeof content !== 'string') return;
    try {
      const qrMatch = content.match(/<g\s+id="svg-qr-group"\s+transform="translate\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)"/i);
      if (qrMatch) {
        setPosConfig((prev) => ({
          ...prev,
          qrX: parseFloat(qrMatch[1]),
          qrY: parseFloat(qrMatch[2])
        }));
      }
      const urlMatch = content.match(/<text\s+id="svg-verification-url"\s+x="(\d+(?:\.\d+)?)"\s+y="(\d+(?:\.\d+)?)"/i);
      if (urlMatch) {
        setPosConfig((prev) => ({
          ...prev,
          urlX: parseFloat(urlMatch[1]),
          urlY: parseFloat(urlMatch[2])
        }));
      }
    } catch (e) {
      console.warn('Extract positions parse error:', e);
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
      try {
        const content = event.target?.result;
        if (typeof content === 'string' && content.trim()) {
          setSvgContent(content);
          extractPositionsFromSvg(content);
          setFeedback({ type: 'success', message: `Uploaded "${file.name}" for Quiz "${currentQuiz?.title || 'Selected'}"!` });
        }
      } catch (err) {
        console.error('File read error:', err);
        setFeedback({ type: 'error', message: 'Failed to parse uploaded SVG file.' });
      }
    };
    reader.readAsText(file);
  };

  const insertPlaceholder = (tag) => {
    setSvgContent((prev) => (prev || DEFAULT_SVG) + `\n${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const updatePositionInSvg = (newConfig) => {
    setPosConfig(newConfig);
    setSvgContent((prevSvg) => {
      let svg = (typeof prevSvg === 'string' && prevSvg.trim()) ? prevSvg : DEFAULT_SVG;

      try {
        // Ensure QR group element exists in SVG or inject it
        if (!svg.includes('id="svg-qr-group"')) {
          const qrSnippet = `\n  <!-- Dynamic QR Code Container -->\n  <g id="svg-qr-group" transform="translate(${newConfig.qrX}, ${newConfig.qrY})">\n    <g transform="translate(-${newConfig.qrSize / 2}, -${newConfig.qrSize / 2})">\n      {{qr_code}}\n    </g>\n  </g>`;
          svg = svg.replace('</svg>', `${qrSnippet}\n</svg>`);
        } else {
          svg = svg.replace(
            /<g\s+id="svg-qr-group"\s+transform="translate\([^)]+\)">/i,
            `<g id="svg-qr-group" transform="translate(${newConfig.qrX}, ${newConfig.qrY})">`
          );
          svg = svg.replace(
            /<g\s+transform="translate\(-?\d*(?:\.\d+)?,\s*-?\d*(?:\.\d+)?\)">(\s*\{\{qr_code\}\}\s*)<\/g>/i,
            `<g transform="translate(-${newConfig.qrSize / 2}, -${newConfig.qrSize / 2})">$1</g>`
          );
        }

        // Ensure Verification URL element exists in SVG or inject it
        if (!svg.includes('id="svg-verification-url"')) {
          const urlSnippet = `\n  <!-- Dynamic Verification Link -->\n  <text id="svg-verification-url" x="${newConfig.urlX}" y="${newConfig.urlY}" fill="${newConfig.urlColor}" font-family="'Segoe UI', sans-serif" font-size="${newConfig.urlFontSize}" font-weight="600" text-anchor="${newConfig.urlAnchor}">Verify Credential: {{verification_url}}</text>`;
          svg = svg.replace('</svg>', `${urlSnippet}\n</svg>`);
        } else {
          svg = svg.replace(
            /<text\s+id="svg-verification-url"[^>]*>([\s\S]*?)<\/text>/i,
            `<text id="svg-verification-url" x="${newConfig.urlX}" y="${newConfig.urlY}" fill="${newConfig.urlColor}" font-family="'Segoe UI', sans-serif" font-size="${newConfig.urlFontSize}" font-weight="600" text-anchor="${newConfig.urlAnchor}">$1</text>`
          );
        }
      } catch (e) {
        console.error('Position update error:', e);
      }

      return svg;
    });
  };

  const handleSave = async () => {
    const targetQuizId = currentQuiz?.id || quiz?.id;
    if (!targetQuizId) {
      setFeedback({ type: 'error', message: 'No quiz selected to save template.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await api.post(`/api/quizzes/${targetQuizId}/template`, {
        svg_template: svgContent
      });
      setFeedback({ type: 'success', message: `SVG Certificate template saved exclusively for Quiz "${currentQuiz?.title || 'Selected'}"!` });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const renderLiveSvg = () => {
    try {
      let svg = (typeof svgContent === 'string' && svgContent.trim()) ? svgContent : DEFAULT_SVG;
      const escapeXml = (unsafe) => String(unsafe || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

      const name = escapeXml(sampleData.name);
      const title = escapeXml(sampleData.title || currentQuiz?.title);
      const eventName = escapeXml(sampleData.event_name || currentQuiz?.event_name);
      const date = escapeXml(sampleData.date);
      const score = escapeXml(sampleData.score);
      const rank = escapeXml(sampleData.rank);
      const category = escapeXml(sampleData.category);
      const credentialId = escapeXml(sampleData.credential_id);
      const verificationUrl = escapeXml(sampleData.verification_url);

      const qrSize = posConfig.qrSize || 64;

      const qrVectorSvg = `<rect width="${qrSize}" height="${qrSize}" fill="#ffffff" rx="8" stroke="#3b82f6" stroke-width="2"/>
      <g transform="translate(4, 4)">
        <rect x="4" y="4" width="16" height="16" fill="#0f172a" rx="3"/>
        <rect x="7" y="7" width="10" height="10" fill="#ffffff" rx="1"/>
        <rect x="9" y="9" width="6" height="6" fill="#0f172a"/>

        <rect x="${Math.max(4, qrSize - 24)}" y="4" width="16" height="16" fill="#0f172a" rx="3"/>
        <rect x="${Math.max(7, qrSize - 21)}" y="7" width="10" height="10" fill="#ffffff" rx="1"/>
        <rect x="${Math.max(9, qrSize - 19)}" y="9" width="6" height="6" fill="#0f172a"/>

        <rect x="4" y="${Math.max(4, qrSize - 24)}" width="16" height="16" fill="#0f172a" rx="3"/>
        <rect x="7" y="${Math.max(7, qrSize - 21)}" width="10" height="10" fill="#ffffff" rx="1"/>
        <rect x="9" y="${Math.max(9, qrSize - 19)}" width="6" height="6" fill="#0f172a"/>

        <rect x="${qrSize / 2 - 4}" y="${qrSize / 2 - 4}" width="8" height="8" fill="#2563eb" rx="2"/>
      </g>`;

      svg = svg.replace(/\{\{\s*(RECIPIENT_NAME|NAME|name)\s*\}\}/g, name);
      svg = svg.replace(/\{\{\s*(QUIZ_TITLE|TITLE|title)\s*\}\}/g, title);
      svg = svg.replace(/\{\{\s*(EVENT_NAME|event_name)\s*\}\}/g, eventName);
      svg = svg.replace(/\{\{\s*(ISSUE_DATE|DATE|date)\s*\}\}/g, date);
      svg = svg.replace(/\{\{\s*(SCORE|score)\s*\}\}/g, score);
      svg = svg.replace(/\{\{\s*(RANK|rank)\s*\}\}/g, rank);
      svg = svg.replace(/\{\{\s*(CATEGORY|category)\s*\}\}/g, category);
      svg = svg.replace(/\{\{\s*(CREDENTIAL_ID|ID|credential_id|id)\s*\}\}/g, credentialId);
      svg = svg.replace(/\{\{\s*(VERIFICATION_URL|verification_url|url)\s*\}\}/g, verificationUrl);
      svg = svg.replace(/\{\{\s*(QR_CODE|VERIFICATION_QR|qr_code|verification_qr)\s*\}\}/g, qrVectorSvg);

      return svg;
    } catch (err) {
      console.error('Error rendering live SVG:', err);
      return DEFAULT_SVG;
    }
  };

  const handleDownloadPreview = () => {
    try {
      const svgStr = renderLiveSvg();
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${(currentQuiz?.title || 'Preview').replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const mainContent = (
    <div className={`bg-white border border-slate-200 w-full ${isInline ? 'min-h-[750px] rounded-2xl shadow-sm' : 'max-w-6xl h-[92vh] rounded-2xl shadow-2xl'} flex flex-col overflow-hidden`}>
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <FileCode size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                SVG Certificate Template & Live Positioner
              </h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                <span>Mapped exclusively to:</span>
                {allQuizzes && allQuizzes.length > 0 ? (
                  <select
                    value={currentQuiz?.id || ''}
                    onChange={(e) => {
                      const q = allQuizzes.find(item => item.id === e.target.value);
                      if (q) {
                        setCurrentQuiz(q);
                        if (onSelectQuiz) onSelectQuiz(q);
                      }
                    }}
                    className="bg-white border border-blue-300 font-bold text-blue-700 text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {allQuizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.event_name})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-blue-600">{currentQuiz?.title || 'Selected Quiz'}</strong>
                )}
              </p>
            </div>
          </div>

          {!isInline && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer self-start sm:self-center"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body: Split view */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Editor & Positioning Controls (5 Cols) */}
          <div className="lg:col-span-5 border-r border-slate-200 p-4 flex flex-col space-y-3 bg-slate-50/50 overflow-y-auto">
            
            {/* Upload & Actions */}
            <div className="flex items-center justify-between gap-2">
              <label className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">
                <Upload size={14} />
                <span>Upload Custom .SVG</span>
                <input type="file" accept=".svg" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={() => {
                  setSvgContent(DEFAULT_SVG);
                  extractPositionsFromSvg(DEFAULT_SVG);
                }}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Reset to Default Vector Template"
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('positioning')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'positioning' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Move size={13} />
                <span>QR & URL Positioning</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'code' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode size={13} />
                <span>SVG Code & Placeholders</span>
              </button>
            </div>

            {/* TAB 1: QR CODE & URL POSITIONING CONTROLS */}
            {activeTab === 'positioning' ? (
              <div className="space-y-3.5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                
                {/* QR Code Positioner */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <QrCode size={14} className="text-blue-600" />
                    QR Code Position & Size Controls:
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-0.5">
                        <span>X Position</span>
                        <span className="font-mono">{posConfig.qrX}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="950"
                        value={posConfig.qrX}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, qrX: parseInt(e.target.value) || 500 })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-0.5">
                        <span>Y Position</span>
                        <span className="font-mono">{posConfig.qrY}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="650"
                        value={posConfig.qrY}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, qrY: parseInt(e.target.value) || 535 })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-0.5">
                        <span>QR Box Size</span>
                        <span className="font-mono">{posConfig.qrSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="140"
                        value={posConfig.qrSize}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, qrSize: parseInt(e.target.value) || 64 })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Verification Link Positioner */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Link size={14} className="text-blue-600" />
                    Verification Link Position & Styling:
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-0.5">
                        <span>URL X Position</span>
                        <span className="font-mono">{posConfig.urlX}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="950"
                        value={posConfig.urlX}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, urlX: parseInt(e.target.value) || 500 })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-semibold mb-0.5">
                        <span>URL Y Position</span>
                        <span className="font-mono">{posConfig.urlY}px</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="680"
                        value={posConfig.urlY}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, urlY: parseInt(e.target.value) || 618 })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Font Size</label>
                      <input
                        type="number"
                        min="8"
                        max="24"
                        value={posConfig.urlFontSize}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, urlFontSize: parseInt(e.target.value) || 11 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Text Color</label>
                      <input
                        type="color"
                        value={posConfig.urlColor || '#94a3b8'}
                        onChange={(e) => updatePositionInSvg({ ...posConfig, urlColor: e.target.value })}
                        className="w-full h-7 bg-slate-50 border border-slate-200 rounded-lg p-0.5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* TAB 2: CODE EDITOR & PLACEHOLDERS */
              <div className="flex-1 flex flex-col space-y-3">
                {/* Clickable Placeholders Toolbar */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <HelpCircle size={12} className="text-blue-500" />
                    Placeholders (Click to insert into code):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {placeholders.map((p) => (
                      <button
                        key={p.tag}
                        onClick={() => insertPlaceholder(p.tag)}
                        className="text-[10px] font-mono font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        title={`Insert ${p.label}`}
                      >
                        <span>{p.tag}</span>
                        {copiedTag === p.tag ? <CheckCircle2 size={10} className="text-emerald-600" /> : <Copy size={9} className="text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1 flex flex-col min-h-[220px]">
                  <textarea
                    value={svgContent}
                    onChange={(e) => {
                      setSvgContent(e.target.value);
                      extractPositionsFromSvg(e.target.value);
                    }}
                    placeholder="Paste or edit SVG code here..."
                    className="flex-1 w-full bg-slate-900 text-blue-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Sample Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye size={13} className="text-blue-600" /> Sample Live Test Controls:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Student Name</label>
                  <input
                    type="text"
                    value={sampleData.name}
                    onChange={(e) => setSampleData({ ...sampleData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Rank</label>
                  <input
                    type="text"
                    value={sampleData.rank}
                    onChange={(e) => setSampleData({ ...sampleData, rank: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Rendered Preview (7 Cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between bg-slate-900/95 text-white overflow-hidden relative">
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye size={15} className="text-blue-400" />
                Live Rendered Canvas
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
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-center overflow-hidden shadow-2xl relative group">
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
              <div className={`mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300' : 'bg-red-950/80 border border-red-700 text-red-300'
              }`}>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex justify-end space-x-3 mt-3 pt-2.5 border-t border-slate-800">
              {!isInline && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{saving ? 'Saving...' : `Save Template for "${currentQuiz?.title || 'Selected'}"`}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
  );

  if (isInline) {
    return mainContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      {mainContent}
    </div>
  );
}
