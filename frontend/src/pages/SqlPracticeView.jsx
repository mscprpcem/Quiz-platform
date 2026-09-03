import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database, Play, CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  RotateCcw, Sparkles, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft,
  BookOpen, Code2, Trophy, ListOrdered, Table, Layers, Clock, Eye,
  HelpCircle, Copy, Check, Terminal, Search, Filter, ShieldCheck, CheckSquare,
  ArrowUpRight, Flame, BarChart3, RefreshCw, X, GripVertical, GripHorizontal,
  Send, FileText, CheckCircle, Settings, Sliders, AlignLeft, EyeOff, LayoutGrid,
  Columns, GitCompare, CheckCheck, CircleAlert, Monitor, Smartphone, Tablet, Target
} from 'lucide-react';
import { SQL_CHALLENGES } from '../data/sqlChallenges';
import { executeSqlQuery, validateChallengeWithTestcases, getTablesPreview } from '../services/sqlEngine';

/**
 * Clean & Short Category Name Helper
 * Strips leading numbering (e.g., "1. Basic Filtering" -> "Filtering & Sorting")
 */
function getCleanCategoryName(title) {
  if (!title) return 'General';
  const cleaned = title.replace(/^(\d+\.|\d+\)|\bModule\s*\d+:?)\s*/i, '').trim();
  
  if (cleaned.toLowerCase().includes('filtering') || cleaned.toLowerCase().includes('sorting')) {
    return 'Filtering & Sorting';
  }
  if (cleaned.toLowerCase().includes('join')) {
    return 'JOIN Operations';
  }
  if (cleaned.toLowerCase().includes('aggregate') || cleaned.toLowerCase().includes('group')) {
    return 'Aggregations';
  }
  if (cleaned.toLowerCase().includes('subquer') || cleaned.toLowerCase().includes('cte')) {
    return 'Subqueries & CTEs';
  }
  if (cleaned.toLowerCase().includes('window')) {
    return 'Window Functions';
  }
  if (cleaned.toLowerCase().includes('database') || cleaned.toLowerCase().includes('drop db') || cleaned.toLowerCase().includes('create db')) {
    return 'Database Lifecycle';
  }
  if (cleaned.toLowerCase().includes('ddl') || cleaned.toLowerCase().includes('data definition')) {
    return 'DDL Operations';
  }
  if (cleaned.toLowerCase().includes('dml') || cleaned.toLowerCase().includes('manipulation')) {
    return 'DML Operations';
  }
  if (cleaned.toLowerCase().includes('index') || cleaned.toLowerCase().includes('optimi')) {
    return 'Optimization';
  }
  if (cleaned.toLowerCase().includes('interview') || cleaned.toLowerCase().includes('leetcode') || cleaned.toLowerCase().includes('faang')) {
    return 'Interview Challenges';
  }
  if (cleaned.toLowerCase().startsWith('section ')) {
    return cleaned.replace(/^section\s+[a-z]:\s*/i, '');
  }
  return cleaned;
}

/**
 * SQL Formatter Utility
 * Formats SQL keywords to uppercase with proper spacing
 */
function formatSql(sql) {
  if (!sql) return '';
  
  const keywords = [
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
    'INSERT INTO', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
    'UNION ALL', 'GROUP BY', 'ORDER BY', 'PARTITION BY', 'PRIMARY KEY', 'FOREIGN KEY',
    'NOT NULL', 'IS NOT NULL', 'IS NULL',
    'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'JOIN', 'ON',
    'HAVING', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'UNION', 'CASE', 'WHEN', 'THEN',
    'ELSE', 'END', 'OVER', 'VALUES', 'UPDATE', 'SET', 'REFERENCES', 'UNIQUE',
    'DEFAULT', 'AS', 'IN', 'BETWEEN', 'LIKE', 'EXISTS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
  ];

  let formatted = sql;
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  });

  return formatted;
}

/**
 * Generates an empty scaffold starter SQL so users write the query themselves
 */
function getCleanStarterSql(challenge = null) {
  if (challenge?.tags?.includes('CREATE DATABASE') || challenge?.tags?.includes('DROP DATABASE') || challenge?.id?.startsWith('ddl-')) {
    return `-- Write your DDL statement below\n`;
  }
  return `-- Write your SQL solution below\nSELECT \n\n`;
}

/**
 * Rock-Solid Cross-Browser Pixel-Perfect Toggle Switch
 */
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      aria-label={label}
      style={{
        width: '44px',
        height: '24px',
        minWidth: '44px',
        minHeight: '24px',
        maxWidth: '44px',
        maxHeight: '24px',
        borderRadius: '9999px',
        padding: '2px',
        backgroundColor: checked ? '#2563eb' : '#cbd5e1',
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        boxSizing: 'border-box'
      }}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          minWidth: '20px',
          minHeight: '20px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'block',
          flexShrink: 0
        }}
      />
    </button>
  );
}

/**
 * Inline Markdown Tokenizer & Formatter
 * Eliminates stray ** and renders code/bold tags properly
 */
