import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CertificateTemplateModal from '../components/CertificateTemplateModal';
import { FileCode, RefreshCw, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminTemplates() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/quizzes');
      const quizList = Array.isArray(res?.data) ? res.data : [];
      setQuizzes(quizList);

      if (quizList.length > 0) {
        setSelectedQuiz((prev) => {
          if (prev && quizList.some((q) => q.id === prev.id)) {
            return quizList.find((q) => q.id === prev.id) || quizList[0];
          }
          return quizList[0];
        });
      } else {
        setSelectedQuiz(null);
      }
    } catch (err) {
      console.error('Failed to load quizzes for templates:', err);
      setQuizzes([]);
      setSelectedQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Page Header */}
        <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <FileCode size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-brand-textMain tracking-tight">
                SVG Certificate Templates & Positioner
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-brand-textMuted mt-1.5 max-w-3xl">
              Configure, upload, and interactively position QR codes and verification links on custom vector SVG certificate templates for each quiz.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-slate-500 font-medium">
            <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
            <span>Loading Quizzes & Templates...</span>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <BookOpen size={36} className="text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Quizzes Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please create a quiz from the Dashboard or Quizzes section before configuring SVG certificate templates.
            </p>
          </div>
        ) : (
          /* Main Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar: Quizzes List (4 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm space-y-3">
                <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Select Quiz ({quizzes.length})</span>
                  <span className="text-[10px] text-blue-600 font-mono">Isolated Templates</span>
                </h2>

                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {quizzes.map((q) => {
                    const isSelected = selectedQuiz?.id === q.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuiz(q)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold truncate">{q.title || 'Untitled Quiz'}</h3>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Event: <strong className="text-slate-700">{q.event_name || 'General Event'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {q.svg_template ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Custom
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              Default
                            </span>
                          )}
                          <ArrowRight size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Area: Embedded Full Configurator (8 Cols) */}
            <div className="lg:col-span-8">
              {selectedQuiz ? (
                <CertificateTemplateModal
                  quiz={selectedQuiz}
                  allQuizzes={quizzes}
                  onSelectQuiz={(q) => setSelectedQuiz(q)}
                  onClose={() => {}}
                  onSaveSuccess={loadQuizzes}
                  isInline={true}
                />
              ) : (
                <div className="bg-white border border-brand-border rounded-2xl p-8 text-center text-slate-500">
                  Select a quiz from the list to manage its template.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
