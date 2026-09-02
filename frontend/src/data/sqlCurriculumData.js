// Comprehensive 21-Module SQL Curriculum, Concepts, Syntax Guidelines, and Multi-Type Questions
import { COMMON_SCHEMAS } from './sqlChallenges';

export const SQL_MODULES = [
  // =========================================================================
  // MODULE 1: SQL FUNDAMENTALS
  // =========================================================================
  {
    id: 'mod-01',
    number: 1,
    title: 'SQL Fundamentals',
    icon: 'Database',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'Core Foundation',
    estimatedHours: 2.5,
    summary: 'Master database fundamentals, relational database principles (RDBMS vs DBMS), SQL syntax rules, keywords, comments, and the 5 command families (DDL, DML, DQL, DCL, TCL).',
    topics: [
      {
        id: 'top-01-01',
        title: 'Introduction to Databases & RDBMS',
        subtopics: ['What is a Database?', 'DBMS vs RDBMS', 'Database vs Table', 'Rows, Columns & Records', 'Schema Architecture', 'Relational Core Concepts'],
        conceptText: `A **Database** is an organized collection of structured information stored electronically. A **DBMS** (Database Management System) manages data in flat files or hierarchical structures, whereas an **RDBMS** (Relational Database Management System) organizes data into interrelated **Tables** connected by Keys (Primary and Foreign keys).`,
        syntaxGuide: `-- Typical Relational Concept Mapping:
-- Table   -> Entity (e.g. employees)
-- Row     -> Record / Tuple (e.g. Vikram Aditya, $145,000)
-- Column  -> Field / Attribute (e.g. first_name, salary)
-- Schema  -> Structural blueprint defining tables, columns, data types & constraints`,
        exampleSnippet: {
          title: 'Viewing Table Records & Columns',
          query: `SELECT id, first_name, last_name, salary, department_id \nFROM employees \nLIMIT 5;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'RDBMS ensures relational integrity, eliminates data redundancy through normalization, and provides ACID compliance.',
        commonPitfall: 'Confusing a Schema (the blueprint/structure) with a Database (the storage container holding schemas and tables).'
      },
      {
        id: 'top-01-02',
        title: 'Introduction to SQL & Syntax Rules',
        subtopics: ['What is SQL?', 'Why SQL is Used', 'Syntax Basics & Semicolons', 'Keywords & Casing Conventions', 'Single & Multi-line Comments', 'Naming Conventions'],
        conceptText: `**SQL** (Structured Query Language) is the universal standard declarative language for interacting with relational databases. SQL is **case-insensitive** for keywords, but best practice writes keywords in UPPERCASE (e.g. \`SELECT\`, \`FROM\`) and identifiers (tables, columns) in \`snake_case\`. Statements terminate with a semicolon (\`;\`).`,
        syntaxGuide: `-- Single-line comment starts with two dashes
/* Multi-line comment 
   spans across multiple lines */
SELECT column_name_1, column_name_2
FROM table_name
WHERE condition_is_met;`,
        exampleSnippet: {
          title: 'Clean Formatted SQL Query',
          query: `-- Query active department records\nSELECT department_name, location, budget\nFROM departments\nORDER BY budget DESC;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'SQL is declarative: you specify WHAT data you want, and the database query optimizer figures out HOW to retrieve it.',
        commonPitfall: 'Omitting commas between column projections or placing a trailing comma before the FROM clause.'
      },
      {
        id: 'top-01-03',
        title: 'SQL Command Categories (DDL, DML, DQL, DCL, TCL)',
        subtopics: ['DDL (Data Definition Language)', 'DML (Data Manipulation Language)', 'DQL (Data Query Language)', 'DCL (Data Control Language)', 'TCL (Transaction Control Language)'],
        conceptText: `SQL commands are divided into 5 distinct categories based on their operational scope:
1. **DDL**: Defines/modifies schema structure (\`CREATE\`, \`ALTER\`, \`DROP\`, \`TRUNCATE\`, \`RENAME\`). Auto-committed in most engines.
2. **DML**: Manages data rows (\`INSERT\`, \`UPDATE\`, \`DELETE\`). Can be rolled back.
3. **DQL**: Queries & retrieves data records (\`SELECT\`).
4. **DCL**: Manages security permissions & user access privileges (\`GRANT\`, \`REVOKE\`).
5. **TCL**: Manages transaction integrity boundaries (\`COMMIT\`, \`ROLLBACK\`, \`SAVEPOINT\`).`,
        syntaxGuide: `-- DDL: CREATE, ALTER, DROP, TRUNCATE, RENAME
-- DML: INSERT, UPDATE, DELETE
-- DQL: SELECT
-- DCL: GRANT, REVOKE
-- TCL: COMMIT, ROLLBACK, SAVEPOINT`,
        exampleSnippet: {
          title: 'Inspecting DQL Query Output',
          query: `SELECT 'DQL Query' AS command_type, COUNT(*) AS total_staff FROM employees;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'DDL works on structure; DML works on data rows; DQL retrieves; DCL secures; TCL ensures transaction safety.',
        commonPitfall: 'Assuming TRUNCATE is DML—TRUNCATE is actually DDL because it resets table storage and cannot be rolled back in standard MySQL.'
      }
    ],
    questions: [
      {
        id: 'q-01-01',
        type: 'Concept',
        difficulty: 'Beginner',
        question: 'What does DDL stand for in SQL, and what is its primary responsibility?',
        options: [
          'Data Definition Language — defines, alters, and drops database structures & schemas',
          'Data Development Language — compiles procedural SQL functions',
          'Database Direction Logic — optimizes relational join execution paths',
          'Data Description List — stores metadata catalogs'
        ],
        correctAnswer: 'A',
        explanation: 'DDL (Data Definition Language) commands like CREATE, ALTER, DROP, and TRUNCATE define and modify the schema structure of database objects.',
        hint: 'Think about commands that build the structural blueprint (tables, columns).'
      },
      {
        id: 'q-01-02',
        type: 'Comparison',
        difficulty: 'Beginner',
        question: 'Which of the following correctly pairs an SQL command with its category?',
        options: [
          'TRUNCATE → DML, SELECT → DDL',
          'INSERT → DML, COMMIT → TCL, GRANT → DCL',
          'ALTER → DQL, UPDATE → DDL',
          'REVOKE → TCL, SAVEPOINT → DCL'
        ],
        correctAnswer: 'B',
        explanation: 'INSERT is DML (modifies data), COMMIT is TCL (controls transactions), and GRANT is DCL (controls privileges).',
        hint: 'Review the 5 command families: DDL, DML, DQL, DCL, TCL.'
      },
      {
        id: 'q-01-03',
        type: 'Error-Finding',
        difficulty: 'Beginner',
        question: 'Identify the syntax error in this SQL statement:\n```sql\nSELECT first_name, last_name, salary,\nFROM employees\nWHERE salary > 50000\n```',
        options: [
          'The WHERE clause requires single quotes around 50000',
          'There is an illegal trailing comma after `salary` before the `FROM` keyword',
          'The `SELECT` keyword must be written in lowercase',
          'The table name must be wrapped in square brackets'
        ],
        correctAnswer: 'B',
        explanation: 'In SQL, column lists cannot have a trailing comma before the `FROM` clause. Doing so causes a syntax error.',
        hint: 'Look closely at the punctuation after salary.'
      }
    ]
  },

  // =========================================================================
  // MODULE 2: DDL (DATA DEFINITION LANGUAGE)
  // =========================================================================
  {
    id: 'mod-02',
    number: 2,
    title: 'DDL (Data Definition Language)',
    icon: 'Layers',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'Schema Design',
    estimatedHours: 3.0,
    summary: 'Master creating, altering, renaming, dropping, and truncating databases and tables. Understand constraints, data types, and DROP vs TRUNCATE vs DELETE.',
    topics: [
      {
        id: 'top-02-01',
        title: 'CREATE DATABASE & CREATE TABLE',
        subtopics: ['CREATE DATABASE syntax', 'CREATE TABLE syntax', 'Defining Columns & Data Types (INT, VARCHAR, DATE, DECIMAL)', 'DEFAULT Values', 'AUTO_INCREMENT / PRIMARY KEY', 'Table Constraints'],
        conceptText: `\`CREATE TABLE\` creates a new table structure. Each column is specified with a **name**, a **data type** (e.g. \`INT\`, \`VARCHAR(100)\`, \`DECIMAL(10,2)\`), and optional **column constraints** such as \`PRIMARY KEY\`, \`NOT NULL\`, \`UNIQUE\`, and \`DEFAULT\`.`,
        syntaxGuide: `CREATE TABLE students (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  admission_date DATE DEFAULT (CURRENT_DATE),
  cgpa DECIMAL(3, 2) DEFAULT 0.00
);`,
        exampleSnippet: {
          title: 'Create and Query New Table',
          query: `CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  project_name TEXT NOT NULL,
  budget INTEGER DEFAULT 50000
);
INSERT INTO projects (id, project_name) VALUES (1, 'Cloud Migration');
SELECT * FROM projects;`,
          setupSql: ``
        },
        keyTakeaway: 'Always specify PRIMARY KEY and appropriate NOT NULL constraints to protect data integrity at the database layer.',
        commonPitfall: 'Using VARCHAR without specifying maximum length in dialects like MySQL/Oracle.'
      },
      {
        id: 'top-02-02',
        title: 'ALTER TABLE (ADD, MODIFY, CHANGE, DROP Column)',
        subtopics: ['ADD column', 'MODIFY column data type', 'CHANGE column name & type', 'Rename column', 'DROP column', 'Add/Drop Constraints'],
        conceptText: `\`ALTER TABLE\` changes the schema of an existing table without dropping its existing records. Common operations include adding new columns (\`ADD\`), modifying column definitions (\`MODIFY\`), renaming columns (\`RENAME COLUMN\`), or dropping columns (\`DROP COLUMN\`).`,
        syntaxGuide: `-- Add a new column:
ALTER TABLE employees ADD phone_number VARCHAR(20);

-- Rename a column:
ALTER TABLE employees RENAME COLUMN phone_number TO contact_number;

-- Drop a column:
ALTER TABLE employees DROP COLUMN contact_number;`,
        exampleSnippet: {
          title: 'Altering Table Schema',
          query: `ALTER TABLE departments ADD country TEXT DEFAULT 'USA';
SELECT * FROM departments LIMIT 3;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'ALTER TABLE modifies schemas in-place. Adding columns with DEFAULT values is safe; dropping columns permanently removes that column’s data.',
        commonPitfall: 'Dropping a column that is referenced by a Foreign Key in another table causes foreign key constraint violations.'
      },
      {
        id: 'top-02-03',
        title: 'DROP vs TRUNCATE vs DELETE Comparison',
        subtopics: ['DROP TABLE & DROP DATABASE', 'TRUNCATE TABLE behavior', 'High-stakes differences', 'Speed & log generation', 'Auto-increment counter reset'],
        conceptText: `Understanding the exact differences between DROP, TRUNCATE, and DELETE is one of the most frequently tested interview concepts:
- **DROP** (DDL): Deletes table structure + all data + indexes + constraints permanently.
- **TRUNCATE** (DDL): Empties all rows, deallocates data pages, resets AUTO_INCREMENT counters. Cannot specify a WHERE clause. Faster than DELETE.
- **DELETE** (DML): Removes specific rows row-by-row using a WHERE filter. Can be rolled back in a transaction. Does NOT reset AUTO_INCREMENT.`,
        syntaxGuide: `-- DROP: Destroys table schema & data
DROP TABLE employees;

-- TRUNCATE: Empties all rows, keeps schema, resets ID counters
TRUNCATE TABLE employees;

-- DELETE: Deletes filtered rows row-by-row (DML)
DELETE FROM employees WHERE department_id = 5;`,
        exampleSnippet: {
          title: 'Safe Deletion vs Schema Preservation',
          query: `SELECT COUNT(*) AS count_before FROM departments;
DELETE FROM departments WHERE id = 5;
SELECT COUNT(*) AS count_after FROM departments;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'DELETE removes rows with WHERE filter; TRUNCATE resets the table entirely; DROP deletes the entire table definition from the catalog.',
        commonPitfall: 'Using DELETE without a WHERE clause when TRUNCATE was intended—DELETE generates massive undo transaction logs.'
      }
    ],
    questions: [
      {
        id: 'q-02-01',
        type: 'Syntax',
        difficulty: 'Beginner',
        question: 'Which SQL statement correctly adds a new column named `email` with a maximum of 100 characters to an existing `clients` table?',
        options: [
          'ALTER TABLE clients ADD email VARCHAR(100);',
          'UPDATE TABLE clients ADD COLUMN email VARCHAR(100);',
          'MODIFY TABLE clients INSERT email VARCHAR(100);',
          'ALTER clients ADD COLUMN email STRING(100);'
        ],
        correctAnswer: 'A',
        explanation: '`ALTER TABLE clients ADD email VARCHAR(100);` is the correct standard SQL syntax to add a column.',
        hint: 'Use the ALTER TABLE command followed by ADD.'
      },
      {
        id: 'q-02-02',
        type: 'Comparison',
        difficulty: 'Intermediate',
        question: 'What happens to the `AUTO_INCREMENT` / Identity counter when you run `TRUNCATE TABLE` vs `DELETE FROM` without a WHERE clause?',
        options: [
          '`TRUNCATE` resets the counter to 1, while `DELETE` preserves the current counter sequence',
          '`DELETE` resets the counter to 1, while `TRUNCATE` preserves the sequence',
          'Both `TRUNCATE` and `DELETE` preserve the sequence number',
          'Both `TRUNCATE` and `DELETE` reset the sequence to 0'
        ],
        correctAnswer: 'A',
        explanation: '`TRUNCATE` deallocates table pages and resets the AUTO_INCREMENT identity seed back to 1. `DELETE` deletes rows one by one, leaving the increment seed at its last value.',
        hint: 'DDL page-level operations reset metadata counters.'
      },
      {
        id: 'q-02-03',
        type: 'Scenario-Based',
        difficulty: 'Beginner',
        question: 'You want to delete all records from a temporary staging table with 2 million rows as fast as possible, preserving the table structure for tomorrow\'s batch job. Which command is optimal?',
        options: [
          'DROP TABLE staging_data;',
          'TRUNCATE TABLE staging_data;',
          'DELETE FROM staging_data;',
          'ALTER TABLE staging_data EMPTY;'
        ],
        correctAnswer: 'B',
        explanation: 'TRUNCATE TABLE deallocates storage pages with minimal logging, making it orders of magnitude faster than DELETE while preserving the table schema.',
        hint: 'Choose the fastest DDL command that empties rows without dropping schema.'
      }
    ]
  },

  // =========================================================================
  // MODULE 3: DML (DATA MANIPULATION LANGUAGE)
  // =========================================================================
  {
    id: 'mod-03',
    number: 3,
    title: 'DML (Data Manipulation Language)',
    icon: 'Edit3',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'CRUD Data Operations',
    estimatedHours: 2.0,
    summary: 'Master inserting single and multiple rows, updating records safely with WHERE clauses, deleting records, and INSERT INTO SELECT.',
    topics: [
      {
        id: 'top-03-01',
        title: 'INSERT INTO & Batch Ingestion',
        subtopics: ['INSERT INTO syntax', 'Insert single record', 'Insert multiple records in batch', 'INSERT INTO SELECT from another table'],
        conceptText: `\`INSERT INTO\` adds new rows to a table. You can insert individual records, multiple rows in a single batch statement for high throughput, or copy rows from another table using \`INSERT INTO ... SELECT\`.`,
        syntaxGuide: `-- Single row insert specifying columns:
INSERT INTO customers (id, name, email, city, country) 
VALUES (10, 'Aria Stark', 'aria@winterfell.com', 'North', 'Westeros');

-- Multi-row batch insert:
INSERT INTO customers (id, name, email, city, country) VALUES
  (11, 'Jon Snow', 'jon@castleblack.com', 'Wall', 'Westeros'),
  (12, 'Sansa Stark', 'sansa@winterfell.com', 'North', 'Westeros');

-- Ingest from query:
INSERT INTO archived_customers (id, name, email)
SELECT id, name, email FROM customers WHERE country = 'USA';`,
        exampleSnippet: {
          title: 'Batch Insert & Verification',
          query: `INSERT INTO departments (id, department_name, location, budget) VALUES
  (10, 'Cybersecurity', 'Boston', 900000),
  (11, 'Cloud DevOps', 'Seattle', 1100000);
SELECT * FROM departments WHERE id >= 10;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Always list target column names explicitly in INSERT statements to prevent silent bugs when schema columns change order.',
        commonPitfall: 'Mismatching the count or data types of values in the VALUES clause with the specified column list.'
      },
      {
        id: 'top-03-02',
        title: 'UPDATE & DELETE with Safe Filtering',
        subtopics: ['UPDATE statement syntax', 'UPDATE with WHERE condition', 'Updating multiple columns', 'DELETE with WHERE', 'Avoiding accidental full table updates'],
        conceptText: `\`UPDATE\` modifies column values in existing rows. \`DELETE\` removes specific rows from a table. Both commands should virtually ALWAYS include a \`WHERE\` clause; running either without \`WHERE\` modifies or deletes ALL records in the entire table!`,
        syntaxGuide: `-- Update specific record:
UPDATE employees 
SET salary = salary * 1.10, department_id = 1
WHERE id = 3;

-- Delete specific record:
DELETE FROM employees 
WHERE id = 10;`,
        exampleSnippet: {
          title: 'Safe Update and Delete Verification',
          query: `UPDATE employees 
SET salary = salary + 5000 
WHERE department_id = 3;

SELECT id, first_name, salary, department_id 
FROM employees 
WHERE department_id = 3;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Always test your WHERE clause with a SELECT query first before executing destructive UPDATE or DELETE statements.',
        commonPitfall: 'Forgetting the WHERE clause in an UPDATE statement: `UPDATE employees SET salary = 100000;` overwrites every employee’s salary.'
      }
    ],
    questions: [
      {
        id: 'q-03-01',
        type: 'Syntax',
        difficulty: 'Beginner',
        question: 'Which query gives a 10% raise to all employees in department 2?',
        options: [
          'UPDATE employees SET salary = salary * 1.10 WHERE department_id = 2;',
          'ALTER employees MODIFY salary = salary * 1.10 WHERE department_id = 2;',
          'CHANGE employees SET salary = salary * 1.10 WHERE department_id = 2;',
          'UPDATE salary = salary * 1.10 FROM employees WHERE department_id = 2;'
        ],
        correctAnswer: 'A',
        explanation: '`UPDATE <table> SET <col> = <expr> WHERE <condition>;` is the correct DML syntax.',
        hint: 'The keyword after the table name is SET.'
      },
      {
        id: 'q-03-02',
        type: 'Error-Finding',
        difficulty: 'Beginner',
        question: 'What is the critical danger in executing:\n```sql\nDELETE FROM orders;\n```',
        options: [
          'It will throw a syntax error because no column is named',
          'It deletes every single row in the orders table because there is no WHERE clause',
          'It will drop the table schema entirely',
          'It will fail because DELETE requires an asterisk (*)'
        ],
        correctAnswer: 'B',
        explanation: 'A DELETE statement without a WHERE clause matches all records and removes every row in the table.',
        hint: 'Look for the missing condition clause.'
      }
    ]
  },

  // =========================================================================
  // MODULE 4: DQL (DATA QUERY LANGUAGE - SELECT)
  // =========================================================================
  {
    id: 'mod-04',
    number: 4,
    title: 'DQL (SELECT, Filtering & Sorting)',
    icon: 'Search',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'Query Fundamentals',
    estimatedHours: 3.5,
    summary: 'Master SELECT projections, column aliases, arithmetic expressions, WHERE comparison & logical operators, DISTINCT, ORDER BY, and LIMIT/OFFSET pagination.',
    topics: [
      {
        id: 'top-04-01',
        title: 'SELECT Basics, Column Aliases & Expressions',
        subtopics: ['SELECT * vs specific columns', 'Column aliases with AS', 'Arithmetic expressions (+, -, *, /)', 'Calculated columns', 'String concatenation'],
        conceptText: `The \`SELECT\` statement projects data from tables. You can select specific columns, rename result headers with column aliases using \`AS\`, and compute dynamic calculated values on the fly.`,
        syntaxGuide: `SELECT 
  first_name,
  last_name,
  salary,
  salary * 0.15 AS estimated_tax,
  salary * 0.85 AS net_pay
FROM employees;`,
        exampleSnippet: {
          title: 'Calculated Columns & Aliasing',
          query: `SELECT 
  first_name || ' ' || last_name AS full_name,
  salary,
  ROUND(salary / 12.0, 2) AS monthly_salary
FROM employees
LIMIT 5;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Avoid `SELECT *` in production: selecting only required columns reduces memory footprint, I/O bandwidth, and network latency.',
        commonPitfall: 'Using column aliases created in SELECT directly inside the WHERE clause—WHERE is processed BEFORE SELECT.'
      },
      {
        id: 'top-04-02',
        title: 'WHERE Filtering & Logical Operators (AND, OR, NOT)',
        subtopics: ['Comparison operators (=, !=, <>, <, >, <=, >=)', 'Logical AND', 'Logical OR', 'Logical NOT', 'Operator Precedence and Parentheses'],
        conceptText: `The \`WHERE\` clause filters rows before projection. Combine multiple boolean conditions using \`AND\`, \`OR\`, and \`NOT\`. Always use parentheses \`()\` when mixing \`AND\` and \`OR\` because \`AND\` has higher operator precedence than \`OR\`.`,
        syntaxGuide: `SELECT first_name, department_id, salary
FROM employees
WHERE (department_id = 1 OR department_id = 2)
  AND salary >= 100000;`,
        exampleSnippet: {
          title: 'Filtering with Logical Conditions',
          query: `SELECT first_name, last_name, salary, department_id
FROM employees
WHERE salary >= 95000 AND (department_id = 1 OR department_id = 3);`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Condition evaluation uses short-circuit logic; parentheses guarantee intended filter order.',
        commonPitfall: 'Writing `WHERE a = 1 OR b = 2 AND c = 3` without parentheses—`AND` evaluates first, causing unexpected query matches.'
      },
      {
        id: 'top-04-03',
        title: 'DISTINCT, ORDER BY & LIMIT / OFFSET Pagination',
        subtopics: ['Eliminating duplicate rows with DISTINCT', 'ORDER BY single & multiple columns', 'ASC and DESC sorting', 'LIMIT row count', 'OFFSET pagination basics'],
        conceptText: `\`DISTINCT\` removes duplicate rows from result sets. \`ORDER BY\` sorts rows ascending (\`ASC\`, default) or descending (\`DESC\`). \`LIMIT n OFFSET m\` enables API-style pagination by returning \`n\` rows starting after skipping \`m\` rows.`,
        syntaxGuide: `-- Unique categories sorted alphabetically:
SELECT DISTINCT category FROM products ORDER BY category ASC;

-- Top 5 highest-earning employees:
SELECT first_name, salary FROM employees ORDER BY salary DESC LIMIT 5;

-- Page 2 of 5 items per page (Skip first 5, take next 5):
SELECT * FROM products ORDER BY id ASC LIMIT 5 OFFSET 5;`,
        exampleSnippet: {
          title: 'Sorting & Pagination',
          query: `SELECT product_name, category, price 
FROM products 
ORDER BY price DESC 
LIMIT 3 OFFSET 0;`,
          setupSql: COMMON_SCHEMAS.ecommerce
        },
        keyTakeaway: 'Always include a deterministic ORDER BY clause when using LIMIT and OFFSET to ensure consistent pagination.',
        commonPitfall: 'Using OFFSET on massive tables (e.g. OFFSET 1,000,000) causes performance degradation because the database still scans the skipped rows.'
      }
    ],
    questions: [
      {
        id: 'q-04-01',
        type: 'Output-Based',
        difficulty: 'Beginner',
        question: 'Given table `employees` with salaries `[145000, 125000, 115000, 108000, 98000, 92000]`, what will this query return?\n```sql\nSELECT salary FROM employees ORDER BY salary DESC LIMIT 2 OFFSET 1;\n```',
        options: [
          '[145000, 125000]',
          '[125000, 115000]',
          '[115000, 108000]',
          '[125000]'
        ],
        correctAnswer: 'B',
        explanation: '`OFFSET 1` skips the 1st highest salary ($145,000) and `LIMIT 2` retrieves the next 2 rows ($125,000 and $115,000).',
        hint: 'Offset skips records from the top of the ordered set.'
      },
      {
        id: 'q-04-02',
        type: 'Concept',
        difficulty: 'Beginner',
        question: 'Why does `SELECT DISTINCT country, city FROM customers;` return multiple rows with the same country?',
        options: [
          'DISTINCT only applies to the last column listed',
          'DISTINCT evaluates uniqueness across the combination of ALL projected columns (country + city tuple)',
          'DISTINCT is ignored when more than one column is present',
          'It is a bug in the SQL query parser'
        ],
        correctAnswer: 'B',
        explanation: '`DISTINCT` evaluates the entire row tuple. If country is "India" with city "Mumbai" and another row has "India" with city "Pune", both tuples are unique.',
        hint: 'DISTINCT checks the distinct combination of all selected attributes.'
      }
    ]
  },

  // =========================================================================
  // MODULE 5: ADVANCED FILTERING
  // =========================================================================
  {
    id: 'mod-05',
    number: 5,
    title: 'Advanced Filtering (LIKE, IN, BETWEEN, NULL)',
    icon: 'Filter',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'Pattern Matching',
    estimatedHours: 2.5,
    summary: 'Master SQL pattern matching with LIKE & wildcards (% and _), discrete lists with IN / NOT IN, ranges with BETWEEN, and Three-Valued Logic for NULLs.',
    topics: [
      {
        id: 'top-05-01',
        title: 'LIKE Operator & Wildcards (% and _)',
        subtopics: ['LIKE pattern matching', 'Wildcard % (zero or more characters)', 'Wildcard _ (exactly one character)', 'Case sensitivity in LIKE vs ILIKE', 'Starts with, ends with, contains'],
        conceptText: `\`LIKE\` matches string patterns using two wildcards:
- **\`%\`**: Matches **zero, one, or multiple** characters.
- **\`_\`**: Matches **exactly one** character.
- Examples:
  - \`'A%'\` -> Starts with 'A'
  - \`'%com'\` -> Ends with 'com'
  - \`'%engineer%'\` -> Contains 'engineer' anywhere
  - \`'_b%'\` -> Has 'b' as the second character`,
        syntaxGuide: `-- Find emails from company.com:
SELECT * FROM employees WHERE email LIKE '%@company.com';

-- Find 5-letter names starting with 'S':
SELECT * FROM employees WHERE first_name LIKE 'S____';`,
        exampleSnippet: {
          title: 'Wildcard Pattern Matching',
          query: `SELECT id, first_name, email 
FROM employees 
WHERE first_name LIKE 'A%' OR email LIKE '%@company.com';`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Leading wildcards like `LIKE "%term"` prevent B-Tree indexes from being used, forcing a full table scan.',
        commonPitfall: 'Using = instead of LIKE when searching with % or _ (e.g. `WHERE email = "%@gmail.com"` treats % as a literal character).'
      },
      {
        id: 'top-05-02',
        title: 'IN / NOT IN, BETWEEN & NULL Handling',
        subtopics: ['IN & NOT IN operators', 'BETWEEN and NOT BETWEEN for numeric & date ranges', 'IS NULL & IS NOT NULL', 'Three-Valued Logic (TRUE, FALSE, UNKNOWN)', 'NULL vs 0 vs Empty String'],
        conceptText: `**IN** tests whether a value matches any value in a list. **BETWEEN** tests whether a value falls within an inclusive range (\`val >= min AND val <= max\`).
**NULL Handling**: In SQL, \`NULL\` represents missing/unknown data. Because \`NULL\` is not a value, standard equality tests (\`= NULL\` or \`!= NULL\`) evaluate to \`UNKNOWN\` (treated as FALSE in WHERE). You MUST use **\`IS NULL\`** or **\`IS NOT NULL\`**.`,
        syntaxGuide: `-- Discrete list match:
SELECT * FROM employees WHERE department_id IN (1, 3, 5);

-- Inclusive range match:
SELECT * FROM employees WHERE salary BETWEEN 80000 AND 120000;

-- Correct NULL check:
SELECT * FROM employees WHERE manager_id IS NULL;`,
        exampleSnippet: {
          title: 'NULL and Range Queries',
          query: `SELECT first_name, last_name, salary, manager_id
FROM employees
WHERE salary BETWEEN 90000 AND 130000 
  AND manager_id IS NOT NULL;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Never use `= NULL`. Always write `IS NULL` or `IS NOT NULL`. NULL represents unknown state, not 0 or empty string.',
        commonPitfall: 'Using `NOT IN (subquery)` when the subquery contains even a single NULL value causes the entire expression to return 0 rows!'
      }
    ],
    questions: [
      {
        id: 'q-05-01',
        type: 'Error-Finding',
        difficulty: 'Beginner',
        question: 'Why does the following query return 0 rows even when there are employees without a manager?\n```sql\nSELECT * FROM employees WHERE manager_id = NULL;\n```',
        options: [
          'In SQL, `= NULL` evaluates to UNKNOWN/FALSE. The query must use `IS NULL` instead',
          'The manager_id column cannot be queried directly',
          'NULL must be wrapped in double quotes `"NULL"`',
          'The query requires a HAVING clause'
        ],
        correctAnswer: 'A',
        explanation: 'NULL is an unknown marker, not a value. Comparing anything to NULL using `= NULL` yields UNKNOWN, so no rows pass the filter. `IS NULL` is required.',
        hint: 'Think about SQL Three-Valued Logic.'
      },
      {
        id: 'q-05-02',
        type: 'Syntax',
        difficulty: 'Beginner',
        question: 'Which condition matches all product names that have the letter `o` as their second character?',
        options: [
          '`WHERE product_name LIKE "_o%"`;',
          '`WHERE product_name LIKE "%o%"`;',
          '`WHERE product_name LIKE "o_%"`;',
          '`WHERE product_name = "_o%"`;'
        ],
        correctAnswer: 'A',
        explanation: '`_` matches exactly 1 character before `o`, and `%` matches any number of characters after `o`.',
        hint: 'Use underscore for single character wildcard.'
      }
    ]
  },

  // =========================================================================
  // MODULE 6: SQL FUNCTIONS & AGGREGATIONS
  // =========================================================================
  {
    id: 'mod-06',
    number: 6,
    title: 'SQL Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
    icon: 'Calculator',
    difficulty: 'Beginner',
    difficultyColor: 'emerald',
    badge: 'Metrics & Math',
    estimatedHours: 2.5,
    summary: 'Master aggregate calculations across dataset rows: COUNT(*), COUNT(col), SUM, AVG, MIN, MAX, and combining aggregates with WHERE filters.',
    topics: [
      {
        id: 'top-06-01',
        title: 'Core Aggregate Functions',
        subtopics: ['COUNT(*) vs COUNT(column) vs COUNT(DISTINCT col)', 'SUM() total values', 'AVG() arithmetic mean', 'MIN() lowest value', 'MAX() highest value', 'Combining aggregates with WHERE'],
        conceptText: `**Aggregate functions** compute a single summary value from a set of rows:
- **\`COUNT(*)\`**: Counts ALL rows including NULLs and duplicates.
- **\`COUNT(col)\`**: Counts non-NULL values in that column.
- **\`COUNT(DISTINCT col)\`**: Counts unique non-NULL values.
- **\`SUM(col)\`**: Total numeric sum (ignores NULLs).
- **\`AVG(col)\`**: Average mean value (ignores NULLs).
- **\`MIN(col)\` / \`MAX(col)\`**: Lowest and highest values (works on numbers, dates, and text).`,
        syntaxGuide: `SELECT 
  COUNT(*) AS total_employees,
  COUNT(department_id) AS assigned_staff,
  COUNT(DISTINCT department_id) AS distinct_departments,
  ROUND(AVG(salary), 2) AS average_salary,
  SUM(salary) AS total_payroll,
  MIN(salary) AS min_salary,
  MAX(salary) AS max_salary
FROM employees
WHERE salary > 50000;`,
        exampleSnippet: {
          title: 'Computing Aggregates on Salary Data',
          query: `SELECT 
  COUNT(*) AS staff_count,
  MIN(salary) AS lowest_salary,
  MAX(salary) AS highest_salary,
  ROUND(AVG(salary), 2) AS average_salary,
  SUM(salary) AS total_payroll
FROM employees;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Aggregate functions ignore NULL values (except COUNT(*)). Always use ROUND() with AVG() for clean decimal formatting.',
        commonPitfall: 'Assuming COUNT(column_name) counts all rows—if that column contains NULLs, those rows are excluded.'
      }
    ],
    questions: [
      {
        id: 'q-06-01',
        type: 'Comparison',
        difficulty: 'Beginner',
        question: 'A table has 10 rows. The `manager_id` column contains 8 numbers and 2 NULLs. What will `COUNT(*)` and `COUNT(manager_id)` return respectively?',
        options: [
          '10 and 8',
          '10 and 10',
          '8 and 8',
          '10 and 2'
        ],
        correctAnswer: 'A',
        explanation: '`COUNT(*)` counts all rows in the table (10), while `COUNT(column)` only counts non-NULL values (8).',
        hint: 'COUNT(col) ignores NULLs.'
      },
      {
        id: 'q-06-02',
        type: 'Concept',
        difficulty: 'Beginner',
        question: 'How does the `AVG()` function handle NULL values in a column?',
        options: [
          'It treats NULL values as 0 and divides by the total row count',
          'It skips NULL values entirely, summing non-NULL values and dividing by the count of non-NULL rows',
          'It returns NULL if any row in the column is NULL',
          'It throws a runtime type conversion error'
        ],
        correctAnswer: 'B',
        explanation: '`AVG()` completely ignores NULLs: `AVG(salary) = SUM(non_null_salary) / COUNT(non_null_salary)`.',
        hint: 'Aggregate math functions ignore NULL.'
      }
    ]
  },

  // =========================================================================
  // MODULE 7: GROUP BY AND HAVING
  // =========================================================================
  {
    id: 'mod-07',
    number: 7,
    title: 'GROUP BY and HAVING Clauses',
    icon: 'PieChart',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Data Grouping',
    estimatedHours: 3.5,
    summary: 'Master grouping data with GROUP BY across single and multiple columns, filtering aggregated groups with HAVING, and internalizing SQL logical execution order.',
    topics: [
      {
        id: 'top-07-01',
        title: 'GROUP BY & Multiple Column Grouping',
        subtopics: ['Basic GROUP BY', 'Grouping by single column', 'Grouping by multiple columns', 'GROUP BY with aggregate functions', 'Non-aggregated columns in SELECT rule'],
        conceptText: `\`GROUP BY\` groups rows that share values into summary rows. Any column present in the \`SELECT\` clause that is NOT inside an aggregate function MUST be listed in the \`GROUP BY\` clause.`,
        syntaxGuide: `SELECT 
  department_id,
  COUNT(*) AS employee_count,
  ROUND(AVG(salary), 2) AS avg_dept_salary
FROM employees
GROUP BY department_id;`,
        exampleSnippet: {
          title: 'Department-Wise Aggregation',
          query: `SELECT 
  department_id,
  COUNT(*) AS staff_count,
  SUM(salary) AS total_dept_payroll,
  MAX(salary) AS highest_dept_salary
FROM employees
WHERE department_id IS NOT NULL
GROUP BY department_id;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'GROUP BY aggregates rows sharing the same group keys into a single representative output row.',
        commonPitfall: 'Selecting a non-aggregated column without including it in GROUP BY violates SQL standard and causes errors in MySQL (ONLY_FULL_GROUP_BY).'
      },
      {
        id: 'top-07-02',
        title: 'HAVING Clause vs WHERE Clause & Execution Order',
        subtopics: ['HAVING clause syntax', 'Filtering aggregated groups', 'WHERE vs HAVING difference', 'SQL Logical Execution Order (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT)'],
        conceptText: `The distinction between **WHERE** and **HAVING** is fundamental:
- **WHERE**: Filters individual rows BEFORE grouping and aggregation. Cannot contain aggregate functions.
- **HAVING**: Filters grouped summary results AFTER aggregation. Can evaluate \`COUNT()\`, \`AVG()\`, etc.

**SQL Logical Processing Order**:
1. \`FROM\` & \`JOIN\`
2. \`WHERE\`
3. \`GROUP BY\`
4. \`HAVING\`
5. \`SELECT\` & Expressions
6. \`DISTINCT\`
7. \`ORDER BY\`
8. \`LIMIT\` / \`OFFSET\``,
        syntaxGuide: `SELECT 
  department_id,
  COUNT(*) AS team_size,
  AVG(salary) AS avg_salary
FROM employees
WHERE salary > 50000         -- Filters individual rows FIRST
GROUP BY department_id       -- Forms department groups SECOND
HAVING COUNT(*) >= 2         -- Filters aggregated groups THIRD
ORDER BY avg_salary DESC;    -- Sorts final result FOURTH`,
        exampleSnippet: {
          title: 'Filtering Groups with HAVING',
          query: `SELECT 
  department_id,
  COUNT(*) AS employee_count,
  AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING COUNT(*) >= 2;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Use WHERE for raw row filtering; use HAVING for aggregate metrics filtering.',
        commonPitfall: 'Putting aggregate conditions inside WHERE (e.g. `WHERE COUNT(*) > 5`) is illegal and throws an execution error.'
      }
    ],
    questions: [
      {
        id: 'q-07-01',
        type: 'Comparison',
        difficulty: 'Intermediate',
        question: 'What is the primary difference between the `WHERE` clause and the `HAVING` clause?',
        options: [
          '`WHERE` filters individual rows before aggregation; `HAVING` filters aggregated groups after `GROUP BY`',
          '`HAVING` is faster than `WHERE` in all situations',
          '`WHERE` works only on text columns, while `HAVING` works only on numbers',
          '`HAVING` can be used without `GROUP BY` to filter raw table rows'
        ],
        correctAnswer: 'A',
        explanation: '`WHERE` filters raw rows before aggregation occurs. `HAVING` filters groups after `GROUP BY` computes summary metrics.',
        hint: 'Consider where aggregation occurs in the SQL execution pipeline.'
      },
      {
        id: 'q-07-02',
        type: 'Error-Finding',
        difficulty: 'Intermediate',
        question: 'What error will occur when running this query?\n```sql\nSELECT department_id, AVG(salary)\nFROM employees\nWHERE AVG(salary) > 80000\nGROUP BY department_id;\n```',
        options: [
          'An error because aggregate functions like `AVG()` are not allowed in the `WHERE` clause; it must be in `HAVING`',
          'The `GROUP BY` clause must come before `WHERE`',
          '`department_id` must be an aggregate',
          'The query is completely valid SQL'
        ],
        correctAnswer: 'A',
        explanation: 'Aggregate functions cannot appear in the `WHERE` clause because `WHERE` runs before aggregates are calculated. Replace `WHERE AVG(...) > 80000` with `HAVING AVG(salary) > 80000`.',
        hint: 'Aggregates cannot be filtered in WHERE.'
      }
    ]
  },

  // =========================================================================
  // MODULE 8: KEYS AND CONSTRAINTS
  // =========================================================================
  {
    id: 'mod-08',
    number: 8,
    title: 'Keys, Constraints & Normalization',
    icon: 'Key',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Data Integrity',
    estimatedHours: 3.0,
    summary: 'Master Primary, Foreign, Candidate, Composite, and Unique Keys. Understand constraints (NOT NULL, CHECK, DEFAULT) and Database Normalization (1NF, 2NF, 3NF).',
    topics: [
      {
        id: 'top-08-01',
        title: 'Database Keys & Table Constraints',
        subtopics: ['Primary Key (PK)', 'Foreign Key (FK) & Referential Integrity', 'Candidate Key vs Super Key', 'Composite Primary Key', 'Unique Key vs Primary Key', 'NOT NULL, DEFAULT, CHECK'],
        conceptText: `Keys maintain relational data integrity:
- **Primary Key**: Uniquely identifies each row. Must be \`UNIQUE\` and \`NOT NULL\`. Only one PK per table.
- **Foreign Key**: A column pointing to the Primary Key of another table, enforcing referential integrity.
- **Unique Key**: Enforces uniqueness across rows, but can permit one or more \`NULL\` values.
- **Composite Key**: A Primary Key composed of 2 or more columns combined (e.g. \`order_id + product_id\`).
- **CHECK Constraint**: Validates that values meet a boolean rule (e.g. \`CHECK (salary >= 0)\`).`,
        syntaxGuide: `CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (order_id, product_id), -- Composite PK
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);`,
        exampleSnippet: {
          title: 'Viewing Foreign Key Relations',
          query: `SELECT 
  e.id AS emp_id,
  e.first_name,
  e.department_id,
  d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.id;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Foreign Keys prevent orphaned records and enforce parent-child relational integrity.',
        commonPitfall: 'Confusing a Candidate Key with a Composite Key: a Candidate Key is any minimal superkey eligible to be PK; a Composite Key is a key formed by multiple columns.'
      },
      {
        id: 'top-08-02',
        title: 'Database Normalization (1NF, 2NF, 3NF)',
        subtopics: ['Why Normalization is Needed', 'Insertion, Update & Deletion Anomalies', 'First Normal Form (1NF: Atomic values)', 'Second Normal Form (2NF: No partial dependencies)', 'Third Normal Form (3NF: No transitive dependencies)'],
        conceptText: `**Normalization** is the process of structuring relational tables to reduce data redundancy and eliminate anomalies:
- **1NF**: Every column must contain **atomic (indivisible) values** and no repeating groups.
- **2NF**: Table must be in **1NF** AND have **no partial functional dependencies** (every non-key attribute must depend on the whole composite primary key).
- **3NF**: Table must be in **2NF** AND have **no transitive dependencies** (non-key attributes must NOT depend on other non-key attributes).`,
        syntaxGuide: `-- Rule of thumb for 3NF:
-- "Every non-key column must depend on the Key, the Whole Key, and Nothing but the Key."`,
        exampleSnippet: {
          title: 'Normalized Schema Verification',
          query: `SELECT d.department_name, COUNT(e.id) AS total_employees
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.department_name;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Normalization reduces storage waste and prevents update anomalies where changing a record requires modifying multiple rows.',
        commonPitfall: 'Over-normalizing in read-heavy analytics data warehouses: denormalization (Star schema) is often preferred for fast BI dashboards.'
      }
    ],
    questions: [
      {
        id: 'q-08-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'Which Normal Form requires eliminating partial dependencies on a composite primary key?',
        options: [
          '1NF',
          '2NF',
          '3NF',
          'BCNF'
        ],
        correctAnswer: 'B',
        explanation: '2NF requires that the table is in 1NF and that no non-prime attribute depends on only part of a composite primary key (eliminates partial dependency).',
        hint: 'Partial dependencies are resolved in the 2nd stage of normalization.'
      },
      {
        id: 'q-08-02',
        type: 'Comparison',
        difficulty: 'Intermediate',
        question: 'What is the primary difference between a `PRIMARY KEY` and a `UNIQUE` constraint?',
        options: [
          'A table can have only ONE Primary Key and it cannot accept NULLs; a table can have MULTIPLE Unique constraints and they may accept NULL values',
          'Primary Key works only on numbers; Unique works only on text',
          'Unique constraints are automatically dropped on table export',
          'There is no difference'
        ],
        correctAnswer: 'A',
        explanation: 'Every table can have at most one PRIMARY KEY (which strictly forbids NULLs). A table can have multiple UNIQUE constraints, which allow NULLs depending on the database engine.',
        hint: 'Check table-level limits on PK vs UNIQUE.'
      }
    ]
  },

  // =========================================================================
  // MODULE 9: SQL JOINS
  // =========================================================================
  {
    id: 'mod-09',
    number: 9,
    title: 'SQL JOINs (INNER, LEFT, RIGHT, FULL, SELF, CROSS)',
    icon: 'GitMerge',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Relational Queries',
    estimatedHours: 4.0,
    summary: 'Master combining data from multiple tables: INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, SELF JOIN, CROSS JOIN, and complex multi-table joins.',
    topics: [
      {
        id: 'top-09-01',
        title: 'INNER JOIN & Multi-Table Joins',
        subtopics: ['INNER JOIN syntax and mechanics', 'Matching records on ON clause', 'Table aliases for readability', 'Joining 3 or more tables', 'Filtering joined results'],
        conceptText: `\`INNER JOIN\` selects records that have matching values in **both** tables. If a row in table A has no matching key in table B, that row is omitted from the output.`,
        syntaxGuide: `SELECT 
  e.first_name,
  e.last_name,
  d.department_name,
  d.location
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;`,
        exampleSnippet: {
          title: 'Three-Table INNER JOIN',
          query: `SELECT 
  c.name AS customer_name,
  o.id AS order_id,
  oi.product_name,
  oi.quantity,
  oi.unit_price
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id;`,
          setupSql: COMMON_SCHEMAS.ecommerce
        },
        keyTakeaway: 'INNER JOIN is the default join type; it retains only the intersection of both tables.',
        commonPitfall: 'Forgetting the ON clause causes an accidental Cartesian CROSS JOIN, multiplying row counts exponentially.'
      },
      {
        id: 'top-09-02',
        title: 'LEFT JOIN, RIGHT JOIN & FULL OUTER JOIN',
        subtopics: ['LEFT OUTER JOIN mechanics', 'Preserving unmatched left rows', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN concepts', 'Simulating FULL JOIN in SQLite/MySQL with UNION'],
        conceptText: `Outer joins preserve unmatched records:
- **LEFT JOIN**: Returns ALL records from the Left table + matching records from the Right table. Unmatched right columns become \`NULL\`.
- **RIGHT JOIN**: Returns ALL records from the Right table + matching records from the Left table.
- **FULL OUTER JOIN**: Returns ALL records when there is a match in EITHER left or right table.`,
        syntaxGuide: `-- Find customers even if they have no orders:
SELECT c.name, o.id AS order_id, o.total_amount
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;

-- Find orphaned customers (Never placed an order):
SELECT c.name, c.email
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;`,
        exampleSnippet: {
          title: 'Detecting Unassigned Employees with LEFT JOIN',
          query: `SELECT 
  e.first_name, 
  e.last_name, 
  COALESCE(d.department_name, 'Unassigned / Intern') AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'LEFT JOIN with `WHERE right_table.id IS NULL` is the canonical pattern for finding missing/unmatched relational records.',
        commonPitfall: 'Placing a filter on the right table inside the WHERE clause instead of the ON clause converts a LEFT JOIN into an INNER JOIN.'
      },
      {
        id: 'top-09-03',
        title: 'SELF JOIN & CROSS JOIN',
        subtopics: ['Joining a table to itself', 'Employee-Manager hierarchies', 'Cartesian Product with CROSS JOIN', 'Combinatorial matrix use cases'],
        conceptText: `A **SELF JOIN** is a regular join in which a table is joined with itself by using distinct table aliases (e.g. \`employees e\` and \`employees m\`). A **CROSS JOIN** produces the Cartesian product of all rows from both tables.`,
        syntaxGuide: `-- Self Join: Employee and Direct Manager
SELECT 
  e.first_name AS employee,
  COALESCE(m.first_name, 'Top Executive') AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`,
        exampleSnippet: {
          title: 'Self Join for Employee-Manager Hierarchy',
          query: `SELECT 
  e.first_name || ' ' || e.last_name AS employee,
  COALESCE(m.first_name || ' ' || m.last_name, 'No Direct Manager (VP)') AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY e.id;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Self joins require distinct table aliases to distinguish the parent entity from the child entity.',
        commonPitfall: 'Accidental CROSS JOINs on large tables can generate millions of rows and crash database memory.'
      }
    ],
    questions: [
      {
        id: 'q-09-01',
        type: 'Scenario-Based',
        difficulty: 'Intermediate',
        question: 'You are asked to list ALL registered users, including those who have never placed an order. Which join must you use from `users` (left) to `orders` (right)?',
        options: [
          'LEFT JOIN',
          'INNER JOIN',
          'CROSS JOIN',
          'NATURAL JOIN'
        ],
        correctAnswer: 'A',
        explanation: 'A LEFT JOIN guarantees that every user from the left table is included in the result. For users without orders, order columns will contain NULL.',
        hint: 'You want to preserve all records from the left table.'
      },
      {
        id: 'q-09-02',
        type: 'Output-Based',
        difficulty: 'Intermediate',
        question: 'Table A has 4 rows. Table B has 5 rows. How many rows will `SELECT * FROM table_a CROSS JOIN table_b;` return?',
        options: [
          '20 rows',
          '9 rows',
          '4 rows',
          '5 rows'
        ],
        correctAnswer: 'A',
        explanation: 'A CROSS JOIN produces the Cartesian product of both tables: 4 * 5 = 20 total rows.',
        hint: 'Multiply the row counts of both tables.'
      }
    ]
  },

  // =========================================================================
  // MODULE 10: SUBQUERIES
  // =========================================================================
  {
    id: 'mod-10',
    number: 10,
    title: 'Subqueries (Single-Row, Multi-Row, Correlated, EXISTS)',
    icon: 'CornerDownRight',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Nested Logic',
    estimatedHours: 3.5,
    summary: 'Master nested queries: Scalar Subqueries, Multi-Row (IN, ANY, ALL), EXISTS / NOT EXISTS, Correlated Subqueries, and subqueries in FROM clauses.',
    topics: [
      {
        id: 'top-10-01',
        title: 'Single-Row & Multi-Row Subqueries',
        subtopics: ['Scalar subqueries returning 1 value', 'Subquery with comparison operators (=, <, >)', 'Multi-row subqueries with IN / NOT IN', 'ANY and ALL operators', 'Derived tables in FROM clause'],
        conceptText: `A **Subquery** (or inner query) is a query nested inside another SQL statement.
- **Scalar Subquery**: Returns exactly 1 row and 1 column (e.g. \`WHERE salary > (SELECT AVG(salary) FROM employees)\`).
- **Multi-Row Subquery**: Returns multiple rows used with \`IN\`, \`NOT IN\`, \`ANY\`, or \`ALL\`.
- **Derived Table**: A subquery inside the \`FROM\` clause that acts as a temporary virtual table.`,
        syntaxGuide: `-- Scalar Subquery:
SELECT first_name, salary 
FROM employees 
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Multi-Row Subquery:
SELECT name, email 
FROM customers 
WHERE id IN (SELECT customer_id FROM orders WHERE total_amount > 500);`,
        exampleSnippet: {
          title: 'Employees Earning Above Average Salary',
          query: `SELECT first_name, last_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Scalar subqueries can be placed in SELECT, WHERE, and HAVING clauses wherever a single expression is valid.',
        commonPitfall: 'Using `=` with a subquery that returns more than one row results in the error: "Subquery returns more than 1 row".'
      },
      {
        id: 'top-10-02',
        title: 'EXISTS, NOT EXISTS & Correlated Subqueries',
        subtopics: ['EXISTS & NOT EXISTS operators', 'Correlated subqueries (row-by-row dependency)', 'Correlated vs Non-Correlated subqueries', 'Performance: EXISTS vs IN'],
        conceptText: `A **Correlated Subquery** references columns from the outer query. The database re-evaluates the inner query once for each candidate row in the outer query.
\`EXISTS\` tests for the existence of rows in a subquery and short-circuits to \`TRUE\` as soon as the first matching row is found.`,
        syntaxGuide: `-- Correlated subquery: Employees earning above their own department average
SELECT e.first_name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
);

-- EXISTS: Customers who placed at least one delivered order
SELECT c.name, c.email
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.id AND o.status = 'Delivered'
);`,
        exampleSnippet: {
          title: 'Correlated Department Average Query',
          query: `SELECT e.first_name, e.last_name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
);`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'EXISTS returns a boolean and does not fetch actual data rows into memory, making it highly efficient for existence checks.',
        commonPitfall: 'Correlated subqueries can be slow on huge datasets (O(N*M)) if supporting indexes on the join columns are missing.'
      }
    ],
    questions: [
      {
        id: 'q-10-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'What makes a subquery "correlated"?',
        options: [
          'It references a column from the outer query and must be evaluated for each outer row',
          'It is placed inside the FROM clause',
          'It returns more than one column',
          'It executes strictly before the outer query starts'
        ],
        correctAnswer: 'A',
        explanation: 'A subquery is correlated when it references columns from the outer query table, requiring evaluation per outer row.',
        hint: 'Look for references to outer query aliases.'
      },
      {
        id: 'q-10-02',
        type: 'Comparison',
        difficulty: 'Intermediate',
        question: 'Why is `EXISTS` generally preferred over `IN` when subqueries might contain NULL values?',
        options: [
          '`NOT IN` fails or evaluates to UNKNOWN if the subquery returns even a single NULL; `EXISTS` cleanly tests row existence',
          '`EXISTS` works only on primary keys',
          '`IN` cannot be used with subqueries',
          '`EXISTS` forces table recreation'
        ],
        correctAnswer: 'A',
        explanation: '`NOT IN` with a NULL in the subquery results evaluates to UNKNOWN for all rows, returning empty sets. `NOT EXISTS` handles NULLs without this flaw.',
        hint: 'Consider NULL handling in sets.'
      }
    ]
  },

  // =========================================================================
  // MODULE 11: VIEWS
  // =========================================================================
  {
    id: 'mod-11',
    number: 11,
    title: 'Views (Virtual Tables)',
    icon: 'Eye',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Schema Abstraction',
    estimatedHours: 2.0,
    summary: 'Master creating, querying, updating, and dropping SQL Views. Understand security encapsulation, query abstraction, and limitations of Views.',
    topics: [
      {
        id: 'top-11-01',
        title: 'Introduction to Views & View Commands',
        subtopics: ['What is a View?', 'Why use Views (Security & Abstraction)', 'CREATE VIEW syntax', 'SELECT from VIEW', 'DROP VIEW', 'Updatable Views vs Read-Only Views'],
        conceptText: `A **View** is a saved, named SQL query that acts as a virtual table. Views do not store physical data (unless materialized); instead, the database executes the underlying query whenever the view is referenced.
**Advantages**:
1. **Security**: Expose only specific columns (e.g. hide salaries or SSNs).
2. **Simplicity**: Hide complex multi-table JOINs behind a clean table interface.
3. **Consistency**: Ensure all team members use the same verified business calculation formulas.`,
        syntaxGuide: `-- Create a secure view without sensitive salary data:
CREATE VIEW public_staff_view AS
SELECT 
  e.id,
  e.first_name,
  e.last_name,
  e.email,
  d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.id;

-- Query the view just like a table:
SELECT * FROM public_staff_view WHERE department_name = 'Engineering';

-- Drop view:
DROP VIEW public_staff_view;`,
        exampleSnippet: {
          title: 'Creating and Querying an SQL View',
          query: `CREATE VIEW engineering_staff AS
SELECT first_name, last_name, email, salary
FROM employees
WHERE department_id = 1;

SELECT * FROM engineering_staff WHERE salary > 100000;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Views simplify complex joins and provide a security abstraction layer over sensitive tables.',
        commonPitfall: 'Expecting regular Views to speed up query execution: standard views re-run their underlying SELECT on every query (Materialized Views cache data).'
      }
    ],
    questions: [
      {
        id: 'q-11-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'What is a standard SQL View?',
        options: [
          'A virtual table based on the result set of a stored SQL statement that does not store data itself',
          'A physical copy of table data stored in memory',
          'A temporary index built on primary keys',
          'A backup archive of a database table'
        ],
        correctAnswer: 'A',
        explanation: 'A standard View is a saved query definition that behaves as a virtual table. It executes dynamically upon request.',
        hint: 'It is a named virtual table without independent physical data storage.'
      }
    ]
  },

  // =========================================================================
  // MODULE 12: INDEXES & QUERY PERFORMANCE
  // =========================================================================
  {
    id: 'mod-12',
    number: 12,
    title: 'Indexes & Query Performance Optimization',
    icon: 'Zap',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Performance Tuning',
    estimatedHours: 2.5,
    summary: 'Master B-Tree indexes, Clustered vs Non-Clustered indexes, CREATE/DROP INDEX, composite indexes, when indexes help, and when they hurt write throughput.',
    topics: [
      {
        id: 'top-12-01',
        title: 'Index Fundamentals & Optimization',
        subtopics: ['What is an Index?', 'How B-Tree indexes speed up lookups', 'CREATE INDEX & DROP INDEX', 'Single-column vs Composite index', 'Unique index', 'Trade-offs: Fast reads vs Slower INSERT/UPDATE/DELETE'],
        conceptText: `An **Index** is a data structure (typically a B-Tree) that enables the database engine to find rows in $O(\\log N)$ time instead of scanning every row in a table ($O(N)$ full table scan).
**When Indexes Help**:
- Columns frequently used in \`WHERE\` filters.
- Columns used in \`JOIN ... ON\` relational predicates.
- Columns used in \`ORDER BY\` and \`GROUP BY\`.

**Trade-offs**:
- Indexes consume additional disk space.
- Every \`INSERT\`, \`UPDATE\`, and \`DELETE\` must maintain the index B-Tree, slowing down write operations.`,
        syntaxGuide: `-- Create single-column index:
CREATE INDEX idx_emp_email ON employees(email);

-- Create composite index (Leftmost prefix rule applies):
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);

-- Unique index:
CREATE UNIQUE INDEX idx_cust_email ON customers(email);

-- Drop index:
DROP INDEX idx_emp_email;`,
        exampleSnippet: {
          title: 'Creating and Using an Index',
          query: `CREATE INDEX idx_employees_dept ON employees(department_id);
SELECT id, first_name, last_name, salary 
FROM employees 
WHERE department_id = 1;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Index foreign keys and high-cardinality search columns, but avoid over-indexing write-heavy transaction tables.',
        commonPitfall: 'Applying functions to indexed columns (e.g. `WHERE UPPER(email) = "FOO"`) prevents index usage unless a function-based index exists.'
      }
    ],
    questions: [
      {
        id: 'q-12-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'What is the main drawback of having too many indexes on a table?',
        options: [
          'It slows down write operations (INSERT, UPDATE, DELETE) because every index must be updated',
          'It causes SELECT queries to fail with syntax errors',
          'It prevents Foreign Keys from working',
          'It drops table constraints'
        ],
        correctAnswer: 'A',
        explanation: 'Every index requires CPU and I/O to update when data is inserted, updated, or deleted, degrading write performance.',
        hint: 'Think about the cost of maintaining auxiliary B-Trees.'
      }
    ]
  },

  // =========================================================================
  // MODULE 13: CASE STATEMENT
  // =========================================================================
  {
    id: 'mod-13',
    number: 13,
    title: 'CASE Conditional Expressions',
    icon: 'Sliders',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Conditional Logic',
    estimatedHours: 2.0,
    summary: 'Master IF-THEN-ELSE conditional logic in SQL: Simple CASE, Searched CASE, conditional categorization, and conditional aggregation with SUM(CASE).',
    topics: [
      {
        id: 'top-13-01',
        title: 'Simple and Searched CASE Statements',
        subtopics: ['Searched CASE syntax (CASE WHEN condition THEN ... ELSE ... END)', 'Simple CASE syntax', 'CASE in SELECT for row categorization', 'CASE in ORDER BY for custom sorting', 'Conditional Aggregation (SUM with CASE)'],
        conceptText: `The **CASE statement** is SQL's conditional expression, equivalent to IF-THEN-ELSE in programming.
- **Searched CASE**: Evaluates a series of boolean expressions sequentially.
- **Conditional Aggregation**: Combines \`SUM()\` or \`COUNT()\` with \`CASE\` to pivot or tally specific conditions in a single query pass.`,
        syntaxGuide: `-- Searched CASE:
SELECT 
  first_name,
  salary,
  CASE 
    WHEN salary >= 120000 THEN 'High Executive'
    WHEN salary >= 90000 THEN 'Senior Professional'
    ELSE 'Associate'
  END AS compensation_tier
FROM employees;

-- Conditional Aggregation:
SELECT 
  COUNT(*) AS total_orders,
  SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count,
  SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) AS in_transit_count
FROM orders;`,
        exampleSnippet: {
          title: 'Conditional Tier Categorization',
          query: `SELECT 
  first_name,
  last_name,
  salary,
  CASE 
    WHEN salary >= 120000 THEN 'Executive Tier'
    WHEN salary >= 90000 THEN 'Mid-Senior Tier'
    ELSE 'Standard Tier'
  END AS pay_grade
FROM employees
ORDER BY salary DESC;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Always include an ELSE clause in CASE statements to handle unmatched values cleanly without producing unexpected NULLs.',
        commonPitfall: 'Forgetting the `END` keyword at the end of the CASE expression causes a syntax error.'
      }
    ],
    questions: [
      {
        id: 'q-13-01',
        type: 'Syntax',
        difficulty: 'Intermediate',
        question: 'What is the missing keyword at the end of this statement?\n```sql\nSELECT name, CASE WHEN score >= 90 THEN "A" ELSE "B" ____ AS grade FROM students;\n```',
        options: [
          'END',
          'STOP',
          'DONE',
          'EXIT'
        ],
        correctAnswer: 'A',
        explanation: 'Every `CASE` statement in SQL must terminate with the `END` keyword.',
        hint: 'All CASE expressions end with END.'
      }
    ]
  },

  // =========================================================================
  // MODULE 14: WINDOW FUNCTIONS
  // =========================================================================
  {
    id: 'mod-14',
    number: 14,
    title: 'Window Functions (ROW_NUMBER, RANK, DENSE_RANK, OVER)',
    icon: 'TrendingUp',
    difficulty: 'Advanced',
    difficultyColor: 'rose',
    badge: 'Modern SQL Analytics',
    estimatedHours: 4.5,
    summary: 'Master analytical ranking and running calculations without collapsing rows: OVER(), PARTITION BY, ROW_NUMBER(), RANK(), DENSE_RANK(), and running totals.',
    topics: [
      {
        id: 'top-14-01',
        title: 'Window Functions vs GROUP BY & Ranking Functions',
        subtopics: ['What are Window Functions?', 'Window Functions vs GROUP BY', 'OVER() clause syntax', 'ROW_NUMBER()', 'RANK() with ties and gaps', 'DENSE_RANK() with ties without gaps', 'PARTITION BY vs ORDER BY in OVER()'],
        conceptText: `Unlike \`GROUP BY\` (which collapses multiple rows into a single summary row), **Window Functions** compute aggregate or ranking metrics while **retaining all individual rows in the output**.
- **\`ROW_NUMBER()\`**: Assigns a unique sequential integer (1, 2, 3...) to each row.
- **\`RANK()\`**: Assigns rank numbers. If ties exist (e.g. identical salaries), it assigns the same rank and **skips** subsequent ranks (e.g. 1, 2, 2, 4).
- **\`DENSE_RANK()\`**: Assigns rank numbers with ties **without skipping** ranks (e.g. 1, 2, 2, 3).`,
        syntaxGuide: `SELECT 
  first_name,
  department_id,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS row_num,
  RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dense_rnk
FROM employees;`,
        exampleSnippet: {
          title: 'Department-Wise Salary Ranking',
          query: `SELECT 
  first_name,
  last_name,
  department_id,
  salary,
  DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank
FROM employees
WHERE department_id IS NOT NULL
ORDER BY department_id, dept_rank;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Use DENSE_RANK() for interview ranking questions (e.g. "Find Nth highest salary") so ties do not skip rank numbers.',
        commonPitfall: 'Window functions are evaluated in SELECT; attempting to place `DENSE_RANK()` directly inside WHERE throws a syntax error. Use a CTE or subquery.'
      },
      {
        id: 'top-14-02',
        title: 'Running Totals & Value Navigation (LEAD, LAG)',
        subtopics: ['Cumulative running totals with SUM() OVER (ORDER BY ...)', 'Moving averages', 'LEAD() to inspect next row', 'LAG() to inspect previous row', 'Top N per department solution pattern'],
        conceptText: `Using \`SUM() OVER (ORDER BY date)\` calculates cumulative running totals across time. \`LAG(col, 1)\` retrieves the value from the preceding row, while \`LEAD(col, 1)\` retrieves the value from the next row—essential for calculating day-over-day growth and consecutive event streaks.`,
        syntaxGuide: `-- Cumulative Revenue Running Total:
SELECT 
  order_date,
  total_amount,
  SUM(total_amount) OVER (ORDER BY order_date ASC) AS running_total
FROM orders;

-- Top 2 Salaries Per Department using CTE:
WITH RankedStaff AS (
  SELECT 
    first_name, 
    department_id, 
    salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT first_name, department_id, salary
FROM RankedStaff
WHERE rnk <= 2;`,
        exampleSnippet: {
          title: 'Running Total of Orders',
          query: `SELECT 
  id AS order_id,
  order_date,
  total_amount,
  SUM(total_amount) OVER (ORDER BY order_date ASC, id ASC) AS cumulative_revenue
FROM orders
ORDER BY order_date;`,
          setupSql: COMMON_SCHEMAS.ecommerce
        },
        keyTakeaway: 'Window functions power modern business intelligence, running balances, and cohort analytics without complex self-joins.',
        commonPitfall: 'Forgetting the ORDER BY inside the OVER() clause when computing running totals turns the calculation into an un-ordered full-table sum.'
      }
    ],
    questions: [
      {
        id: 'q-14-01',
        type: 'Comparison',
        difficulty: 'Advanced',
        question: 'Two employees tie for the 2nd highest salary ($100k). How will `RANK()` vs `DENSE_RANK()` assign ranks to the 1st ($120k), 2nd ($100k tie), and next ($90k) employees?',
        options: [
          '`RANK`: 1, 2, 2, 4 | `DENSE_RANK`: 1, 2, 2, 3',
          '`RANK`: 1, 2, 3, 4 | `DENSE_RANK`: 1, 2, 2, 4',
          '`RANK`: 1, 2, 2, 3 | `DENSE_RANK`: 1, 2, 2, 4',
          'Both assign 1, 2, 3, 4'
        ],
        correctAnswer: 'A',
        explanation: '`RANK()` leaves gaps after ties (1, 2, 2, 4), whereas `DENSE_RANK()` assigns consecutive integers without gaps (1, 2, 2, 3).',
        hint: 'Dense rank maintains dense (gapless) numbering.'
      },
      {
        id: 'q-14-02',
        type: 'Error-Finding',
        difficulty: 'Advanced',
        question: 'Why does this query fail?\n```sql\nSELECT first_name, salary\nFROM employees\nWHERE ROW_NUMBER() OVER (ORDER BY salary DESC) = 1;\n```',
        options: [
          'Window functions cannot be placed directly in the `WHERE` clause; they must be wrapped in a CTE or Subquery',
          '`ROW_NUMBER()` requires a `PARTITION BY` clause',
          '`OVER()` cannot have an `ORDER BY` clause',
          'The query requires a `HAVING` clause'
        ],
        correctAnswer: 'A',
        explanation: 'In the SQL execution pipeline, `WHERE` executes before Window functions in `SELECT`. To filter by window rank, wrap the query in a CTE or derived table.',
        hint: 'Window functions are computed after WHERE.'
      }
    ]
  },

  // =========================================================================
  // MODULE 15: CTE (COMMON TABLE EXPRESSIONS)
  // =========================================================================
  {
    id: 'mod-15',
    number: 15,
    title: 'CTE (Common Table Expressions) & Recursive Queries',
    icon: 'Layers',
    difficulty: 'Advanced',
    difficultyColor: 'rose',
    badge: 'Modular Queries',
    estimatedHours: 3.5,
    summary: 'Master WITH clauses, modular multi-step CTEs, combining CTEs with Window functions/joins, and writing Recursive CTEs for hierarchical organizational trees.',
    topics: [
      {
        id: 'top-15-01',
        title: 'Basic & Multiple CTEs (WITH Clause)',
        subtopics: ['What is a CTE?', 'WITH clause syntax', 'Chaining multiple CTEs with commas', 'CTE vs Subquery vs Temporary Table', 'Readability and maintainability'],
        conceptText: `A **CTE** (Common Table Expression) is a temporary, named result set defined using the \`WITH\` clause. CTEs make complex queries modular, easy to read, and reusable within the same execution scope.`,
        syntaxGuide: `WITH DepartmentAvg AS (
  SELECT department_id, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department_id
),
HighEarners AS (
  SELECT e.first_name, e.salary, e.department_id
  FROM employees e
  JOIN DepartmentAvg d ON e.department_id = d.department_id
  WHERE e.salary > d.avg_salary
)
SELECT * FROM HighEarners;`,
        exampleSnippet: {
          title: 'Modular Analytics with CTE',
          query: `WITH DeptPayroll AS (
  SELECT 
    d.department_name,
    COUNT(e.id) AS headcount,
    SUM(e.salary) AS total_payroll
  FROM departments d
  LEFT JOIN employees e ON d.id = e.department_id
  GROUP BY d.id, d.department_name
)
SELECT * FROM DeptPayroll WHERE total_payroll > 100000;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'CTEs break large unwieldy queries into clean, self-documenting logical building blocks.',
        commonPitfall: 'Repeating the `WITH` keyword when defining multiple CTEs—use a comma `,` to separate CTE definitions after a single `WITH`.'
      },
      {
        id: 'top-15-02',
        title: 'Recursive CTEs for Hierarchies',
        subtopics: ['Recursive CTE structure', 'Anchor Member', 'UNION ALL recursive invocation', 'Termination condition', 'Traversing organizational charts & trees'],
        conceptText: `A **Recursive CTE** repeatedly references itself to traverse hierarchical data structures, such as employee-manager reporting chains or bill-of-materials category trees.`,
        syntaxGuide: `WITH RECURSIVE OrgChart AS (
  -- 1. Anchor Member: Top Executive
  SELECT id, first_name, manager_id, 1 AS org_level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- 2. Recursive Member: Direct Reports
  SELECT e.id, e.first_name, e.manager_id, o.org_level + 1
  FROM employees e
  JOIN OrgChart o ON e.manager_id = o.id
)
SELECT * FROM OrgChart ORDER BY org_level, id;`,
        exampleSnippet: {
          title: 'Recursive Employee Hierarchy Walk',
          query: `WITH RECURSIVE OrgChart AS (
  SELECT id, first_name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  SELECT e.id, e.first_name, e.manager_id, o.level + 1
  FROM employees e
  JOIN OrgChart o ON e.manager_id = o.id
)
SELECT * FROM OrgChart ORDER BY level, id;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Recursive CTEs replace complex loop scripts with native, declarative tree traversal in pure SQL.',
        commonPitfall: 'Missing a proper join or termination condition in a Recursive CTE can cause an infinite loop.'
      }
    ],
    questions: [
      {
        id: 'q-15-01',
        type: 'Syntax',
        difficulty: 'Advanced',
        question: 'Which keyword is used to define a Common Table Expression in SQL?',
        options: [
          'WITH',
          'TEMP TABLE',
          'CREATE CTE',
          'DECLARE'
        ],
        correctAnswer: 'A',
        explanation: 'CTEs are declared using the `WITH` keyword at the beginning of a SQL statement.',
        hint: 'Starts with WITH.'
      }
    ]
  },

  // =========================================================================
  // MODULE 16: TRANSACTIONS (TCL)
  // =========================================================================
  {
    id: 'mod-16',
    number: 16,
    title: 'Transactions & ACID Properties (TCL)',
    icon: 'ShieldCheck',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Data Reliability',
    estimatedHours: 2.5,
    summary: 'Master Transaction Control Language: COMMIT, ROLLBACK, SAVEPOINT, and the 4 fundamental ACID properties (Atomicity, Consistency, Isolation, Durability).',
    topics: [
      {
        id: 'top-16-01',
        title: 'ACID Properties & Transaction Control (COMMIT, ROLLBACK, SAVEPOINT)',
        subtopics: ['What is a Transaction?', 'ACID Properties (Atomicity, Consistency, Isolation, Durability)', 'BEGIN / START TRANSACTION', 'COMMIT to persist changes', 'ROLLBACK to revert changes', 'SAVEPOINT checkpoints', 'Banking money transfer scenario'],
        conceptText: `A **Transaction** is a logical unit of work comprising one or more SQL statements that execute as an all-or-nothing operation.
**ACID Principles**:
- **Atomicity**: All operations succeed, or all are rolled back.
- **Consistency**: Database transitions from one valid state to another, obeying all constraints.
- **Isolation**: Concurrent transactions do not interfere with each other.
- **Durability**: Once committed, data changes survive system crashes.`,
        syntaxGuide: `-- Safe Banking Transfer Scenario:
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 500 WHERE account_no = 10001;
UPDATE accounts SET balance = balance + 500 WHERE account_no = 10002;

-- If checks pass:
COMMIT;

-- If an error or insufficient funds occurs:
-- ROLLBACK;`,
        exampleSnippet: {
          title: 'Transaction Boundary Demonstration',
          query: `SELECT first_name, salary FROM employees WHERE id = 1;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Transactions guarantee data correctness in mission-critical applications like banking, e-commerce, and inventory ledgers.',
        commonPitfall: 'Leaving open transactions without issuing COMMIT or ROLLBACK holds database locks and can freeze the entire table for other users.'
      }
    ],
    questions: [
      {
        id: 'q-16-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'Which ACID property guarantees that either all operations in a transaction complete successfully or none of them take effect?',
        options: [
          'Atomicity',
          'Consistency',
          'Isolation',
          'Durability'
        ],
        correctAnswer: 'A',
        explanation: 'Atomicity ensures "all or nothing" execution: if any statement fails, the entire transaction is rolled back.',
        hint: 'Think of an indivisible unit (atom).'
      }
    ]
  },

  // =========================================================================
  // MODULE 17: DCL (DATA CONTROL LANGUAGE)
  // =========================================================================
  {
    id: 'mod-17',
    number: 17,
    title: 'DCL (GRANT, REVOKE & Security Privileges)',
    icon: 'Lock',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Database Security',
    estimatedHours: 2.0,
    summary: 'Master database access control, user authentication, role-based access control (RBAC), and granting/revoking permissions with GRANT and REVOKE.',
    topics: [
      {
        id: 'top-17-01',
        title: 'GRANT, REVOKE & Database Security Roles',
        subtopics: ['Database Users and Roles', 'GRANT privileges (SELECT, INSERT, UPDATE, DELETE)', 'REVOKE privileges', 'Principle of Least Privilege', 'Column-level permissions'],
        conceptText: `**DCL** manages who has access to which database objects:
- **\`GRANT\`**: Gives specific permissions (e.g. \`SELECT\`, \`INSERT\`, \`ALL PRIVILEGES\`) to users or security roles.
- **\`REVOKE\`**: Removes previously granted privileges.
- **Principle of Least Privilege**: Users should only receive the minimum permissions necessary to perform their job duties.`,
        syntaxGuide: `-- Grant read-only access on employees to analyst_user:
GRANT SELECT ON employees TO 'analyst_user'@'localhost';

-- Grant full table control:
GRANT SELECT, INSERT, UPDATE ON orders TO 'app_service';

-- Revoke write privileges:
REVOKE INSERT, UPDATE ON orders FROM 'app_service';`,
        exampleSnippet: {
          title: 'Database Security Concept Mapping',
          query: `SELECT 'DCL Security' AS layer, 'GRANT & REVOKE' AS commands;`,
          setupSql: ``
        },
        keyTakeaway: 'Always apply least privilege: never give application database users administrative DDL privileges in production.',
        commonPitfall: 'Using `GRANT ALL PRIVILEGES` for routine microservice accounts creates severe security vulnerabilities.'
      }
    ],
    questions: [
      {
        id: 'q-17-01',
        type: 'Concept',
        difficulty: 'Intermediate',
        question: 'Which SQL command removes a previously granted permission from a database user?',
        options: [
          'REVOKE',
          'DENY',
          'REMOVE',
          'DROP PERMISSION'
        ],
        correctAnswer: 'A',
        explanation: '`REVOKE` is the standard DCL command used to withdraw privileges from users or roles.',
        hint: 'Opposite of GRANT.'
      }
    ]
  },

  // =========================================================================
  // MODULE 18: STORED PROCEDURES
  // =========================================================================
  {
    id: 'mod-18',
    number: 18,
    title: 'Stored Procedures & Programmable Logic',
    icon: 'Code2',
    difficulty: 'Intermediate',
    difficultyColor: 'amber',
    badge: 'Server-Side Logic',
    estimatedHours: 2.5,
    summary: 'Master Stored Procedures: CREATE PROCEDURE, CALL, DROP PROCEDURE, IN/OUT parameters, variables, IF statements, and reusable database logic.',
    topics: [
      {
        id: 'top-18-01',
        title: 'Stored Procedures & Parameter Modes',
        subtopics: ['What is a Stored Procedure?', 'Advantages (Precompiled plans, network reduction, security)', 'CREATE PROCEDURE syntax', 'CALL procedure', 'IN, OUT, and INOUT parameters', 'Procedural IF/ELSE and loop constructs'],
        conceptText: `A **Stored Procedure** is a prepared, compiled block of SQL code stored directly on the database server.
**Advantages**:
1. **Performance**: Precompiled and cached execution plan.
2. **Reduced Network Traffic**: Complex business transactions execute in one call from application to DB.
3. **Security**: Users can be given permission to execute a procedure without having direct table access.`,
        syntaxGuide: `-- Procedure with IN parameter (MySQL dialect):
DELIMITER //
CREATE PROCEDURE GetDepartmentStaff(IN dept_id INT)
BEGIN
  SELECT first_name, last_name, salary 
  FROM employees 
  WHERE department_id = dept_id;
END //
DELIMITER ;

-- Execute procedure:
CALL GetDepartmentStaff(1);`,
        exampleSnippet: {
          title: 'Stored Procedure Conceptual Flow',
          query: `SELECT 'Stored Procedures' AS feature, 'Compiled on Database Server' AS benefit;`,
          setupSql: ``
        },
        keyTakeaway: 'Stored procedures centralize complex business logic directly beside the data, reducing round-trip latency.',
        commonPitfall: 'Placing heavy application routing logic inside stored procedures makes version control and unit testing harder compared to modern ORM application layers.'
      }
    ],
    questions: [
      {
        id: 'q-18-01',
        type: 'Syntax',
        difficulty: 'Intermediate',
        question: 'Which SQL keyword is used to execute a Stored Procedure?',
        options: [
          'CALL',
          'EXECUTE_NOW',
          'RUN',
          'START'
        ],
        correctAnswer: 'A',
        explanation: 'In standard SQL / MySQL, `CALL procedure_name(args);` is used to execute a stored procedure.',
        hint: '4-letter word starting with C.'
      }
    ]
  },

  // =========================================================================
  // MODULE 19: SQL INTERVIEW DRILLS
  // =========================================================================
  {
    id: 'mod-19',
    number: 19,
    title: 'SQL Interview Mastery (Top 14+ Classic Problems)',
    icon: 'Award',
    difficulty: 'Advanced',
    difficultyColor: 'rose',
    badge: 'Tech Interview Ready',
    estimatedHours: 5.0,
    summary: 'Master the top 14+ high-frequency interview problems asked by Google, Microsoft, Amazon, Meta, TCS, Infosys, and high-growth startups.',
    topics: [
      {
        id: 'top-19-01',
        title: 'Classic High-Frequency Interview Problems',
        subtopics: [
          'Second & Nth Highest Salary',
          'Find & Remove Duplicate Records',
          'Unmatched Records (Departments without staff / Staff without dept)',
          'Top 3 Salaries per Department',
          'Employees Earning Above Department Average',
          'Consecutive Login Streaks',
          'Running Totals & Moving Averages',
          'Latest Record per Customer'
        ],
        conceptText: `Mastering SQL technical interviews requires recognizing standard problem archetypes:
1. **Ranking Archetype**: Nth highest salary / Top N per group -> \`DENSE_RANK() OVER (PARTITION BY ...)\`.
2. **Deduplication Archetype**: Find duplicates -> \`GROUP BY col HAVING COUNT(*) > 1\`. Remove duplicates -> \`ROW_NUMBER() > 1\`.
3. **Difference Archetype**: Items with no relation -> \`LEFT JOIN ... WHERE right.id IS NULL\` or \`NOT EXISTS\`.
4. **Cohort Comparison**: Rows exceeding group averages -> Correlated subquery or Window AVG in a CTE.`,
        syntaxGuide: `-- Nth Highest Salary Pattern:
WITH RankedSalaries AS (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
)
SELECT salary FROM RankedSalaries WHERE rnk = 2 LIMIT 1;`,
        exampleSnippet: {
          title: 'Top 2 Highest Salaries per Department',
          query: `WITH RankedStaff AS (
  SELECT 
    d.department_name,
    e.first_name,
    e.salary,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  JOIN departments d ON e.department_id = d.id
)
SELECT department_name, first_name, salary
FROM RankedStaff
WHERE rnk <= 2
ORDER BY department_name, rnk;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Always ask the interviewer about edge cases: ties, NULLs, empty tables, and case sensitivity before writing the final SQL query.',
        commonPitfall: 'Using `LIMIT 1 OFFSET 1` to find 2nd highest salary without handling ties—if two employees tie for 1st place, OFFSET 1 returns the 1st highest salary again!'
      }
    ],
    questions: [
      {
        id: 'q-19-01',
        type: 'Query-Writing',
        difficulty: 'Advanced',
        question: 'Which query correctly reports the 2nd highest salary handling duplicate top salaries?',
        options: [
          'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);',
          'SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;',
          'SELECT MIN(salary) FROM employees WHERE salary > 0;',
          'SELECT salary FROM employees WHERE salary = 2;'
        ],
        correctAnswer: 'A',
        explanation: '`SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees)` correctly skips duplicate highest salaries and returns NULL if no second salary exists.',
        hint: 'Use the MAX() subquery pattern.'
      }
    ]
  },

  // =========================================================================
  // MODULE 20: REAL-WORLD SQL
  // =========================================================================
  {
    id: 'mod-20',
    number: 20,
    title: 'Real-World Production SQL & Business Case Studies',
    icon: 'Briefcase',
    difficulty: 'Advanced',
    difficultyColor: 'rose',
    badge: 'Enterprise Architecture',
    estimatedHours: 4.0,
    summary: 'Solve end-to-end analytical business challenges across 4 production schemas: Employee HR Analytics, B2B Sales, E-Commerce Platform, and Core Banking.',
    topics: [
      {
        id: 'top-20-01',
        title: 'Production Schemas & Business Analytics',
        subtopics: ['Employee HR Analytics schema', 'Sales & Revenue Operations schema', 'E-Commerce Marketplace schema', 'Banking Ledger & Transaction schema', 'Writing executive reporting queries'],
        conceptText: `In production software engineering and data analytics, SQL queries connect multiple normalized tables to produce high-value business insights:
- **HR**: Compensation ratios, retention by tenure, manager load factor.
- **Sales**: Customer Lifetime Value (LTV), Average Order Value (AOV), product gross margins.
- **E-Commerce**: Conversion rates, category sales velocity, rating distributions.
- **Banking**: Liquid assets, account velocity, audit transaction ledgers.`,
        syntaxGuide: `-- Executive Revenue & Volume Summary:
SELECT 
  category,
  COUNT(id) AS total_orders,
  ROUND(SUM(unit_price * quantity), 2) AS gross_merchandise_value
FROM order_items
GROUP BY category
ORDER BY gross_merchandise_value DESC;`,
        exampleSnippet: {
          title: 'Customer Lifetime Value Analysis',
          query: `SELECT 
  c.name AS customer,
  c.country,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS lifetime_spend
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.country
ORDER BY lifetime_spend DESC;`,
          setupSql: COMMON_SCHEMAS.ecommerce
        },
        keyTakeaway: 'Writing production SQL requires handling NULL values defensively, aliasing columns cleanly for reports, and formatting currency/percentages.',
        commonPitfall: 'Performing raw calculations directly on financial floats without explicit decimal precision rounding.'
      }
    ],
    questions: [
      {
        id: 'q-20-01',
        type: 'Scenario-Based',
        difficulty: 'Advanced',
        question: 'When computing Customer Lifetime Value across `customers` and `orders`, why is a `LEFT JOIN` required rather than an `INNER JOIN`?',
        options: [
          'To ensure newly registered customers who haven\'t placed an order yet still appear in the report with a 0 spend',
          'Because INNER JOIN cannot work with SUM()',
          'LEFT JOIN is always faster than INNER JOIN',
          'To prevent duplicate orders from being counted'
        ],
        correctAnswer: 'A',
        explanation: 'A LEFT JOIN retains all customers in the report, including zero-order accounts (which can be formatted with COALESCE(SUM, 0)).',
        hint: 'Consider accounts that have 0 orders.'
      }
    ]
  },

  // =========================================================================
  // MODULE 21: SQL CODE CHALLENGES & LAB
  // =========================================================================
  {
    id: 'mod-21',
    number: 21,
    title: 'SQL Code Challenges & Live Interactive Lab',
    icon: 'Sparkles',
    difficulty: 'Advanced',
    difficultyColor: 'rose',
    badge: 'Hands-on Coding',
    estimatedHours: 6.0,
    summary: 'Solve hands-on interactive coding challenges executed in-browser via WebAssembly SQLite. Immediate feedback, automated grading, schema visualization, and diff checking.',
    topics: [
      {
        id: 'top-21-01',
        title: 'Beginner, Intermediate & Advanced Code Challenges',
        subtopics: ['Interactive Code Editor (Keyboard shortcuts Ctrl+Enter)', 'Schema & Table Visualizer', 'Test Case Evaluation against canonical SQL', 'Result Diff Viewer', 'Performance execution timer'],
        conceptText: `Practice is the fastest way to master SQL. The Code Lab runs real SQLite WebAssembly directly in your browser with **zero server delay and zero server load**. You can write queries, view live database table state, check schema structures, and validate your solutions against canonical test benchmarks.`,
        syntaxGuide: `-- Practice writing clean, deterministic queries:
SELECT * FROM employees ORDER BY salary DESC LIMIT 5;`,
        exampleSnippet: {
          title: 'Interactive Query Sandbox Test',
          query: `SELECT 
  department_id, 
  COUNT(*) AS total_staff, 
  ROUND(AVG(salary), 2) AS average_salary
FROM employees
GROUP BY department_id
ORDER BY average_salary DESC;`,
          setupSql: COMMON_SCHEMAS.hrCompany
        },
        keyTakeaway: 'Solve challenges without looking at hints first to build independent muscle memory and problem-solving intuition.',
        commonPitfall: 'Writing queries that happen to match test data by coincidence but fail on edge cases—always consider NULLs, duplicates, and ordering.'
      }
    ],
    questions: [
      {
        id: 'q-21-01',
        type: 'Concept',
        difficulty: 'Beginner',
        question: 'What is the fastest way to run your SQL query in the interactive code lab?',
        options: [
          'Press Ctrl+Enter (or Cmd+Enter on Mac)',
          'Refresh the entire browser page',
          'Press the Escape key twice',
          'Click the back button'
        ],
        correctAnswer: 'A',
        explanation: 'Pressing `Ctrl + Enter` (or `Cmd + Enter` on macOS) triggers immediate query execution in the code lab.',
        hint: 'Standard code editor shortcut for execution.'
      }
    ]
  }
];

export const TOTAL_MODULES_COUNT = SQL_MODULES.length;
export const TOTAL_TOPICS_COUNT = SQL_MODULES.reduce((sum, m) => sum + m.topics.length, 0);
export const TOTAL_QUESTIONS_COUNT = SQL_MODULES.reduce((sum, m) => sum + m.questions.length, 0);
