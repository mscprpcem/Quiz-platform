import React, { useState, useMemo, useEffect } from 'react';
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
  Database,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DDL_50_QUESTIONS, DDL_SECTIONS } from '../../data/ddlQuestionsData';

const PAGE_SIZE = 10;

export default function DdlQuestionsBank({ onJumpToPractice }) {
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Solutions hidden by default for student practice
  const [revealedSolutions, setRevealedSolutions] = useState({});

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSection, searchQuery]);

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

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  // Paginated slice: strictly 10 questions per page
  const paginatedQuestions = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredQuestions, safePage]);

  const handleCopy = (sqlText, qId) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedId(qId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRevealSolution = (qId) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const revealAll = () => {
    const all = {};
    DDL_50_QUESTIONS.forEach(q => { all[q.id] = true; });
    setRevealedSolutions(all);
  };

  const hideAll = () => {
    setRevealedSolutions({});
  };

  const goToPage = (p) => {
    setCurrentPage(p);
  };

  const revealedCount = Object.values(revealedSolutions).filter(Boolean).length;

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredQuestions.length);

  return (
    <article className="space-y-8 animate-fadeIn max-w-4xl mx-auto py-2">
      
      {/* ── HEADER ── */}
      <header className="space-y-4 pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0 font-black text-sm">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  50 DDL Practice Questions
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-black text-[11px] uppercase tracking-wide">
                  Master Bank
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                10 Modular Sections (A to J): Practice first, then reveal the solution to verify
              </p>
            </div>
          </div>

          {/* GLOBAL EYE TOGGLE CONTROLS */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={revealAll}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
              title="Reveal all 50 solutions"
            >
              <Eye size={14} className="text-blue-600" />
              <span>Reveal All</span>
            </button>
            <button
              type="button"
              onClick={hideAll}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
              title="Hide all solutions for practice"
            >
              <EyeOff size={14} className="text-slate-400" />
              <span>Hide All</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>Practice Mode:</strong> Solutions are hidden by default so you can test your knowledge. Click the <strong>Eye button</strong> on any card to reveal its SQL solution.
            </span>
          </div>
          <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold text-[11px] shrink-0 whitespace-nowrap shadow-2xs">
            {revealedCount} / {DDL_50_QUESTIONS.length} Revealed
          </span>
        </div>

        {/* SEARCH BAR */}
        <div className="relative pt-2">
          <Search size={16} className="absolute left-3.5 top-[18px] text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword, table name, or command (e.g. students, truncate, smallint, drop)..."
            style={{ paddingLeft: '38px', paddingRight: '20px' }}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* SECTION FILTER PILLS */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSection('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSection === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            All Sections (50)
          </button>
          {DDL_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSection === sec.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>
      </header>

      {/* ── QUESTION LIST HEADER & COUNT ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-black text-slate-800 uppercase tracking-wider">
              Questions {filteredQuestions.length > 0 ? startIndex + 1 : 0} – {endIndex} of {filteredQuestions.length}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold">
              Page {safePage} of {totalPages}
            </span>
          </div>

          {selectedSection !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedSection('all')}
              className="text-blue-600 hover:underline capitalize font-bold"
            >
              Clear Section Filter
            </button>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-12 text-center space-y-3 bg-slate-50/50">
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
          paginatedQuestions.map((q) => {
            const isRevealed = Boolean(revealedSolutions[q.id]);
            const isCopied = copiedId === q.id;

            return (
              <div 
                key={q.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
              >
                {/* TOP ROW: Q# BADGE, SECTION TAG, AND ACTIONS */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      Q{q.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10.5px] rounded-lg">
                      {q.sectionTitle}
                    </span>
                    {q.type === 'Interview' && (
                      <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-black text-[10px] rounded-lg">
                        Interview Focus
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS: PRACTICE -> + EYE TOGGLE */}
                  <div className="flex items-center space-x-1.5">
                    {onJumpToPractice && (
                      <button
                        type="button"
                        onClick={() => onJumpToPractice({ id: q.challengeId, title: q.question })}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                        title="Practice writing this query in the SQL Engine Lab"
                      >
                        <span>Practice</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    {/* EYE BUTTON (JUST EYE ICON) */}
                    <button
                      type="button"
                      onClick={() => toggleRevealSolution(q.id)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isRevealed
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200'
                      }`}
                      title={isRevealed ? 'Hide solution' : 'Reveal solution'}
                      aria-label={isRevealed ? 'Hide solution' : 'Reveal solution'}
                    >
                      {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* QUESTION TITLE / PROMPT */}
                <div className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {q.question}
                </div>

                {/* SOLUTION CONTAINER */}
                {isRevealed ? (
                  /* REVEALED STATE: DARK CODE BLOCK & CONCEPT EXPLANATION */
                  <div className="space-y-3 pt-1 animate-in fade-in-50 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 relative group overflow-x-auto shadow-sm">
                      <button
                        type="button"
                        onClick={() => handleCopy(q.sql, q.id)}
                        className="absolute top-2.5 right-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className={isCopied ? "text-emerald-400 font-bold" : ""}>
                          {isCopied ? 'Copied' : 'Copy SQL'}
                        </span>
                      </button>

                      <pre className="font-mono text-xs sm:text-[13px] text-sky-300 font-bold leading-relaxed whitespace-pre-wrap select-text pr-20">
                        {q.sql}
                      </pre>
                    </div>

                    {/* EXPLANATION / NOTE */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-start space-x-1.5 font-medium">
                        <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Concept:</strong> {q.explanation}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* HIDDEN STATE: ENCOURAGING PRACTICE PROMPT */
                  <div className="bg-slate-50/80 border border-dashed border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                        <Eye size={13} />
                      </div>
                      <span className="font-medium text-slate-600">
                        Solution hidden — test your query first, then click the eye icon to view.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealSolution(q.id)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs hover:underline flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <span>Show Solution</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── PAGINATION BAR (10 QUESTIONS PER PAGE) ── */}
      {totalPages > 1 && (
        <nav aria-label="Questions Pagination" className="pt-6 pb-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800">{endIndex}</strong> of{' '}
            <strong className="text-slate-800">{filteredQuestions.length}</strong> questions
          </div>

          <div className="flex items-center space-x-1.5">
            {/* PREVIOUS PAGE BUTTON */}
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                safePage === 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs active:scale-95'
              }`}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* PAGE NUMBER BUTTONS */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => goToPage(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                  safePage === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* NEXT PAGE BUTTON */}
            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                safePage === totalPages
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs active:scale-95'
              }`}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </nav>
      )}

    </article>
  );
}
