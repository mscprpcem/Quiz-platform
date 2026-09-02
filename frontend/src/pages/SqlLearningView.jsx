import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Copy, Check, Table, CheckCircle2, ChevronRight,
  ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Lightbulb, Code2, Menu, X,
  Server, Layers, ShieldCheck, Database, AlertTriangle, Shield, Zap, FileText,
  Download, ExternalLink, Laptop, Clock, Sparkles
} from 'lucide-react';
import { TOTAL_TOPICS_COUNT } from '../data/sqlCurriculumData';
import { 
  CHAPTER_CATALOG, 
  ALL_TOPIC_DETAILS, 
  getChapterMetadata, 
  isChapterAvailable 
} from '../data/chapters';
import ChapterComingSoon from '../components/learn/ChapterComingSoon';
import ComparisonTable from '../components/learn/ComparisonTable';
import DdlQuestionsBank from '../components/learn/DdlQuestionsBank';

/**
 * SQL Syntax Colorizer
 * Highlights SQL keywords, data types, numbers, strings, comments, and identifiers in high-contrast light theme
 */
function HighlightedSql({ code }) {
  if (!code) return null;

  const lines = code.split('\n');

  return (
    <div className="font-mono text-[12px] sm:text-[13px] leading-relaxed select-text">
      {lines.map((line, lineIdx) => {
        // Handle comment line
        if (line.trim().startsWith('--') || line.trim().startsWith('/*') || line.trim().startsWith('#')) {
          return (
            <div key={lineIdx} className="text-slate-500 italic font-medium">
              {line}
            </div>
          );
        }

        // Tokenize line with regex
        const tokens = line.split(/(\b(?:CREATE\s+TABLE|CREATE\s+DATABASE|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE\s+TABLE|RENAME\s+TABLE|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|NOT\s+NULL|UNIQUE|DEFAULT|CHECK|TRUE|FALSE|SELECT|FROM|WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|OFFSET|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|DESC|ASC|ADD\s+COLUMN|DROP\s+COLUMN|RENAME\s+COLUMN|RENAME\s+TO|MODIFY\s+COLUMN|CHANGE\s+COLUMN|INSERT\s+INTO|UPDATE|DELETE|SET|VALUES|COMMIT|ROLLBACK|SAVEPOINT|START\s+TRANSACTION|GRANT|REVOKE|SHOW\s+DATABASES|SHOW\s+TABLES|DESCRIBE|USE|VERSION|CURRENT_TIMESTAMP|USER|DATABASE|INT|INTEGER|VARCHAR|DECIMAL|DATE|BOOLEAN|TEXT|FLOAT|DOUBLE|BIGINT|TIMESTAMP)\b|'[^']*'|\d+(?:\.\d+)?|[(),;]|\[constraints\]|\bdatatype\b|\btable_name\b|\bcolumn\d+\b|\bdatabase_name\b)/gi);

        return (
          <div key={lineIdx}>
            {tokens.map((token, tIdx) => {
              if (!token) return null;
              const upper = token.toUpperCase();

              // SQL Keywords
              if (
                ['CREATE TABLE', 'CREATE DATABASE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE', 'RENAME TABLE',
                 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'NOT NULL', 'UNIQUE', 'DEFAULT', 'CHECK', 'TRUE', 'FALSE',
                 'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
                 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'DESC', 'ASC',
                 'ADD COLUMN', 'DROP COLUMN', 'RENAME COLUMN', 'RENAME TO', 'MODIFY COLUMN', 'CHANGE COLUMN',
                 'INSERT INTO', 'UPDATE', 'DELETE', 'SET', 'VALUES', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
                 'START TRANSACTION', 'GRANT', 'REVOKE', 'SHOW DATABASES', 'SHOW TABLES', 'DESCRIBE', 'USE',
                 'VERSION', 'CURRENT_TIMESTAMP', 'USER', 'DATABASE'].includes(upper)
              ) {
                return (
                  <span key={tIdx} className="text-blue-700 font-black">
                    {token}
                  </span>
                );
              }

              // SQL Data Types
              if (['INT', 'INTEGER', 'VARCHAR', 'DECIMAL', 'DATE', 'BOOLEAN', 'TEXT', 'FLOAT', 'DOUBLE', 'BIGINT', 'TIMESTAMP'].includes(upper)) {
                return (
                  <span key={tIdx} className="text-indigo-700 font-black">
                    {token}
                  </span>
                );
              }

              // Placeholder syntax tags
              if (token.toLowerCase() === 'datatype') {
                return (
                  <span key={tIdx} className="text-teal-700 font-bold">
                    {token}
                  </span>
                );
              }
              if (token.toLowerCase() === '[constraints]') {
                return (
                  <span key={tIdx} className="text-slate-500 font-medium">
                    {token}
                  </span>
                );
              }

              // Strings
              if (token.startsWith("'") && token.endsWith("'")) {
                return (
                  <span key={tIdx} className="text-emerald-700 font-semibold">
                    {token}
                  </span>
                );
              }

              // Numbers
              if (/^\d+(?:\.\d+)?$/.test(token)) {
                return (
                  <span key={tIdx} className="text-amber-700 font-bold">
                    {token}
                  </span>
                );
              }

              // Punctuation
              if (['(', ')', ',', ';'].includes(token)) {
                return (
                  <span key={tIdx} className="text-slate-900 font-bold">
                    {token}
                  </span>
                );
              }

              return (
                <span key={tIdx} className="text-slate-900 font-medium">
                  {token}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function SqlLearningView({
  selectedModuleId = 'mod-01',
  setSelectedModuleId,
  selectedTopicId = 'top-01-01',
  setSelectedTopicId,
  completedTopics = [],
  onToggleCompleted,
  onJumpToPractice,
  onBackToOverview
}) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active topic state (defaults to top-01-01)
  const [currentActiveTopicId, setCurrentActiveTopicId] = useState(selectedTopicId || 'top-01-01');

  // Synchronized completed topics
  const [localCompletedTopics, setLocalCompletedTopics] = useState(() => {
    if (completedTopics && completedTopics.length > 0) return completedTopics;
    try {
      const saved = localStorage.getItem('msc_sql_completed_topics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (completedTopics && completedTopics.length > 0) {
      setLocalCompletedTopics(completedTopics);
    }
  }, [completedTopics]);

  useEffect(() => {
    if (selectedTopicId) {
      setCurrentActiveTopicId(selectedTopicId);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    if (selectedModuleId) {
      setExpandedModules((prev) => ({ ...prev, [selectedModuleId]: true }));
    }
  }, [selectedModuleId]);

  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState({
    'mod-01': true, // Fundamentals expanded by default
    'mod-02': true  // DDL expanded by default
  });

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleSelectTopic = (topId, modId = 'mod-01') => {
    setCurrentActiveTopicId(topId);
    if (setSelectedTopicId) setSelectedTopicId(topId);
    if (setSelectedModuleId) setSelectedModuleId(modId);
    setMobileMenuOpen(false);
  };

  const handleToggleRead = (topId) => {
    const targetId = topId || currentActiveTopicId;
    if (onToggleCompleted) {
      onToggleCompleted(targetId);
    }
    setLocalCompletedTopics((prev) => {
      const next = prev.includes(targetId) ? prev.filter(t => t !== targetId) : [...prev, targetId];
      try {
        localStorage.setItem('msc_sql_completed_topics', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Active chapter metadata and live status
  const activeChapter = useMemo(() => {
    return getChapterMetadata(selectedModuleId || 'mod-01');
  }, [selectedModuleId]);

  const isChapterLive = activeChapter.status === 'available';

  // Active topic data
  const topicData = useMemo(() => {
    if (ALL_TOPIC_DETAILS[currentActiveTopicId]) {
      return ALL_TOPIC_DETAILS[currentActiveTopicId];
    }
    // Fallback to first available topic in chapter or default
    if (activeChapter.topics && activeChapter.topics.length > 0) {
      const firstId = activeChapter.topics[0].id;
      if (ALL_TOPIC_DETAILS[firstId]) return ALL_TOPIC_DETAILS[firstId];
    }
    return ALL_TOPIC_DETAILS['top-01-01'] || ALL_TOPIC_DETAILS['top-create-table'];
  }, [currentActiveTopicId, activeChapter]);

  const isCurrentTopicRead = localCompletedTopics.includes(topicData.id);
  const totalTopicsCount = TOTAL_TOPICS_COUNT || 66;
  const progressPercent = Math.min(100, Math.round((localCompletedTopics.length / totalTopicsCount) * 100));

  const handleCopyCode = (code, sectionKey) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div
      style={{ height: 'calc(100vh - 63px)', overflow: 'hidden' }}
      className="w-full flex font-segoe text-slate-800 bg-slate-50/40"
    >
      {/* =========================================================================
          LEFT SIDEBAR: CURRICULUM SYLLABUS (MODULAR CHAPTERS + COMING SOON BUTTONS)
         ========================================================================= */}
      <aside className="w-80 border-r border-slate-200/90 bg-white flex flex-col shrink-0 h-full select-none z-10 shadow-xs hidden lg:flex">
        
        {/* ── TOP HEADER: Syllabus Title + Quick Exit to Hub ── */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen size={16} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block leading-tight">
                  SQL Syllabus
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {CHAPTER_CATALOG.filter(c => c.status === 'available').length} Chapters Live • {CHAPTER_CATALOG.filter(c => c.status === 'coming_soon').length} Upcoming
                </span>
              </div>
            </div>

            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200"
              >
                <ArrowLeft size={12} />
                <span>Hub</span>
              </button>
            )}
          </div>

          {/* Overall Reading Progress bar */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Reading Progress</span>
              <span className="text-blue-600 font-mono font-black">{localCompletedTopics.length} completed</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Scrollable Module & Topic List ── */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar">
          {CHAPTER_CATALOG.map((mod) => {
            const isExpanded = expandedModules[mod.id] !== false;
            const isAvailable = mod.status === 'available';
            const isSelected = selectedModuleId === mod.id;

            if (!isAvailable) {
              return (
                <div key={mod.id} className="pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModuleId && setSelectedModuleId(mod.id);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-black flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border border-amber-200 text-amber-950 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                        {mod.number}
                      </span>
                      <span className="truncate">
                        {mod.shortTitle || mod.title}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100/90 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-extrabold tracking-wide shrink-0 shadow-2xs">
                      Coming Soon
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <div key={mod.id} className="pb-2 mb-1 border-b border-slate-200/80 last:border-b-0 last:mb-0 last:pb-0">
                {/* Available Chapter Header */}
                <button
                  type="button"
                  onClick={() => {
                    toggleModule(mod.id);
                    setSelectedModuleId && setSelectedModuleId(mod.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-black flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-950 font-black border border-indigo-200/80'
                      : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}>
                      {mod.number}
                    </span>
                    <span className="truncate">
                      {mod.title}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp size={15} className="text-indigo-600 shrink-0 ml-1.5" strokeWidth={2.2} />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400 shrink-0 ml-1.5" strokeWidth={2.2} />
                  )}
                </button>

                {isExpanded && mod.topics && (
                  <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5 pt-1 pb-1">
                    {mod.topics.map((t) => {
                      const isTopicSelected = currentActiveTopicId === t.id && isAvailable;
                      const isCompleted = localCompletedTopics.includes(t.id);

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTopic(t.id, mod.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer leading-snug ${
                            isTopicSelected
                              ? 'bg-blue-50 text-blue-700 font-black border border-blue-200/80 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {isCompleted ? (
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                            ) : (
                              <span className={`text-xs leading-none shrink-0 ${isTopicSelected ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>•</span>
                            )}
                            <span className="truncate">{t.title}</span>
                          </div>
                          {isCompleted && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-xs shrink-0">Done</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM: Practice Playground Shortcut Card ── */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100 shrink-0">
              <Lightbulb size={15} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Need to practice?</div>
              <div className="text-[10px] text-slate-500 font-medium">Try SQL challenges in the engine</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onJumpToPractice && onJumpToPractice(topicData)}
            className="w-full py-1.5 bg-white hover:bg-slate-50 text-indigo-600 font-black text-xs rounded-xl border border-indigo-200/80 shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <span className="font-mono text-xs font-bold">{`</>`}</span>
            <span>Open Practice Lab</span>
          </button>
        </div>

      </aside>

      {/* =========================================================================
          RIGHT MAIN CONTENT: SCROLLABLE WORKSPACE
         ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        
        {/* ── MOBILE TOP BAR (<1024px) ── */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs active:scale-95"
          >
            <BookOpen size={14} className="text-blue-600" />
            <span>Course Syllabus</span>
            <ChevronRight size={12} className="text-slate-400" />
          </button>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
            <span className="text-[11px] font-mono text-blue-600 font-black">
              {progressPercent}% Done
            </span>
          </div>
        </div>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
          {!isChapterLive ? (
            <ChapterComingSoon
              chapter={activeChapter}
              onSelectChapter={(modId) => {
                setSelectedModuleId && setSelectedModuleId(modId);
                const targetMod = CHAPTER_CATALOG.find(m => m.id === modId);
                if (targetMod?.topics?.[0]) {
                  handleSelectTopic(targetMod.topics[0].id, modId);
                }
              }}
              onJumpToPractice={onJumpToPractice}
            />
          ) : topicData.isQuestionsBankTopic ? (
            <DdlQuestionsBank onJumpToPractice={onJumpToPractice} />
          ) : (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">

              {/* 1. TOPIC HEADER CARD (Clean Light Theme & Spacing) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs shrink-0 font-black text-sm">
                      {topicData.chapterNumber !== undefined ? `${topicData.chapterNumber}.${topicData.id.slice(-2)}` : <Table size={20} strokeWidth={2.2} />}
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {topicData.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        {topicData.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* MARK AS READ BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleToggleRead(topicData.id)}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                      isCurrentTopicRead
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-extrabold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border-slate-200/90'
                    }`}
                  >
                    <CheckCircle2
                      size={16}
                      className={isCurrentTopicRead ? 'text-emerald-600' : 'text-slate-400'}
                      strokeWidth={isCurrentTopicRead ? 2.5 : 2}
                    />
                    <span>{isCurrentTopicRead ? 'Marked as Read' : 'Mark as Read'}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1 max-w-5xl">
                  {topicData.intro}
                </p>
              </div>

              {/* 2. ARCHITECTURAL COMPARISON MATRIX (Generic & Dynamic) */}
              {topicData.comparisonTable && (
                <ComparisonTable comparison={topicData.comparisonTable} />
              )}

              {/* 3. WHY DO WE NEED AN RDBMS (ACID Properties) */}
              {topicData.whyWeNeedItSection && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                      <Shield size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        {topicData.whyWeNeedItSection.title}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {topicData.whyWeNeedItSection.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {topicData.whyWeNeedItSection.intro}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {topicData.whyWeNeedItSection.acidPillars.map((pillar) => (
                      <div key={pillar.letter} className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2.5 shadow-2xs flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                              pillar.badgeColor === 'blue' ? 'bg-blue-600 text-white' :
                              pillar.badgeColor === 'emerald' ? 'bg-emerald-600 text-white' :
                              pillar.badgeColor === 'indigo' ? 'bg-indigo-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {pillar.letter}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {pillar.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            {pillar.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. STRUCTURAL HIERARCHY DEFINITIONS (Table, Row, Column, Cell) */}
              {topicData.structuralDefinitions && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                      <Layers size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        The 6 Core Structural Layers
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        From physical database container down to an atomic data cell
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {topicData.structuralDefinitions.map((t) => (
                      <div key={t.term} className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{t.term}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          {t.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SQL COMMAND TYPES GRID (DDL, DML, DQL, DCL, TCL) */}
              {topicData.commandTypesGrid && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                      <Code2 size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        The 5 SQL Command Families (DDL, DML, DQL, DCL, TCL)
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Comprehensive classification, operational scope, and transaction behavior
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topicData.commandTypesGrid.map((cmd) => (
                      <div key={cmd.category} className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-indigo-200 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wide ${
                              cmd.category === 'DDL' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              cmd.category === 'DML' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              cmd.category === 'DQL' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              cmd.category === 'DCL' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {cmd.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {cmd.target}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-black text-slate-900">{cmd.fullForm}</div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium mt-1">
                              {cmd.purpose}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {cmd.commands.map(c => (
                              <span key={c} className="font-mono text-[11px] font-bold px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-md shadow-2xs">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="font-bold text-slate-500">Rollback via TCL:</span>
                            <span className={`font-black ${cmd.category === 'DML' ? 'text-emerald-600' : 'text-slate-700'}`}>
                              {cmd.rollback}
                            </span>
                          </div>
                          <div className="font-mono text-[10.5px] font-bold bg-white text-slate-900 p-2.5 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre shadow-2xs">
                            {cmd.example}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. OS DOWNLOAD PANELS (Windows & macOS) */}
              {topicData.osDownloadPanels && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                      <Download size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        Official Downloads Matrix (Windows & macOS)
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Direct official Oracle links for MySQL Server 8.0 & MySQL Workbench
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* WINDOWS CARD */}
                    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {topicData.osDownloadPanels.windows.osName}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {topicData.osDownloadPanels.windows.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">
                          {topicData.osDownloadPanels.windows.packageTitle}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {topicData.osDownloadPanels.windows.stepsOverview}
                        </p>
                      </div>

                      <a
                        href={topicData.osDownloadPanels.windows.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition-all text-center cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Download Windows Installer (MSI)</span>
                        <ExternalLink size={12} className="opacity-80" />
                      </a>
                    </div>

                    {/* MACOS CARD */}
                    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {topicData.osDownloadPanels.macos.osName}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {topicData.osDownloadPanels.macos.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900">
                          {topicData.osDownloadPanels.macos.packageTitle}
                        </h3>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            Or via Terminal (Homebrew):
                          </span>
                          <div className="bg-white text-slate-800 font-mono text-[10px] font-bold p-2.5 rounded-lg overflow-x-auto whitespace-pre border border-slate-200 shadow-2xs">
                            {topicData.osDownloadPanels.macos.brewCommand}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={topicData.osDownloadPanels.macos.serverLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90 font-black text-[11px] shadow-2xs transition-all text-center"
                        >
                          <Download size={13} />
                          <span>Server DMG</span>
                          <ExternalLink size={11} />
                        </a>
                        <a
                          href={topicData.osDownloadPanels.macos.workbenchLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] shadow-xs transition-all text-center"
                        >
                          <Download size={13} />
                          <span>Workbench</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. STEP-BY-STEP SETUP GUIDE */}
              {topicData.setupGuide && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
                      <Laptop size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        Step-by-Step Installation & First Connection Walkthrough
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Follow these 5 steps to get MySQL Server and Workbench running locally
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {topicData.setupGuide.map((stepItem) => (
                      <div key={stepItem.step} className="space-y-2 border-l-2 border-slate-200/80 pl-4 relative">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                            {stepItem.step}
                          </span>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900">
                            {stepItem.title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-medium pl-8">
                          {stepItem.description}
                        </p>

                        {stepItem.code && (
                          <div className="ml-8 bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 relative group overflow-x-auto shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(stepItem.code, `step-${stepItem.step}`)}
                              className="absolute top-2.5 right-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                            >
                              {copiedSection === `step-${stepItem.step}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              <span className={copiedSection === `step-${stepItem.step}` ? "text-emerald-600 font-bold" : ""}>
                                {copiedSection === `step-${stepItem.step}` ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                            <div className="pt-1">
                              <HighlightedSql code={stepItem.code} />
                            </div>
                          </div>
                        )}

                        {stepItem.tip && (
                          <div className="ml-8 bg-amber-50/80 border border-amber-200/90 rounded-lg p-2.5 flex items-start space-x-2 text-[11px] text-amber-900 font-medium">
                            <Lightbulb size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Pro Tip: </strong>{stepItem.tip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. UNDER THE HOOD DATABASE ENGINE INTERNALS */}
              {topicData.underTheHood && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                      <Server size={15} />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        {topicData.underTheHood.title}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        What physically happens inside MySQL Engine, System Catalog, and Disk Storage
                      </p>
                    </div>
                  </div>

                  {topicData.underTheHood.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {topicData.underTheHood.summary}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {topicData.underTheHood.steps.map((st) => (
                      <div key={st.step} className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-2xs flex flex-col justify-between hover:border-blue-200 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {st.step}
                            </span>
                            <h3 className="text-xs font-black text-slate-900">
                              {st.title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium pl-7">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. VISUAL INFOGRAPHIC IMAGE SHOWCASE */}
              {topicData.infographicImage && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold">
                        <BookOpen size={15} />
                      </div>
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        {topicData.infographicTitle || 'Visual Architecture & Flow Diagram'}
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      Visual Guide
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-50">
                    <img
                      src={topicData.infographicImage}
                      alt={topicData.infographicTitle}
                      className="w-full h-auto object-contain max-h-[500px] mx-auto hover:scale-[1.01] transition-transform duration-300"
                    />
                  </div>

                  {topicData.infographicCaption && (
                    <p className="text-[11px] text-slate-500 font-medium italic pt-1 text-center sm:text-left">
                      {topicData.infographicCaption}
                    </p>
                  )}
                </div>
              )}

              {/* 10. TWO-COLUMN GRID: LEFT (SYNTAX, EXAMPLE, NOTE) & RIGHT (MISTAKES, KEY POINTS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                
                {/* LEFT COLUMN (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* (1) SYNTAX CARD */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                      <span>Syntax</span>
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 relative group overflow-x-auto shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(topicData.syntax, 'syntax')}
                        className="absolute top-3 right-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                      >
                        {copiedSection === 'syntax' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedSection === 'syntax' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <div className="pt-1">
                        <HighlightedSql code={topicData.syntax} />
                      </div>
                    </div>
                  </div>

                  {/* (2) EXAMPLE CARD */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                      <span>Example</span>
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 relative group overflow-x-auto shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(topicData.example, 'example')}
                        className="absolute top-3 right-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                      >
                        {copiedSection === 'example' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedSection === 'example' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <div className="pt-1">
                        <HighlightedSql code={topicData.example} />
                      </div>
                    </div>
                  </div>

                  {/* (3) ARCHITECTURAL NOTE */}
                  {topicData.note && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-start space-x-3 text-xs leading-relaxed text-slate-700">
                      <Lightbulb size={17} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-black text-slate-900 block text-xs">Architectural Note</span>
                        <p>{topicData.note}</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* RIGHT COLUMN (5 cols) */}
                <div className="lg:col-span-5 space-y-6">

                  {/* (1) COMMON BEGINNER MISTAKES */}
                  {topicData.mistakes && topicData.mistakes.length > 0 && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                      <div className="flex items-center space-x-2 text-rose-800 font-black text-sm">
                        <AlertTriangle size={17} className="text-rose-600" />
                        <span>Common Beginner Mistakes</span>
                      </div>

                      <div className="space-y-3">
                        {topicData.mistakes.map((m, idx) => (
                          <div key={idx} className="bg-rose-50/40 border border-rose-100 rounded-xl p-3.5 space-y-2">
                            <span className="text-xs font-black text-rose-900 block">
                              ✕ {m.title}
                            </span>
                            <div className="bg-white border border-rose-200/80 rounded-lg p-2 font-mono text-[11px] text-rose-700 whitespace-pre overflow-x-auto shadow-2xs">
                              {m.badCode}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                              {m.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* (2) KEY TAKEAWAYS */}
                  {topicData.keyPoints && topicData.keyPoints.length > 0 && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                      <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                        <CheckCircle2 size={17} className="text-emerald-600" />
                        <span>Key Takeaways</span>
                      </div>

                      <div className="space-y-2.5">
                        {topicData.keyPoints.map((kp, idx) => (
                          <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* (3) NEXT TOPIC PREVIEW CARD */}
                  {topicData.nextTopicId && (
                    <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center space-x-1.5 text-indigo-900 font-black text-xs uppercase tracking-wider">
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>Up Next</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900">
                          {topicData.nextTopicName}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          Continue along the structured learning path.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectTopic(topicData.nextTopicId, selectedModuleId)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>Next: {topicData.nextTopicName}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}

                </div>

              </div>

              {/* 11. BOTTOM ACTION BAR */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 pb-8">
                {topicData.prevTopicId ? (
                  <button
                    type="button"
                    onClick={() => handleSelectTopic(topicData.prevTopicId, selectedModuleId)}
                    className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-black shadow-2xs transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous: {topicData.prevTopicName}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleToggleRead(topicData.id)}
                    className={`inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer border ${
                      isCurrentTopicRead
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check size={14} className={isCurrentTopicRead ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>{isCurrentTopicRead ? 'Read' : 'Mark as Read'}</span>
                  </button>

                  {topicData.nextTopicId && (
                    <button
                      type="button"
                      onClick={() => handleSelectTopic(topicData.nextTopicId, selectedModuleId)}
                      className="inline-flex items-center space-x-1.5 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                    >
                      <span>Next Topic</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (<1024px)
         ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
          />

          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen size={16} className="text-blue-600" />
                <span className="font-black text-sm text-slate-900">Course Syllabus</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {CHAPTER_CATALOG.map((mod) => {
                const isExpanded = expandedModules[mod.id] !== false;
                const isAvailable = mod.status === 'available';
                const isSelected = selectedModuleId === mod.id;

                if (!isAvailable) {
                  return (
                    <div key={mod.id} className="pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedModuleId && setSelectedModuleId(mod.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border border-amber-200 text-amber-950 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
                            {mod.number}
                          </span>
                          <span className="truncate">{mod.shortTitle || mod.title}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100/90 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-extrabold tracking-wide shrink-0 shadow-2xs">
                          Coming Soon
                        </span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={mod.id} className="pb-2 mb-1 border-b border-slate-200/80 last:border-b-0 last:mb-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => {
                        toggleModule(mod.id);
                        setSelectedModuleId && setSelectedModuleId(mod.id);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-950 border border-indigo-200'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-700'
                        }`}>
                          {mod.number}
                        </span>
                        <span className="truncate">{mod.title}</span>
                      </div>

                      {isExpanded ? (
                        <ChevronUp size={15} className="text-indigo-600 shrink-0 ml-1.5" strokeWidth={2.2} />
                      ) : (
                        <ChevronRight size={15} className="text-slate-400 shrink-0 ml-1.5" strokeWidth={2.2} />
                      )}
                    </button>

                    {isExpanded && mod.topics && (
                      <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5 pt-1 pb-1">
                        {mod.topics.map((t) => {
                          const isTopicSelected = currentActiveTopicId === t.id && isAvailable;
                          const isCompleted = localCompletedTopics.includes(t.id);

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                handleSelectTopic(t.id, mod.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                isTopicSelected
                                  ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                {isCompleted ? (
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                ) : (
                                  <span className="text-slate-400 shrink-0">•</span>
                                )}
                                <span className="truncate">{t.title}</span>
                              </div>
                              {isCompleted && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm shrink-0">Done</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
