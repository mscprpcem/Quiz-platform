// =========================================================================
// 📘 CHAPTER 4: DML COMMANDS (DATA MANIPULATION LANGUAGE)
// =========================================================================

export const CHAPTER_3_METADATA = {
  id: 'mod-04',
  number: 4,
  title: 'Data Manipulation Language (DML)',
  shortTitle: 'DML Operations',
  status: 'available',
  badge: 'Live',
  releaseDate: 'Available Now',
  description: 'Master row-level data manipulation: INSERT INTO (single & multi-row batching), UPDATE with strict WHERE safety, DELETE vs TRUNCATE, SELECT retrieval fundamentals, and 50 standard practice questions on the employees table.',
  topics: [
    {
      id: 'top-04-01',
      title: 'What is DML & Core Characteristics',
      lessonCode: '4.1',
      summary: 'Understand what DML is, how it works on DATA rather than structure, transaction rollback capabilities, and the 4 primary commands (INSERT, UPDATE, DELETE, SELECT).',
      estimatedTime: '15 min'
    },
    {
      id: 'top-04-02',
      title: 'INSERT Command & Data Ingestion Deep Dive',
      lessonCode: '4.2',
      summary: 'Learn what INSERT does, single-row inserts, explicit column lists (best practice), multi-row bulk batching, quoting rules, and inserting from queries.',
      estimatedTime: '25 min'
    },
    {
      id: 'top-04-03',
      title: 'UPDATE Command & Safe Modification',
      lessonCode: '4.3',
      summary: 'Modify existing data safely with WHERE clauses, update multiple columns simultaneously, apply computed arithmetic, and avoid catastrophic full-table updates.',
      estimatedTime: '20 min'
    },
    {
      id: 'top-04-04',
      title: 'DELETE Command vs TRUNCATE',
      lessonCode: '4.4',
      summary: 'Execute row-level deletions with WHERE conditions, inspect the deep comparison table between DELETE (DML) and TRUNCATE (DDL), and prevent accidental data loss.',
      estimatedTime: '20 min'
    },
    {
      id: 'top-04-05',
      title: 'SELECT Command & Execution Order',
      lessonCode: '4.5',
      summary: 'Understand SELECT as a DML retrieval command, column projection, basic WHERE filtering, and the crucial execution order: FROM → WHERE → SELECT.',
      estimatedTime: '20 min'
    },
    {
      id: 'top-04-06',
      title: '50 DML Practice Questions Bank',
      lessonCode: '4.6',
      summary: '50 standard interview and coding practice problems on the employees table (emp_id, name, department, salary, city) with pagination, practice buttons, and eye solution reveals.',
      estimatedTime: '45 min'
    }
  ]
};

