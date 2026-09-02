import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Copy, Check, Table, CheckCircle2, ChevronRight,
  ChevronUp, ChevronDown, ArrowRight, ArrowLeft, Lightbulb, Code2, Menu, X
} from 'lucide-react';
import { SQL_MODULES, TOTAL_TOPICS_COUNT } from '../data/sqlCurriculumData';

/**
 * SQL Syntax Colorizer
 * Highlights SQL keywords, data types, numbers, strings, comments, and identifiers
 */
function HighlightedSql({ code }) {
  if (!code) return null;

  const lines = code.split('\n');

  return (
    <div className="font-mono text-[12px] sm:text-[13px] leading-relaxed select-text">
      {lines.map((line, lineIdx) => {
        // Handle comment line
        if (line.trim().startsWith('--') || line.trim().startsWith('/*')) {
          return (
            <div key={lineIdx} className="text-slate-400 italic">
              {line}
            </div>
          );
        }

        // Tokenize line with regex
        const tokens = line.split(/(\b(?:CREATE\s+TABLE|CREATE\s+DATABASE|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE\s+TABLE|RENAME\s+TABLE|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|NOT\s+NULL|UNIQUE|DEFAULT|CHECK|TRUE|FALSE|SELECT|FROM|WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|OFFSET|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|DESC|ASC|ADD\s+COLUMN|DROP\s+COLUMN|RENAME\s+COLUMN|RENAME\s+TO|MODIFY\s+COLUMN|CHANGE\s+COLUMN|INT|INTEGER|VARCHAR|DECIMAL|DATE|BOOLEAN|TEXT|FLOAT|DOUBLE|BIGINT|TIMESTAMP)\b|'[^']*'|\d+(?:\.\d+)?|[(),;]|\[constraints\]|\bdatatype\b|\btable_name\b|\bcolumn\d+\b|\bdatabase_name\b)/gi);

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
                 'ADD COLUMN', 'DROP COLUMN', 'RENAME COLUMN', 'RENAME TO', 'MODIFY COLUMN', 'CHANGE COLUMN'].includes(upper)
              ) {
                return (
                  <span key={tIdx} className="text-blue-600 font-black">
                    {token}
                  </span>
                );
              }

              // SQL Data Types
              if (['INT', 'INTEGER', 'VARCHAR', 'DECIMAL', 'DATE', 'BOOLEAN', 'TEXT', 'FLOAT', 'DOUBLE', 'BIGINT', 'TIMESTAMP'].includes(upper)) {
                return (
                  <span key={tIdx} className="text-blue-600 font-black">
                    {token}
                  </span>
                );
              }

              // Placeholder syntax tags
              if (token.toLowerCase() === 'datatype') {
                return (
                  <span key={tIdx} className="text-teal-600 font-bold">
                    {token}
                  </span>
                );
              }
              if (token.toLowerCase() === '[constraints]') {
                return (
                  <span key={tIdx} className="text-slate-400 font-medium">
                    {token}
                  </span>
                );
              }

              // Strings
              if (token.startsWith("'") && token.endsWith("'")) {
                return (
                  <span key={tIdx} className="text-emerald-600 font-semibold">
                    {token}
                  </span>
                );
              }

              // Numbers
              if (/^\d+(?:\.\d+)?$/.test(token)) {
                return (
                  <span key={tIdx} className="text-amber-500 font-bold">
                    {token}
                  </span>
                );
              }

              // Punctuation
              if (['(', ')', ',', ';'].includes(token)) {
                return (
                  <span key={tIdx} className="text-slate-700 font-bold">
                    {token}
                  </span>
                );
              }

              return (
                <span key={tIdx} className="text-slate-800">
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

// Curated detailed topic structures matching the exact visual design from the screenshot
const TOPIC_DETAILS_MAP = {
  'top-create-table': {
    id: 'top-create-table',
    moduleId: 'mod-02',
    title: 'CREATE TABLE',
    subtitle: 'Create a new table in the database.',
    intro: 'The CREATE TABLE statement is used to create a new table in a database.',
    syntax: `CREATE TABLE table_name (
    column1 datatype [constraints],
    column2 datatype [constraints],
    column3 datatype [constraints],
    ...
);`,
    example: `CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    salary DECIMAL(10,2) DEFAULT 0.00,
    department_id INT,
    join_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);`,
    note: 'Each column can have a data type and optional constraints like PRIMARY KEY, UNIQUE, NOT NULL, DEFAULT, etc.',
    mistakes: [
      {
        title: 'Missing data type',
        badCode: 'CREATE TABLE users (id, name);',
        explanation: 'Every column must have a valid data type.'
      },
      {
        title: 'Missing comma',
        badCode: 'CREATE TABLE users (id INT name VARCHAR(100));',
        explanation: 'Columns must be separated by commas.'
      },
      {
        title: 'Invalid default value',
        badCode: "CREATE TABLE users (is_active BOOLEAN DEFAULT 'yes');",
        explanation: 'Default value must match the column data type.'
      },
      {
        title: 'Missing closing bracket',
        badCode: 'CREATE TABLE users (id INT, name VARCHAR(100);',
        explanation: 'Ensure all brackets are properly closed.'
      }
    ],
    keyPoints: [
      'Creates a new table in the database',
      'Defines columns and their data types',
      'Allows setting constraints (PRIMARY KEY, UNIQUE, NOT NULL, etc.)',
      'Does not insert any data'
    ],
    prevTopicName: 'CREATE DATABASE',
    prevTopicId: 'top-create-db',
    nextTopicName: 'Constraints in CREATE',
    nextTopicId: 'top-create-constraints'
  },
  'top-create-db': {
    id: 'top-create-db',
    moduleId: 'mod-02',
    title: 'CREATE DATABASE',
    subtitle: 'Create a new container database instance.',
    intro: 'The CREATE DATABASE statement is used to allocate and initialize a new relational database.',
    syntax: `CREATE DATABASE database_name;`,
    example: `CREATE DATABASE company_db;
USE company_db;`,
    note: 'Database names must be unique within the server instance and follow identifier naming rules.',
    mistakes: [
      {
        title: 'Duplicate database name',
        badCode: 'CREATE DATABASE company_db;',
        explanation: 'Fails if company_db already exists. Use CREATE DATABASE IF NOT EXISTS.'
      },
      {
        title: 'Forgetting to select database',
        badCode: 'CREATE TABLE users (...); -- without USE database',
        explanation: 'Tables require an active database context or qualified database.table syntax.'
      }
    ],
    keyPoints: [
      'Creates a new storage catalog for tables and schemas',
      'Auto-committed immediately by the database engine',
      'Use IF NOT EXISTS to prevent runtime errors in automated scripts'
    ],
    prevTopicName: 'SQL Fundamentals',
    prevTopicId: 'top-01-01',
    nextTopicName: 'CREATE TABLE',
    nextTopicId: 'top-create-table'
  },
  'top-create-constraints': {
    id: 'top-create-constraints',
    moduleId: 'mod-02',
    title: 'Constraints in CREATE',
    subtitle: 'Enforce relational integrity and validation rules at table creation.',
    intro: 'Constraints specify business rules for the data in a table, rejecting invalid insert or update operations.',
    syntax: `CREATE TABLE table_name (
    column_name datatype CONSTRAINT_TYPE,
    ...
);`,
    example: `CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
    order_date DATE DEFAULT (CURRENT_DATE)
);`,
    note: 'Primary keys automatically imply NOT NULL and UNIQUE constraints.',
    mistakes: [
      {
        title: 'Multiple PRIMARY KEY definitions',
        badCode: 'CREATE TABLE t (id1 INT PRIMARY KEY, id2 INT PRIMARY KEY);',
        explanation: 'A table can have only ONE primary key (use composite PRIMARY KEY (id1, id2) if needed).'
      }
    ],
    keyPoints: [
      'PRIMARY KEY guarantees unique identity for records',
      'FOREIGN KEY enforces referential integrity across related tables',
      'NOT NULL prohibits missing or null values in critical fields',
      'CHECK constraint validates custom boolean conditions'
    ],
    prevTopicName: 'CREATE TABLE',
    prevTopicId: 'top-create-table',
    nextTopicName: 'ALTER TABLE',
    nextTopicId: 'top-alter-table'
  },
  'top-alter-table': {
    id: 'top-alter-table',
    moduleId: 'mod-02',
    title: 'ALTER TABLE',
    subtitle: 'Modify existing table schema without losing data records.',
    intro: 'The ALTER TABLE statement adds, deletes, or modifies columns and constraints in an existing table.',
    syntax: `-- Add a new column:
ALTER TABLE table_name
ADD column_name datatype [constraints];

-- Drop a column:
ALTER TABLE table_name
DROP COLUMN column_name;`,
    example: `ALTER TABLE employees
ADD phone_number VARCHAR(20),
ADD status VARCHAR(50) DEFAULT 'Active';

ALTER TABLE employees
DROP COLUMN temp_notes;`,
    note: 'Adding columns with DEFAULT values is safe; dropping a column permanently deletes its data.',
    mistakes: [
      {
        title: 'Missing ADD or DROP keyword',
        badCode: 'ALTER TABLE users email VARCHAR(100);',
        explanation: 'Specify ADD, DROP, or MODIFY action explicitly.'
      },
      {
        title: 'Dropping referenced primary key column',
        badCode: 'ALTER TABLE departments DROP COLUMN id;',
        explanation: 'Cannot drop columns referenced by active Foreign Keys.'
      }
    ],
    keyPoints: [
      'Modifies existing tables in-place without rebuilding',
      'Can add new columns with default constraints',
      'Can drop obsolete or redundant columns',
      'Auto-committed immediately in standard SQL'
    ],
    prevTopicName: 'Constraints in CREATE',
    prevTopicId: 'top-create-constraints',
    nextTopicName: 'Add & Drop Columns',
    nextTopicId: 'top-alter-columns'
  },
  'top-alter-columns': {
    id: 'top-alter-columns',
    moduleId: 'mod-02',
    title: 'Add & Drop Columns',
    subtitle: 'Add new columns or remove obsolete columns using ALTER TABLE.',
    intro: 'The ALTER TABLE ADD and DROP COLUMN statements allow you to append new attributes with constraints or remove unused columns from a live table schema.',
    syntax: `-- Add a new column:
ALTER TABLE table_name ADD column_name datatype [constraints];

-- Drop an existing column:
ALTER TABLE table_name DROP COLUMN column_name;`,
    example: `ALTER TABLE customers
ADD loyalty_points INT DEFAULT 0,
ADD is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE customers
DROP COLUMN legacy_fax;`,
    note: 'Dropping a column permanently deletes all data contained in that column across all rows.',
    mistakes: [
      {
        title: 'Missing data type on ADD',
        badCode: 'ALTER TABLE users ADD email;',
        explanation: 'Every new column must specify a valid data type.'
      },
      {
        title: 'Dropping referenced foreign key column',
        badCode: 'ALTER TABLE departments DROP COLUMN dept_id;',
        explanation: 'Cannot drop columns referenced by active Foreign Keys in child tables.'
      }
    ],
    keyPoints: [
      'Adds new fields to existing tables without downtime',
      'Supports setting DEFAULT values on new fields',
      'DROP COLUMN permanently purges column data'
    ]
  },
  'top-alter-modify': {
    id: 'top-alter-modify',
    moduleId: 'mod-02',
    title: 'Modify Column Definitions',
    subtitle: 'Change data types, sizes, or constraints of existing columns.',
    intro: 'Use ALTER TABLE with MODIFY (or ALTER COLUMN) to change column data types, size limits, or nullability rules in existing tables.',
    syntax: `-- Modify column data type or capacity:
ALTER TABLE table_name MODIFY column_name new_datatype [constraints];`,
    example: `ALTER TABLE employees MODIFY salary DECIMAL(12,2) NOT NULL;
ALTER TABLE employees MODIFY phone_number VARCHAR(25);`,
    note: 'Changing data types requires that existing row values are safely convertible to the new data type.',
    mistakes: [
      {
        title: 'Shrinking length below existing data',
        badCode: 'ALTER TABLE users MODIFY name VARCHAR(5);',
        explanation: 'Fails with truncation error if existing records exceed the new length.'
      }
    ],
    keyPoints: [
      'Expands column capacity safely',
      'Alters nullability (NOT NULL / NULL) constraints',
      'Auto-committed immediately in standard SQL'
    ]
  },
  'top-drop-table': {
    id: 'top-drop-table',
    moduleId: 'mod-02',
    title: 'DROP TABLE',
    subtitle: 'Permanently remove a table definition and all its data.',
    intro: 'The DROP TABLE statement permanently deletes the table structure, all its rows, indexes, and triggers.',
    syntax: `DROP TABLE [IF EXISTS] table_name;`,
    example: `DROP TABLE IF EXISTS obsolete_logs_2021;`,
    note: 'DROP cannot be rolled back in most databases once executed. Use IF EXISTS to avoid errors.',
    mistakes: [
      {
        title: 'Dropping parent table with foreign key references',
        badCode: 'DROP TABLE customers;',
        explanation: 'Fails if orders table has foreign keys pointing to customers.'
      }
    ],
    keyPoints: [
      'Destroys both table schema and all data records',
      'Releases allocated storage back to the database engine',
      'Use CASCADE if supported to drop dependent foreign key constraints'
    ]
  },
  'top-drop-db': {
    id: 'top-drop-db',
    moduleId: 'mod-02',
    title: 'DROP DATABASE',
    subtitle: 'Permanently delete an entire database and all contained tables.',
    intro: 'The DROP DATABASE statement permanently destroys the database catalog, including all tables, views, stored procedures, and data.',
    syntax: `DROP DATABASE [IF EXISTS] database_name;`,
    example: `DROP DATABASE IF EXISTS staging_test_db;`,
    note: 'DROP DATABASE is irreversible. Always verify database name before executing drop statements in production.',
    mistakes: [
      {
        title: 'Executing DROP DATABASE on active production database',
        badCode: 'DROP DATABASE prod_company_db;',
        explanation: 'Always double-check the database name and take a backup before dropping.'
      }
    ],
    keyPoints: [
      'Destroys the entire database catalog and all contained tables',
      'Frees server disk space immediately',
      'Use IF EXISTS for idempotency in automated migration scripts'
    ]
  },
  'top-truncate-table': {
    id: 'top-truncate-table',
    moduleId: 'mod-02',
    title: 'TRUNCATE TABLE',
    subtitle: 'Quickly remove all rows while preserving table structure.',
    intro: 'TRUNCATE TABLE empties all records from a table quickly by deallocating data pages.',
    syntax: `TRUNCATE TABLE table_name;`,
    example: `TRUNCATE TABLE staging_orders;`,
    note: 'TRUNCATE resets AUTO_INCREMENT identity counters back to seed 1.',
    mistakes: [
      {
        title: 'Trying to add WHERE clause to TRUNCATE',
        badCode: 'TRUNCATE TABLE users WHERE id > 100;',
        explanation: 'TRUNCATE operates on the entire table and cannot accept a WHERE clause.'
      }
    ],
    keyPoints: [
      'Much faster than DELETE because it deallocates data pages',
      'Preserves table structure, columns, and indexes',
      'Resets AUTO_INCREMENT counter back to 1'
    ]
  },
  'top-rename-table': {
    id: 'top-rename-table',
    moduleId: 'mod-02',
    title: 'RENAME TABLE',
    subtitle: 'Rename an existing database table safely.',
    intro: 'The RENAME TABLE statement updates the table name without affecting underlying rows or column structure.',
    syntax: `ALTER TABLE old_name RENAME TO new_name;
-- Or:
RENAME TABLE old_name TO new_name;`,
    example: `ALTER TABLE clients RENAME TO customers;`,
    note: 'Remember to update any application queries or stored procedures that reference the old table name.',
    mistakes: [
      {
        title: 'Renaming to an existing table name',
        badCode: 'ALTER TABLE clients RENAME TO orders;',
        explanation: 'Target table name must not already exist in the database schema.'
      }
    ],
    keyPoints: [
      'Changes table identifier in catalog metadata',
      'Preserves all data, constraints, and indexes',
      'Quick schema update with zero data downtime'
    ]
  }
};

// Curriculum Hierarchy Structure with Sub-groups (Proper 5-Part DDL Level Hierarchy)
const SIDEBAR_MODULES = [
  {
    id: 'mod-01',
    number: 1,
    title: 'Fundamentals',
    hasSubgroups: false,
    topics: [
      { id: 'top-01-01', title: 'Introduction to Databases' },
      { id: 'top-01-02', title: 'SQL Syntax Rules' },
      { id: 'top-01-03', title: 'Command Categories' }
    ]
  },
  {
    id: 'mod-02',
    number: 2,
    title: 'DDL',
    hasSubgroups: true,
    subgroups: [
      {
        name: 'CREATE',
        topics: [
          { id: 'top-create-table', title: 'CREATE TABLE' },
          { id: 'top-create-db', title: 'CREATE DATABASE' },
          { id: 'top-create-constraints', title: 'Constraints in CREATE' }
        ]
      },
      {
        name: 'ALTER',
        topics: [
          { id: 'top-alter-table', title: 'ALTER TABLE' },
          { id: 'top-alter-columns', title: 'Add & Drop Columns' },
          { id: 'top-alter-modify', title: 'Modify Column Types' }
        ]
      },
      {
        name: 'DROP',
        topics: [
          { id: 'top-drop-table', title: 'DROP TABLE' },
          { id: 'top-drop-db', title: 'DROP DATABASE' }
        ]
      },
      {
        name: 'TRUNCATE',
        topics: [
          { id: 'top-truncate-table', title: 'TRUNCATE TABLE' }
        ]
      },
      {
        name: 'RENAME',
        topics: [
          { id: 'top-rename-table', title: 'RENAME TABLE' }
        ]
      }
    ]
  },
  {
    id: 'mod-03',
    number: 3,
    title: 'DML',
    hasSubgroups: false,
    topics: [
      { id: 'top-03-01', title: 'INSERT INTO' },
      { id: 'top-03-02', title: 'UPDATE & DELETE' }
    ]
  },
  {
    id: 'mod-04',
    number: 4,
    title: 'SELECT & Filtering',
    hasSubgroups: false,
    topics: [
      { id: 'top-04-01', title: 'SELECT Basics' },
      { id: 'top-04-02', title: 'WHERE Filtering' }
    ]
  },
  {
    id: 'mod-05',
    number: 5,
    title: 'Functions',
    hasSubgroups: false,
    topics: [
      { id: 'top-05-01', title: 'Aggregate Functions' },
      { id: 'top-05-02', title: 'Scalar Functions' }
    ]
  },
  {
    id: 'mod-06',
    number: 6,
    title: 'GROUP BY & HAVING',
    hasSubgroups: false,
    topics: [
      { id: 'top-06-01', title: 'GROUP BY Aggregations' },
      { id: 'top-06-02', title: 'HAVING Clause' }
    ]
  },
  {
    id: 'mod-07',
    number: 7,
    title: 'JOINS',
    hasSubgroups: false,
    topics: [
      { id: 'top-07-01', title: 'INNER JOIN' },
      { id: 'top-07-02', title: 'LEFT & RIGHT JOIN' }
    ]
  },
  {
    id: 'mod-08',
    number: 8,
    title: 'Subqueries',
    hasSubgroups: false,
    topics: [
      { id: 'top-08-01', title: 'Single & Multi-Row Subqueries' },
      { id: 'top-08-02', title: 'Correlated Subqueries' }
    ]
  },
  {
    id: 'mod-09',
    number: 9,
    title: 'Views',
    hasSubgroups: false,
    topics: [
      { id: 'top-09-01', title: 'CREATE VIEW' },
      { id: 'top-09-02', title: 'Managing Views' }
    ]
  },
  {
    id: 'mod-10',
    number: 10,
    title: 'Advanced SQL',
    hasSubgroups: false,
    topics: [
      { id: 'top-10-01', title: 'Window Functions (ROW_NUMBER, RANK)' },
      { id: 'top-10-02', title: 'Common Table Expressions (CTEs)' }
    ]
  }
];

export default function SqlLearningView({
  selectedModuleId = 'mod-02',
  setSelectedModuleId,
  selectedTopicId = 'top-create-table',
  setSelectedTopicId,
  completedTopics = [],
  onToggleCompleted,
  onJumpToPractice,
  onBackToOverview
}) {
  const [copiedSection, setCopiedSection] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active topic state (defaults to top-create-table)
  const [currentActiveTopicId, setCurrentActiveTopicId] = useState(selectedTopicId || 'top-create-table');

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

  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState({
    'mod-02': true // DDL expanded by default
  });

  // Accordion state for DDL subcategories (5 parts: CREATE, ALTER, DROP, TRUNCATE, RENAME)
  const [expandedSubgroups, setExpandedSubgroups] = useState({
    CREATE: true,
    ALTER: true,
    DROP: true,
    TRUNCATE: true,
    RENAME: true
  });

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const toggleSubgroup = (subName) => {
    setExpandedSubgroups((prev) => ({
      ...prev,
      [subName]: !prev[subName]
    }));
  };

  const handleSelectTopic = (topId, modId = 'mod-02') => {
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

  // Get active topic data
  const topicData = useMemo(() => {
    if (TOPIC_DETAILS_MAP[currentActiveTopicId]) {
      return TOPIC_DETAILS_MAP[currentActiveTopicId];
    }
    // Fallback default
    return TOPIC_DETAILS_MAP['top-create-table'];
  }, [currentActiveTopicId]);

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
          LEFT SIDEBAR — flex column, pinned top + bottom, scrollable middle
         ========================================================================= */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-white border-r border-slate-200 select-none">
        
        {/* ── TOP: Clean Progress bar only (pinned, never scrolls) ── */}
        <div className="p-3 border-b border-slate-100 shrink-0 bg-white">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">Your Progress</span>
              <span className="font-bold text-blue-600 font-mono">
                {progressPercent}% Completed ({localCompletedTopics.length}/{totalTopicsCount})
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(localCompletedTopics.length > 0 ? 5 : 0, progressPercent)}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Course topics with proper multi-level hierarchy (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {SIDEBAR_MODULES.map((mod) => {
            const isExpanded = Boolean(expandedModules[mod.id]);

            return (
              <div key={mod.id} className="pb-2.5 mb-1 border-b-2 border-slate-200/90 last:border-b-0 last:mb-0 last:pb-0">
                {/* Level 1: Module / Chapter Header (e.g. 2. DDL) */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-[13px] font-black flex items-center justify-between transition-all cursor-pointer ${
                    mod.id === 'mod-02' ? 'text-indigo-950 font-black' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">
                    {mod.number}. {mod.title}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={15} className="text-indigo-600 shrink-0 ml-1.5" strokeWidth={2.2} />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400 shrink-0 ml-1.5" strokeWidth={2.2} />
                  )}
                </button>

                {isExpanded && (
                  <div className="pl-1.5 pr-1 py-1 space-y-1.5 mt-0.5">
                    {mod.hasSubgroups ? (
                      mod.subgroups.map((sub) => {
                        const isSubExpanded = expandedSubgroups[sub.name] !== false;
                        const isSubActive = sub.topics?.some(t => t.id === currentActiveTopicId);

                        return (
                          <div key={sub.name} className="space-y-1">
                            {/* Level 2: Category Part Header (CREATE, ALTER, DROP, TRUNCATE, RENAME - less small, clean uppercase, no count) */}
                            <button
                              type="button"
                              onClick={() => toggleSubgroup(sub.name)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                                isSubActive
                                  ? 'bg-slate-100 text-slate-900 border border-slate-200/90'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                <span className="uppercase text-xs tracking-wide font-black">{sub.name}</span>
                              </div>

                              {isSubExpanded ? (
                                <ChevronUp size={13} className="text-slate-500 shrink-0" strokeWidth={2.2} />
                              ) : (
                                <ChevronRight size={13} className="text-slate-400 shrink-0" strokeWidth={2.2} />
                              )}
                            </button>

                            {/* Level 3: Sub-Parts (Topics) underneath each part (a little more small) */}
                            {isSubExpanded && sub.topics && (
                              <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5 pb-0.5">
                                {sub.topics.map((t) => {
                                  const isSelected = currentActiveTopicId === t.id;
                                  const isCompleted = localCompletedTopics.includes(t.id);

                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleSelectTopic(t.id, mod.id)}
                                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer leading-snug ${
                                        isSelected
                                          ? 'bg-blue-50 text-blue-700 font-black border border-blue-200/80 shadow-2xs'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-1.5 truncate">
                                        {isCompleted ? (
                                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                        ) : (
                                          <span className={`text-xs leading-none shrink-0 ${isSelected ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>•</span>
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
                      })
                    ) : (
                      mod.topics.map((t) => {
                        const isSelected = currentActiveTopicId === t.id;
                        const isCompleted = localCompletedTopics.includes(t.id);

                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTopic(t.id, mod.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
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
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM: Practice playground card (pinned, never scrolls) ── */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100 shrink-0">
              <Lightbulb size={15} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Need to practice?</div>
              <div className="text-[10px] text-slate-500 font-medium">Try this topic in the playground</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onJumpToPractice && onJumpToPractice(topicData)}
            className="w-full py-1.5 bg-white hover:bg-slate-50 text-indigo-600 font-black text-xs rounded-xl border border-indigo-200/80 shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <span className="font-mono text-xs font-bold">{`</>`}</span>
            <span>Open Playground</span>
          </button>
        </div>

      </aside>

      {/* =========================================================================
          RIGHT MAIN CONTENT — independently scrollable
         ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        
        {/* ── MOBILE / TABLET TOP SUBHEADER BAR (<1024px) ── */}
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

        <main className="flex-1 overflow-y-auto w-full pt-4 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10 space-y-5 max-w-[1600px] mx-auto">
          
          {/* Topic Title Header with Mark as Read Toggle */}
          <div className="space-y-2 pb-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs shrink-0">
                  <Table size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.2} />
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

              {/* MARK AS READ TOGGLE BUTTON */}
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

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5 max-w-5xl">
              {topicData.intro}
            </p>
          </div>

          {/* TWO-COLUMN GRID: LEFT (SYNTAX, EXAMPLE, NOTE) & RIGHT (MISTAKES, KEY POINTS, PRACTICE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
            
            {/* LEFT COLUMN (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* (1) SYNTAX CARD */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                  <span>Syntax</span>
                </div>
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 sm:p-5 relative group overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(topicData.syntax, 'syntax')}
                    className="absolute top-3 right-3 bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
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
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                  <span>Example</span>
                </div>
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 sm:p-5 relative group overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(topicData.example, 'example')}
                    className="absolute top-3 right-3 bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                  >
                    {copiedSection === 'example' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedSection === 'example' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <div className="pt-1">
                    <HighlightedSql code={topicData.example} />
                  </div>
                </div>
              </div>

              {/* NOTE CALLOUT */}
              {topicData.note && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-slate-700 shadow-2xs">
                  <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-extrabold text-slate-900">Note: </strong>
                    <span>{topicData.note}</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* (3) COMMON MISTAKES */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">3</span>
                  <span>Common Mistakes</span>
                </div>
                <div className="space-y-3.5">
                  {topicData.mistakes.map((m, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <span className="text-rose-500 font-black text-sm">✕</span>
                        <span>{m.title}</span>
                      </div>
                      <div className="font-mono text-[11px] text-rose-600 bg-rose-50/60 border border-rose-100 rounded-md px-2.5 py-1">
                        {m.badCode}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium pl-0.5">
                        {m.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KEY POINTS */}
              <div className="bg-emerald-50/60 border border-emerald-100/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Key Points</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {topicData.keyPoints.map((kp, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-500 font-black">•</span>
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PRACTICE THIS TOPIC */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono font-bold text-xs">{`</>`}</div>
                  <span className="text-sm font-black text-slate-900">Practice This Topic</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Test your understanding with practice questions.</p>
                <button
                  type="button"
                  onClick={() => onJumpToPractice && onJumpToPractice(topicData)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 font-black text-xs rounded-xl border border-indigo-200/80 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Practice Now</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* =========================================================================
          MOBILE / TABLET SLIDE-OUT SYLLABUS DRAWER (< 1024px)
         ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full sm:w-84 h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <BookOpen size={16} className="text-blue-600" />
                <span className="text-sm font-black text-slate-900">Course Syllabus</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar in mobile drawer */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Progress</span>
                  <span className="font-bold text-blue-600 font-mono">
                    {progressPercent}% ({localCompletedTopics.length}/{totalTopicsCount})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(localCompletedTopics.length > 0 ? 5 : 0, progressPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Topics Hierarchy List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {SIDEBAR_MODULES.map((mod) => {
                const isExpanded = Boolean(expandedModules[mod.id]);

                return (
                  <div key={mod.id} className="pb-2.5 mb-1 border-b-2 border-slate-200/90 last:border-b-0 last:mb-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-[13px] font-black flex items-center justify-between transition-all cursor-pointer text-slate-800 hover:bg-slate-50"
                    >
                      <span className="truncate">{mod.number}. {mod.title}</span>
                      {isExpanded ? (
                        <ChevronUp size={15} className="text-indigo-600 shrink-0 ml-1.5" strokeWidth={2.2} />
                      ) : (
                        <ChevronRight size={15} className="text-slate-400 shrink-0 ml-1.5" strokeWidth={2.2} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pl-1.5 pr-1 py-1 space-y-1.5 mt-0.5">
                        {mod.hasSubgroups ? (
                          mod.subgroups.map((sub) => {
                            const isSubExpanded = expandedSubgroups[sub.name] !== false;
                            const isSubActive = sub.topics?.some(t => t.id === currentActiveTopicId);

                            return (
                              <div key={sub.name} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleSubgroup(sub.name)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                                    isSubActive ? 'bg-slate-100 text-slate-900 border border-slate-200/90' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                                    <span className="uppercase text-xs tracking-wide font-black">{sub.name}</span>
                                  </div>
                                  {isSubExpanded ? (
                                    <ChevronUp size={13} className="text-slate-500 shrink-0" strokeWidth={2.2} />
                                  ) : (
                                    <ChevronRight size={13} className="text-slate-400 shrink-0" strokeWidth={2.2} />
                                  )}
                                </button>

                                {isSubExpanded && sub.topics && (
                                  <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5 pb-0.5">
                                    {sub.topics.map((t) => {
                                      const isSelected = currentActiveTopicId === t.id;
                                      const isCompleted = localCompletedTopics.includes(t.id);

                                      return (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => handleSelectTopic(t.id, mod.id)}
                                          className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-all cursor-pointer leading-snug ${
                                            isSelected
                                              ? 'bg-blue-50 text-blue-700 font-black border border-blue-200/80 shadow-2xs'
                                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="flex items-center space-x-1.5 truncate">
                                            {isCompleted ? (
                                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                                            ) : (
                                              <span className={`text-xs leading-none shrink-0 ${isSelected ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>•</span>
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
                          })
                        ) : (
                          mod.topics.map((t) => {
                            const isSelected = currentActiveTopicId === t.id;
                            const isCompleted = localCompletedTopics.includes(t.id);

                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleSelectTopic(t.id, mod.id)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
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
                          })
                        )}
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

