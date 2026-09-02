import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Code2, 
  Filter, 
  Lightbulb, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Database 
} from 'lucide-react';
import { DDL_50_QUESTIONS, DDL_SECTIONS } from '../../data/ddlQuestionsData';

export default function DdlQuestionsBank({ onJumpToPractice }) {
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Filter questions based on active section and search input
  const filteredQuestions = useMemo(() => {
    return DDL_50_QUESTIONS.filter((q) => {
      if (selectedSection !== 'all' && q.section !== selectedSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQ = q.question.toLowerCase().includes(query);
        const matchesSql = q.sql.toLowerCase().includes(query);
        const matchesSec = q.sectionTitle.toLowerCase().includes(query);
        return matchesQ || matchesSql || matchesSec;
      }
      return true;
    });
  }, [selectedSection, searchQuery]);

  const handleCopy = (sqlText, qId) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedId(qId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (qId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const expandAll = () => {
    const all = {};
    DDL_50_QUESTIONS.forEach(q => { all[q.id] = true; });
    setExpandedCards(all);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-5xl mx-auto py-2">
      
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0 font-black text-sm">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  50 DDL Practice Questions
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-black text-[11px] uppercase tracking-wide">
                  Master Bank
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                10 Modular Sections (A to J): From Database Creation to Real-World Interview Questions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl relative z-10">
          This dedicated question bank is organized into 10 structured sections. Each question includes standard SQL solution syntax, internal explanation, and direct integration with the interactive Practice Lab.
        </p>

        {/* SEARCH BAR */}
        <div className="relative pt-2">
          <Search size={16} className="absolute left-3.5 top-[18px] text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, table name, or command (e.g. students, truncate, smallint, drop)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs font-medium"
          />
        </div>

        {/* SECTION FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {DDL_SECTIONS.map((sec) => {
            const isActive = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSection(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
                }`}
              >
                <span>{sec.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── QUESTION LIST ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1 text-xs font-black text-slate-500 uppercase tracking-wider">
          <span>Showing {filteredQuestions.length} of 50 Questions</span>
          {selectedSection !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedSection('all')}
              className="text-blue-600 hover:underline capitalize"
            >
              Clear Section Filter
            </button>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <HelpCircle size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-black text-slate-800">No matching questions found</h3>
            <p className="text-xs text-slate-500 font-medium">Try searching for another keyword or reset your filter.</p>
            <button
              type="button"
              onClick={() => { setSelectedSection('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-100 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedCards[q.id] !== false; // expanded by default
            const isCopied = copiedId === q.id;

            return (
              <div 
                key={q.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* TOP ROW: Q# BADGE, SECTION TAG, AND ACTIONS */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      Q{q.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10.5px] rounded-lg">
                      {q.sectionTitle}
                    </span>
                    {q.type === 'Interview' && (
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-black text-[10px] rounded-lg">
                        Interview Focus
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(q.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* QUESTION TITLE / PROMPT */}
                <div className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {q.question}
                </div>

                {/* EXPANDABLE SOLUTION BLOCK */}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {/* SQL CODE CONTAINER */}
                    <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 sm:p-4 relative group overflow-x-auto shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleCopy(q.sql, q.id)}
                        className="absolute top-2.5 right-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span className={isCopied ? "text-emerald-600 font-bold" : ""}>
                          {isCopied ? 'Copied' : 'Copy SQL'}
                        </span>
                      </button>

                      <pre className="font-mono text-xs sm:text-[13px] text-blue-900 font-bold leading-relaxed whitespace-pre-wrap select-text pr-20">
                        {q.sql}
                      </pre>
                    </div>

                    {/* EXPLANATION / NOTE */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-start space-x-1.5 font-medium">
                        <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Concept:</strong> {q.explanation}</span>
                      </div>

                      {/* JUMP TO PRACTICE BUTTON */}
                      {onJumpToPractice && (
                        <button
                          type="button"
                          onClick={() => onJumpToPractice({ id: q.challengeId, title: q.question })}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shrink-0 cursor-pointer shadow-2xs"
                        >
                          <Code2 size={13} />
                          <span>Solve in Lab</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