export const CHAPTER_3_TOPICS = {
  // =========================================================================
  // LESSON 4.1: WHAT IS DML?
  // =========================================================================
  'top-04-01': {
    id: 'top-04-01',
    chapterNumber: 4,
    lessonNumber: 1,
    lessonCode: '4.1',
    title: 'What is DML (Data Manipulation Language)?',
    subtitle: 'Working on Table Data, Transaction Rollbacks & The Core DML Taxonomy',
    intro: 'DML (Data Manipulation Language) commands are SQL statements used to insert, modify, delete, and retrieve data stored inside database tables. The most fundamental rule to remember in database engineering is: DML works on the DATA itself, never on the structure of the table. While DDL creates the schema blueprint, DML populates and maintains the actual rows.',

    comparisonTable: {
      title: 'DML Commands Taxonomy & Purpose',
      badge: 'Interview Gold',
      headers: ['Command', 'Category', 'Primary Purpose', 'Transaction Safe (Rollbackable)?'],
      rows: [
        {
          feature: 'INSERT',
          values: ['DML', 'Adds new records/rows into an existing table', 'YES — fully rollbackable in transactions']
        },
        {
          feature: 'UPDATE',
          values: ['DML', 'Modifies values in existing rows matching a condition', 'YES — fully rollbackable in transactions']
        },
        {
          feature: 'DELETE',
          values: ['DML', 'Removes specific rows matching a condition', 'YES — fully rollbackable in transactions']
        },
        {
          feature: 'SELECT',
          values: ['DML / DQL', 'Retrieves and filters records for user inspection', 'Read-Only (Does not mutate persistent data)']
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'Core Principle: DML Works on Data, NOT Structure',
        badge: 'Fundamental Concept',
        explanation: 'DML statements manipulate row values inside disk storage blocks. Unlike DDL statements (such as CREATE or ALTER), DML does not alter table columns, datatypes, or constraints.',
        code: `-- DML: Inserts a single record into the existing table structure
INSERT INTO employees (emp_id, name, department, salary, city)
VALUES (1, 'Amit', 'IT', 60000, 'Mumbai');`
      },
      {
        step: 2,
        title: 'Interview Concept: Why is SELECT considered DML?',
        badge: 'Top Interview Question',
        explanation: 'In the official ANSI/ISO SQL standard, SELECT is categorized as part of Data Manipulation Language (DML) because it queries and manipulates in-memory relational projections of data. Some textbooks refer to SELECT as DQL (Data Query Language), but in technical interviews, stating that SELECT is part of DML demonstrates deep standard compliance.',
        code: `-- SELECT retrieves and manipulates data representations
SELECT name, salary, salary * 1.10 AS projected_salary
FROM employees
WHERE department = 'IT';`
      },
      {
        step: 3,
        title: 'Transaction Safety: DML Can Be Rolled Back',
        badge: 'ACID Property',
        explanation: 'Unlike DDL commands which auto-commit immediately, DML commands (INSERT, UPDATE, DELETE) operate inside transaction blocks. If a mistake occurs, issuing ROLLBACK restores the data to its exact previous state.',
        code: `-- Transaction safety demonstration
START TRANSACTION;

-- Modifying data
UPDATE employees SET salary = salary + 5000 WHERE department = 'HR';

-- If validation fails, undo everything completely:
ROLLBACK;`
      }
    ],

    mistakes: [
      {
        title: 'Confusing DML with DDL Operations',
        badCode: `ALTER TABLE employees DROP COLUMN salary; -- This is DDL, NOT DML!`,
        explanation: 'ALTER TABLE modifies the schema structure (DDL). To modify or remove data values without changing structure, use UPDATE or DELETE (DML).'
      },
      {
        title: 'Assuming SELECT Cannot Be Part of DML',
        badCode: `-- Assuming only INSERT/UPDATE/DELETE belong to DML`,
        explanation: 'In ANSI SQL specification, SELECT is the retrieval component of DML. Knowing this distinction is a classic test in senior database interviews.'
      }
    ],

    keyPoints: [
      'DML works strictly on table DATA, never on table structure.',
      'The 4 core DML commands are INSERT, UPDATE, DELETE, and SELECT.',
      'DML operations can be committed or rolled back within ACID transactions.',
      'SELECT is officially categorized under DML in the ANSI SQL standard.'
    ],

    note: 'Key Takeaway for Interviews: DDL defines the container (columns, constraints, tables); DML manages the contents inside the container (rows, values).'
  },

  // =========================================================================
  // LESSON 4.2: INSERT COMMAND & DATA INGESTION DEEP DIVE
  // =========================================================================
  'top-04-02': {
    id: 'top-04-02',
    chapterNumber: 4,
    lessonNumber: 2,
    lessonCode: '4.2',
    title: 'INSERT Command & Data Ingestion Deep Dive',
    subtitle: 'What INSERT Does, Single-Row, Explicit Columns, Multi-Row Batching & Data Quoting',
    intro: 'The INSERT statement is the primary DML command used to add new rows (records) into an existing table. Whether you are adding a single new customer, batch-importing a CSV file with thousands of products, or copying records from another table, mastering how INSERT works, value sequencing, and quoting rules is essential for every developer.',

    comparisonTable: {
      title: 'INSERT Ingestion Strategies Compared',
      badge: 'Architecture Matrix',
      headers: ['Ingestion Method', 'Syntax Structure', 'Best Use Case & Throughput'],
      rows: [
        {
          feature: 'Single-Row (Positional)',
          values: [
            'INSERT INTO table VALUES (v1, v2, v3);',
            'Quick scripts/testing only. Dangerous in production because any schema column change breaks the query.'
          ]
        },
        {
          feature: 'Single-Row (Explicit Columns)',
          values: [
            'INSERT INTO table (c1, c2, c3) VALUES (v1, v2, v3);',
            'Universal production standard for individual application mutations (e.g. user signups).'
          ]
        },
        {
          feature: 'Multi-Row Batch Insert',
          values: [
            'INSERT INTO table (c1, c2) VALUES (r1_1, r1_2), (r2_1, r2_2);',
            'High-throughput bulk ingestion. Reduces network latency and disk I/O log flush overhead by over 80%.'
          ]
        },
        {
          feature: 'INSERT INTO ... SELECT',
          values: [
            'INSERT INTO archive (c1, c2) SELECT c1, c2 FROM live_table;',
            'Internal zero-copy table-to-table migrations without transferring bytes over the network.'
          ]
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'What does INSERT do? Single-Row Insert (All Columns)',
        badge: 'Basic Syntax',
        explanation: 'When you run INSERT INTO table_name VALUES (...), the database engine appends a new physical row record to the tables datafile. In this positional syntax, the order of values in parentheses must match the exact order of columns defined in the table schema.',
        code: `-- Syntax: INSERT INTO table_name VALUES (val1, val2, val3, ...);
-- Example: Inserting one employee record into all 5 columns
INSERT INTO employees
VALUES (6, 'Rahul', 'IT', 55000, 'Pune');`
      },
      {
        step: 2,
        title: 'Best Practice: INSERT with Explicit Column Names',
        badge: 'Recommended Best Practice',
        explanation: 'Always explicitly declare the target columns before the VALUES keyword. This guarantees that even if a future migration adds new columns or changes column order, your query continues to write the correct data into the correct fields.',
        code: `-- Recommended: Explicitly list target columns before VALUES
INSERT INTO employees (emp_id, name, department, salary, city)
VALUES (7, 'Neha', 'HR', 48000, 'Mumbai');`
      },
      {
        step: 3,
        title: 'Multi-Row Batch Insert (Inserting Multiple Records in One Query)',
        badge: 'Bulk High Throughput',
        explanation: 'You can insert multiple rows in a single operation by separating each row tuple with a comma. Instead of executing 3 separate network round-trips and 3 transaction log flushes, the database engine commits all rows in a single atomic batch.',
        code: `-- Multi-Row Insert: Inserts 3 employees in 1 single statement
INSERT INTO employees (emp_id, name, department, salary, city) VALUES
  (8, 'Arjun', 'Finance', 65000, 'Delhi'),
  (9, 'Meena', 'IT', 72000, 'Mumbai'),
  (10, 'Suresh', 'HR', 38000, 'Pune');`
      },
      {
        step: 4,
        title: 'Data Quoting Rules: Text/Dates in Single Quotes vs Numbers without Quotes',
        badge: 'Quoting Rules',
        explanation: 'In SQL: Text strings and dates MUST always be enclosed in single quotes (\'Mumbai\', \'IT\'). Numeric values (integers, decimals) must NEVER be quoted. Using double quotes in SQL designates database identifiers (like table names), not string literals.',
        code: `-- Text in 'single quotes'; Numbers without quotes
INSERT INTO employees (emp_id, name, department, salary, city)
VALUES (11, 'Pooja', 'IT', 61000, 'Delhi');`
      },
      {
        step: 5,
        title: 'Inserting Data with Default Column Values & Generated Keys',
        badge: 'Default Values',
        explanation: 'If a table column has a DEFAULT constraint (such as created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) or an AUTO_INCREMENT primary key, simply omit that column from your column list. The database engine automatically generates and assigns the value.',
        code: `-- Omitting columns that have defaults or auto-generated keys
INSERT INTO employees (emp_id, name, department, salary, city)
VALUES (12, 'Ramesh', 'Finance', 54000, 'Mumbai');`
      },
      {
        step: 6,
        title: 'Ingesting Data from Another Table (INSERT INTO ... SELECT)',
        badge: 'ETL Query Ingestion',
        explanation: 'You can populate a table dynamically by selecting records from another table using INSERT INTO ... SELECT. This is widely used in data archiving, reporting tables, and backup pipelines.',
        code: `-- Copying all IT department employees into an archive table
INSERT INTO it_employees_backup (emp_id, name, department, salary, city)
SELECT emp_id, name, department, salary, city
FROM employees
WHERE department = 'IT';`
      }
    ],

    mistakes: [
      {
        title: 'Omitting Target Column Names in Production Backend Code',
        badCode: `INSERT INTO employees VALUES (1, 'Amit', 'IT', 60000, 'Mumbai');`,
        explanation: 'If another developer alters the table by adding a column (like `join_date`) or reordering columns, positional inserts will immediately fail with a "Column count does not match value count" error.'
      },
      {
        title: 'Using Double Quotes Instead of Single Quotes for Strings',
        badCode: `INSERT INTO employees VALUES (1, "Amit", "IT", 60000, "Mumbai");`,
        explanation: 'In ANSI SQL, double quotes are reserved for schema identifiers. String data must ALWAYS be wrapped in single quotes: \'Amit\', \'IT\', \'Mumbai\'.'
      },
      {
        title: 'Mismatched Column and Value Positions',
        badCode: `INSERT INTO employees (emp_id, name, department, salary, city)
VALUES (1, 'Amit', 60000, 'IT', 'Mumbai');`,
        explanation: 'Here 60000 was supplied where string department was expected, and string "IT" where numeric salary was expected, causing a datatype conversion error.'
      }
    ],

    keyPoints: [
      'INSERT INTO adds new physical rows to an existing table.',
      'Always list target column names explicitly: INSERT INTO table (c1, c2) VALUES (v1, v2).',
      'Use multi-row comma-separated value tuples for high-performance batch data loading.',
      'Strings and dates require single quotes (\'text\'); numeric numbers must not be quoted.',
      'Use INSERT INTO ... SELECT for server-side zero-copy data migration between tables.'
    ],

    note: 'Engineering Benchmark: A single multi-row batch insert containing 500 rows executes in roughly the same time as 2 single-row inserts, yielding a 250x write throughput gain in production systems.'
  },

  // =========================================================================
  // LESSON 4.3: UPDATE COMMAND & SAFE MODIFICATION
  // =========================================================================
  'top-04-03': {
    id: 'top-04-03',
    chapterNumber: 4,
    lessonNumber: 3,
    lessonCode: '4.3',
    title: 'UPDATE Command & Safe Modification',
    subtitle: 'Modifying Existing Rows, Strict WHERE Conditions & Atomic Expressions',
    intro: 'The UPDATE command is used to modify existing data in a table. It specifies which columns to change in the SET clause and which rows to target using the WHERE clause. The WHERE clause is the most critical safety filter in SQL: without a WHERE clause, EVERY row in the entire table will be updated!',

    comparisonTable: {
      title: 'UPDATE Mutation Patterns',
      badge: 'Syntax Reference',
      headers: ['Pattern', 'SQL Example', 'Target Scope'],
      rows: [
        {
          feature: 'Single Record Update',
          values: ['UPDATE employees SET salary = 65000 WHERE emp_id = 1;', 'Exact single row targeted by Primary Key']
        },
        {
          feature: 'Multi-Column Update',
          values: ['UPDATE employees SET salary = 70000, city = \'Delhi\' WHERE emp_id = 3;', 'Modifies multiple fields on targeted row']
        },
        {
          feature: 'Computed Arithmetic',
          values: ['UPDATE employees SET salary = salary + 5000 WHERE department = \'HR\';', 'In-place mathematical increment']
        },
        {
          feature: 'Percentage Raise',
          values: ['UPDATE employees SET salary = salary * 1.10 WHERE department = \'IT\';', 'Scales column value by relative multiplier']
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'Targeted Single-Row Update with Primary Key Filter',
        badge: 'Targeted Update',
        explanation: 'Filter with the primary key (emp_id = 2) to ensure that only the specific intended employee record is updated.',
        code: `-- Update salary to 60000 for specific employee where emp_id is 2
UPDATE employees
SET salary = 60000
WHERE emp_id = 2;`
      },
      {
        step: 2,
        title: 'Updating Multiple Columns Simultaneously',
        badge: 'Multi-Column',
        explanation: 'Separate multiple column assignments with commas in the SET clause. You can update different data types (like salary and city) in the same statement.',
        code: `-- Update both salary and city for employee where emp_id is 3
UPDATE employees
SET salary = 70000, city = 'Delhi'
WHERE emp_id = 3;`
      },
      {
        step: 3,
        title: 'Computed Mathematical Updates (In-Place Arithmetic)',
        badge: 'Computed Update',
        explanation: 'Reference the current column value to perform atomic in-place increments (e.g., salary = salary + 5000 or salary * 1.10).',
        code: `-- Increase salary by 5000 for all employees in HR department
UPDATE employees
SET salary = salary + 5000
WHERE department = 'HR';`
      },
      {
        step: 4,
        title: 'Percentage-Based Raise with Calculation (10% Hike)',
        badge: 'Percentage Update',
        explanation: 'Multiply the existing column by a factor (1.10 for a 10% raise) to apply relative adjustments across all matching rows.',
        code: `-- 10% salary hike for all IT department employees
UPDATE employees
SET salary = salary * 1.10
WHERE department = 'IT';`
      },
      {
        step: 5,
        title: 'Updating Records by Location (Batch City Update)',
        badge: 'Categorical Update',
        explanation: 'Update all employees currently working in Pune to Delhi in a single batch.',
        code: `-- Transfer all employees currently working in Pune to Delhi
UPDATE employees
SET city = 'Delhi'
WHERE city = 'Pune';`
      }
    ],

    mistakes: [
      {
        title: 'The Catastrophic Missing WHERE Clause',
        badCode: `UPDATE employees SET salary = 50000;`,
        explanation: 'Without a WHERE clause, the database will overwrite the salary of EVERY employee in the table to 50000, destroying individual compensation data.'
      },
      {
        title: 'Using AND to Separate Column Assignments in SET',
        badCode: `UPDATE employees SET salary = 60000 AND city = 'Mumbai' WHERE emp_id = 2;`,
        explanation: 'Columns in the SET clause MUST be separated by commas (,), never the keyword AND. Writing AND evaluates a boolean comparison expression.'
      }
    ],

    keyPoints: [
      'The WHERE clause is MANDATORY in production to prevent unintended table-wide data overwrites.',
      'Separate multiple column modifications with commas, not the keyword AND.',
      'Use atomic in-place expressions (salary = salary + 5000) to prevent application race conditions.',
      'Always run SELECT * FROM table WHERE condition first to verify the target rows before updating.'
    ],

    note: 'Golden Rule: When writing an UPDATE statement, write the WHERE clause first, then write the SET clause!'
  },

  // =========================================================================
  // LESSON 4.4: DELETE COMMAND VS TRUNCATE
  // =========================================================================
  'top-04-04': {
    id: 'top-04-04',
    chapterNumber: 4,
    lessonNumber: 4,
    lessonCode: '4.4',
    title: 'DELETE Command vs TRUNCATE',
    subtitle: 'Row-Level Deletions, WHERE Filtering & The Technical Architecture Comparison',
    intro: 'The DELETE statement is a DML command used to remove existing records from a table. Just like UPDATE, DELETE requires a WHERE clause to target specific records. Removing all records using DELETE is very different from using TRUNCATE (a DDL command). Understanding this distinction is one of the most frequently tested topics in database interviews.',

    comparisonTable: {
      title: 'Deep Comparison: DELETE (DML) vs TRUNCATE (DDL)',
      badge: 'Architecture Matrix',
      headers: ['Feature', 'DELETE FROM table', 'TRUNCATE TABLE'],
      rows: [
        {
          feature: 'Command Classification',
          values: ['DML (Data Manipulation Language)', 'DDL (Data Definition Language)']
        },
        {
          feature: 'WHERE Clause Filter',
          values: ['ALLOWED — deletes only matching rows', 'NOT ALLOWED — always removes all rows']
        },
        {
          feature: 'Execution Speed',
          values: ['Slower — deletes and logs row-by-row', 'Much faster — deallocates physical data pages']
        },
        {
          feature: 'Transaction Rollback',
          values: ['Can be rolled back within transactions', 'Cannot be rolled back in MySQL/Oracle']
        },
        {
          feature: 'Triggers Execution',
          values: ['Fires ON DELETE row-level triggers', 'Does NOT fire row triggers']
        },
        {
          feature: 'Scope of Deletion',
          values: ['Deletes selected rows matching filter', 'Deletes all rows and resets auto-increment']
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'Targeted Row Deletion by Primary Key',
        badge: 'Single Row Delete',
        explanation: 'Remove a specific employee record by their unique primary key emp_id.',
        code: `-- Delete specific employee where emp_id is 5
DELETE FROM employees
WHERE emp_id = 5;`
      },
      {
        step: 2,
        title: 'Conditional Batch Deletion by Department',
        badge: 'Batch Delete',
        explanation: 'Delete all records that belong to a specific department.',
        code: `-- Delete all employees in Finance department
DELETE FROM employees
WHERE department = 'Finance';`
      },
      {
        step: 3,
        title: 'Deleting with Comparison Operators (< or >)',
        badge: 'Range Filter Delete',
        explanation: 'Remove records that fall below a specific compensation threshold.',
        code: `-- Delete employees with salary less than 40000
DELETE FROM employees
WHERE salary < 40000;`
      },
      {
        step: 4,
        title: 'Deleting by Name Condition',
        badge: 'String Filter Delete',
        explanation: 'Remove records where name matches a specific string.',
        code: `-- Delete employee named Suresh
DELETE FROM employees
WHERE name = 'Suresh';`
      },
      {
        step: 5,
        title: 'Deleting All Rows while Preserving Table Structure',
        badge: 'Full Table Wipe',
        explanation: 'DELETE without a WHERE clause removes all rows from the table, but the table schema, columns, and data types remain intact.',
        code: `-- Deletes all rows, but keeps the table structure intact
DELETE FROM employees;`
      }
    ],

    mistakes: [
      {
        title: 'Forgetting the WHERE Clause in DELETE',
        badCode: `DELETE FROM employees;`,
        explanation: 'Omitting the WHERE clause deletes every single record in the table. Always double-check before running in production.'
      },
      {
        title: 'Attempting to Use a WHERE Clause with TRUNCATE',
        badCode: `TRUNCATE TABLE employees WHERE department = 'IT';`,
        explanation: 'TRUNCATE is a DDL command and does not support WHERE clauses. To delete specific rows, you must use DELETE FROM.'
      }
    ],

    keyPoints: [
      'DELETE is DML, supports WHERE clauses, and logs row deletions so it can be rolled back.',
      'TRUNCATE is DDL, deallocates data pages instantly, resets ID counters, and does not allow WHERE.',
      'Always test your delete condition with a SELECT query first: SELECT * FROM table WHERE condition.',
      'A table with all rows deleted via DELETE still exists and can immediately accept new INSERT queries.'
    ],

    note: 'Interview Tip: If asked "How to delete data faster: DELETE or TRUNCATE?", answer TRUNCATE, because it deallocates disk data pages instead of logging every individual row delete.'
  },

  // =========================================================================
  // LESSON 4.5: SELECT COMMAND & EXECUTION ORDER
  // =========================================================================
  'top-04-05': {
    id: 'top-04-05',
    chapterNumber: 4,
    lessonNumber: 5,
    lessonCode: '4.5',
    title: 'SELECT Command & Execution Order',
    subtitle: 'Data Retrieval Projections, WHERE Filtering & The Execution Hierarchy',
    intro: 'The SELECT statement is used to retrieve records from one or more database tables. As part of DML, it enables projecting specific columns, filtering rows, and sorting outputs. One of the most important concepts for writing optimized queries and cracking technical interviews is understanding the true execution order: the database executes FROM, then WHERE, and only then projects SELECT columns!',

    comparisonTable: {
      title: 'SQL Logical Execution Order (The FROM → WHERE → SELECT Hierarchy)',
      badge: 'Execution Pipeline',
      headers: ['Step Order', 'Clause', 'Engine Action & Responsibility'],
      rows: [
        {
          feature: 'Step 1 (First)',
          values: ['FROM', 'Identifies the target table and loads the data source into memory']
        },
        {
          feature: 'Step 2 (Second)',
          values: ['WHERE', 'Filters out rows that do not satisfy the conditional predicate']
        },
        {
          feature: 'Step 3 (Third)',
          values: ['SELECT', 'Projects the specified columns and calculates aliases']
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'Retrieve All Columns and Rows (SELECT *)',
        badge: 'Full Retrieval',
        explanation: 'The asterisk (*) wildcard instructs the database engine to retrieve all columns defined in the table schema.',
        code: `-- Retrieve all employee records and all columns
SELECT * FROM employees;`
      },
      {
        step: 2,
        title: 'Projecting Specific Columns (name, salary)',
        badge: 'Explicit Projection',
        explanation: 'Specify only the exact columns required by your application. This reduces memory usage and network transfer size.',
        code: `-- Retrieve only employee names and salaries
SELECT name, salary
FROM employees;`
      },
      {
        step: 3,
        title: 'Filtering Rows with a WHERE Clause',
        badge: 'Conditional Retrieval',
        explanation: 'Apply a conditional filter to retrieve only employees belonging to the IT department.',
        code: `-- Retrieve employees working in IT department
SELECT * 
FROM employees
WHERE department = 'IT';`
      },
      {
        step: 4,
        title: 'Range Filtering with BETWEEN',
        badge: 'Range Filter',
        explanation: 'Retrieve employees whose salary falls within an inclusive range between 45000 and 65000.',
        code: `-- Retrieve employees with salary between 45000 and 65000
SELECT * 
FROM employees
WHERE salary BETWEEN 45000 AND 65000;`
      },
      {
        step: 5,
        title: 'Sorting Results (ORDER BY in Descending Order)',
        badge: 'Ordered Output',
        explanation: 'Order results by salary in descending order (DESC) to see the highest earners at the top.',
        code: `-- Retrieve employees sorted by salary in descending order
SELECT * 
FROM employees
ORDER BY salary DESC;`
      }
    ],

    mistakes: [
      {
        title: 'Attempting to Use a SELECT Alias in the WHERE Clause',
        badCode: `SELECT name, salary * 12 AS annual_salary 
FROM employees 
WHERE annual_salary > 600000;`,
        explanation: 'Because the database executes FROM → WHERE → SELECT, the alias `annual_salary` does not yet exist when the WHERE clause is evaluated! You must write `WHERE salary * 12 > 600000`.'
      },
      {
        title: 'Using SELECT * in Production Backend Code',
        badCode: `SELECT * FROM employees;`,
        explanation: 'In production APIs, selecting unused columns wastes network bandwidth and database memory. Always specify the exact columns needed.'
      }
    ],

    keyPoints: [
      'Basic SELECT Syntax: SELECT column1, column2 FROM table_name WHERE condition.',
      'SQL Logical Execution Order: FROM → WHERE → SELECT.',
      'Column aliases declared in SELECT cannot be referenced in the WHERE clause.',
      'Use explicit column names instead of SELECT * for production performance.'
    ],

    note: 'Interview Gold: Remember the order FROM → WHERE → SELECT. Explaining this order in an interview immediately sets you apart as someone who understands how the database engine actually executes SQL.'
  },

  // =========================================================================
  // LESSON 4.6: 50 DML PRACTICE QUESTIONS BANK
  // =========================================================================
  'top-04-06': {
    id: 'top-04-06',
    chapterNumber: 4,
    lessonNumber: 6,
    lessonCode: '4.6',
    title: '50 DML Practice Questions Bank',
    subtitle: 'Comprehensive Hands-on Question Set on the employees Table with Pagination & Solution Reveals',
    intro: 'Put your DML skills to the test with 50 standardized coding and interview questions on the employees table (emp_id, name, department, salary, city). Questions are organized across INSERT (Q1–12), UPDATE (Q13–28), DELETE (Q29–38), and SELECT (Q39–50). Test each query in your Practice Lab before clicking the eye icon to verify your solution!',

    isQuestionsBankTopic: true,
    isQuestionBank: true,
    questionBankType: 'dml',

    sqlSteps: [],
    mistakes: [],
    keyPoints: [
      'Practice all 50 questions step-by-step from INSERT to SELECT.',
      'Test your queries in the Practice Lab by clicking the Practice → button.',
      'Use the eye icon to reveal the verified SQL solution when you are ready to check your work.'
    ],
    note: 'Mastering these 50 questions guarantees total confidence in DML operations for college practical exams, technical coding rounds, and professional database development.'
  }
};
