import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';
import { DML_QUESTIONS_DATA, DML_SECTIONS } from '../../data/dmlQuestionsData';

const PAGE_SIZE = 10;

const EMPLOYEES_SETUP_SQL = `-- Create employees table for DML Practice
CREATE TABLE IF NOT EXISTS employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    city VARCHAR(50) NOT NULL
);`;

export default function DmlQuestionsBank({ onJumpToPractice }) {
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedSolutions, setRevealedSolutions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedSetup, setCopiedSetup] = useState(false);

  // Toggle reveal solution for single question
  const toggleRevealSolution = (id) => {
    setRevealedSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Copy SQL to clipboard
  const handleCopy = (sql, id) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Setup SQL
  const handleCopySetup = () => {
    navigator.clipboard.writeText(EMPLOYEES_SETUP_SQL);
    setCopiedSetup(true);
    setTimeout(() => setCopiedSetup(false), 2000);
  };

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return DML_QUESTIONS_DATA.filter(q => {
      const matchSection = selectedSection === 'all' || q.section === selectedSection;
      const matchSearch = !searchQuery.trim() || 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.sql.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.sectionTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSection && matchSearch;
    });
  }, [selectedSection, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredQuestions.length);
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Smooth scroll to top of questions container
    const container = document.getElementById('dml-questions-top');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <article id="dml-questions-top" className="space-y-6 animate-fadeIn max-w-4xl mx-auto py-2">
      {/* ── SIMPLE LIGHT THEME HEADER ── */}
      <header className="space-y-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs shrink-0 font-black text-sm">
              <Database size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  50 DML Practice Questions
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-black text-[11px] uppercase tracking-wide">
                  Master Bank
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                50 standard practice questions covering INSERT, UPDATE, DELETE, and SELECT
              </p>
            </div>
          </div>
        </div>

        {/* PREREQUISITE: LIGHT TABLE SETUP ROW */}
        <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-700 shadow-2xs">
          <div className="flex items-center space-x-2">
            <Terminal size={15} className="text-blue-600 shrink-0" />
            <span>
              <strong>Prerequisite:</strong> Create <code className="text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">employees</code> table with columns: <span className="font-mono text-slate-600">emp_id, name, department, salary, city</span>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopySetup}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
          >
            {copiedSetup ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copiedSetup ? 'Copied Setup SQL' : 'Copy Table Setup SQL'}</span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative pt-1">
          <Search size={16} className="absolute left-3.5 top-[15px] text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search questions by keyword, department, or salary (e.g. 60000, IT, Mumbai)..."
            style={{ paddingLeft: '38px', paddingRight: '20px' }}
            className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* SECTION FILTER PILLS (LIGHT THEME) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {DML_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setSelectedSection(sec.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSection === sec.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── QUESTION CARDS LIST ── */}
      <div className="space-y-4">
        {paginatedQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 text-slate-500 text-xs">
            <p className="font-bold text-slate-700">No matching DML questions found.</p>
            <p>Try clearing your search term or switching to a different section.</p>
          </div>
        ) : (
          paginatedQuestions.map((q) => {
            const isRevealed = !!revealedSolutions[q.id];
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
                    <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">
                      {q.type}
                    </span>
                    <span className={`px-2 py-0.5 border font-bold text-[10px] rounded-lg ${
                      q.difficulty?.toLowerCase() === 'basic'
                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                        : q.difficulty?.toLowerCase() === 'easy'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : q.difficulty?.toLowerCase() === 'medium'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>

                  {/* ACTION BUTTONS: PRACTICE -> + EYE TOGGLE */}
                  <div className="flex items-center space-x-1.5">
                    <a
                      href={`/courses/sql/practice?challenge=${q.challengeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 no-underline"
                      title="Open Practice Lab in a new tab"
                    >
                      <span>Practice</span>
                      <ArrowRight size={13} />
                    </a>

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
        <nav aria-label="DML Questions Pagination" className="pt-6 pb-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800">{endIndex}</strong> of{' '}
            <strong className="text-slate-800">{filteredQuestions.length}</strong> questions
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => handlePageChange(safePage - 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center space-x-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  safePage === pageNum
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => handlePageChange(safePage + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center space-x-1"
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
