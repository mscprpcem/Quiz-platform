import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { formatToISTDateTimeString } from '../utils/dateUtils';
import { downloadBrandedQRCard, fetchBrandingConfig, getLogoUrl } from '../utils/qrCardGenerator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Calendar, Clock, CheckCircle, ArrowLeft, Users, Trophy, Pause, 
  Play, ExternalLink, ShieldCheck, HelpCircle, Layers, QrCode, Mail,
  Send, Copy, Check, Trash2, Download, AlertTriangle, FileSpreadsheet,
  BarChart2, ChevronDown, Award, TrendingUp, Percent, Loader2
} from 'lucide-react';

export default function ScheduledQuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMail, setSendingMail] = useState(false);
  const [mailSentMessage, setMailSentMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Dropdown states
  const [activeExportDropdown, setActiveExportDropdown] = useState(null); // 'results' | 'responses' | null
  const [exportLoading, setExportLoading] = useState(null);

  const scoreboardRef = useRef(null);
  const responsesRef = useRef(null);

  useEffect(() => {
    fetchDetails();
    fetchAnalytics();
    loadBranding();
  }, [id]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        scoreboardRef.current && !scoreboardRef.current.contains(e.target) &&
        responsesRef.current && !responsesRef.current.contains(e.target)
      ) {
        setActiveExportDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBranding = async () => {
    try {
      const config = await fetchBrandingConfig();
      setBranding(config);
    } catch (e) {
      console.warn('Could not load branding:', e);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/scheduled-quizzes/${id}`);
      setQuizData(res.data);
    } catch (err) {
      console.error('Fetch scheduled quiz details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/api/analytics/quiz/${id}`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.warn('Could not load analytics summary:', err);
    }
  };

  const handleExport = async (endpoint, format) => {
    const exportKey = `${endpoint}_${format}`;
    try {
      setExportLoading(exportKey);
      const response = await api.get(`/api/export/quiz/${id}/${endpoint}?format=${format}`, {
        responseType: 'blob'
      });
      const fileExt = format === 'csv' ? 'csv' : 'xlsx';
      const cleanTitle = (quizData?.quiz?.title || 'scheduled_quiz').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${endpoint === 'results' ? 'Leaderboard' : 'Responses'}_${cleanTitle}.${fileExt}`;

      const blob = new Blob([response.data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setActiveExportDropdown(null);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate export file. Please ensure participants have submitted attempts.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleSendWeeklyReminder = async () => {
    try {
      setSendingMail(true);
      setMailSentMessage('');
      const res = await api.post(`/api/scheduled-quizzes/${id}/notify`, {
        customSubject: `[MSC Reminder] Join ${quizData?.quiz?.title || 'Weekly Assessment'}`,
        customMessage: `Weekly recurring quiz reminder. Scan the QR code or click the direct short link to attempt your scheduled assessment.`
      });
      setMailSentMessage(res.data.message || 'Notification dispatched successfully!');
      setTimeout(() => setMailSentMessage(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch email notification.');
    } finally {
      setSendingMail(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm(`Are you sure you want to delete '${quizData?.quiz?.title}'?\nAll occurrences, questions, and participant attempts will be permanently removed.`)) {
      return;
    }
    try {
      await api.delete(`/api/scheduled-quizzes/${id}`);
      navigate('/admin/scheduled-quizzes');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete scheduled quiz.');
    }
  };

  const quiz = quizData?.quiz;
  const occurrences = quiz?.occurrences || [];
  const attempts = quizData?.attempts || [];

  const slugOrCode = quiz?.custom_slug || quiz?.join_code || id;
  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://quiz.mscprpcem.tech';
  const vanityUrl = `${hostOrigin}/q/${slugOrCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(vanityUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = async () => {
    if (!quiz) return;
    const code = quiz.join_code || quiz.custom_slug || id;
    await downloadBrandedQRCard({
      svgElementId: 'scheduled-quiz-qr-svg',
      quizData: {
        title: quiz.title,
        subtitle: quiz.category || (quiz.schedule_type ? `${quiz.schedule_type} ASSESSMENT` : 'SCHEDULED ASSESSMENT'),
        custom_slug: quiz.custom_slug,
        join_code: quiz.join_code,
        join_url: `${hostOrigin}/join/${quiz.join_code || slugOrCode}`
      },
      brandData: branding,
      fileName: `quiz-${code}.png`
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-extrabold animate-pulse">
        Loading scheduled quiz details...
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left font-segoe pb-16">
      
      {/* ════════ HEADER ════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/scheduled-quizzes')}
            className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer shadow-2xs"
            title="Back to Scheduled Quizzes"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Scheduled Assessment Manager
              </span>
              {quiz?.schedule_type && (
                <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                  {quiz.schedule_type}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{quiz?.title}</h1>
            <p className="text-xs text-slate-500 font-medium">{quiz?.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Quick Analytics Page Link */}
          <button
            onClick={() => navigate(`/admin/analytics/${id}`)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Open Dedicated Full Analytics Dashboard"
          >
            <BarChart2 size={15} />
            <span>Full Analytics Report</span>
          </button>

          {/* Export Scoreboard Dropdown */}
          <div className="relative" ref={scoreboardRef}>
            <button
              type="button"
              onClick={() => setActiveExportDropdown(activeExportDropdown === 'results' ? null : 'results')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {exportLoading?.startsWith('results') ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={15} />
              )}
              <span>Export Scoreboard</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${activeExportDropdown === 'results' ? 'rotate-180' : ''}`} />
            </button>

            {activeExportDropdown === 'results' && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-44 py-1.5 text-left text-xs font-bold text-slate-800 animate-fade-in divide-y divide-slate-100">
                <button
                  onClick={() => handleExport('results', 'excel')}
                  disabled={Boolean(exportLoading)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('results', 'csv')}
                  disabled={Boolean(exportLoading)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-blue-600" />
                  <span>CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Export Responses Dropdown */}
          <div className="relative" ref={responsesRef}>
            <button
              type="button"
              onClick={() => setActiveExportDropdown(activeExportDropdown === 'responses' ? null : 'responses')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {exportLoading?.startsWith('responses') ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={15} />
              )}
              <span>Export Responses</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${activeExportDropdown === 'responses' ? 'rotate-180' : ''}`} />
            </button>

            {activeExportDropdown === 'responses' && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 w-44 py-1.5 text-left text-xs font-bold text-slate-800 animate-fade-in divide-y divide-slate-100">
                <button
                  onClick={() => handleExport('responses', 'excel')}
                  disabled={Boolean(exportLoading)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExport('responses', 'csv')}
                  disabled={Boolean(exportLoading)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-blue-600" />
                  <span>CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/admin/email-dispatch?quizId=${id}`)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all"
            title="Dispatch targeted emails by completion status"
          >
            <Mail size={15} />
            <span>Email Dispatch</span>
          </button>

          <button
            onClick={handleDeleteQuiz}
            className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Delete Quiz"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {mailSentMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{mailSentMessage}</span>
        </div>
      )}

      {/* ════════ ANALYTICS METRICS OVERVIEW ════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Attempts</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analyticsData?.totalAttempts ?? attempts.length}</div>
          <span className="text-[10px] text-slate-400 font-bold">{analyticsData?.totalParticipants ?? attempts.length} unique</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Top Score</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{analyticsData?.highestScore ?? (attempts[0]?.score || 0)} pts</div>
          <span className="text-[10px] text-slate-400 font-bold">Lowest: {analyticsData?.lowestScore ?? 0} pts</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avg Duration</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{analyticsData?.averageResponseTime ?? 0}s</div>
          <span className="text-[10px] text-slate-400 font-bold">Per submission</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Completion Rate</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{analyticsData?.completionPercentage ?? 0}%</div>
          <span className="text-[10px] text-slate-400 font-bold">{quizData?.quiz?.questions?.length || 0} Questions</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Anti-Cheat Flags</span>
          <div className={`text-2xl font-black mt-1 ${
            (quizData?.violationCount || analyticsData?.violationCount || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {quizData?.violationCount ?? (analyticsData?.violationCount || 0)}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Violations logged</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Occurrences</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{occurrences.length}</div>
          <button
            onClick={() => navigate(`/admin/analytics/${id}`)}
            className="text-[10px] font-black text-purple-600 hover:text-purple-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>Full Analysis</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </div>

      {/* ════════ INTERACTIVE CHARTS ════════ */}
      {analyticsData && (analyticsData.totalParticipants > 0 || analyticsData.totalAttempts > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>Accuracy Rate Per Question</span>
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase">% Correct</span>
            </div>

            <div className="h-56 text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.accuracyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis unit="%" stroke="#94a3b8" domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                  />
                  <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span>Score Distribution Ranges</span>
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase">Participant Spread</span>
            </div>

            <div className="h-56 text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value) => [value, 'Participants']}
                  />
                  <Bar dataKey="Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ════════ VANITY LINK & QR CARD ════════ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-lg text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase">
            <QrCode size={13} />
            <span>Direct QR Code & Short Link</span>
          </div>

          <h2 className="text-xl font-black">Direct Student Join Link</h2>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={vanityUrl}
              className="bg-white/10 border border-white/20 text-amber-300 font-mono font-bold text-xs px-3.5 py-2 rounded-xl w-full"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-300">Students scanning the QR code or visiting this short URL join the active quiz occurrence directly.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center space-y-2.5">
          <QRCodeSVG
            id="scheduled-quiz-qr-svg"
            value={vanityUrl}
            size={130}
            bgColor="#FFFFFF"
            fgColor="#0F172A"
            level="H"
            imageSettings={{
              src: getLogoUrl(branding?.logo_path),
              x: undefined,
              y: undefined,
              height: branding?.qr_logo_size || 28,
              width: branding?.qr_logo_size || 28,
              excavate: true,
            }}
          />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Scan to Join</span>
          <button
            onClick={handleDownloadQR}
            className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Download Direct Join Card Image"
          >
            <Download size={13} />
            <span>Download Card</span>
          </button>
        </div>
      </div>

      {/* ════════ OCCURRENCES TABLE ════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-slate-900">Schedule Occurrences ({occurrences.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Occurrence</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occurrences.map((occ) => (
                <tr key={occ.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{occ.title || `Slot #${occ.occurrence_number}`}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatToISTDateTimeString(occ.start_time)}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatToISTDateTimeString(occ.end_time)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700">
                      {occ.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => window.open(`/q/${slugOrCode}`, '_blank')}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Public Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════ ATTEMPTS & SCOREBOARD ════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Participant Attempts & Leaderboard ({attempts.length})</h3>
            <p className="text-xs text-slate-500 font-medium">Rankings computed strictly by score, correct answers, and response speed.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('results', 'excel')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Export to Excel"
            >
              <Download size={13} />
              <span>Export .xlsx</span>
            </button>
            <button
              onClick={() => handleExport('results', 'csv')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Export to CSV"
            >
              <Download size={13} />
              <span>Export .csv</span>
            </button>
          </div>
        </div>

        {attempts.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No attempts submitted for this scheduled quiz yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-black text-blue-600">#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{att.participant_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{att.participant_email || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">{att.score} pts</td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const vCount = Number(att.violation_count ?? att.violationsCount ?? att.violationCount ?? (Array.isArray(att.violations) ? att.violations.length : 0)) || 0;
                        return vCount > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle size={11} className="text-rose-600" />
                            <span>{vCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[11px]">0</span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{att.time_taken_seconds || 0}s</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700">
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
