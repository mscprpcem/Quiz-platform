// =========================================================================
// CHAPTER 3: DATA DEFINITION LANGUAGE (DDL) (CREATE, ALTER, RENAME, TRUNCATE, DROP)
// =========================================================================

export const CHAPTER_1_METADATA = {
  id: 'mod-03',
  number: 3,
  title: 'Data Definition Language (DDL)',
  status: 'available',
  badge: 'Schema Architecture',
  description: 'Deep dive into DDL commands: CREATE, ALTER, RENAME, TRUNCATE, and DROP. Master under-the-hood engine lifecycles, memory caching, physical .ibd tablespace allocation, and storage page deallocation.',
  topics: [
    { id: 'top-create-table', title: 'CREATE', lessonCode: '3.1' },
    { id: 'top-alter-table', title: 'ALTER', lessonCode: '3.2' },
    { id: 'top-rename-table', title: 'RENAME', lessonCode: '3.3' },
    { id: 'top-truncate-table', title: 'TRUNCATE', lessonCode: '3.4' },
    { id: 'top-drop-table', title: 'DROP', lessonCode: '3.5' },
    { id: 'top-ddl-50-questions', title: '50 DDL Practice Questions', lessonCode: '3.6' }
  ]
};

export const CHAPTER_1_TOPICS = {
  'top-create-table': {
    id: 'top-create-table',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 1,
    lessonCode: '3.1',
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
          title: 'Acquiring Exclusive Metadata Lock (MDL)',
          desc: 'MySQL acquires an exclusive metadata lock on the table identifier. This lock guarantees no other thread can execute queries against this name while the schema is being physically constructed.'
        },
        {
          step: 3,
          title: 'Registration in System Data Dictionary',
          desc: 'In MySQL 8.0+, table metadata is written transactionally into InnoDB data dictionary tables (mysql.tables, mysql.columns, mysql.indexes) with full crash recovery.'
        },
        {
          step: 4,
          title: 'Physical Disk Allocation (.ibd Tablespace)',
          desc: 'With innodb_file_per_table enabled, InnoDB creates a physical file named table_name.ibd in the data directory and formats the initial 7 extent pages (112 KB total).'
        },
        {
          step: 5,
          title: 'Building the Clustered B+ Tree Root Page',
          desc: 'The storage engine allocates root page #3 for the Primary Key index (Clustered Index). All future INSERT statements will populate leaf nodes branched from this root.'
        },
        {
          step: 6,
          title: 'Implicit Commit & Buffer Pool Registration',
          desc: 'Because CREATE is a DDL command, the engine immediately issues an implicit COMMIT. The operation is etched permanently and cannot be rolled back with ROLLBACK.'
        }
      ]
    },
    sqlSteps: [
      {
        step: 1,
        title: 'Create Database Storage Catalog',
        badge: 'Storage Allocation',
        explanation: 'Initializes a dedicated database catalog container. Using IF NOT EXISTS prevents script interruption if the database already exists.',
        code: `CREATE DATABASE IF NOT EXISTS company_db;`
      },
      {
        step: 2,
        title: 'Select Active Database Context with USE',
        badge: 'Session Context',
        explanation: 'Directs the database session to execute all subsequent table creation and query statements inside the company_db catalog.',
        code: `USE company_db;`
      },
      {
        step: 3,
        title: 'Create Table with Clustered Primary Key & Core Constraints',
        badge: 'Parent Table Blueprint',
        explanation: 'Builds the employees table. In InnoDB, the PRIMARY KEY creates the physical Clustered B+ Tree index on disk. We attach NOT NULL, UNIQUE, DEFAULT, and CHECK constraints.',
        code: `CREATE TABLE IF NOT EXISTS employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,  -- Physical Clustered Index (Unique & Not Null)
    first_name VARCHAR(50) NOT NULL,             -- Mandatory text attribute
    last_name VARCHAR(50) NOT NULL,              -- Mandatory text attribute
    email VARCHAR(120) NOT NULL UNIQUE,          -- Secondary B+ Tree Index (No duplicates)
    salary DECIMAL(10,2) DEFAULT 0.00,           -- Default monetary value
    is_active BOOLEAN DEFAULT TRUE,              -- Active status flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Auto-generated creation timestamp
    CHECK (salary >= 0.00)                       -- Constraint validation expression
);`
      },
      {
        step: 4,
        title: 'Create Child Table with Referential Linkage (Foreign Key)',
        badge: 'Child Table Blueprint',
        explanation: 'Builds the products table linked to parent categories via category_id. We configure ON UPDATE CASCADE and ON DELETE RESTRICT to guarantee referential integrity.',
        code: `CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(120) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    category_id INT NOT NULL,
    CONSTRAINT fk_product_category 
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);`
      }
    ],
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
    prevTopicName: 'Operators in SQL (Arithmetic, Comparison & Logical)',
    prevTopicId: 'top-02-03',
    nextTopicName: 'ALTER (Columns & Schema Evolution)',
    nextTopicId: 'top-alter-table'
  },

  'top-alter-table': {
    id: 'top-alter-table',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 2,
    lessonCode: '3.2',
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
    sqlSteps: [
      {
        step: 1,
        title: 'ADD COLUMN — Add New Attributes to Table',
        badge: 'Online DDL',
        explanation: 'Appends a new column without modifying existing rows. In MySQL 8.0+, this uses ALGORITHM=INSTANT, completing in milliseconds even on tables with millions of rows.',
        code: `ALTER TABLE employees 
ADD COLUMN phone VARCHAR(20) DEFAULT NULL;`
      },
      {
        step: 2,
        title: 'MODIFY COLUMN — Adjust Data Type & Nullability',
        badge: 'Capacity Expansion',
        explanation: 'Changes the data type, precision, or constraints of a column. Always widen column capacity (e.g. VARCHAR(50) to VARCHAR(100)) rather than shrinking to avoid truncation errors.',
        code: `ALTER TABLE employees 
MODIFY COLUMN salary DECIMAL(12,2) NOT NULL DEFAULT 1000.00;`
      },
      {
        step: 3,
        title: 'RENAME COLUMN — Update Column Identifier',
        badge: 'Identifier Update',
        explanation: 'Renames a specific column while preserving its underlying data type, index associations, and stored values.',
        code: `ALTER TABLE employees 
RENAME COLUMN phone TO mobile_phone;`
      },
      {
        step: 4,
        title: 'DROP COLUMN — Permanently Remove Attributes',
        badge: 'Space Reclamation',
        explanation: 'Permanently removes a column and frees up slot offsets in data pages. Any values stored in this column for existing records are permanently erased.',
        code: `ALTER TABLE employees 
DROP COLUMN temp_notes;`
      },
      {
        step: 5,
        title: 'ADD CONSTRAINT — Enforce Foreign Key Integrity',
        badge: 'Referential Link',
        explanation: 'Attaches a Foreign Key constraint to an existing column, validating all existing rows and preventing future invalid child references.',
        code: `ALTER TABLE employees 
ADD CONSTRAINT fk_emp_dept 
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;`
      }
    ],
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
    prevTopicName: 'CREATE (Databases & Tables)',
    prevTopicId: 'top-create-table',
    nextTopicName: 'RENAME (Tables & Atomic Swaps)',
    nextTopicId: 'top-rename-table'
  },

  'top-rename-table': {
    id: 'top-rename-table',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 3,
    lessonCode: '3.3',
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
          desc: 'The engine replaces the table name string in the mysql.tables data dictionary. The internal table_id and space_id remain unchanged.'
        },
        {
          step: 3,
          title: 'Physical File Renaming on Disk',
          desc: 'The underlying storage file (e.g. clients.ibd) is renamed to customers.ibd on the host filesystem in a few microseconds.'
        },
        {
          step: 4,
          title: 'Atomic Multi-Table Swapping Capability',
          desc: 'SQL allows swapping live tables with zero downtime using RENAME TABLE current TO old, staging TO current;'
        }
      ]
    },
    sqlSteps: [
      {
        step: 1,
        title: 'Dedicated RENAME TABLE Statement',
        badge: 'Standard Syntax',
        explanation: 'Renames the catalog metadata and physical .ibd storage file on disk in microseconds with zero row movement or copying.',
        code: `RENAME TABLE clients TO customers;`
      },
      {
        step: 2,
        title: 'ALTER TABLE ... RENAME TO (ANSI Standard)',
        badge: 'ANSI Standard',
        explanation: 'Cross-compatible alternative syntax supported across MySQL, PostgreSQL, SQLite, and Oracle.',
        code: `ALTER TABLE suppliers RENAME TO partners;`
      },
      {
        step: 3,
        title: 'Atomic Zero-Downtime Blue/Green Table Swap',
        badge: 'Production Swap',
        explanation: 'Swaps live and staging tables in a single atomic statement without dropping a single active customer query.',
        code: `-- Atomic swap: no incoming queries see a missing table
RENAME TABLE 
    active_orders TO orders_backup,
    staging_orders TO active_orders;`
      }
    ],
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
    prevTopicName: 'ALTER (Columns & Schema Evolution)',
    prevTopicId: 'top-alter-table',
    nextTopicName: 'TRUNCATE (Fast Storage Reset)',
    nextTopicId: 'top-truncate-table'
  },

  'top-truncate-table': {
    id: 'top-truncate-table',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 4,
    lessonCode: '3.4',
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
    sqlSteps: [
      {
        step: 1,
        title: 'TRUNCATE TABLE — High-Speed Storage Reset',
        badge: 'Page Deallocation',
        explanation: 'Deallocates all data and index pages in the .ibd tablespace in milliseconds. Skips row-by-row scanning and undo logging completely.',
        code: `TRUNCATE TABLE staging_orders;`
      },
      {
        step: 2,
        title: 'Resetting AUTO_INCREMENT Back to Seed 1',
        badge: 'Counter Reset',
        explanation: 'Unlike DELETE (which preserves the highest ID generated), TRUNCATE resets the internal identity counter back to seed 1.',
        code: `TRUNCATE TABLE test_counter;`
      }
    ],
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
    prevTopicName: 'RENAME (Tables & Atomic Swaps)',
    prevTopicId: 'top-rename-table',
    nextTopicName: 'DROP (Permanent Destruction)',
    nextTopicId: 'top-drop-table'
  },

  'top-drop-table': {
    id: 'top-drop-table',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 5,
    lessonCode: '3.5',
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
    sqlSteps: [
      {
        step: 1,
        title: 'DROP TABLE IF EXISTS — Safe Deletion Guard',
        badge: 'Idempotent Deletion',
        explanation: 'Safely removes a table without throwing a terminating error if the table has already been dropped or does not exist.',
        code: `DROP TABLE IF EXISTS old_logs_2021;`
      },
      {
        step: 2,
        title: 'Drop Multiple Tables in a Single Statement',
        badge: 'Batch Reclamation',
        explanation: 'Unlinks storage files and purges catalog metadata for multiple tables in an atomic DDL execution.',
        code: `DROP TABLE IF EXISTS audit_archive, temp_metrics;`
      },
      {
        step: 3,
        title: 'DROP DATABASE IF EXISTS — Complete Catalog Purge',
        badge: 'Database Container Purge',
        explanation: 'Destroys an entire database catalog, unlinking all contained .ibd tablespaces and erasing schema references from the system dictionary.',
        code: `DROP DATABASE IF EXISTS staging_test_db;`
      }
    ],
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
    prevTopicName: 'TRUNCATE (Fast Storage Reset)',
    prevTopicId: 'top-truncate-table',
    nextTopicName: '50 DDL Practice Questions',
    nextTopicId: 'top-ddl-50-questions'
  },

  'top-ddl-50-questions': {
    id: 'top-ddl-50-questions',
    moduleId: 'mod-03',
    chapterNumber: 3,
    lessonNumber: 6,
    lessonCode: '3.6',
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
    prevTopicName: 'DROP (Permanent Destruction)',
    prevTopicId: 'top-drop-table',
    nextTopicName: null,
    nextTopicId: null
  }
};
