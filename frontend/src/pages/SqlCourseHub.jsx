import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Code2, CheckCircle2, Play, ArrowRight, ArrowLeft,
  Search, Copy, Check, Sparkles, Database, Table, HelpCircle,
  CheckSquare, AlertCircle, ChevronRight, ChevronDown, Layers, Award,
  RotateCcw, ShieldCheck, Clock, Lightbulb, Terminal, Flame, Star,
  Target, BookMarked, Filter, TrendingUp, Trophy, Map
} from 'lucide-react';

import { SQL_MODULES, TOTAL_MODULES_COUNT, TOTAL_TOPICS_COUNT } from '../data/sqlCurriculumData';
import { SQL_CHALLENGES } from '../data/sqlChallenges';
import { SQL_30_DAY_ROADMAP } from '../data/sqlRoadmapData';
import { SQL_INTERVIEW_PROBLEMS } from '../data/sqlInterviewData';
import { executeSqlQuery, getTablesPreview } from '../services/sqlEngine';
import SqlLandingPage from './SqlLandingPage';
import SqlLearningView from './SqlLearningView';

/**
 * Rich Text & Markdown Parser
 * Parses **bold**, `code`, bullet points, and paragraphs cleanly.
 */
function RichMarkdown({ content, className = '' }) {
  if (!content) return null;

  const parseInline = (text) => {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-extrabold text-slate-900 bg-slate-100/90 px-1 py-0.5 rounded text-inherit">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const lines = content.trim().split('\n');

  return (
    <div className={`space-y-2.5 text-slate-700 leading-relaxed font-normal ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2">
              <span className="text-blue-600 font-black mt-1 text-sm">•</span>
              <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function SqlCourseHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Mode: 'overview' | 'learn' | 'practice' | 'roadmap' | 'interview' | 'quiz'
  const currentMode = searchParams.get('mode') || 'overview';
  const setMode = (modeName) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (modeName === 'overview') {
        next.delete('mode');
      } else {
        next.set('mode', modeName);
      }
      return next;
    });
  };

  // Accordion state for modules in sidebar
  const [expandedModules, setExpandedModules] = useState(() => {
    const initial = {};
    SQL_MODULES.forEach(m => {
      initial[m.id] = m.id === 'mod-01';
    });
    return initial;
  });

  const toggleModuleAccordion = (modId, e) => {
    if (e) e.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleExpandAll = () => {
    const next = {};
    SQL_MODULES.forEach(m => { next[m.id] = true; });
    setExpandedModules(next);
  };

  const handleCollapseAll = () => {
    const next = {};
    SQL_MODULES.forEach(m => { next[m.id] = false; });
    setExpandedModules(next);
  };

  // State: Progress in localStorage
  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('msc_sql_completed_topics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [solvedChallenges, setSolvedChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem('msc_sql_solved_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Learn Mode Navigation
  const [selectedModuleId, setSelectedModuleId] = useState('mod-01');
  const [selectedTopicId, setSelectedTopicId] = useState('top-01-01');
  const [learnSearch, setLearnSearch] = useState('');

  // Practice Mode Navigation
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(0);
  const [practiceSearch, setPracticeSearch] = useState('');
  const [practiceDifficulty, setPracticeDifficulty] = useState('all');
  const [schemaViewTab, setSchemaViewTab] = useState('data'); // 'data' | 'structure'

  // Interview Mode Navigation
  const [selectedInterviewIndex, setSelectedInterviewIndex] = useState(0);
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewDifficulty, setInterviewDifficulty] = useState('all');
  const [showInterviewSolution, setShowInterviewSolution] = useState(false);

  // Quiz Engine State
  const [quizActiveModuleId, setQuizActiveModuleId] = useState('mod-01');
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState({});

  // SQL Execution State
  const [userSql, setUserSql] = useState('');
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [tableSchemas, setTableSchemas] = useState([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Active Objects
  const activeModule = useMemo(() => {
    return SQL_MODULES.find(m => m.id === selectedModuleId) || SQL_MODULES[0];
  }, [selectedModuleId]);

  const activeTopic = useMemo(() => {
    return activeModule.topics.find(t => t.id === selectedTopicId) || activeModule.topics[0];
  }, [activeModule, selectedTopicId]);

  const activeChallenge = SQL_CHALLENGES[selectedChallengeIndex] || SQL_CHALLENGES[0];
  const activeInterviewProblem = SQL_INTERVIEW_PROBLEMS[selectedInterviewIndex] || SQL_INTERVIEW_PROBLEMS[0];

  const currentQuizQuestions = useMemo(() => {
    const mod = SQL_MODULES.find(m => m.id === quizActiveModuleId) || SQL_MODULES[0];
    return mod?.questions || [];
  }, [quizActiveModuleId]);

  // Filtered Modules for Learn Mode
  const filteredModules = useMemo(() => {
    if (!learnSearch.trim()) return SQL_MODULES;
    const q = learnSearch.toLowerCase();
    return SQL_MODULES.filter(m => 
      m.title.toLowerCase().includes(q) ||
      m.summary?.toLowerCase().includes(q) ||
      m.topics.some(t => t.title.toLowerCase().includes(q))
    );
  }, [learnSearch]);

  // Filtered Challenges for Practice Mode
  const filteredChallenges = useMemo(() => {
    return SQL_CHALLENGES.filter((ch, idx) => {
      ch.originalIndex = idx;
      if (practiceDifficulty !== 'all' && ch.difficulty?.toLowerCase() !== practiceDifficulty.toLowerCase()) return false;
      if (practiceSearch.trim()) {
        const q = practiceSearch.toLowerCase();
        return ch.title?.toLowerCase().includes(q) || ch.moduleTitle?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [practiceDifficulty, practiceSearch]);

  // Filtered Interview Questions
  const filteredInterviews = useMemo(() => {
    return SQL_INTERVIEW_PROBLEMS.filter((p, idx) => {
      p.originalIndex = idx;
      if (interviewDifficulty !== 'all' && p.difficulty?.toLowerCase() !== interviewDifficulty.toLowerCase()) return false;
      if (interviewSearch.trim()) {
        const q = interviewSearch.toLowerCase();
        return p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.companyTags?.some(c => c.toLowerCase().includes(q));
      }
      return true;
    });
  }, [interviewDifficulty, interviewSearch]);

  // Sync Practice Challenge Code & Schemas safely
  useEffect(() => {
    if (currentMode !== 'practice' && currentMode !== 'interview') return;
    const targetObj = currentMode === 'interview' ? activeInterviewProblem : activeChallenge;
    if (!targetObj) return;

    setUserSql(targetObj.starterSql || '');
    setQueryResult(null);
    setShowHint(false);
    setShowInterviewSolution(false);

    let isMounted = true;
    setLoadingSchemas(true);
    getTablesPreview(targetObj.setupSql)
      .then(tables => {
        if (isMounted) {
          setTableSchemas(Array.isArray(tables) ? tables : []);
          setLoadingSchemas(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load table schema preview:', err);
        if (isMounted) {
          setTableSchemas([]);
          setLoadingSchemas(false);
        }
      });

    return () => { isMounted = false; };
  }, [selectedChallengeIndex, selectedInterviewIndex, currentMode, activeChallenge, activeInterviewProblem]);

  // Handlers
  const handleToggleTopic = (id) => {
    setCompletedTopics(prev => {
      const next = prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id];
      try { localStorage.setItem('msc_sql_completed_topics', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleRunQuery = async () => {
    const targetObj = currentMode === 'interview' ? activeInterviewProblem : activeChallenge;
    if (runningQuery || !targetObj) return;
    setRunningQuery(true);
    try {
      const res = await executeSqlQuery(targetObj.setupSql, userSql);
      setQueryResult(res);
      if (res && res.success && currentMode === 'practice' && !solvedChallenges.includes(activeChallenge.id)) {
        const updated = [...solvedChallenges, activeChallenge.id];
        setSolvedChallenges(updated);
        try { localStorage.setItem('msc_sql_solved_challenges', JSON.stringify(updated)); } catch (_) {}
      }
    } catch (err) {
      setQueryResult({
        success: false,
        columns: [],
        values: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: err.message || 'An error occurred while executing the query.'
      });
    } finally {
      setRunningQuery(false);
    }
  };

  const handleJumpToPractice = (topic) => {
    const matchIdx = SQL_CHALLENGES.findIndex(c => 
      c.moduleId?.includes(activeModule.id.replace('mod-', '')) || 
      c.moduleTitle?.toLowerCase().includes(activeModule.title.toLowerCase().split(' ')[0])
    );
    if (matchIdx !== -1) {
      setSelectedChallengeIndex(matchIdx);
    }
    setMode('practice');
  };

  const handleJumpToQuiz = (modId) => {
    setQuizActiveModuleId(modId || activeModule.id);
    setQuizCurrentIndex(0);
    setQuizSelectedAnswers({});
    setMode('quiz');
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-50 text-slate-800 font-segoe w-full flex flex-col">
      
      {/* =========================================================================
          INNER MODES TOP BREADCRUMB / CONTROLS (ONLY SHOWN IN WORKSPACE VIEWS)
         ========================================================================= */}
      {currentMode !== 'overview' && currentMode !== 'learn' && (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 sticky top-[60px] z-30 shadow-2xs">
          
          {/* Back to Overview */}
          <button
            onClick={() => setMode('overview')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to SQL Overview</span>
          </button>

          {/* Quick Mode Toggle Pills */}
          <div className="flex items-center space-x-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMode('learn')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'learn' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Learn Topics ({completedTopics.length}/{TOTAL_TOPICS_COUNT})
            </button>
            <button
              onClick={() => setMode('practice')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'practice' ? 'bg-blue-600 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Practice Lab ({solvedChallenges.length}/{SQL_CHALLENGES.length})
            </button>
            <button
              onClick={() => setMode('roadmap')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'roadmap' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMode('interview')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'interview' || currentMode === 'quiz' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interview Questions
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 1: LANDING OVERVIEW PAGE (DEFAULT VIEW - ZERO EXTRA TOP BARS!)
         ========================================================================= */}
      {currentMode === 'overview' && (
        <SqlLandingPage
          onSelectMode={setMode}
          completedTopicsCount={completedTopics.length}
          solvedChallengesCount={solvedChallenges.length}
        />
      )}

      {/* =========================================================================
          VIEW 2: ROADMAP VIEW (30-DAY GUIDED TIMELINE)
         ========================================================================= */}
      {currentMode === 'roadmap' && (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-[11px] font-black">
                <Sparkles size={12} />
                <span>30-Day Step-by-Step Pathway</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                SQL Mastery Roadmap
              </h1>
              <p className="text-xs text-slate-500 max-w-xl">
                From relational schema fundamentals to advanced query optimization, CTEs, and window functions.
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
              <div className="text-center">
                <div className="text-lg font-black text-blue-600">{completedTopics.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Topics Done</div>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <div className="text-lg font-black text-emerald-600">{solvedChallenges.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Solved</div>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <div className="text-lg font-black text-purple-600">30</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Days</div>
              </div>
            </div>
          </div>

          {/* Timeline Days */}
          <div className="space-y-3">
            {SQL_30_DAY_ROADMAP.map((item) => {
              const isTopicDone = completedTopics.includes(item.topicId);

              return (
                <div
                  key={item.day}
                  className={`bg-white border rounded-xl p-4 transition-all shadow-2xs hover:shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isTopicDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      isTopicDone ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {isTopicDone ? '✓' : `D${item.day}`}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          Week {item.week} • {item.phase}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                          {item.difficulty}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setSelectedModuleId(item.moduleId);
                        setSelectedTopicId(item.topicId);
                        setMode('learn');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Study Day {item.day}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 3: LEARN TOPICS WORKSPACE (PIXEL-PERFECT STRUCTURED LEARNING VIEW)
         ========================================================================= */}
      {currentMode === 'learn' && (
        <SqlLearningView
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          selectedTopicId={selectedTopicId}
          setSelectedTopicId={setSelectedTopicId}
          completedTopics={completedTopics}
          onToggleCompleted={handleToggleTopic}
          onJumpToPractice={handleJumpToPractice}
          onBackToOverview={() => setMode('overview')}
        />
      )}

      {/* =========================================================================
          5. VIEW 4: PRACTICE LAB (CHALLENGES WORKSPACE)
         ========================================================================= */}
      {currentMode === 'practice' && (
        <div className="flex-1 flex w-full relative">
          <aside className="w-80 xl:w-96 shrink-0 bg-white border-r border-slate-200 sticky top-[108px] h-[calc(100vh-108px)] overflow-y-auto z-20 flex flex-col shadow-2xs">
            <div className="p-3.5 space-y-3 flex-1 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Challenges ({SQL_CHALLENGES.length})
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-600">
                    {solvedChallenges.length} Solved
                  </span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={practiceSearch}
                    onChange={(e) => setPracticeSearch(e.target.value)}
                    placeholder="Search challenges..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  {['all', 'easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setPracticeDifficulty(d)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        practiceDifficulty === d
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto border border-slate-200/80 rounded-xl">
                {filteredChallenges.map((ch) => {
                  const isSelected = ch.originalIndex === selectedChallengeIndex;
                  const isSolved = solvedChallenges.includes(ch.id);

                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChallengeIndex(ch.originalIndex)}
                      className={`w-full text-left p-3 flex items-center justify-between transition-all cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSolved
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isSolved ? '✓' : ch.originalIndex + 1}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">#{ch.originalIndex + 1}: {ch.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{ch.difficulty} • {ch.moduleTitle}</div>
                        </div>
                      </div>

                      <ChevronRight size={13} className={`text-slate-400 shrink-0 ${isSelected ? 'text-blue-600' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MAIN PRACTICE LAB AREA */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full items-start">
              
              <div className="xl:col-span-5 space-y-4 w-full">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                        #{selectedChallengeIndex + 1} • {activeChallenge?.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{activeChallenge?.moduleTitle}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        disabled={selectedChallengeIndex === 0}
                        onClick={() => setSelectedChallengeIndex(prev => prev - 1)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Previous Problem"
                      >
                        <ArrowLeft size={13} />
                      </button>
                      <button
                        disabled={selectedChallengeIndex === SQL_CHALLENGES.length - 1}
                        onClick={() => setSelectedChallengeIndex(prev => prev + 1)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Next Problem"
                      >
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {activeChallenge?.title}
                  </h2>
                  
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <RichMarkdown content={activeChallenge?.description} />
                  </div>

                  {activeChallenge?.hints?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setShowHint(prev => !prev)}
                        className="text-xs font-extrabold text-amber-700 hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <Lightbulb size={13} />
                        <span>{showHint ? 'Hide Problem Hint' : 'View Problem Hint'}</span>
                      </button>
                      {showHint && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-semibold">
                          <ul className="list-disc list-inside space-y-1">
                            {activeChallenge.hints.map((h, i) => <li key={i}>{h}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Schemas */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                      <Database size={14} className="text-blue-600" />
                      <span>Database Tables & Data</span>
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        onClick={() => setSchemaViewTab('data')}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          schemaViewTab === 'data' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Sample Records
                      </button>
                      <button
                        onClick={() => setSchemaViewTab('structure')}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          schemaViewTab === 'structure' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Columns & Types
                      </button>
                    </div>
                  </div>

                  {loadingSchemas ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading table schemas...</div>
                  ) : tableSchemas.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No tables defined for this challenge.</div>
                  ) : (
                    <div className="space-y-3 max-h-84 overflow-y-auto pr-1">
                      {tableSchemas.map((tbl, tIdx) => {
                        const tableName = tbl.tableName || tbl.name || `Table ${tIdx + 1}`;
                        const columnObjects = Array.isArray(tbl.columns) ? tbl.columns : [];
                        const dataRows = tbl.sampleRows || tbl.rows || tbl.values || [];

                        return (
                          <div key={tIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-mono font-black text-blue-900 flex items-center space-x-1.5">
                                <Table size={12} className="text-blue-600" />
                                <span>Table: {tableName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                {columnObjects.length} cols • {dataRows.length} rows
                              </span>
                            </div>

                            {schemaViewTab === 'data' && (
                              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                                <table className="min-w-full divide-y divide-slate-200 text-[11px] text-left">
                                  <thead className="bg-slate-50 font-extrabold text-slate-700">
                                    <tr>
                                      <th className="px-2 py-1 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                                      {columnObjects.map((c, cIdx) => (
                                        <th key={cIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                          {typeof c === 'object' ? (c.name || c.column_name) : c}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                    {dataRows.slice(0, 5).map((r, rIdx) => (
                                      <tr key={rIdx} className="hover:bg-slate-50/70">
                                        <td className="px-2 py-1 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                        {Array.isArray(r) ? (
                                          r.map((val, vIdx) => (
                                            <td key={vIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                              {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                            </td>
                                          ))
                                        ) : (
                                          <td className="px-2.5 py-1">{String(r)}</td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {schemaViewTab === 'structure' && (
                              <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                                <table className="min-w-full divide-y divide-slate-200 text-[11px] text-left">
                                  <thead className="bg-slate-50 font-extrabold text-slate-700">
                                    <tr>
                                      <th className="px-2.5 py-1">Column Name</th>
                                      <th className="px-2.5 py-1">Data Type</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                                    {columnObjects.map((c, cIdx) => (
                                      <tr key={cIdx} className="hover:bg-slate-50/70">
                                        <td className="px-2.5 py-1 font-bold text-slate-900">{typeof c === 'object' ? (c.name || c.column_name) : c}</td>
                                        <td className="px-2.5 py-1 text-blue-600">{typeof c === 'object' ? (c.type || 'TEXT') : 'TEXT'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Code Editor */}
              <div className="xl:col-span-7 space-y-4 w-full">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal size={14} className="text-slate-600" />
                      <span className="text-xs font-black text-slate-700 font-mono">SQL Solution Editor</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setUserSql(activeChallenge?.starterSql || '')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleRunQuery}
                        disabled={runningQuery}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Play size={12} className="fill-white" />
                        <span>{runningQuery ? 'Running...' : 'Run Query (Ctrl+Enter)'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={userSql}
                    onChange={(e) => setUserSql(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleRunQuery();
                      }
                    }}
                    rows={9}
                    className="w-full bg-white text-slate-900 font-mono text-xs sm:text-sm p-4 focus:outline-none resize-y border-none font-semibold leading-relaxed"
                    placeholder="-- Type your SQL query solution here..."
                  />
                </div>

                {/* Output visualizer */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Query Execution Output</span>
                    {queryResult && (
                      <span className="text-[11px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                        {queryResult.rowCount} row(s) • {queryResult.executionTimeMs} ms
                      </span>
                    )}
                  </div>

                  {queryResult ? (
                    queryResult.success ? (
                      <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                          <thead className="bg-slate-50 font-black text-slate-800">
                            <tr>
                              <th className="px-2.5 py-2 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                              {(queryResult.columns || []).map((col, idx) => (
                                <th key={idx} className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            {(queryResult.values || []).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/70">
                                <td className="px-2.5 py-1.5 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                {Array.isArray(row) ? (
                                  row.map((val, cIdx) => (
                                    <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-medium">
                                      {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                    </td>
                                  ))
                                ) : (
                                  <td className="px-3 py-1.5">{String(row)}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 font-mono">
                        {queryResult.error}
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
                      Press "Run Query" or Ctrl+Enter to execute query in in-browser SQLite WebAssembly.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          6. VIEW 5: INTERVIEW QUESTIONS & PROBLEMS WORKSPACE
         ========================================================================= */}
      {currentMode === 'interview' && (
        <div className="flex-1 flex w-full relative">
          <aside className="w-80 xl:w-96 shrink-0 bg-white border-r border-slate-200 sticky top-[108px] h-[calc(100vh-108px)] overflow-y-auto z-20 flex flex-col shadow-2xs">
            <div className="p-3.5 space-y-3 flex-1 flex flex-col">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Interview Bank ({SQL_INTERVIEW_PROBLEMS.length})
                  </span>
                  <span className="text-[11px] font-bold text-blue-600">Top Tech Companies</span>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                    placeholder="Search interview questions..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  {['all', 'intermediate', 'advanced'].map(d => (
                    <button
                      key={d}
                      onClick={() => setInterviewDifficulty(d)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        interviewDifficulty === d
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto border border-slate-200/80 rounded-xl">
                {filteredInterviews.map((prob) => {
                  const isSelected = prob.originalIndex === selectedInterviewIndex;

                  return (
                    <button
                      key={prob.id}
                      onClick={() => setSelectedInterviewIndex(prob.originalIndex)}
                      className={`w-full text-left p-3 flex items-center justify-between transition-all cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {prob.originalIndex + 1}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">#{prob.originalIndex + 1}: {prob.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{prob.difficulty} • {prob.companyTags?.slice(0, 2).join(', ')}</div>
                        </div>
                      </div>

                      <ChevronRight size={13} className={`text-slate-400 shrink-0 ${isSelected ? 'text-blue-600' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* MAIN INTERVIEW LAB */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full items-start">
              
              <div className="xl:col-span-5 space-y-4 w-full">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex flex-wrap gap-1.5 items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md">
                      {activeInterviewProblem?.difficulty} • {activeInterviewProblem?.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Freq: {activeInterviewProblem?.frequency}
                    </span>
                  </div>

                  {activeInterviewProblem?.companyTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activeInterviewProblem.companyTags.map((comp, cIdx) => (
                        <span key={cIdx} className="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-200">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {activeInterviewProblem?.title}
                  </h2>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <RichMarkdown content={activeInterviewProblem?.description} />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => setShowInterviewSolution(prev => !prev)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      <span>{showInterviewSolution ? 'Hide Model Solution & Tips' : 'Reveal Expected Solution & Tips'}</span>
                    </button>

                    {showInterviewSolution && (
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 font-mono text-xs">
                        <div className="text-[11px] font-bold text-emerald-400 font-sans uppercase">Expected Query Solution:</div>
                        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto text-emerald-300">
                          {activeInterviewProblem?.expectedSql}
                        </pre>
                        {activeInterviewProblem?.tips && (
                          <div className="pt-2 border-t border-slate-800 text-amber-300 text-[11px] font-sans">
                            <strong>Interview Tip:</strong> {activeInterviewProblem.tips}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="xl:col-span-7 space-y-4 w-full">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal size={14} className="text-slate-600" />
                      <span className="text-xs font-black text-slate-700 font-mono">Live Interview Solution Workspace</span>
                    </div>
                    
                    <button
                      onClick={handleRunQuery}
                      disabled={runningQuery}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Play size={12} className="fill-white" />
                      <span>{runningQuery ? 'Running...' : 'Run Query'}</span>
                    </button>
                  </div>

                  <textarea
                    value={userSql}
                    onChange={(e) => setUserSql(e.target.value)}
                    rows={9}
                    className="w-full bg-white text-slate-900 font-mono text-xs sm:text-sm p-4 focus:outline-none resize-y border-none font-semibold leading-relaxed"
                    placeholder="-- Write interview SQL solution..."
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
                  <div className="text-xs font-bold text-slate-700">Query Output</div>
                  {queryResult ? (
                    queryResult.success ? (
                      <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl bg-white">
                        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                          <thead className="bg-slate-50 font-black text-slate-800">
                            <tr>
                              {(queryResult.columns || []).map((col, idx) => (
                                <th key={idx} className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            {(queryResult.values || []).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/70">
                                {Array.isArray(row) ? row.map((val, cIdx) => (
                                  <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-medium">
                                    {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                  </td>
                                )) : <td className="px-3 py-1.5">{String(row)}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 font-mono">
                        {queryResult.error}
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-medium">
                      Press "Run Query" to verify your SQL logic against sample interview schemas.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          7. VIEW 6: TOPIC QUIZZES WORKSPACE
         ========================================================================= */}
      {currentMode === 'quiz' && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6 w-full">
            {currentQuizQuestions.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10">No questions available for this module yet.</div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="font-extrabold text-blue-600">
                    Module {activeModule.number} Quiz • Question {quizCurrentIndex + 1} of {currentQuizQuestions.length}
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 font-extrabold px-2.5 py-0.5 rounded-md">
                    {currentQuizQuestions[quizCurrentIndex]?.type || 'Question'}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-black text-slate-900 leading-snug whitespace-pre-line">
                  {currentQuizQuestions[quizCurrentIndex]?.question}
                </div>

                <div className="space-y-2.5">
                  {(currentQuizQuestions[quizCurrentIndex]?.options || []).map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = quizSelectedAnswers[quizCurrentIndex] === letter;
                    const isCorrect = currentQuizQuestions[quizCurrentIndex]?.correctAnswer === letter;
                    const answered = Boolean(quizSelectedAnswers[quizCurrentIndex]);

                    let cardStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';
                    if (answered) {
                      if (isCorrect) cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                      else if (isSelected) cardStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
                    } else if (isSelected) {
                      cardStyle = 'border-blue-600 bg-blue-50 text-blue-950 font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          setQuizSelectedAnswers(prev => ({ ...prev, [quizCurrentIndex]: letter }));
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${cardStyle}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                          answered && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : answered && isSelected && !isCorrect
                            ? 'bg-rose-600 text-white'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold pt-0.5">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSelectedAnswers[quizCurrentIndex] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
                    <div className="text-xs font-extrabold text-blue-900 uppercase">
                      Explanation (Correct Answer: {currentQuizQuestions[quizCurrentIndex]?.correctAnswer})
                    </div>
                    <p className="text-xs text-blue-950 font-medium leading-relaxed">
                      {currentQuizQuestions[quizCurrentIndex]?.explanation}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    disabled={quizCurrentIndex === 0}
                    onClick={() => setQuizCurrentIndex(prev => prev - 1)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>

                  <button
                    disabled={quizCurrentIndex === currentQuizQuestions.length - 1}
                    onClick={() => setQuizCurrentIndex(prev => prev + 1)}
                    className="px-4 py-1.5 rounded-lg text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next Question
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