function parseInline(text) {
  if (!text) return null;

  const parts = [];
  const regex = /(\*\*(?:`[^`]+`|[^*]+)\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index).replace(/\*\*/g, '');
      parts.push(plain);
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      if (inner.startsWith('`') && inner.endsWith('`')) {
        parts.push(
          <code key={match.index} className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded mx-0.5">
            {inner.slice(1, -1)}
          </code>
        );
      } else {
        parts.push(
          <strong key={match.index} className="font-bold text-slate-900 bg-slate-100/90 px-1 py-0.5 rounded text-inherit">
            {inner}
          </strong>
        );
      }
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded mx-0.5">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).replace(/\*\*/g, '');
    parts.push(remaining);
  }
  return parts;
}

/**
 * Rich Markdown Component
 * Accurately parses tables, horizontal dividers, bullet lists, and section callouts.
 */
function RichMarkdown({ content, className = '' }) {
  if (!content) return null;

  const rawLines = content.trim().split('\n');
  const blocks = [];
  let currentTable = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Markdown table detection
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!currentTable) {
        currentTable = [];
      }
      currentTable.push(line);
      continue;
    } else if (currentTable) {
      blocks.push({ type: 'table', lines: currentTable });
      currentTable = null;
    }

    if (!line) {
      continue;
    }

    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ type: 'divider' });
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      blocks.push({ type: 'bullet', text: line.slice(2) });
    } else if (
      line.startsWith('Example ') ||
      line.startsWith('**Example') ||
      line.startsWith('Input:') ||
      line.startsWith('Output:') ||
      line.startsWith('Explanation:')
    ) {
      blocks.push({ type: 'header_para', text: line });
    } else {
      blocks.push({ type: 'para', text: line });
    }
  }

  if (currentTable) {
    blocks.push({ type: 'table', lines: currentTable });
  }

  return (
    <div className={`space-y-3 text-slate-700 leading-relaxed text-xs sm:text-[13px] ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'divider') {
          return <hr key={idx} className="border-slate-200/80 my-4" />;
        }

        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2">
              <span className="text-blue-600 font-black mt-0.5 text-xs">•</span>
              <span className="flex-1">{parseInline(block.text)}</span>
            </div>
          );
        }

        if (block.type === 'header_para') {
          return (
            <div key={idx} className="font-extrabold text-slate-900 pt-2 text-xs sm:text-[13px]">
              {parseInline(block.text)}
            </div>
          );
        }

        if (block.type === 'table') {
          const rows = block.lines
            .map(l => l.split('|').map(c => c.trim()).filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1))
            .filter(r => r.length > 0 && !r.every(c => /^:?-+:?$/.test(c)));

          if (rows.length === 0) return null;
          const headerRow = rows[0];
          const bodyRows = rows.slice(1);

          return (
            <div key={idx} className="my-3 overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 font-black text-slate-800">
                  <tr>
                    {headerRow.map((h, i) => (
                      <th key={i} className="px-3.5 py-2.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                        {parseInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap text-xs font-medium">
                          {parseInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={idx}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

export default function SqlPracticeView({
  onJumpToLearn,
  initialChallengeIndex = null
}) {
  // View mode: 'solve' (Dedicated LeetCode solve workspace with Problems drawer)
  const [viewMode, setViewMode] = useState('solve');
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState(() => (initialChallengeIndex !== null && initialChallengeIndex >= 0 ? initialChallengeIndex : 0));

  // Filters for Problemset List
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'solved' | 'unsolved'

  // LeetCode Resizable Splitter State (for Desktop viewports >= 1024px)
  const [leftWidthPercent, setLeftWidthPercent] = useState(46); // Default 46% left pane, 54% right pane
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const containerRef = useRef(null);

  // Vertical Resizer for Code Editor vs Output Console
  const [editorHeightPercent, setEditorHeightPercent] = useState(54); // Default 54% editor, 46% console
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const rightPaneRef = useRef(null);

  // Mobile / Tablet Active View Pane (< 1024px)
  // 'problem' | 'editor' | 'console'
  const [mobileActivePane, setMobileActivePane] = useState('problem');

  // Quick Problem List Drawer in Solve Workspace
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerDifficulty, setDrawerDifficulty] = useState('all');
  const [drawerTrack, setDrawerTrack] = useState('all'); // 'all' | 'ddl' | 'core'
  const [drawerDdlFilter, setDrawerDdlFilter] = useState('all'); // 'all' | 'create' | 'use' | 'alter' | 'rename' | 'truncate' | 'drop'

  // Sync initialChallengeIndex from parent prop
  useEffect(() => {
    if (initialChallengeIndex !== null && initialChallengeIndex >= 0 && initialChallengeIndex < SQL_CHALLENGES.length) {
      setSelectedChallengeIndex(initialChallengeIndex);
      setViewMode('solve');
    }
  }, [initialChallengeIndex]);

  // Settings Modal & Preferences with Tabbed Interface
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('practice'); // 'practice' | 'editor' | 'engine'
  const [resetConfirm, setResetConfirm] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('msc_sql_practice_settings');
      return saved ? JSON.parse(saved) : {
        schemaOnlyMode: false, // Hide sample data rows, show only table structure
        hideHints: false,       // Hide problem hints
        fontSize: '13',         // 12, 13, 14, 16
        autoUppercase: true     // Auto format keywords
      };
    } catch {
      return { schemaOnlyMode: false, hideHints: false, fontSize: '13', autoUppercase: true };
    }
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('msc_sql_practice_settings', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Solve Workspace tabs
  const [solveTab, setSolveTab] = useState('description'); // 'description' | 'schema' | 'hints'
  const [schemaViewTab, setSchemaViewTab] = useState(() => (settings.schemaOnlyMode ? 'structure' : 'data'));
  const [copiedCode, setCopiedCode] = useState(false);

  // Console Execution State
  // mode: 'idle' | 'run' | 'submit'
  const [consoleMode, setConsoleMode] = useState('idle');
  const [activeConsoleSubTab, setActiveConsoleSubTab] = useState('your_output'); // 'your_output' | 'expected_output'
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0); // 0 or 1 for Submit test cases

  const [rawExecutionResult, setRawExecutionResult] = useState(null); // Result from "Run"
  const [rawExpectedResult, setRawExpectedResult] = useState(null);   // Expected from "Run"
  const [submissionResult, setSubmissionResult] = useState(null);     // Result from "Submit" (Testcases)
  const [runningAction, setRunningAction] = useState(false);          // Spinner indicator

  // Solved challenges stored in localStorage
  const [solvedChallenges, setSolvedChallenges] = useState(() => {
    try {
      const saved = localStorage.getItem('msc_sql_solved_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Extract unique short category names from challenges
  const categories = useMemo(() => {
    const set = new Set();
    SQL_CHALLENGES.forEach((c) => {
      const clean = getCleanCategoryName(c.moduleTitle);
      if (clean) set.add(clean);
    });
    return Array.from(set);
  }, []);

  const activeChallenge = SQL_CHALLENGES[selectedChallengeIndex] || SQL_CHALLENGES[0];

  // User query state (Start with clean blank scaffold rather than giving the solution away)
  const [userSql, setUserSql] = useState(() => getCleanStarterSql(activeChallenge));
  const [tableSchemas, setTableSchemas] = useState([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  // Sync starter scaffold & schemas when active challenge changes
  useEffect(() => {
    if (!activeChallenge) return;
    setUserSql(getCleanStarterSql(activeChallenge));
    setConsoleMode('idle');
    setRawExecutionResult(null);
    setRawExpectedResult(null);
    setSubmissionResult(null);

    let isMounted = true;
    setLoadingSchemas(true);
    getTablesPreview(activeChallenge.setupSql)
      .then((tables) => {
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

    return () => {
      isMounted = false;
    };
  }, [selectedChallengeIndex, activeChallenge]);

  // Handle Horizontal Splitter Dragging (Left vs Right Panes on Desktop)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingHorizontal || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPercent >= 25 && newPercent <= 75) {
        setLeftWidthPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
    };

    if (isDraggingHorizontal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal]);

  // Handle Vertical Splitter Dragging (Code Editor vs Console on Desktop)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingVertical || !rightPaneRef.current) return;
      const rect = rightPaneRef.current.getBoundingClientRect();
      const newPercent = ((e.clientY - rect.top) / rect.height) * 100;
      if (newPercent >= 25 && newPercent <= 80) {
        setEditorHeightPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingVertical(false);
    };

    if (isDraggingVertical) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVertical]);

  const handleOpenChallenge = (index) => {
    setSelectedChallengeIndex(index);
    setShowDrawer(false);
    // On mobile, start on the problem description
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileActivePane('problem');
    }
  };

  // Format code action
  const handleFormatCode = () => {
    setUserSql(prev => formatSql(prev));
  };

  // Reset code action
  const handleResetCode = () => {
    setUserSql(getCleanStarterSql(activeChallenge));
  };

  // 1. RUN QUERY (Instant raw execution on current SQLite DB)
  const handleRunQuery = async () => {
    if (runningAction || !activeChallenge) return;
    setRunningAction(true);
    setConsoleMode('run');
    setActiveConsoleSubTab('your_output');

    // On mobile / tablet, auto-switch to console tab so user sees output immediately
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileActivePane('console');
    }

    try {
      const userRes = await executeSqlQuery(activeChallenge.setupSql, userSql);
      setRawExecutionResult(userRes);

      if (activeChallenge.expectedSql) {
        const expRes = await executeSqlQuery(activeChallenge.setupSql, activeChallenge.expectedSql);
        setRawExpectedResult(expRes);
      } else {
        setRawExpectedResult(null);
      }
    } catch (err) {
      setRawExecutionResult({
        success: false,
        columns: [],
        values: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: err.message || 'Error executing query.'
      });
    } finally {
      setRunningAction(false);
    }
  };

  // 2. SUBMIT SOLUTION (Multi-dataset test cases validation)
  const handleSubmitSolution = async () => {
    if (runningAction || !activeChallenge) return;
    setRunningAction(true);
    setConsoleMode('submit');
    setActiveTestCaseIndex(0);

    // On mobile / tablet, auto-switch to console tab so user sees output immediately
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileActivePane('console');
    }

    try {
      const result = await validateChallengeWithTestcases(activeChallenge, userSql);
      setSubmissionResult(result);

      if (result.passed && !solvedChallenges.includes(activeChallenge.id)) {
        const updated = [...solvedChallenges, activeChallenge.id];
        setSolvedChallenges(updated);
        try {
          localStorage.setItem('msc_sql_solved_challenges', JSON.stringify(updated));
        } catch (_) {}
      }
    } catch (err) {
      setSubmissionResult({
        passed: false,
        totalCases: 1,
        passedCases: 0,
        message: err.message || 'Error evaluating test cases.',
        testcases: [
          {
            caseIndex: 1,
            name: 'Case 1: Primary Dataset',
            passed: false,
            userResult: { success: false, columns: [], values: [], rowCount: 0, executionTimeMs: 0, error: err.message },
            expectedResult: null,
            missingInUserIndices: [],
            extraInUserIndices: [],
            message: err.message
          }
        ]
      });
    } finally {
      setRunningAction(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userSql);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isCurrentSolved = solvedChallenges.includes(activeChallenge?.id);
  const totalCount = SQL_CHALLENGES.length;

  // Filtered drawer challenges
  const drawerChallenges = useMemo(() => {
    return SQL_CHALLENGES.map((c, i) => ({ ...c, originalIndex: i })).filter((c) => {
      if (drawerTrack === 'ddl') {
        if (!c.id.startsWith('ddl-')) return false;
        if (drawerDdlFilter !== 'all') {
          const matchString = (c.title + ' ' + (c.tags || []).join(' ') + ' ' + (c.moduleTitle || '')).toLowerCase();
          if (drawerDdlFilter === 'create' && !matchString.includes('create')) return false;
          if (drawerDdlFilter === 'use' && !matchString.includes('use')) return false;
          if (drawerDdlFilter === 'alter' && !matchString.includes('alter') && !matchString.includes('add') && !matchString.includes('modify')) return false;
          if (drawerDdlFilter === 'rename' && !matchString.includes('rename')) return false;
          if (drawerDdlFilter === 'truncate' && !matchString.includes('truncate')) return false;
          if (drawerDdlFilter === 'drop' && !matchString.includes('drop')) return false;
        }
      }
      if (drawerTrack === 'core' && c.id.startsWith('ddl-')) {
        return false;
      }
      if (drawerDifficulty !== 'all' && c.difficulty?.toLowerCase() !== drawerDifficulty.toLowerCase()) {
        return false;
      }
      if (drawerSearch.trim()) {
        const q = drawerSearch.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.moduleTitle?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [drawerSearch, drawerDifficulty, drawerTrack, drawerDdlFilter]);

  return (
    <div
      style={{ height: 'calc(100vh - 63px)', overflow: 'hidden' }}
      className="w-full flex flex-col font-segoe text-slate-800 bg-slate-50/40 relative"
    >
      {/* =========================================================================
          TOP LEETCODE WORKSPACE NAVIGATION BAR (RESPONSIVE FOR ALL SCREENS)
         ========================================================================= */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 shadow-2xs z-20 gap-2">
        
        {/* Left Group: Problems Drawer Button & Prev/Next & Title */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          
          {/* Quick Problem List Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-100/90 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs active:scale-95 shrink-0"
            title="Open Problem Selector Drawer"
          >
            <LayoutGrid size={14} className="text-blue-600 shrink-0" />
            <span className="font-extrabold text-slate-800 hidden xs:inline">Problems</span>
            <span className="font-mono text-[10px] sm:text-[11px] bg-white px-1.5 py-0.5 rounded-md border border-slate-200/80 text-slate-600 font-bold">
              {selectedChallengeIndex + 1}/{totalCount}
            </span>
            <ChevronRight size={12} className="text-slate-400 rotate-90 shrink-0" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0 hidden sm:block" />

          {/* Quick Prev / Next problem navigation */}
          <div className="flex items-center space-x-0.5 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              disabled={selectedChallengeIndex === 0}
              onClick={() => setSelectedChallengeIndex((prev) => Math.max(0, prev - 1))}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              title="Previous Problem"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={selectedChallengeIndex === SQL_CHALLENGES.length - 1}
              onClick={() => setSelectedChallengeIndex((prev) => Math.min(SQL_CHALLENGES.length - 1, prev + 1))}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              title="Next Problem"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Title & Metadata */}
          <div className="flex items-center space-x-2 min-w-0 truncate pl-0.5">
            <span className="font-mono text-xs font-black text-slate-400 shrink-0 hidden sm:inline">
              #{selectedChallengeIndex + 1}.
            </span>
            <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
              {activeChallenge?.title}
            </span>
            <span
              className={`text-[11px] sm:text-xs font-bold capitalize shrink-0 ${
                activeChallenge?.difficulty?.toLowerCase() === 'easy'
                  ? 'text-emerald-600'
                  : activeChallenge?.difficulty?.toLowerCase() === 'medium'
                  ? 'text-amber-500'
                  : 'text-rose-600'
              }`}
            >
              {activeChallenge?.difficulty}
            </span>
            {isCurrentSolved && (
              <span className="text-xs font-bold text-emerald-600 hidden md:flex items-center gap-0.5 shrink-0">
                <Check size={12} strokeWidth={3} /> Solved
              </span>
            )}
          </div>
        </div>

        {/* Right Group: Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          
          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Practice Settings (Schema-only, Hide hints)"
          >
            <Settings size={14} />
          </button>

          {/* Format Code */}
          <button
            type="button"
            onClick={handleFormatCode}
            className="px-2 sm:px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
            title="Format SQL query"
          >
            <AlignLeft size={12} />
            <span className="hidden md:inline">Format</span>
          </button>

          {/* Reset Code */}
          <button
            type="button"
            onClick={handleResetCode}
            className="px-2 sm:px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
            title="Reset to blank template"
          >
            <RotateCcw size={12} />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-2 sm:px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
            title="Copy SQL code"
          >
            {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span className="hidden lg:inline">{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>

          {/* RUN QUERY BUTTON */}
          <button
            type="button"
            onClick={handleRunQuery}
            disabled={runningAction}
            className="px-2.5 sm:px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center space-x-1 sm:space-x-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Play size={12} className="fill-slate-800" />
            <span>Run</span>
          </button>

          {/* SUBMIT SOLUTION BUTTON */}
          <button
            type="button"
            onClick={handleSubmitSolution}
            disabled={runningAction}
            className="px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg flex items-center space-x-1 sm:space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send size={12} />
            <span className="hidden sm:inline">{runningAction && consoleMode === 'submit' ? 'Running...' : 'Submit'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE & TABLET PANE SWITCHER (< 1024px)
         ========================================================================= */}
      <div className="lg:hidden flex items-center justify-around bg-slate-100/90 border-b border-slate-200 p-1 shrink-0 text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setMobileActivePane('problem')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            mobileActivePane === 'problem'
              ? 'bg-white text-blue-700 shadow-2xs font-extrabold border border-slate-200/80'
              : 'hover:bg-slate-200/60 text-slate-600'
          }`}
        >
          <FileText size={13} />
          <span>Problem</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActivePane('editor')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            mobileActivePane === 'editor'
              ? 'bg-white text-blue-700 shadow-2xs font-extrabold border border-slate-200/80'
              : 'hover:bg-slate-200/60 text-slate-600'
          }`}
        >
          <Terminal size={13} />
          <span>Code Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActivePane('console')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            mobileActivePane === 'console'
              ? 'bg-white text-blue-700 shadow-2xs font-extrabold border border-slate-200/80'
              : 'hover:bg-slate-200/60 text-slate-600'
          }`}
        >
          <Sparkles size={13} />
          <span>Output / Testcases</span>
          {consoleMode !== 'idle' && (
            <span
              className={`w-2 h-2 rounded-full ${
                submissionResult ? (submissionResult.passed ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-blue-500'
              }`}
            />
          )}
        </button>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE BODY
          - Desktop (>=1024px): 2-pane resizable split view
          - Mobile / Tablet (<1024px): Full-width tabbed view based on mobileActivePane
         ========================================================================= */}
      <div
        ref={containerRef}
        style={{
          userSelect: isDraggingHorizontal || isDraggingVertical ? 'none' : 'auto'
        }}
        className="flex-1 flex w-full overflow-hidden relative"
      >
        
        {/* ── LEFT PANE: Problem Statement & Schema (Independently Scrollable) ── */}
        <div
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidthPercent}%` : '100%' }}
          className={`h-full flex-col bg-white border-r border-slate-200 overflow-hidden shrink-0 ${
            typeof window !== 'undefined' && window.innerWidth < 1024
              ? mobileActivePane === 'problem' ? 'flex w-full' : 'hidden'
              : 'flex'
          }`}
        >
          {/* Problem Tabs Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1 flex items-center space-x-1 shrink-0 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setSolveTab('description')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                solveTab === 'description'
                  ? 'bg-white text-blue-700 font-black shadow-2xs border border-slate-200/80'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <FileText size={13} />
              <span>Description</span>
            </button>

            <button
              type="button"
              onClick={() => setSolveTab('schema')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                solveTab === 'schema'
                  ? 'bg-white text-blue-700 font-black shadow-2xs border border-slate-200/80'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Database size={13} />
              <span>{settings.schemaOnlyMode ? 'Table Schema' : 'Database Tables'}</span>
            </button>

            {!settings.hideHints && activeChallenge?.hints && activeChallenge.hints.length > 0 && (
              <button
                type="button"
                onClick={() => setSolveTab('hints')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  solveTab === 'hints'
                    ? 'bg-white text-amber-700 font-black shadow-2xs border border-slate-200/80'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Lightbulb size={13} className="text-amber-500" />
                <span>Hints</span>
              </button>
            )}
          </div>

          {/* Left Pane Body (Independently Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            
            {solveTab === 'description' && (
              <div className="space-y-4">
                {/* Header Title & Badges */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {selectedChallengeIndex + 1}. {activeChallenge?.title?.replace(/:\s*(CREATE|DROP|ALTER|TRUNCATE|RENAME)\b.*/i, '').trim()}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-bold capitalize ${
                        activeChallenge?.difficulty?.toLowerCase() === 'easy'
                          ? 'text-emerald-600'
                          : activeChallenge?.difficulty?.toLowerCase() === 'medium'
                          ? 'text-amber-500'
                          : 'text-rose-600'
                      }`}
                    >
                      {activeChallenge?.difficulty}
                    </span>
                    <span>•</span>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      {getCleanCategoryName(activeChallenge?.moduleTitle)}
                    </span>
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      SQL
                    </span>
                  </div>
                </div>

                {/* Rich Formatted Problem Description */}
                <RichMarkdown content={activeChallenge?.description} />
              </div>
            )}

            {solveTab === 'schema' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider">
                    <Database size={14} className="text-blue-600" />
                    <span>{settings.schemaOnlyMode ? 'Table Columns & Types (Schema Only)' : 'Database Schemas & Data'}</span>
                  </div>

                  {!settings.schemaOnlyMode && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSchemaViewTab('data')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          schemaViewTab === 'data' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Sample Records
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchemaViewTab('structure')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          schemaViewTab === 'structure' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Columns & Types
                      </button>
                    </div>
                  )}
                </div>

                {loadingSchemas ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading database tables...</div>
                ) : tableSchemas.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">No tables defined for this challenge.</div>
                ) : (
                  <div className="space-y-4">
                    {tableSchemas.map((tbl, tIdx) => {
                      const tableName = tbl.tableName || tbl.name || `Table ${tIdx + 1}`;
                      const columnObjects = Array.isArray(tbl.columns) ? tbl.columns : [];
                      const dataRows = tbl.sampleRows || tbl.rows || tbl.values || [];

                      return (
                        <div key={tIdx} className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-mono font-black text-blue-900 flex items-center space-x-1.5">
                              <Table size={13} className="text-blue-600" />
                              <span>Table: {tableName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {columnObjects.length} columns {settings.schemaOnlyMode ? '' : `• ${dataRows.length} rows`}
                            </span>
                          </div>

                          {(settings.schemaOnlyMode || schemaViewTab === 'structure') ? (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                <thead className="bg-slate-50 font-black text-slate-700 text-[11px]">
                                  <tr>
                                    <th className="px-3 py-1.5">Column Name</th>
                                    <th className="px-3 py-1.5">Data Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                                  {columnObjects.map((c, cIdx) => (
                                    <tr key={cIdx} className="hover:bg-slate-50/70">
                                      <td className="px-3 py-1.5 font-bold text-slate-900">{typeof c === 'object' ? (c.name || c.column_name) : c}</td>
                                      <td className="px-3 py-1.5 text-blue-600 font-bold">{typeof c === 'object' ? (c.type || 'TEXT') : 'TEXT'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                <thead className="bg-slate-50 font-black text-slate-700 text-[11px]">
                                  <tr>
                                    <th className="px-2.5 py-1 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                                    {columnObjects.map((c, cIdx) => (
                                      <th key={cIdx} className="px-2.5 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                        {typeof c === 'object' ? (c.name || c.column_name) : c}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-slate-700 text-xs">
                                  {dataRows.map((r, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/70">
                                      <td className="px-2.5 py-1.5 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                      {Array.isArray(r) ? (
                                        r.map((val, vIdx) => (
                                          <td key={vIdx} className="px-2.5 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-medium">
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!settings.hideHints && solveTab === 'hints' && (
              <div className="space-y-3">
                <div className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span>Challenge Hints</span>
                </div>
                {activeChallenge?.hints?.map((h, i) => (
                  <div key={i} className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-950 font-medium flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 leading-relaxed">{parseInline(h)}</div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── DESKTOP DRAGGABLE VERTICAL DIVIDER LINE (>=1024px) ── */}
        <div
          onMouseDown={() => setIsDraggingHorizontal(true)}
          className="hidden lg:flex w-1.5 hover:w-2 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize select-none transition-colors relative items-center justify-center shrink-0 z-30 group"
          title="Drag to resize panel widths"
        >
          <div className="w-1 h-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
        </div>

        {/* ── RIGHT PANE: Code Editor & Console ── */}
        <div
          ref={rightPaneRef}
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - leftWidthPercent}%` : '100%' }}
          className={`h-full flex-col bg-white overflow-hidden shrink-0 ${
            typeof window !== 'undefined' && window.innerWidth < 1024
              ? mobileActivePane !== 'problem' ? 'flex w-full' : 'hidden'
              : 'flex'
          }`}
        >
          
          {/* (1) TOP SUB-PANE: SQL SOLUTION CODE EDITOR */}
          <div
            style={{
              height: typeof window !== 'undefined' && window.innerWidth < 1024
                ? mobileActivePane === 'editor' ? '100%' : '0%'
                : `${editorHeightPercent}%`
            }}
            className={`flex-col bg-white overflow-hidden shrink-0 ${
              typeof window !== 'undefined' && window.innerWidth < 1024 && mobileActivePane !== 'editor' ? 'hidden' : 'flex'
            }`}
          >
            {/* Editor Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-1.5 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <Terminal size={13} className="text-slate-500" />
                <span className="font-mono text-xs font-black text-slate-800">SQL Solution Editor</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleFormatCode}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Format SQL
                </button>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-mono text-slate-400">Ctrl+Enter to Run</span>
              </div>
            </div>

            {/* Editor Textarea with Line Numbers effect */}
            <div className="flex-1 relative overflow-hidden bg-white">
              <textarea
                value={userSql}
                onChange={(e) => setUserSql(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleRunQuery();
                  }
                }}
                style={{ fontSize: `${settings.fontSize || '13'}px` }}
                className="w-full h-full p-4 font-mono text-slate-900 bg-white focus:outline-none focus:ring-0 leading-relaxed font-semibold resize-none overflow-y-auto"
                placeholder="-- Write your SQL query here... e.g. SELECT * FROM table_name;"
                spellCheck="false"
              />
            </div>
          </div>

          {/* (2) DESKTOP DRAGGABLE HORIZONTAL DIVIDER LINE (>=1024px) */}
          <div
            onMouseDown={() => setIsDraggingVertical(true)}
            className="hidden lg:flex h-1.5 hover:h-2 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-row-resize select-none transition-colors relative items-center justify-center shrink-0 z-20 group"
            title="Drag to resize editor vs console"
          >
            <div className="h-1 w-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
          </div>

          {/* (3) BOTTOM SUB-PANE: OUTPUT & TESTCASE CONSOLE */}
          <div
            style={{
              height: typeof window !== 'undefined' && window.innerWidth < 1024
                ? mobileActivePane === 'console' ? '100%' : '0%'
                : `${100 - editorHeightPercent}%`
            }}
            className={`flex-col bg-white overflow-hidden shrink-0 ${
              typeof window !== 'undefined' && window.innerWidth < 1024 && mobileActivePane !== 'console' ? 'hidden' : 'flex'
            }`}
          >
            {/* Console Header Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1 flex items-center justify-between shrink-0 text-xs font-bold">
              <div className="flex items-center space-x-1">
                {/* RUN MODE TABS */}
                {consoleMode === 'run' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveConsoleSubTab('your_output')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        activeConsoleSubTab === 'your_output'
                          ? 'bg-white text-blue-700 shadow-2xs font-black border border-slate-200/80'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>Your Output</span>
                    </button>
                    {rawExpectedResult && (
                      <button
                        type="button"
                        onClick={() => setActiveConsoleSubTab('expected_output')}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          activeConsoleSubTab === 'expected_output'
                            ? 'bg-white text-blue-700 shadow-2xs font-black border border-slate-200/80'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>Expected Output</span>
                      </button>
                    )}
                  </>
                )}

                {/* SUBMIT MODE TABS (Testcases) */}
                {consoleMode === 'submit' && submissionResult && (
                  <>
                    {submissionResult.testcases.map((tc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTestCaseIndex(idx)}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                          activeTestCaseIndex === idx
                            ? 'bg-white text-blue-700 shadow-2xs font-black border border-slate-200/80'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>Case {idx + 1}</span>
                        {tc.passed ? (
                          <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={2.5} />
                        ) : (
                          <XCircle size={13} className="text-rose-500" strokeWidth={2.5} />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {consoleMode === 'idle' && (
                  <span className="text-slate-500 text-[11px] font-bold">Console Results</span>
                )}
              </div>

              {/* Execution Metrics Pill */}
              {consoleMode === 'run' && rawExecutionResult && (
                <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                  {rawExecutionResult.rowCount} row(s) • {rawExecutionResult.executionTimeMs} ms
                </span>
              )}
              {consoleMode === 'submit' && submissionResult && (
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                    submissionResult.passed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {submissionResult.passed ? 'Accepted' : 'Wrong Answer'} ({submissionResult.passedCases}/{submissionResult.totalCases})
                </span>
              )}
            </div>

            {/* Console Body Area (Independently Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              
              {/* RUN RESULTS VIEW */}
              {consoleMode === 'run' && rawExecutionResult && (
                <div className="space-y-3">
                  {/* Error Alert */}
                  {rawExecutionResult.error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2">
                      <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <div>
                        <div className="font-black">SQL Syntax / Runtime Error:</div>
                        <div className="text-[11.5px] font-mono mt-0.5">{rawExecutionResult.error}</div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1: Your Output */}
                  {activeConsoleSubTab === 'your_output' && rawExecutionResult.success && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Your Query Result:</span>
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">{rawExecutionResult.rowCount} rows</span>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                          <thead className="bg-slate-50 font-black text-slate-800">
                            <tr>
                              <th className="px-2.5 py-1.5 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                              {(rawExecutionResult.columns || []).map((col, idx) => (
                                <th key={idx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            {(rawExecutionResult.values || []).map((row, rIdx) => (
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
                    </div>
                  )}

                  {/* Tab 2: Expected Output */}
                  {activeConsoleSubTab === 'expected_output' && rawExpectedResult?.success && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Expected Output (Canonical Solution):</span>
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">{rawExpectedResult.rowCount} rows</span>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                          <thead className="bg-slate-50 font-black text-slate-800">
                            <tr>
                              <th className="px-2.5 py-1.5 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                              {(rawExpectedResult.columns || []).map((col, idx) => (
                                <th key={idx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                            {(rawExpectedResult.values || []).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/70">
                                <td className="px-2.5 py-1.5 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                {Array.isArray(row) ? (
                                  row.map((val, cIdx) => (
                                    <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-medium text-emerald-800">
                                      {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                    </td>
                                  ))
                                ) : (
                                  <td className="px-3 py-1.5 text-emerald-800">{String(row)}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUBMIT RESULTS VIEW (TESTCASES & RED HIGHLIGHTING) */}
              {consoleMode === 'submit' && submissionResult && (
                <div className="space-y-4">
                  {(() => {
                    const activeCase = submissionResult.testcases[activeTestCaseIndex] || submissionResult.testcases[0];
                    if (!activeCase) return null;

                    const userRes = activeCase.userResult;
                    const expRes = activeCase.expectedResult;
                    const missingIndices = activeCase.missingInUserIndices || [];
                    const extraIndices = activeCase.extraInUserIndices || [];

                    return (
                      <div className="space-y-3">
                        {/* Pass / Fail Banner */}
                        <div
                          className={`p-3 rounded-xl border flex items-start space-x-2 text-xs font-semibold ${
                            activeCase.passed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : userRes?.error
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-rose-50/90 text-rose-900 border-rose-200'
                          }`}
                        >
                          {activeCase.passed ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          ) : (
                            <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          )}
                          <div className="flex-1">
                            <div className="font-black text-xs mb-0.5">
                              {activeCase.passed
                                ? `Test Case ${activeCase.caseIndex}: Accepted`
                                : userRes?.error
                                ? `Test Case ${activeCase.caseIndex}: Execution Error`
                                : `Test Case ${activeCase.caseIndex}: Wrong Answer`}
                            </div>
                            <div className="text-[11.5px] leading-relaxed">
                              {activeCase.message}
                            </div>
                          </div>
                        </div>

                        {/* Side-by-Side Comparison Tables with Red Highlight on discrepancies */}
                        {userRes?.success && expRes?.success && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            
                            {/* User Output Column */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-black text-slate-700">
                                <span>Your Output:</span>
                                <span className="text-[10px] font-mono text-slate-400">{userRes.rowCount} row(s)</span>
                              </div>
                              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs max-h-60">
                                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                  <thead className="bg-slate-50 font-black text-slate-800">
                                    <tr>
                                      <th className="px-2 py-1 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                                      {(userRes.columns || []).map((col, cIdx) => (
                                        <th key={cIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                    {(userRes.values || []).map((row, rIdx) => {
                                      const isExtra = extraIndices.includes(rIdx);
                                      return (
                                        <tr
                                          key={rIdx}
                                          className={isExtra ? 'bg-rose-50 text-rose-800 font-bold' : 'hover:bg-slate-50/70'}
                                        >
                                          <td className="px-2 py-1 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                          {Array.isArray(row) ? (
                                            row.map((val, cIdx) => (
                                              <td key={cIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-medium">
                                                {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                              </td>
                                            ))
                                          ) : (
                                            <td className="px-2.5 py-1">{String(row)}</td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              {extraIndices.length > 0 && (
                                <div className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1 pt-0.5">
                                  <CircleAlert size={12} />
                                  <span>Highlighted in red: {extraIndices.length} incorrect row(s) returned by your query.</span>
                                </div>
                              )}
                            </div>

                            {/* Expected Output Column */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-black text-slate-700">
                                <span>Expected Output:</span>
                                <span className="text-[10px] font-mono text-slate-400">{expRes.rowCount} row(s)</span>
                              </div>
                              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs max-h-60">
                                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                                  <thead className="bg-slate-50 font-black text-slate-800">
                                    <tr>
                                      <th className="px-2 py-1 text-slate-400 font-mono text-[10px] border-r border-slate-100">#</th>
                                      {(expRes.columns || []).map((col, cIdx) => (
                                        <th key={cIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                          {col}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                    {(expRes.values || []).map((row, rIdx) => {
                                      const isMissing = missingIndices.includes(rIdx);
                                      return (
                                        <tr
                                          key={rIdx}
                                          className={isMissing ? 'bg-amber-50/90 text-rose-700 font-bold' : 'hover:bg-slate-50/70 text-emerald-800 font-medium'}
                                        >
                                          <td className="px-2 py-1 text-slate-400 text-[10px] border-r border-slate-100">{rIdx + 1}</td>
                                          {Array.isArray(row) ? (
                                            row.map((val, cIdx) => (
                                              <td key={cIdx} className="px-2.5 py-1 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                                                {val === null ? <span className="text-slate-400 italic">NULL</span> : String(val)}
                                              </td>
                                            ))
                                          ) : (
                                            <td className="px-2.5 py-1">{String(row)}</td>
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              {missingIndices.length > 0 && (
                                <div className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1 pt-0.5">
                                  <CircleAlert size={12} />
                                  <span>Highlighted in red: {missingIndices.length} expected row(s) missing from your query result.</span>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* IDLE PLACEHOLDER */}
              {consoleMode === 'idle' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Terminal size={22} className="text-slate-300 mb-2" />
                  <div className="text-xs font-bold text-slate-600">Run code to see results</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Click <strong className="text-slate-600">Run</strong> to inspect your query or <strong className="text-emerald-600">Submit</strong> to validate testcases.
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          QUICK PROBLEM LIST DRAWER / SIDEBAR POPUP (RESPONSIVE FULL-SCREEN ON PHONES)
         ========================================================================= */}
      {showDrawer && (
        <div className="absolute inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative w-full sm:w-96 h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <LayoutGrid size={16} className="text-blue-600" />
                <span className="text-sm font-black text-slate-900">Problem List ({totalCount})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Filters: Search + Difficulty Pills */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Search questions & topics..."
                  style={{ paddingLeft: '34px', paddingRight: '28px' }}
                  className="w-full py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
                {drawerSearch && (
                  <button
                    type="button"
                    onClick={() => setDrawerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Track Category Tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setDrawerTrack('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    drawerTrack === 'all'
                      ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTrack('ddl')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1 ${
                    drawerTrack === 'ddl'
                      ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                  }`}
                >
                  <span>📘 50 DDL Questions</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    drawerTrack === 'ddl' ? 'bg-blue-700 text-white' : 'bg-blue-200/80 text-blue-900'
                  }`}>
                    50
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTrack('core')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    drawerTrack === 'core'
                      ? 'bg-indigo-600 text-white font-extrabold shadow-2xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
                  }`}
                >
                  <span>Core SQL (16)</span>
                </button>
              </div>

              {/* DDL Operational Granular Filters (CREATE, USE, ALTER, RENAME, TRUNCATE, DROP) */}
              {drawerTrack === 'ddl' && (
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                  {[
                    { id: 'all', label: 'All DDL' },
                    { id: 'create', label: 'CREATE' },
                    { id: 'use', label: 'USE' },
                    { id: 'alter', label: 'ALTER' },
                    { id: 'rename', label: 'RENAME' },
                    { id: 'truncate', label: 'TRUNCATE' },
                    { id: 'drop', label: 'DROP' }
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setDrawerDdlFilter(op.id)}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        drawerDdlFilter === op.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-1">
                {['all', 'easy', 'medium', 'hard'].map((df) => (
                  <button
                    key={df}
                    type="button"
                    onClick={() => setDrawerDifficulty(df)}
                    className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer text-center ${
                      drawerDifficulty === df
                        ? 'bg-blue-600 text-white font-extrabold shadow-2xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {df === 'medium' ? 'Med' : df}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Problem List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
              {drawerChallenges.map((ch) => {
                const isSelected = ch.originalIndex === selectedChallengeIndex;
                const isSolved = solvedChallenges.includes(ch.id);

                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleOpenChallenge(ch.originalIndex)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-extrabold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0">
                        #{ch.originalIndex + 1}
                      </span>
                      <span className="truncate">{ch.title}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`text-[10.5px] font-bold capitalize ${
                          ch.difficulty?.toLowerCase() === 'easy'
                            ? 'text-emerald-600'
                            : ch.difficulty?.toLowerCase() === 'medium'
                            ? 'text-amber-500'
                            : 'text-rose-600'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                      {isSolved && <CheckCircle2 size={13} className="text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TABBED PRACTICE SETTINGS MODAL (PREMIUM & BALANCED UI)
         ========================================================================= */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowSettingsModal(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">Preferences & Settings</h3>
                  <p className="text-[11.5px] text-slate-500 font-medium">Configure practice rules, editor, and SQL engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Segmented Tabs Navigation Bar */}
            <div className="px-5 pt-3 pb-1 bg-white shrink-0">
              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('practice')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    settingsActiveTab === 'practice'
                      ? 'bg-white text-blue-600 font-black shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Target size={13} className={settingsActiveTab === 'practice' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Practice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('editor')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    settingsActiveTab === 'editor'
                      ? 'bg-white text-blue-600 font-black shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Code2 size={13} className={settingsActiveTab === 'editor' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('engine')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    settingsActiveTab === 'engine'
                      ? 'bg-white text-blue-600 font-black shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Database size={13} className={settingsActiveTab === 'engine' ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Engine</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
              
              {/* TAB 1: PRACTICE RULES */}
              {settingsActiveTab === 'practice' && (
                <div className="space-y-3">
                  
                  {/* Schema-Only Mode */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3 hover:border-slate-300 transition-colors">
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-1.5 font-black text-slate-900 text-xs">
                        <EyeOff size={14} className="text-blue-600" />
                        <span>Schema-Only Mode (Hide Data)</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed">
                        Hides sample data rows and displays only column definitions and data types.
                      </p>
                    </div>

                    {/* Pixel-Perfect Toggle Switch */}
                    <ToggleSwitch
                      checked={settings.schemaOnlyMode}
                      onChange={() => updateSetting('schemaOnlyMode', !settings.schemaOnlyMode)}
                      label="Toggle Schema-Only Mode"
                    />
                  </div>

                  {/* Hide Hints */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between gap-3 hover:border-slate-300 transition-colors">
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-1.5 font-black text-slate-900 text-xs">
                        <Lightbulb size={14} className="text-amber-500" />
                        <span>Hide Hints (Strict Mode)</span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed">
                        Hides the hints tab to simulate timed interview conditions.
                      </p>
                    </div>

                    {/* Pixel-Perfect Toggle Switch */}
                    <ToggleSwitch
                      checked={settings.hideHints}
                      onChange={() => updateSetting('hideHints', !settings.hideHints)}
                      label="Toggle Hide Hints"
                    />
                  </div>

                  {/* Red Discrepancy Diff Highlighter */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start space-x-2.5">
                    <CircleAlert size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Red Discrepancy Highlighting</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Incorrect or missing rows are automatically highlighted in red upon submission.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: CODE EDITOR */}
              {settingsActiveTab === 'editor' && (
                <div className="space-y-3.5">
                  
                  {/* Font Size Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">Editor Font Size</span>
                      <span className="font-mono text-xs font-bold text-blue-600">{settings.fontSize || '13'}px</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['12', '13', '14', '16'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateSetting('fontSize', size)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                            settings.fontSize === size
                              ? 'bg-blue-600 text-white font-black shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Uppercase Keywords */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">SQL Keyword Capitalization</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Formats SELECT, FROM, WHERE, JOIN to uppercase</div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10.5px] font-bold">Enabled</span>
                  </div>

                  {/* Live Syntax Preview */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 text-[10.5px] uppercase tracking-wider">Live Preview</span>
                    <div
                      style={{ fontSize: `${settings.fontSize || '13'}px` }}
                      className="p-3 bg-slate-900 text-emerald-400 font-mono rounded-xl border border-slate-800 shadow-inner leading-relaxed"
                    >
                      <span className="text-blue-400">SELECT</span> id, first_name, salary<br />
                      <span className="text-blue-400">FROM</span> employees<br />
                      <span className="text-blue-400">WHERE</span> salary &gt; 90000;
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: SQL ENGINE */}
              {settingsActiveTab === 'engine' && (
                <div className="space-y-3">
                  
                  {/* Engine Specs */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">Runtime Engine</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10.5px] font-mono font-bold">
                        SQLite 3 WASM (Active)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed">
                      Zero latency in-browser execution with support for 20+ custom functions (CONCAT, IFNULL, NVL, NOW, DATEDIFF, LEN).
                    </p>
                  </div>

                  {/* Dialects */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <span className="font-bold text-slate-800 text-xs">Supported SQL Dialects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['ANSI SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'MS SQL (T-SQL)'].map((dl) => (
                        <span key={dl} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10.5px] font-bold text-slate-700">
                          ✓ {dl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reset Progress */}
                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/70 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900 text-xs">Solved Challenges</div>
                      <div className="text-[11px] text-rose-700 font-medium">{solvedChallenges.length} challenges marked solved</div>
                    </div>
                    {resetConfirm ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSolvedChallenges([]);
                            try {
                              localStorage.removeItem('msc_sql_solved_challenges');
                            } catch (_) {}
                            setResetConfirm(false);
                          }}
                          className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetConfirm(false)}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResetConfirm(true)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Reset History
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Auto-saved to local browser storage</span>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
