import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar, Clock, CheckCircle, ArrowLeft, Users, Trophy, Pause, 
  Play, ExternalLink, ShieldCheck, HelpCircle, Layers
} from 'lucide-react';

export default function ScheduledQuizDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-extrabold animate-pulse">
        Loading scheduled quiz details...
      </div>
    );
  }

  const quiz = quizData?.quiz;
  const occurrences = quiz?.occurrences || [];
  const attempts = quizData?.attempts || [];

  return (
    <div className="space-y-8 text-left font-segoe">
      
      {/* Header */}
      <div className="flex items-center space-x-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-2xs">
        <button
          onClick={() => navigate('/admin/scheduled-quizzes')}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Scheduled Quiz Overview</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">{quiz?.title}</h1>
          <p className="text-xs text-slate-500 font-medium">{quiz?.description || 'No description provided.'}</p>
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
                      onClick={() => window.open(`/scheduled-quiz/${occ.id}`, '_blank')}
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
