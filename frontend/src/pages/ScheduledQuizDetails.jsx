import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import {
  Calendar, Clock, CheckCircle, ArrowLeft, Users, Trophy, Pause, 
  Play, ExternalLink, ShieldCheck, HelpCircle, Layers, QrCode, Mail, Send, Copy, Check, Trash2, Download
} from 'lucide-react';

export default function ScheduledQuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMail, setSendingMail] = useState(false);
  const [mailSentMessage, setMailSentMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

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

  const handleDownloadQR = () => {
    const svg = document.getElementById('scheduled-quiz-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // High-res card dimensions
    canvas.width = 600;
    canvas.height = 700;

    img.onload = () => {
      // Draw background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 600, 700);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E1B4B');
      bgGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGrad;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(0, 0, 600, 700, 32);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, 600, 700);
      }

      // Microsoft 4-quadrant accent bar
      ctx.fillStyle = '#F25022';
      ctx.fillRect(40, 40, 130, 4);
      ctx.fillStyle = '#7FBA00';
      ctx.fillRect(170, 40, 130, 4);
      ctx.fillStyle = '#00A4EF';
      ctx.fillRect(300, 40, 130, 4);
      ctx.fillStyle = '#FFB900';
      ctx.fillRect(430, 40, 130, 4);

      // Club name & Subtitle
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 12px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MICROSOFT STUDENT CLUB PRPCEM', 300, 75);

      // Quiz Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Segoe UI, system-ui, sans-serif';
      const titleText = quiz?.title || 'Scheduled Quiz';
      ctx.fillText(titleText.length > 36 ? titleText.slice(0, 36) + '...' : titleText, 300, 115);

      // QR Code container white box
      ctx.fillStyle = '#FFFFFF';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(140, 150, 320, 320, 24);
        ctx.fill();
      } else {
        ctx.fillRect(140, 150, 320, 320);
      }

      // Draw QR Image
      ctx.drawImage(img, 160, 170, 280, 280);

      // Direct Link URL text
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 14px Segoe UI, monospace';
      ctx.fillText(vanityUrl, 300, 520);

      // Instructions
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 13px Segoe UI, sans-serif';
      ctx.fillText('Scan QR or visit link to join quiz session directly', 300, 560);

      // Footer badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(160, 600, 280, 40, 12);
        ctx.fill();
      } else {
        ctx.fillRect(160, 600, 280, 40);
      }

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText('Official Assessment • MSC Platform', 300, 625);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `msc-quiz-${slugOrCode}-join-card.png`;
      a.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/scheduled-quizzes')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Scheduled Quiz Manager</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{quiz?.title}</h1>
            <p className="text-xs text-slate-500 font-medium">{quiz?.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleSendWeeklyReminder}
            disabled={sendingMail}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all"
          >
            <Mail size={16} />
            <span>{sendingMail ? 'Dispatching...' : 'Email Reminder'}</span>
          </button>

          <button
            onClick={handleDeleteQuiz}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Delete Quiz"
          >
            <Trash2 size={16} />
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

      {/* Custom Vanity Link & QR Code Direct Join Card */}
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
            size={120}
            bgColor="#FFFFFF"
            fgColor="#0F172A"
            level="H"
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

      {/* Occurrences Table */}
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
                  <td className="py-3.5 px-4 text-slate-600">{new Date(occ.start_time).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-slate-600">{new Date(occ.end_time).toLocaleString()}</td>
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

      {/* Attempts & Scoreboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-slate-900">Participant Attempts & Leaderboard ({attempts.length})</h3>

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
