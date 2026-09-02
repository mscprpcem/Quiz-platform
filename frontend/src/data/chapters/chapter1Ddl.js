// =========================================================================
// CHAPTER 1: DDL DEEP DIVE (CREATE, ALTER, DROP, TRUNCATE, RENAME)
// =========================================================================

export const CHAPTER_1_METADATA = {
  id: 'mod-02',
  number: 1,
  title: 'DDL Deep Dive',
  status: 'available',
  badge: 'Schema Architecture',
  description: 'Deep dive into DDL commands: CREATE, ALTER, DROP, TRUNCATE, and RENAME. Master under-the-hood engine lifecycles, memory caching, physical .ibd tablespace allocation, and storage page deallocation.',
  topics: [
    { id: 'top-create-table', title: 'CREATE' },
    { id: 'top-alter-table', title: 'ALTER' },
    { id: 'top-drop-table', title: 'DROP' },
    { id: 'top-truncate-table', title: 'TRUNCATE' },
    { id: 'top-rename-table', title: 'RENAME' },
    { id: 'top-ddl-50-questions', title: '50 DDL Practice Questions' }
  ]
};

export const CHAPTER_1_TOPICS = {
  'top-create-table': {
    id: 'top-create-table',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: 'CREATE',
    subtitle: 'Database & Table Creation: Physical Disk Allocation, Metadata Registration & Constraints',
    intro: 'In SQL, CREATE is the foundational Data Definition command used to establish new database instances and tables. When you execute CREATE TABLE, the database engine does far more than save text: it verifies security privileges, acquires an exclusive Metadata Lock (MDL), writes structural schemas into the internal System Data Dictionary, allocates physical 16KB storage pages on your hard drive (e.g. users.ibd in MySQL InnoDB), builds the root node of the Clustered Index (B+ Tree), and prepares in-memory Buffer Pool slots for high-speed writes.',
    infographicImage: '/how-create-table-works.jpg',
    infographicTitle: 'Under the Hood: What Happens Inside Database When You Run CREATE TABLE',
    infographicCaption: 'Notice the 4 clear steps: SQL query sent -> Database checks syntax & permissions -> Writes table schema into System Data Dictionary -> Allocates physical .ibd storage file on hard drive with empty B-tree data pages.',
    underTheHood: {
      title: 'What Happens Inside the Database When You Run CREATE TABLE',
      summary: 'From your SQL statement to raw bytes etched onto physical disk storage pages, here is the exact 6-step lifecycle executed by the MySQL engine:',
      steps: [
        {
          step: 1,
          title: 'Query Parsing & Semantic Validation',
          desc: 'The SQL parser analyzes syntax, verifies that the target table name does not already exist in the database catalog, checks data type validity, and validates user privileges (requires CREATE privilege).'
        },
        {
          step: 2,
          title: 'Acquiring Metadata Lock (MDL)',
          desc: 'The engine grabs an exclusive Metadata Lock on the table name. This prevents any other concurrent session from creating or renaming a table with the same name at the exact same millisecond.'
        },
        {
          step: 3,
          title: 'Updating the System Data Dictionary',
          desc: 'In MySQL 8.0+, table metadata (column names, data types, nullability, primary key constraints) is serialized and committed into transactional Data Dictionary tables (stored in the mysql schema).'
        },
        {
          step: 4,
          title: 'Allocating Physical Storage (.ibd Tablespace File)',
          desc: 'For InnoDB, a dedicated physical file (e.g. users.ibd) is initialized on disk. The storage engine allocates a 16KB root page (Page #3) to form the base node of the Clustered Index (B+ Tree).'
        },
        {
          step: 5,
          title: 'Buffer Pool Cache Registration',
          desc: 'The empty root page descriptor is loaded into memory inside the InnoDB Buffer Pool so subsequent INSERT statements can write instantly without waiting on mechanical disk spin.'
        },
        {
          step: 6,
          title: 'Implicit Commit (Auto-Commit)',
          desc: 'Because CREATE is a DDL command, the engine immediately issues an implicit COMMIT. The operation is etched permanently and cannot be rolled back with ROLLBACK.'
        }
      ]
    },
    syntax: `-- 1. CREATE DATABASE (Initial Storage Catalog Allocation)
CREATE DATABASE IF NOT EXISTS company_db;
USE company_db;

-- 2. CREATE TABLE with Core Constraints
CREATE TABLE IF NOT EXISTS employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,  -- Physical Clustered Index (Unique & Not Null)
    first_name VARCHAR(50) NOT NULL,             -- String attribute, cannot be omitted
    last_name VARCHAR(50) NOT NULL,              -- String attribute, cannot be omitted
    email VARCHAR(120) NOT NULL UNIQUE,          -- Secondary B+ Tree Index (No duplicates)
    salary DECIMAL(10,2) DEFAULT 0.00,           -- Numeric value injected if not specified
    is_active BOOLEAN DEFAULT TRUE,              -- Boolean status flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Auto timestamp on insert
    CHECK (salary >= 0.00)                       -- Constraint validation expression
);`,
    example: `-- Complete Practical Example: Parent & Child Tables with Referential Linkage
CREATE DATABASE IF NOT EXISTS ecommerce_store;
USE ecommerce_store;

-- Parent Table: Categories
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(60) NOT NULL UNIQUE
);

-- Child Table: Products linked via Foreign Key
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(120) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category_id INT NOT NULL,
    CONSTRAINT fk_product_category 
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);`,
    note: 'In MySQL InnoDB, the PRIMARY KEY is special: the entire table data is physically organized on disk in sorted order of the Primary Key inside a B+ Tree structure called the Clustered Index.',
    mistakes: [
      {
        title: 'Forgetting to select a database before creating a table',
        badCode: 'CREATE TABLE users (id INT); -- Error: No database selected',
        explanation: 'Always execute USE database_name; first or write CREATE TABLE database_name.table_name.'
      },
      {
        title: 'Missing data type on a column definition',
        badCode: 'CREATE TABLE users (id, name VARCHAR(100));',
        explanation: 'Every column must specify a valid data type (INT, VARCHAR, DECIMAL, etc.).'
      },
      {
        title: 'Creating a table with no Primary Key',
        badCode: 'CREATE TABLE logs (log_message TEXT, log_time TIMESTAMP);',
        explanation: 'Every relational table should have a Primary Key. Without one, InnoDB generates a hidden 6-byte row ID (GEN_CLUST_INDEX) which degrades query performance.'
      }
    ],
    keyPoints: [
      'CREATE is DDL: updates data dictionary and allocates physical tablespace on disk',
      'PRIMARY KEY creates the physical Clustered B+ Tree Index',
      'InnoDB allocates a dedicated .ibd file per table (with innodb_file_per_table=1)',
      'All DDL operations in MySQL issue an implicit COMMIT and cannot be rolled back',
      'Use IF NOT EXISTS to prevent script crashes on existing objects'
    ],
    prevTopicName: 'Install MySQL & Workbench',
    prevTopicId: 'top-01-04',
    nextTopicName: 'ALTER (DDL Deep Dive)',
    nextTopicId: 'top-alter-table'
  },

  'top-alter-table': {
    id: 'top-alter-table',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: 'ALTER',
    subtitle: 'Schema Evolution: Modifying Columns, Constraints & Online DDL Algorithms',
    intro: 'The ALTER TABLE statement allows you to evolve a live database schema by adding, removing, or modifying columns, changing data types, and adding constraints without destroying existing records. Under the hood, modern RDBMS engines use Online DDL algorithms (INSTANT, INPLACE, COPY) backed by Metadata Locks to modify physical storage pages while keeping your application running.',
    infographicImage: '/how-alter-table-works.jpg',
    infographicTitle: 'Under the Hood: What Happens Inside Database When You Run ALTER TABLE',
    infographicCaption: 'Notice the 4 steps: ALTER query sent -> Database acquires Metadata Lock (MDL) to prevent conflicts -> Updates column definition in System Data Dictionary -> Storage Engine modifies physical data pages in users.ibd while keeping all existing rows safe.',
    underTheHood: {
      title: 'What Happens Inside the Database When You Run ALTER TABLE',
      summary: 'Altering a table in production is a critical operation. Here is how MySQL executes ALTER without corrupting active records:',
      steps: [
        {
          step: 1,
          title: 'Acquiring Exclusive Metadata Lock (MDL)',
          desc: 'The engine acquires an exclusive metadata lock. Any concurrent SELECT or INSERT queries attempting to alter table structure wait momentarily to prevent race conditions.'
        },
        {
          step: 2,
          title: 'Choosing the DDL Algorithm (INSTANT vs INPLACE vs COPY)',
          desc: 'MySQL evaluates the optimal algorithm: ALGORITHM=INSTANT (modifies metadata in milliseconds without touching rows), ALGORITHM=INPLACE (modifies the .ibd file without creating a temporary copy), or ALGORITHM=COPY (creates a hidden shadow table, copies all rows, and swaps files).'
        },
        {
          step: 3,
          title: 'System Data Dictionary Update',
          desc: 'Column offset descriptors, column count, and schema metadata are updated inside the transactional data dictionary.'
        },
        {
          step: 4,
          title: 'Physical Data Page Adjustment',
          desc: 'The physical records inside the .ibd B+ tree pages are updated with new column slot offsets, preserving every existing row with zero data loss.'
        },
        {
          step: 5,
          title: 'Lock Release & Implicit Commit',
          desc: 'The metadata lock is released, and changes are auto-committed. The live application immediately sees the updated column structure.'
        }
      ]
    },
    syntax: `-- 1. Add a new column to an existing table
ALTER TABLE employees ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

-- 2. Modify an existing column's data type or capacity
ALTER TABLE employees MODIFY COLUMN salary DECIMAL(12,2) NOT NULL;

-- 3. Rename a column
ALTER TABLE employees RENAME COLUMN phone TO mobile_phone;

-- 4. Drop an obsolete column permanently
ALTER TABLE employees DROP COLUMN temp_notes;

-- 5. Add a foreign key constraint
ALTER TABLE employees ADD CONSTRAINT fk_emp_dept 
    FOREIGN KEY (department_id) REFERENCES departments(id);`,
    example: `-- Realistic Production Schema Migration Example
ALTER TABLE users 
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN last_login_at TIMESTAMP NULL,
    MODIFY COLUMN username VARCHAR(60) NOT NULL;`,
    note: 'In MySQL 8.0+, adding a column at the end of a table uses ALGORITHM=INSTANT by default, completing in under 0.01 seconds even on tables with tens of millions of rows because it only updates catalog metadata!',
    mistakes: [
      {
        title: 'Shrinking a column below the size of existing records',
        badCode: 'ALTER TABLE users MODIFY COLUMN username VARCHAR(3);',
        explanation: 'If existing usernames are longer than 3 characters, MySQL immediately rejects the operation with a data truncation error.'
      },
      {
        title: 'Dropping a column that has an active Foreign Key constraint',
        badCode: 'ALTER TABLE orders DROP COLUMN customer_id;',
        explanation: 'You must drop the Foreign Key constraint first before dropping the referenced column.'
      }
    ],
    keyPoints: [
      'ALTER evolves table architecture without deleting existing row records',
      'ALGORITHM=INSTANT enables zero-downtime column additions in MySQL 8.0+',
      'MODIFY changes data type / nullability; RENAME COLUMN changes the column name',
      'DROP COLUMN permanently erases data contained within that specific column'
    ],
    prevTopicName: 'CREATE (DDL Deep Dive)',
    prevTopicId: 'top-create-table',
    nextTopicName: 'DROP (DDL Deep Dive)',
    nextTopicId: 'top-drop-table'
  },

  'top-drop-table': {
    id: 'top-drop-table',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: 'DROP',
    subtitle: 'Object Deletion: Unlinking Storage Files, Evicting Buffer Pages & Purging Metadata',
    intro: 'The DROP statement permanently destroys a table or entire database from the RDBMS. When you drop a table, the engine verifies that no active Foreign Keys reference it, acquires an exclusive lock, evicts cached dirty pages from the in-memory Buffer Pool, deletes the physical .ibd storage file from the disk drive, and purges all catalog metadata from the System Data Dictionary.',
    underTheHood: {
      title: 'What Happens Inside the Database When You Run DROP',
      summary: 'Dropping a database object is an irreversible storage reclamation operation. Here is how the engine clears disk and memory:',
      steps: [
        {
          step: 1,
          title: 'Foreign Key Dependency Verification',
          desc: 'The engine checks foreign key catalog references. If another table references this table and child rows exist, the DROP statement is immediately rejected with an error to prevent dangling pointers.'
        },
        {
          step: 2,
          title: 'Acquiring Exclusive Metadata Lock (X-MDL)',
          desc: 'Locks the table exclusively so no active transaction can read or write to it while deletion is underway.'
        },
        {
          step: 3,
          title: 'Buffer Pool Page Eviction (Flushing Memory)',
          desc: 'InnoDB scans its memory buffer pool and removes all cached pages and dirty log buffers belonging to this table space.'
        },
        {
          step: 4,
          title: 'Physical File Unlinking & OS Space Deallocation',
          desc: 'The physical table storage file (.ibd file) on the hard drive is unlinked (deleted) from the filesystem, returning physical storage blocks back to the Operating System.'
        },
        {
          step: 5,
          title: 'Catalog Metadata Purge',
          desc: 'The table record, column definitions, index definitions, triggers, and statistics are permanently erased from the Data Dictionary.'
        }
      ]
    },
    syntax: `-- 1. Drop a specific table safely
DROP TABLE IF EXISTS old_logs_2021;

-- 2. Drop multiple tables at once
DROP TABLE IF EXISTS audit_archive, temp_metrics;

-- 3. Drop an entire database and all contained tables
DROP DATABASE IF EXISTS staging_test_db;`,
    example: `-- Idempotent Clean Cleanup Script
DROP TABLE IF EXISTS temp_order_calculations;
DROP DATABASE IF EXISTS demo_test_environment;`,
    note: 'DROP TABLE is permanent! Once executed, the .ibd file is unlinked on disk and the metadata is erased. It cannot be undone with ROLLBACK. Always verify your database and table name before executing DROP in production.',
    mistakes: [
      {
        title: 'Running DROP TABLE without IF EXISTS in automation scripts',
        badCode: 'DROP TABLE staging_data; -- Fails and halts script if table does not exist',
        explanation: 'Always use DROP TABLE IF EXISTS in deployment and CI/CD pipelines to guarantee idempotent execution.'
      },
      {
        title: 'Attempting to drop a parent table before child tables',
        badCode: 'DROP TABLE customers; -- Fails if orders table has foreign key to customers',
        explanation: 'Either drop the child table (orders) first or drop the foreign key constraint before dropping the parent.'
      }
    ],
    keyPoints: [
      'DROP destroys both table structure (schema blueprint) and all underlying records',
      'Deallocates and deletes the physical .ibd storage file from the disk drive',
      'Foreign Key constraints protect parent tables from accidental dropping',
      'Auto-committed immediately; completely irreversible via ROLLBACK'
    ],
    prevTopicName: 'ALTER (DDL Deep Dive)',
    prevTopicId: 'top-alter-table',
    nextTopicName: 'TRUNCATE (DDL Deep Dive)',
    nextTopicId: 'top-truncate-table'
  },

  'top-truncate-table': {
    id: 'top-truncate-table',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: 'TRUNCATE',
    subtitle: 'Fast Reset: Deallocating Data Pages, Resetting Counters & Master Comparison',
    intro: 'TRUNCATE TABLE empties all rows from a table in milliseconds. Unlike DELETE (which scans rows one-by-one and records every deletion in undo logs for rollback), TRUNCATE operates as a DDL command: it deallocates the existing data pages in the tablespace as a whole unit, allocates a fresh empty root page, resets AUTO_INCREMENT back to 1, and auto-commits immediately.',
    infographicImage: '/drop-vs-truncate-vs-delete.jpg',
    infographicTitle: 'Under the Hood: DROP vs TRUNCATE vs DELETE Comparison',
    infographicCaption: 'Notice the difference: DROP completely erases table & deletes .ibd file; TRUNCATE instantly drops data pages, resets AUTO_INCREMENT to 1, and preserves blueprint; DELETE slowly deletes row-by-row with rollback log.',
    underTheHood: {
      title: 'What Happens Inside the Database When You Run TRUNCATE',
      summary: 'Why is TRUNCATE thousands of times faster than DELETE on a 10-million row table? Here is the internal engine difference:',
      steps: [
        {
          step: 1,
          title: 'DDL Fast-Path Deallocation (No Row-by-Row Scanning)',
          desc: 'DELETE must read each individual row, write the deleted values into Undo Logs for rollback, and flag the row as deleted. TRUNCATE completely skips row reading and acts on page storage directly.'
        },
        {
          step: 2,
          title: 'Physical B+ Tree Page Reallocation',
          desc: 'InnoDB drops the existing data and index pages in the .ibd file and allocates a brand new, empty 16KB root page in milliseconds.'
        },
        {
          step: 3,
          title: 'Resetting Identity Counters (AUTO_INCREMENT = 1)',
          desc: 'The table metadata counter for AUTO_INCREMENT is reset back to seed value 1. Next inserted row will have ID = 1.'
        },
        {
          step: 4,
          title: 'Zero Undo Logging & Implicit Auto-Commit',
          desc: 'No row-level rollback logs are generated. An implicit COMMIT is issued immediately, permanently freeing disk space.'
        }
      ]
    },
    comparisonTable: {
      title: 'DROP vs TRUNCATE vs DELETE Master Comparison',
      badge: '3-Way Storage Analysis',
      headers: ['Feature / Dimension', 'DROP TABLE (DDL)', 'TRUNCATE TABLE (DDL)', 'DELETE FROM (DML)'],
      rows: [
        {
          feature: 'Command Category',
          values: [
            'DDL (Data Definition Language)',
            'DDL (Data Definition Language)',
            'DML (Data Manipulation Language)'
          ]
        },
        {
          feature: 'Table Structure / Blueprint',
          values: [
            'Completely Destroyed (Gone from catalog)',
            'Preserved (Ready for new rows)',
            'Preserved (Ready for new rows)'
          ]
        },
        {
          feature: 'Physical Disk Storage (.ibd)',
          values: [
            'File unlinked & deleted from disk',
            'Data pages wiped; empty root page allocated',
            'Rows marked deleted; storage file does not shrink'
          ]
        },
        {
          feature: 'WHERE Clause Support',
          values: [
            'No (Operates on entire table)',
            'No (Cannot filter rows)',
            'Yes (Selectively filters rows)'
          ]
        },
        {
          feature: 'Execution Speed',
          values: [
            'Extremely Fast (Microseconds)',
            'Ultra Fast (Millisecond page wipe)',
            'Slow on large tables (Row-by-row logging)'
          ]
        },
        {
          feature: 'AUTO_INCREMENT Counter',
          values: [
            'Destroyed with table',
            'Reset back to seed 1',
            'Unchanged (Preserves highest ID)'
          ]
        },
        {
          feature: 'Rollback Capability (TCL)',
          values: [
            'No (Implicit auto-commit)',
            'No (Implicit auto-commit)',
            'Yes (Rollback supported within transaction)'
          ]
        }
      ]
    },
    syntax: `-- Truncate table: Fast wipe while keeping structure
TRUNCATE TABLE staging_orders;`,
    example: `-- Testing TRUNCATE behavior on AUTO_INCREMENT
CREATE TABLE IF NOT EXISTS test_counter (
    id INT PRIMARY KEY AUTO_INCREMENT,
    val VARCHAR(20)
);

INSERT INTO test_counter (val) VALUES ('A'), ('B'), ('C'); -- id 1, 2, 3

-- Fast wipe
TRUNCATE TABLE test_counter;

-- Next insert receives id 1 (not id 4!)
INSERT INTO test_counter (val) VALUES ('New First Row');
SELECT * FROM test_counter;`,
    note: 'TRUNCATE cannot be executed on a table referenced by active Foreign Keys from another table, even if the child table is empty. You must drop the child foreign key constraint first or use DELETE.',
    mistakes: [
      {
        title: 'Trying to use WHERE with TRUNCATE',
        badCode: 'TRUNCATE TABLE users WHERE id > 100;',
        explanation: 'TRUNCATE is DDL and acts on the entire table. To selectively delete rows, use DML DELETE with a WHERE clause.'
      },
      {
        title: 'Expecting ROLLBACK to restore truncated data',
        badCode: 'START TRANSACTION; TRUNCATE TABLE users; ROLLBACK; -- Table remains empty!',
        explanation: 'Because TRUNCATE is DDL, MySQL executes an implicit commit before and after the statement. Rollback cannot recover the data.'
      }
    ],
    keyPoints: [
      'TRUNCATE deallocates storage pages as a whole unit, making it ultra fast',
      'Preserves the table blueprint and column definitions',
      'Resets AUTO_INCREMENT identity counters back to seed 1',
      'Issues an implicit commit; cannot be rolled back via TCL'
    ],
    prevTopicName: 'DROP (DDL Deep Dive)',
    prevTopicId: 'top-drop-table',
    nextTopicName: 'RENAME (DDL Deep Dive)',
    nextTopicId: 'top-rename-table'
  },

  'top-rename-table': {
    id: 'top-rename-table',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: 'RENAME',
    subtitle: 'Atomic Identifier Modification: Pointer Swaps Without Moving or Copying Rows',
    intro: 'The RENAME TABLE statement changes a table identifier in catalog metadata. Because data rows are tied to internal tablespace identifiers rather than the human-readable name, renaming a table requires zero row copying or index rebuilding: the engine simply updates the table name string in the Data Dictionary and renames the physical .ibd file on disk in microseconds.',
    underTheHood: {
      title: 'What Happens Inside the Database When You Run RENAME TABLE',
      summary: 'Renaming a table is one of the fastest operations in an RDBMS. Here is why it requires zero data downtime:',
      steps: [
        {
          step: 1,
          title: 'Exclusive Metadata Lock on Both Names',
          desc: 'The engine acquires exclusive metadata locks on both the source table name and target table name simultaneously to guarantee atomic execution.'
        },
        {
          step: 2,
          title: 'System Data Dictionary Pointer Update',
          desc: 'The internal table name string is updated inside the Data Dictionary catalog table (information_schema.TABLES).'
        },
        {
          step: 3,
          title: 'Physical File Renaming (.ibd rename)',
          desc: 'The operating system performs a simple file rename on disk (e.g. old_name.ibd becomes new_name.ibd). This takes less than 1 millisecond regardless of whether the table has 10 rows or 100 million rows!'
        },
        {
          step: 4,
          title: 'Zero Row Copying or Re-Indexing',
          desc: 'Not a single row or index node is re-indexed, moved, or copied. All B+ Tree data pages remain untouched.'
        },
        {
          step: 5,
          title: 'Atomic Multi-Table Swap Capability',
          desc: 'SQL allows swapping live tables with zero downtime using RENAME TABLE current TO old, staging TO current;'
        }
      ]
    },
    syntax: `-- Method 1: Dedicated RENAME TABLE statement
RENAME TABLE old_table_name TO new_table_name;

-- Method 2: ALTER TABLE syntax
ALTER TABLE old_table_name RENAME TO new_table_name;

-- Method 3: Zero-Downtime Blue/Green Table Swap (Atomic)
RENAME TABLE 
    active_orders TO orders_backup,
    staging_orders TO active_orders;`,
    example: `-- Zero-Downtime Production Swap Pattern
CREATE TABLE users_v2 LIKE users;
-- ... populate users_v2 with migrated data ...

-- Atomic swap in a single statement
RENAME TABLE 
    users TO users_legacy,
    users_v2 TO users;`,
    note: 'When you rename a table, remember to update application queries, views, and stored procedures that reference the old table name. In MySQL, views pointing to the old name will fail with an error until updated.',
    mistakes: [
      {
        title: 'Renaming to a name that already exists in the database',
        badCode: 'RENAME TABLE clients TO customers; -- Fails if customers already exists',
        explanation: 'Target table name must be unique within the current schema.'
      },
      {
        title: 'Forgetting to update dependent views or procedures',
        badCode: '-- Renaming table without updating CREATE VIEW v_orders AS SELECT * FROM old_table;',
        explanation: 'Views store literal table names; update your view definitions after renaming base tables.'
      }
    ],
    keyPoints: [
      'RENAME only updates catalog metadata and renames the physical .ibd file',
      'Executes in microseconds with zero row copying or data movement',
      'Supports atomic multi-table swapping for zero-downtime database upgrades',
      'Auto-committed immediately like all DDL operations'
    ],
    prevTopicName: 'TRUNCATE (DDL Deep Dive)',
    prevTopicId: 'top-truncate-table',
    nextTopicName: '50 DDL Practice Questions',
    nextTopicId: 'top-ddl-50-questions'
  },

  'top-ddl-50-questions': {
    id: 'top-ddl-50-questions',
    moduleId: 'mod-02',
    chapterNumber: 1,
    title: '50 DDL Practice Questions',
    subtitle: '10 Sections (A to J): Complete Question Bank from Creation to Interview Scenarios',
    intro: 'Put your DDL mastery to the test with 50 curated practice questions covering every aspect of Data Definition Language. The questions are categorized into 10 focused sections: Database & Table Creation, Column Additions, Data Type Modifications, Renaming, Column Deletions, Table Renaming, Truncation, Deletions, Database Drops, and Interview Thinking Questions.',
    isQuestionsBankTopic: true,
    syntax: `-- DDL Operations Quick Master Reference:
CREATE DATABASE school_db;
CREATE TABLE students (student_id INT PRIMARY KEY, name VARCHAR(50), age INT, city VARCHAR(50));
ALTER TABLE students ADD COLUMN email VARCHAR(100);
ALTER TABLE students MODIFY COLUMN age SMALLINT;
ALTER TABLE students RENAME COLUMN city TO location;
ALTER TABLE students DROP COLUMN email;
RENAME TABLE students TO school_students;
TRUNCATE TABLE school_students;
DROP TABLE school_students;
DROP DATABASE school_db;`,
    example: `-- Typical Safe Database Migration Sequence:
CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;
CREATE TABLE IF NOT EXISTS students (student_id INT PRIMARY KEY, name VARCHAR(100), age SMALLINT);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(120);`,
    note: 'Browse all 50 questions below with instant SQL solutions, copy buttons, and one-click access to solve them interactively in our SQL practice sandbox.',
    keyPoints: [
      '50 questions organized across 10 progressive sections (A through J)',
      'Covers standard DDL syntax, defensive IF EXISTS patterns, and column modifications',
      'Under-the-hood implications: auto-commits, page deallocations, and schema evolution',
      'Direct one-click access to solve inside the interactive SQL practice sandbox'
    ],
    prevTopicName: 'RENAME (DDL Deep Dive)',
    prevTopicId: 'top-rename-table',
    nextTopicName: null,
    nextTopicId: null
  }
};
