// =========================================================================
// CHAPTER 0: FUNDAMENTALS (DBMS vs RDBMS, Schema, Commands, Setup)
// =========================================================================

export const CHAPTER_0_METADATA = {
  id: 'mod-01',
  number: 0,
  title: 'Fundamentals',
  status: 'available',
  badge: 'Core Foundation',
  description: 'Master core database concepts, DBMS vs RDBMS architecture, tables, columns, rows, the 5 SQL command types, and complete local MySQL & Workbench installation.',
  topics: [
    { id: 'top-01-01', title: 'DBMS vs RDBMS' },
    { id: 'top-01-02', title: 'Tables, Rows, Columns & Schema' },
    { id: 'top-01-03', title: 'SQL Command Types' },
    { id: 'top-01-04', title: 'Install MySQL & Workbench' }
  ]
};

export const CHAPTER_0_TOPICS = {
  'top-01-01': {
    id: 'top-01-01',
    moduleId: 'mod-01',
    chapterNumber: 0,
    title: 'DBMS vs RDBMS',
    subtitle: 'From Flat File Systems to Relational Tables, ACID Guarantees & Constraints',
    intro: 'Before writing SQL queries, you must understand how databases evolved. In the early computing era, applications stored data in flat operating system files (CSV, XML, JSON). As datasets expanded, file systems failed to handle concurrent multi-user writes, led to massive data duplication, and suffered from catastrophic file corruption during unexpected power loss. This crisis motivated the creation of the Relational Database Management System (RDBMS), founded on E.F. Codd’s relational model.',
    infographicImage: '/file-system-vs-dbms-vs-rdbms.jpg',
    infographicTitle: 'Evolutionary Architecture: File Systems vs DBMS vs RDBMS',
    infographicCaption: 'Notice the progression: Flat Files (unstructured) ➔ DBMS (hierarchical/flat) ➔ RDBMS (strict 2D tables with keys, ACID compliance, and zero data redundancy).',
    comparisonTable: {
      title: 'DBMS vs RDBMS Comprehensive Comparison',
      badge: '8 Architectural Dimensions',
      headers: ['Feature / Dimension', 'Traditional DBMS', 'Relational RDBMS (Modern SQL)'],
      rows: [
        {
          feature: 'Data Structure & Storage',
          values: [
            'Flat files, XML/JSON documents, or hierarchical navigation trees',
            'Structured 2D Tables (Relations) consisting of typed Rows & Columns'
          ]
        },
        {
          feature: 'Relationships & Linkages',
          values: [
            'No built-in relational model between separate data files',
            'Tables are linked via Primary Key (PK) and Foreign Key (FK) constraints'
          ]
        },
        {
          feature: 'Data Redundancy',
          values: [
            'High redundancy; identical data is duplicated across multiple records',
            'Minimized or eliminated through Database Normalization (1NF to BCNF)'
          ]
        },
        {
          feature: 'ACID Compliance',
          values: [
            'Not fully supported; risk of partial writes or corruption on crash',
            'Strictly ACID-compliant (Atomicity, Consistency, Isolation, Durability)'
          ]
        },
        {
          feature: 'Data Integrity & Constraints',
          values: [
            'Integrity rules must be coded manually in application software',
            'Integrity enforced directly by engine (NOT NULL, UNIQUE, CHECK, FK)'
          ]
        },
        {
          feature: 'Query Language',
          values: [
            'Procedural custom file navigation; requires manual search loops',
            'Declarative SQL (Structured Query Language); optimizer selects best path'
          ]
        },
        {
          feature: 'Concurrent Access & Locking',
          values: [
            'File-level locking; multiple users easily encounter concurrency conflicts',
            'Fine-grained row-level and table-level locking with multi-version concurrency (MVCC)'
          ]
        },
        {
          feature: 'Enterprise Examples',
          values: [
            'XML files, JSON files, Windows Registry, dBase, FoxPro',
            'MySQL, PostgreSQL, Oracle Database, Microsoft SQL Server, SQLite'
          ]
        }
      ]
    },
    whyWeNeedItSection: {
      title: 'Why Do We Need an RDBMS? (The ACID Pillars)',
      subtitle: 'How modern databases guarantee 100% financial and transactional reliability',
      intro: 'In production systems (banking, e-commerce, healthcare), a software glitch or power failure during a multi-step operation cannot be allowed to lose records or create phantom balances. RDBMS engines enforce ACID properties:',
      acidPillars: [
        {
          letter: 'A',
          name: 'Atomicity',
          badgeColor: 'blue',
          desc: 'All or Nothing. If a transaction has 4 steps and step 3 fails, the entire transaction is rolled back automatically with zero partial writes.'
        },
        {
          letter: 'C',
          name: 'Consistency',
          badgeColor: 'emerald',
          desc: 'Integrity Rules. Data must conform to all schema constraints (Primary Key uniqueness, Foreign Keys, data types) before and after execution.'
        },
        {
          letter: 'I',
          name: 'Isolation',
          badgeColor: 'indigo',
          desc: 'Independent Sessions. Concurrent transactions run independently without seeing half-completed changes from other users.'
        },
        {
          letter: 'D',
          name: 'Durability',
          badgeColor: 'purple',
          desc: 'Permanent Etch. Once a transaction is committed, changes are guaranteed to survive server crashes, restarts, or power failures.'
        }
      ]
    },
    syntax: `-- Relational Model in Action: Parent & Child Tables linked via Foreign Key
-- 1. Parent Entity (departments)
CREATE TABLE departments (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Child Entity (employees) with Referential Integrity Constraint
CREATE TABLE employees (
    employee_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
);`,
    example: `-- Inserting connected records demonstrating referential integrity:
INSERT INTO departments (department_name) VALUES ('Engineering'), ('Finance');

-- Valid insert linked to existing department #1
INSERT INTO employees (full_name, department_id) VALUES ('Alex Chen', 1);

-- This insert will FAIL because department #99 does not exist!
-- INSERT INTO employees (full_name, department_id) VALUES ('Ghost User', 99);`,
    note: 'In an RDBMS, foreign keys act as guardrails: you cannot insert a child record pointing to a non-existent parent, preventing orphaned and corrupted data.',
    mistakes: [
      {
        title: 'Storing relational data in flat CSV or JSON files for mission-critical apps',
        badCode: '// Writing directly to data.json without locking or transaction logs\nfs.writeFileSync("db.json", JSON.stringify(data));',
        explanation: 'Files lack ACID compliance. If the server loses power mid-write, the entire JSON file is corrupted with zero recovery.'
      },
      {
        title: 'Confusing generic DBMS with relational RDBMS',
        badCode: '-- Thinking a spreadsheet or XML file is an RDBMS',
        explanation: 'Spreadsheets lack declarative integrity constraints, multi-version concurrency control (MVCC), and structured relational foreign keys.'
      }
    ],
    keyPoints: [
      'File systems have high redundancy and lack crash recovery; RDBMS eliminates redundancy and enforces ACID',
      'RDBMS organizes data into typed 2D tables linked by Primary and Foreign Keys',
      'ACID guarantees ensure data is never lost or partially saved during server crashes',
      'Relational integrity prevents orphaned records at the database engine layer'
    ],
    prevTopicName: null,
    prevTopicId: null,
    nextTopicName: 'Tables, Rows, Columns & Schema',
    nextTopicId: 'top-01-02'
  },

  'top-01-02': {
    id: 'top-01-02',
    moduleId: 'mod-01',
    chapterNumber: 0,
    title: 'Tables, Rows, Columns & Schema',
    subtitle: 'The 4 Core Building Blocks of Every Relational Database',
    intro: 'To understand how an RDBMS works, think of an Excel spreadsheet, but with strict mathematical rules. You cannot put random text into a date column, rows must have a unique identifier, and every entity is strictly defined by an architectural blueprint called a Schema.',
    infographicImage: '/table-row-column-guide.jpg',
    infographicTitle: 'Beginner Visual Guide: What is a Table, Row, Column, and Cell?',
    infographicCaption: 'Notice the Students table: A Column runs vertically defining the attribute (e.g. Email), a Row runs horizontally representing a complete student record, and a Cell is a single data value.',
    structuralDefinitions: [
      {
        term: '1. Database',
        color: 'blue',
        definition: 'The outer physical container holding all tables, indexes, views, and security permissions for an entire application (e.g. school_management_db).'
      },
      {
        term: '2. Schema',
        color: 'indigo',
        definition: 'The architectural blueprint. It defines table names, column data types, character limits, nullability, default values, and foreign key relationships.'
      },
      {
        term: '3. Table (Entity)',
        color: 'emerald',
        definition: 'A 2D structured grid representing a single real-world entity (e.g. students, products, orders, invoices).'
      },
      {
        term: '4. Column (Field / Attribute)',
        color: 'amber',
        definition: 'A vertical category defining a specific property (e.g. first_name, email, price, created_at) along with its strict data type.'
      },
      {
        term: '5. Row (Record / Tuple)',
        color: 'purple',
        definition: 'A horizontal entry representing one single real-world instance (e.g. Student #101: Alex Rivera, age 21, Computer Science).'
      },
      {
        term: '6. Cell (Atomic Value)',
        color: 'teal',
        definition: 'The intersection of one row and one column holding a single, atomic data point (e.g. alex@gmail.com).'
      }
    ],
    syntax: `-- Inspecting the structure of an existing table:
DESCRIBE students;

-- Viewing the exact CREATE TABLE blueprint generated by MySQL:
SHOW CREATE TABLE students;

-- Listing all tables in current database:
SHOW TABLES;`,
    example: `-- Creating a clean, well-structured table with all core components:
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT, -- Primary Key (Unique per row)
    first_name VARCHAR(50) NOT NULL,           -- Attribute: Text up to 50 chars
    last_name VARCHAR(50) NOT NULL,            -- Attribute: Text up to 50 chars
    email VARCHAR(100) UNIQUE,                 -- Attribute: Must be unique across all rows
    admission_date DATE DEFAULT (CURRENT_DATE),-- Attribute: Calendar date
    cgpa DECIMAL(3,2) DEFAULT 0.00             -- Attribute: Precise decimal (e.g. 3.85)
);`,
    note: 'In relational design, each cell must be atomic (containing only a single value). Never store comma-separated lists like "reading, coding, gaming" inside a single cell—create a separate relationship table instead!',
    mistakes: [
      {
        title: 'Storing multiple values in a single cell',
        badCode: "INSERT INTO students (name, phone_numbers) VALUES ('Alex', '9876543210, 9123456780');",
        explanation: 'Violates First Normal Form (1NF). Makes searching or indexing individual phone numbers extremely slow.'
      },
      {
        title: 'Confusing a Schema with a Database',
        badCode: '-- Assuming Schema and Database are completely unrelated concepts',
        explanation: 'In MySQL, SCHEMA and DATABASE are exact synonyms (CREATE SCHEMA is identical to CREATE DATABASE). In PostgreSQL and Oracle, a database can contain multiple schemas.'
      }
    ],
    keyPoints: [
      'Database is the storage container; Schema is the architectural blueprint',
      'Tables represent real-world entities (students, courses, payments)',
      'Columns define data types and constraints; Rows represent individual records',
      'Cells must hold atomic values for optimal querying and indexing'
    ],
    prevTopicName: 'DBMS vs RDBMS',
    prevTopicId: 'top-01-01',
    nextTopicName: 'SQL Command Types',
    nextTopicId: 'top-01-03'
  },

  'top-01-03': {
    id: 'top-01-03',
    moduleId: 'mod-01',
    chapterNumber: 0,
    title: 'SQL Command Types',
    subtitle: 'The 5 Command Families: DDL, DML, DQL, DCL, and TCL',
    intro: 'SQL is not just a single command language. It is divided into 5 specialized command families, each responsible for a distinct layer of database management: defining structures, manipulating records, querying data, managing permissions, and controlling transaction boundaries.',
    commandTypesGrid: [
      {
        category: 'DDL',
        fullForm: 'Data Definition Language',
        target: 'Schema / Structure',
        purpose: 'Creates, alters, renames, drops, and truncates database containers and table blueprints. Auto-committed immediately.',
        commands: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'],
        rollback: 'No (Auto-commit)',
        example: 'CREATE TABLE users (id INT PRIMARY KEY);'
      },
      {
        category: 'DML',
        fullForm: 'Data Manipulation Language',
        target: 'Row Records',
        purpose: 'Inserts new rows, modifies existing cell values, and deletes rows from tables. Can be committed or rolled back.',
        commands: ['INSERT', 'UPDATE', 'DELETE'],
        rollback: 'Yes (via TCL)',
        example: "INSERT INTO users (id) VALUES (1);"
      },
      {
        category: 'DQL',
        fullForm: 'Data Query Language',
        target: 'Data Retrieval',
        purpose: 'Fetches and filters records from one or more tables without altering the underlying data in storage.',
        commands: ['SELECT'],
        rollback: 'Read-only (N/A)',
        example: 'SELECT * FROM users WHERE id = 1;'
      },
      {
        category: 'DCL',
        fullForm: 'Data Control Language',
        target: 'Permissions & Security',
        purpose: 'Grants or revokes administrative rights and table-level access privileges to database user accounts.',
        commands: ['GRANT', 'REVOKE'],
        rollback: 'No (Auto-commit)',
        example: 'GRANT SELECT ON company.* TO "analyst"@"localhost";'
      },
      {
        category: 'TCL',
        fullForm: 'Transaction Control Language',
        target: 'Transaction Boundaries',
        purpose: 'Controls transactions to guarantee ACID compliance. Commits changes permanently or rolls back on failure.',
        commands: ['COMMIT', 'ROLLBACK', 'SAVEPOINT'],
        rollback: 'Controls Rollbacks',
        example: 'COMMIT; -- Saves transaction permanently'
      }
    ],
    syntax: `-- 1. DDL: Create Table
CREATE TABLE accounts (account_id INT PRIMARY KEY, balance DECIMAL(10,2));

-- 2. DML: Insert row
INSERT INTO accounts VALUES (101, 5000.00);

-- 3. DQL: Query data
SELECT * FROM accounts WHERE account_id = 101;

-- 4. TCL: Save transaction
COMMIT;`,
    example: `-- Real-World Bank Transfer Transaction (DML + TCL):
START TRANSACTION;

-- Step 1: Deduct $500 from Alice (Account 101)
UPDATE accounts SET balance = balance - 500.00 WHERE account_id = 101;

-- Step 2: Add $500 to Bob (Account 102)
UPDATE accounts SET balance = balance + 500.00 WHERE account_id = 102;

-- Step 3: If everything succeeds, commit permanently:
COMMIT;

-- If an error happened, rollback would undo both updates:
-- ROLLBACK;`,
    note: 'Remember: DDL commands (CREATE, ALTER, DROP, TRUNCATE) issue an implicit auto-commit in MySQL! You cannot wrap a TRUNCATE TABLE in a transaction and expect ROLLBACK to restore the data.',
    mistakes: [
      {
        title: 'Believing TRUNCATE is DML and can be rolled back',
        badCode: 'START TRANSACTION;\nTRUNCATE TABLE orders;\nROLLBACK; -- Orders table remains empty!',
        explanation: 'TRUNCATE is DDL, not DML. It deallocates disk pages immediately and issues an implicit commit.'
      },
      {
        title: 'Running UPDATE or DELETE without a WHERE clause',
        badCode: 'UPDATE employees SET salary = 100000; -- Changes ALL employees in table!',
        explanation: 'Without a WHERE filter, DML modifies every row in the table.'
      }
    ],
    keyPoints: [
      'DDL modifies table structures (CREATE, ALTER, DROP, TRUNCATE) and auto-commits',
      'DML modifies row records (INSERT, UPDATE, DELETE) and can be rolled back',
      'DQL retrieves records (SELECT) and never alters stored data',
      'DCL manages security (GRANT, REVOKE)',
      'TCL manages transaction boundaries (COMMIT, ROLLBACK, SAVEPOINT)'
    ],
    prevTopicName: 'Tables, Rows, Columns & Schema',
    prevTopicId: 'top-01-02',
    nextTopicName: 'Install MySQL & Workbench',
    nextTopicId: 'top-01-04'
  },

  'top-01-04': {
    id: 'top-01-04',
    moduleId: 'mod-01',
    chapterNumber: 0,
    title: 'Install MySQL & Workbench',
    subtitle: 'Zero-to-Hero Installation Guide for Windows & macOS with Download Links',
    intro: 'To write and practice SQL on your computer, you need two software components: MySQL Server (the background engine that manages database storage, memory, and indexing) and MySQL Workbench (the visual GUI client where you write queries and design ER diagrams).',
    infographicImage: '/mysql-workbench-architecture.jpg',
    infographicTitle: 'Client-Server Architecture: MySQL Server vs MySQL Workbench',
    infographicCaption: 'Notice how MySQL Workbench communicates with the background MySQL Server process on localhost (127.0.0.1) via TCP/IP Port 3306.',
    osDownloadPanels: {
      windows: {
        osName: 'Windows (10 / 11)',
        packageTitle: 'MySQL Community Installer (All-in-One MSI)',
        downloadUrl: 'https://dev.mysql.com/downloads/installer/',
        recommendedFile: 'mysql-installer-community-8.0.xx.msi (~450 MB)',
        badge: 'Official Oracle Portal',
        stepsOverview: 'Includes MySQL Server 8.0, MySQL Workbench, Shell, and Sample Databases in one single offline setup.'
      },
      macos: {
        osName: 'macOS (Apple Silicon M1/M2/M3 & Intel)',
        packageTitle: 'MySQL Server DMG + Workbench DMG',
        serverLink: 'https://dev.mysql.com/downloads/mysql/',
        workbenchLink: 'https://dev.mysql.com/downloads/workbench/',
        brewCommand: 'brew install mysql && brew install --cask mysqlworkbench && brew services start mysql',
        badge: 'DMG & Homebrew Support',
        stepsOverview: 'Select ARM64 DMG for Apple Silicon (M1/M2/M3) or x86_64 DMG for Intel Macs.'
      }
    },
    setupGuide: [
      {
        step: 1,
        title: 'Download MySQL Community Installer',
        description: 'Navigate to the official MySQL Community Downloads page and download the MySQL Installer for your operating system.',
        code: '-- Official Windows Installer link:\nhttps://dev.mysql.com/downloads/installer/\n\n-- Official macOS Server link:\nhttps://dev.mysql.com/downloads/mysql/',
        tip: 'Choose the larger offline installer (mysql-installer-community-*.msi) so you don’t need an active internet connection during setup.'
      },
      {
        step: 2,
        title: 'Run Setup & Select "Developer Default"',
        description: 'Launch the downloaded installer. Choose the "Developer Default" setup type. This automatically bundles MySQL Server 8.0, MySQL Workbench, MySQL Shell, and connectors.',
        tip: 'If port 3306 is already taken by another service (like XAMPP or MariaDB), you can assign port 3307.'
      },
      {
        step: 3,
        title: 'Set Your Root Password (CRITICAL)',
        description: 'During configuration, you will be prompted to create a password for the "root" administrative account. Write this password down in a secure location!',
        code: '-- Standard default connection parameters:\nHost: 127.0.0.1 (localhost)\nPort: 3306\nUsername: root\nPassword: [your-chosen-password]',
        tip: 'Do not forget this password! Resetting the root password later requires terminating background services and modifying initial grant tables.'
      },
      {
        step: 4,
        title: 'Launch MySQL Workbench & Test Handshake',
        description: 'Open MySQL Workbench from your Start Menu or Applications folder. Click on "Local instance MySQL80". Enter your root password and execute the verification query below.',
        code: `SELECT VERSION() AS mysql_version, CURRENT_TIMESTAMP AS server_time, USER() AS current_user;`,
        tip: 'If you see version 8.0.x returned in the result grid, your MySQL local server is 100% operational!'
      },
      {
        step: 5,
        title: 'Create Your First Practice Database',
        description: 'Execute this introductory query in Workbench to initialize a sandbox environment for your SQL exercises:',
        code: `CREATE DATABASE IF NOT EXISTS day1_sql_setup;
USE day1_sql_setup;

CREATE TABLE IF NOT EXISTS welcome_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message VARCHAR(100) NOT NULL,
    setup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO welcome_status (message) 
VALUES ('MySQL Server and Workbench Setup Completed Successfully!');

SELECT * FROM welcome_status;`,
        tip: 'Use Ctrl + Enter (Windows) or Cmd + Enter (macOS) in Workbench to execute the query line under your cursor.'
      }
    ],
    syntax: `-- Test Server Connection via Command Prompt / Terminal:
mysql -u root -p

-- Enter your root password when prompted.
-- Once connected, run:
SHOW DATABASES;
STATUS;`,
    example: `-- Simple verification script to run in Workbench Query Tab:
SELECT 
    'MySQL 8.0' AS database_engine,
    '3306' AS default_port,
    'Connected' AS connection_status;`,
    note: 'MySQL Server runs continuously as a background Windows Service (named MySQL80) or macOS launchd service, listening on port 3306.',
    mistakes: [
      {
        title: 'Forgetting the MySQL root password',
        badCode: '-- Entering wrong root password causes "Access denied for user root@localhost"',
        explanation: 'Always record your password during setup. Recovery requires starting mysqld with --skip-grant-tables.'
      },
      {
        title: 'Port 3306 Conflict with XAMPP or MariaDB',
        badCode: '-- Error: Port 3306 is already in use by another process',
        explanation: 'If XAMPP or MariaDB is running, stop it via Task Manager/Services or configure MySQL Server to listen on port 3307.'
      }
    ],
    keyPoints: [
      'MySQL Server is the background database engine; MySQL Workbench is the graphical development client',
      'Standard connection settings: Host = 127.0.0.1 (localhost), Port = 3306, User = root',
      'Always securely record your root password during installation',
      'Run SELECT VERSION(); to immediately verify client-server connectivity'
    ],
    prevTopicName: 'SQL Command Types',
    prevTopicId: 'top-01-03',
    nextTopicName: 'CREATE (DDL Deep Dive)',
    nextTopicId: 'top-create-table'
  }
};
