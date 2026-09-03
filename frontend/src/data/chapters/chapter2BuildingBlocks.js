// =========================================================================
// 📘 CHAPTER 2: SQL KEYWORDS, DATA TYPES & OPERATORS
// =========================================================================

export const CHAPTER_2_METADATA = {
  id: 'mod-02',
  number: 2,
  title: 'SQL Keywords, Data Types & Operators',
  shortTitle: 'Keywords, Data Types & Operators',
  status: 'available',
  badge: 'Live',
  releaseDate: 'Available Now',
  description: 'Master the foundational building blocks of SQL: reserved language keywords & clause orders, exhaustive numeric/string/temporal data types, and arithmetic/comparison/logical operators.',
  topics: [
    {
      id: 'top-02-01',
      title: 'SQL Keywords & Reserved Words',
      lessonCode: '2.1',
      summary: 'Learn how SQL compilers parse reserved words, keyword classifications (DDL, DML, DQL, TCL), lexical clause ordering, and identifier quoting rules.',
      estimatedTime: '20 min'
    },
    {
      id: 'top-02-02',
      title: 'SQL Data Types Deep Dive',
      lessonCode: '2.2',
      summary: 'Comprehensive guide to numeric, character, date/time, boolean, and JSON data types with storage footprints and precision rules.',
      estimatedTime: '30 min'
    },
    {
      id: 'top-02-03',
      title: 'Operators in SQL (Arithmetic, Comparison & Logical)',
      lessonCode: '2.3',
      summary: 'Deep dive into arithmetic, comparison, pattern matching, logical operators, operator precedence, and Three-Valued Logic (3VL).',
      estimatedTime: '25 min'
    }
  ]
};

export const CHAPTER_2_TOPICS = {
  // =========================================================================
  // LESSON 2.1: SQL KEYWORDS & RESERVED WORDS
  // =========================================================================
  'top-02-01': {
    id: 'top-02-01',
    chapterNumber: 2,
    lessonNumber: 1,
    lessonCode: '2.1',
    title: 'SQL Keywords & Reserved Words',
    subtitle: 'Syntax Tokens, Clause Hierarchy, Identifier Quoting & Reserved Names',
    intro: 'Every SQL statement is a sequence of tokens interpreted by the database engine parser. SQL Keywords are standardized words reserved by the language specification (ANSI SQL) to perform specific operations—such as selecting data, declaring constraints, or filtering rows. Because the parser attaches predefined semantic meaning to these words, understanding keyword taxonomy and naming collision rules is critical for writing robust production queries.',

    comparisonTable: {
      title: 'SQL Token Taxonomy: Keywords vs Identifiers vs Literals',
      badge: 'Lexical Grammar',
      headers: ['Token Category', 'Definition & Semantic Role', 'Production Example'],
      rows: [
        {
          feature: 'Reserved Keywords',
          values: [
            'Words permanently reserved by the SQL standard parser with special grammatical meaning; cannot be used as unquoted table/column names.',
            'SELECT, FROM, WHERE, CREATE, TABLE, INSERT, ALTER, DROP, GROUP BY, HAVING, ORDER BY'
          ]
        },
        {
          feature: 'Non-Reserved Keywords',
          values: [
            'Words recognized by the engine in specific contexts (like function names or clauses) but permitted as table or column names without quotes in certain engines.',
            'COUNT, AVG, DATE, STATUS, TITLE, FORMAT, ACTION, FIRST, LAST'
          ]
        },
        {
          feature: 'User Identifiers',
          values: [
            'Names defined by developers to represent database objects (databases, tables, views, columns, indexes, triggers, stored procedures).',
            'employees, department_id, salary, hire_date, idx_user_email'
          ]
        },
        {
          feature: 'Literals & Constants',
          values: [
            'Concrete, explicit data values embedded directly into SQL expressions (numbers, single-quoted strings, dates, NULL, TRUE/FALSE).',
            "'Engineering', 75000, 3.14159, '2026-01-15', NULL, TRUE"
          ]
        }
      ]
    },

    structuralDefinitions: [
      {
        term: '1. DDL Keywords (Definition)',
        definition: 'Commands used to define, alter, and delete database schemas and structures. Examples: CREATE, ALTER, DROP, TRUNCATE, RENAME.'
      },
      {
        term: '2. DML Keywords (Manipulation)',
        definition: 'Commands used to modify existing rows within tables. Examples: INSERT, UPDATE, DELETE, MERGE.'
      },
      {
        term: '3. DQL Keywords (Querying)',
        definition: 'The fundamental data retrieval vocabulary used to inspect data. Examples: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.'
      },
      {
        term: '4. DCL Keywords (Control & Security)',
        definition: 'Keywords controlling user privileges, roles, and access permissions. Examples: GRANT, REVOKE.'
      },
      {
        term: '5. TCL Keywords (Transactions)',
        definition: 'Keywords managing the atomic boundaries of transactions. Examples: COMMIT, ROLLBACK, SAVEPOINT.'
      },
      {
        term: '6. Predicate & Clause Keywords',
        definition: 'Keywords qualifying boolean expressions and data filtering. Examples: AND, OR, NOT, IN, BETWEEN, LIKE, IS NULL, EXISTS, CASE.'
      }
    ],

    sqlSteps: [
      {
        step: 1,
        title: 'Universal Syntactic Clause Order in SQL',
        badge: 'Query Grammar',
        explanation: 'SQL has a strict lexical order in which clauses must be written. Notice the sequence: SELECT -> FROM -> WHERE -> ORDER BY -> LIMIT.',
        code: `SELECT first_name, salary 
FROM employees 
WHERE salary > 60000 
ORDER BY salary DESC 
LIMIT 5;`
      },
      {
        step: 2,
        title: 'Escaping Reserved Keywords in MySQL / SQLite (Backticks)',
        badge: 'MySQL Quoting',
        explanation: 'If a table or column name happens to match a reserved SQL word like "order" or "status", escape it with backticks (`).',
        code: `SELECT \`order_id\`, \`status\` 
FROM \`orders\` 
WHERE \`status\` = 'COMPLETED';`
      },
      {
        step: 3,
        title: 'Escaping Reserved Keywords in PostgreSQL / ANSI SQL (Double Quotes)',
        badge: 'ANSI SQL Quoting',
        explanation: 'In standard ANSI SQL and PostgreSQL, reserved words used as identifiers must be enclosed in double quotes (").',
        code: `SELECT "order_id", "status" 
FROM "orders" 
WHERE "status" = 'COMPLETED';`
      },
      {
        step: 4,
        title: 'Recommended Best Practice: Avoid Reserved Words with Clear Names',
        badge: 'Clean Architecture',
        explanation: 'Rather than using quotes, rename columns to self-descriptive snake_case nouns to avoid any conflict with SQL keywords.',
        code: `SELECT order_number, user_group, account_status 
FROM customer_orders 
WHERE account_status = 'ACTIVE';`
      }
    ],

    commonMistakes: [
      {
        title: 'Using Unquoted Reserved Words in Column Names',
        wrong: 'CREATE TABLE orders (order INT, group VARCHAR(50), desc TEXT);',
        correct: 'CREATE TABLE orders (order_id INT, group_name VARCHAR(50), description TEXT);',
        why: 'Words like "order", "group", and "desc" are core reserved words. Without quotes or prefixes, the SQL parser throws a fatal syntax error.'
      },
      {
        title: 'Confusing Written Clause Order',
        wrong: 'SELECT * FROM employees ORDER BY salary WHERE salary > 50000;',
        correct: 'SELECT * FROM employees WHERE salary > 50000 ORDER BY salary;',
        why: 'The WHERE clause must always precede GROUP BY, HAVING, and ORDER BY clauses.'
      }
    ],

    keyTakeaways: [
      'SQL Keywords are reserved by the language specification to define schemas, manipulate rows, and filter queries.',
      'SQL has a strict written clause order: SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT.',
      'Always format SQL keywords in UPPERCASE and object identifiers (tables, columns) in lowercase_snake_case for legibility.',
      'If forced to use a reserved word as an identifier, escape it with backticks in MySQL/SQLite or double quotes in PostgreSQL/ANSI SQL.'
    ],

    prevTopicId: 'top-01-04',
    prevTopicName: 'Install MySQL & Workbench',
    nextTopicId: 'top-02-02',
    nextTopicName: 'SQL Data Types Deep Dive'
  },

  // =========================================
  // LESSON 2.2: SQL DATA TYPES DEEP DIVE
  // =========================================
  'top-02-02': {
    id: 'top-02-02',
    chapterNumber: 2,
    lessonNumber: 2,
    lessonCode: '2.2',
    title: 'SQL Data Types Deep Dive',
    subtitle: 'Numeric, String, Temporal, Boolean & JSON Primitives and Storage Engine Footprints',
    intro: 'Data types define the nature of data stored inside each column, how the database engine allocates storage bytes on physical disk blocks, what mathematical or textual operations are permitted, and how indexes are structured. Choosing the correct data type prevents data truncation, guarantees arithmetic precision for financial records, and optimizes memory buffer pool utilization.',

    comparisonTable: {
      title: 'SQL Core Data Types Matrix & Memory Footprint',
      badge: 'Storage Architecture',
      headers: ['Data Type', 'Storage Size', 'Permitted Range / Value Format', 'Ideal Use Case'],
      rows: [
        {
          feature: 'TINYINT',
          values: ['1 Byte', '-128 to 127 (or 0 to 255 UNSIGNED)', 'Status flags, age, small enumerated types (0 = Inactive, 1 = Active)']
        },
        {
          feature: 'INT / INTEGER',
          values: ['4 Bytes', '-2.14 Billion to +2.14 Billion (up to 4.29 Billion UNSIGNED)', 'Standard Primary Keys, order quantities, view counts']
        },
        {
          feature: 'BIGINT',
          values: ['8 Bytes', '-9 Quintillion to +9 Quintillion', 'High-scale primary keys, financial ledgers, distributed Snowflake IDs']
        },
        {
          feature: 'DECIMAL(M, D) / NUMERIC',
          values: ['Variable (Exact)', 'Up to 65 significant digits (M = total digits, D = decimals)', 'Currency balances, bank accounts, taxes (Guarantees zero floating-point rounding error)']
        },
        {
          feature: 'FLOAT / DOUBLE',
          values: ['4 / 8 Bytes', 'Approximate IEEE-754 floating point numbers', 'Scientific telemetry, GPS latitude/longitude, physics simulations']
        },
        {
          feature: 'CHAR(N)',
          values: ['Fixed N Bytes', 'Fixed length up to 255 characters (space-padded if shorter)', 'Country codes (e.g., ISO "US", "IN"), SHA-256 hashes, currency codes ("USD")']
        },
        {
          feature: 'VARCHAR(N)',
          values: ['1-2 Bytes + N', 'Variable length string up to 65,535 bytes with length prefix', 'User names, emails, addresses, article titles, variable descriptions']
        },
        {
          feature: 'TEXT / LONGTEXT',
          values: ['2-4 Bytes + Length', 'Up to 4GB of text stored off-page in overflow storage', 'Blog posts, HTML bodies, long legal contracts, audit log payloads']
        },
        {
          feature: 'DATE',
          values: ['3 Bytes', 'YYYY-MM-DD (Range: 1000-01-01 to 9999-12-31)', 'Birth dates, invoice dates, project milestone deadlines']
        },
        {
          feature: 'DATETIME',
          values: ['5-8 Bytes', 'YYYY-MM-DD HH:MM:SS (Constant, no timezone offset)', 'Calendar events, appointment dates independent of server timezone']
        },
        {
          feature: 'TIMESTAMP',
          values: ['4 Bytes', 'UTC Unix epoch (1970 to 2038); converts automatically to connection timezone', 'Created_at, updated_at audit timestamps in global microservices']
        },
        {
          feature: 'JSON',
          values: ['Variable', 'Binary-optimized BSON format with indexable virtual paths', 'Dynamic configs, metadata tags, third-party webhook payloads']
        }
      ]
    },

    sqlSteps: [
      {
        step: 1,
        title: 'Exact Financial Balances with DECIMAL(M, D)',
        badge: 'Financial Precision',
        explanation: 'Never use FLOAT for money! Always use DECIMAL(12, 2) which reserves 12 total digits with exactly 2 digits after the decimal point for 100% zero-rounding error.',
        code: `CREATE TABLE financial_accounts (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    current_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);`
      },
      {
        step: 2,
        title: 'Approximate Scientific Readings with FLOAT',
        badge: 'Scientific Floating-Point',
        explanation: 'Use FLOAT or DOUBLE for scientific sensors, physics simulations, or GPS coordinates where extreme decimal speed matters more than absolute financial precision.',
        code: `CREATE TABLE sensor_readings (
    reading_id INT PRIMARY KEY AUTO_INCREMENT,
    temperature_celsius FLOAT(5, 2) NOT NULL
);`
      },
      {
        step: 3,
        title: 'Fixed-Length Character Strings with CHAR(N)',
        badge: 'Fixed String',
        explanation: 'CHAR(2) allocates exactly 2 bytes per row. This provides rapid memory indexing for fixed codes like 2-letter country codes (US, IN, CA).',
        code: `CREATE TABLE country_lookup (
    country_code CHAR(2) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL
);`
      },
      {
        step: 4,
        title: 'Variable-Length Strings with VARCHAR(N)',
        badge: 'Variable String',
        explanation: 'VARCHAR(255) dynamically allocates only the actual bytes used by the user email plus a 1-byte length prefix.',
        code: `CREATE TABLE registered_users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email_address VARCHAR(255) NOT NULL UNIQUE
);`
      },
      {
        step: 5,
        title: 'Automatic Audit Timestamps with TIMESTAMP',
        badge: 'Audit Timestamps',
        explanation: 'TIMESTAMP automatically records the UTC timestamp when a record is inserted without requiring manual code.',
        code: `CREATE TABLE system_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
      },
      {
        step: 6,
        title: 'Explicit Type Conversion with CAST()',
        badge: 'Casting Function',
        explanation: 'Use CAST(val AS type) to convert an integer into a decimal to perform real division without integer truncation.',
        code: `SELECT CAST(10 AS DECIMAL(5, 2)) / 4 AS precise_division;`
      }
    ],

    commonMistakes: [
      {
        title: 'Using FLOAT or DOUBLE for Financial Currencies',
        wrong: 'CREATE TABLE bank_ledger (balance FLOAT NOT NULL);',
        correct: 'CREATE TABLE bank_ledger (balance DECIMAL(15, 2) NOT NULL);',
        why: 'IEEE 754 floating-point numbers cannot accurately represent base-10 fractions like $0.10. Over thousands of calculations, fractional cents vanish, causing audit failures.'
      },
      {
        title: 'Over-allocating VARCHAR Size Without Constraints',
        wrong: 'CREATE TABLE customers (state_code VARCHAR(255));',
        correct: 'CREATE TABLE customers (state_code CHAR(2));',
        why: 'US or Indian state codes have a fixed length. Using VARCHAR(255) wastes memory buffer allocations in sorting operations.'
      }
    ],

    keyTakeaways: [
      'Choose the smallest data type that safely accommodates all future data values to optimize disk space and buffer pool RAM cache.',
      'Always use DECIMAL(M, D) for currency and financial ledgers to avoid catastrophic floating-point rounding errors.',
      'Use CHAR(N) for fixed-length codes (hashes, 2-letter country codes) and VARCHAR(N) for variable names, emails, and titles.',
      'Use TIMESTAMP for universal UTC audit columns (created_at, updated_at) and DATETIME for timezone-independent dates.'
    ],

    prevTopicId: 'top-02-01',
    prevTopicName: 'SQL Keywords & Reserved Words',
    nextTopicId: 'top-02-03',
    nextTopicName: 'Operators in SQL (Arithmetic, Comparison & Logical)'
  },

  // =========================================================================
  // LESSON 2.3: OPERATORS IN SQL (ARITHMETIC, COMPARISON & LOGICAL)
  // =========================================================================
  'top-02-03': {
    id: 'top-02-03',
    chapterNumber: 2,
    lessonNumber: 3,
    lessonCode: '2.3',
    title: 'Operators in SQL (Arithmetic, Comparison & Logical)',
    subtitle: 'Expressions, Three-Valued Logic (3VL), Pattern Matching & Operator Precedence',
    intro: 'Operators are symbolic expressions that instruct the database engine to execute mathematical computations, evaluate relational comparisons, or combine logical conditions. SQL uses a unique Three-Valued Logic (3VL) system where expressions evaluate to TRUE, FALSE, or UNKNOWN (NULL). Mastering operators ensures accurate business logic filtering, avoids NULL comparison traps, and prevents operator precedence bugs.',

    comparisonTable: {
      title: 'SQL Operators Master Taxonomy & Precedence Order',
      badge: 'Evaluation Hierarchy',
      headers: ['Operator Type', 'Symbols / Keywords', 'Description & Behavior', 'Precedence'],
      rows: [
        {
          feature: 'Arithmetic Operators',
          values: ['+ , - , * , / , % (MOD)', 'Mathematical computation on numeric columns; any arithmetic with NULL returns NULL.', 'Highest']
        },
        {
          feature: 'Relational Comparison',
          values: ['= , != / <> , < , > , <= , >=', 'Compares two scalar values; returns TRUE, FALSE, or UNKNOWN if either operand is NULL.', 'High']
        },
        {
          feature: 'Range & Set Comparison',
          values: ['BETWEEN ... AND ... , IN (...)', 'Tests if a value falls within an inclusive numeric/date range or matches a list of members.', 'Medium-High']
        },
        {
          feature: 'Pattern Matching',
          values: ['LIKE (% , _) , REGEXP', 'Matches string patterns (% represents 0+ characters, _ represents exactly 1 character).', 'Medium']
        },
        {
          feature: 'Nullity Operators',
          values: ['IS NULL , IS NOT NULL', 'The ONLY valid way to test for absence of data in SQL (because column = NULL yields UNKNOWN).', 'Medium']
        },
        {
          feature: 'Logical NOT',
          values: ['NOT (or !)', 'Inverts the truth value of a boolean predicate (NOT TRUE -> FALSE, NOT NULL -> NULL).', 'Medium']
        },
        {
          feature: 'Logical AND',
          values: ['AND (or &&)', 'Returns TRUE only if BOTH conditions are TRUE; evaluates BEFORE the OR operator.', 'Low']
        },
        {
          feature: 'Logical OR',
          values: ['OR (or ||)', 'Returns TRUE if EITHER condition is TRUE; evaluates AFTER AND unless parenthesized.', 'Lowest']
        }
      ]
    },

    structuralDefinitions: [
      {
        term: 'Three-Valued Logic (3VL: TRUE, FALSE, UNKNOWN)',
        definition: 'In SQL, NULL does not equal zero or empty string; it represents "missing or unknown". Therefore, NULL = NULL evaluates to UNKNOWN, not TRUE! Always use IS NULL or IS NOT NULL.'
      },
      {
        term: 'Short-Circuit Evaluation',
        definition: 'SQL query optimizers may evaluate clauses in any physical order that produces the correct result. Never rely on the sequential left-to-right evaluation of conditions to prevent division by zero; use NULLIF or CASE WHEN.'
      },
      {
        term: 'Operator Precedence Hazard (AND before OR)',
        definition: 'The logical operator AND binds tighter than OR. An expression "A OR B AND C" is parsed as "A OR (B AND C)". Always use explicit parentheses to enforce intended business logic!'
      },
      {
        term: 'Wildcard Semantics in LIKE',
        definition: 'Percent sign (%) matches zero or more arbitrary characters. Underscore (_) matches exactly one single character. To search for literal % or _, escape with backslash (\\% or \\_).'
      }
    ],

    sqlSteps: [
      {
        step: 1,
        title: 'Multiplication Operator (*) — Calculating Stock Value',
        badge: 'Arithmetic Math',
        explanation: 'Multiply unit price by available stock quantity to compute the total financial valuation of inventory.',
        code: `SELECT 
    product_name,
    unit_price,
    quantity_in_stock,
    unit_price * quantity_in_stock AS total_stock_value
FROM products;`
      },
      {
        step: 2,
        title: 'Modulo Operator (%) — Finding Remainder Units',
        badge: 'Modulo Math',
        explanation: 'Use the modulo operator (%) to calculate leftovers after packaging stock units into dozens (12-packs).',
        code: `SELECT 
    product_name,
    quantity_in_stock,
    quantity_in_stock % 12 AS leftover_units
FROM products;`
      },
      {
        step: 3,
        title: 'Safe Arithmetic with NULL Using COALESCE()',
        badge: 'NULL Safety',
        explanation: 'In SQL, subtracting NULL yields NULL! Use COALESCE(discount, 0) to provide a safe 0.00 default when calculating discounts.',
        code: `SELECT 
    product_name,
    unit_price,
    unit_price - COALESCE(discount_amount, 0.00) AS final_discounted_price
FROM products;`
      },
      {
        step: 4,
        title: 'Comparison Operators (>=) — Salary Threshold Filter',
        badge: 'Relational Comparison',
        explanation: 'Retrieve all employees who earn a salary greater than or equal to $75,000.',
        code: `SELECT employee_id, first_name, salary
FROM employees
WHERE salary >= 75000;`
      },
      {
        step: 5,
        title: 'Set Matching with IN Operator — Multiple Department IDs',
        badge: 'Set Membership',
        explanation: 'Use the IN operator to check if an employee belongs to department 1, 3, or 5 cleanly without messy OR chains.',
        code: `SELECT employee_id, first_name, department_id
FROM employees
WHERE department_id IN (1, 3, 5);`
      },
      {
        step: 6,
        title: 'Inclusive Range Filtering with BETWEEN Operator',
        badge: 'Range Filter',
        explanation: 'Retrieve all customer orders placed between January 1, 2026 and March 31, 2026 (both boundary dates are included).',
        code: `SELECT order_id, customer_id, order_date, total_amount
FROM orders
WHERE order_date BETWEEN '2026-01-01' AND '2026-03-31';`
      },
      {
        step: 7,
        title: 'Wildcard String Matching with LIKE and Percent Sign (%)',
        badge: 'Prefix Wildcard',
        explanation: 'Find all faculty instructors whose professional title starts with "Dr." followed by any number of characters.',
        code: `SELECT employee_id, first_name, title
FROM faculty
WHERE title LIKE 'Dr.%';`
      },
      {
        step: 8,
        title: 'Exact Length String Matching with LIKE and Underscore (_)',
        badge: 'Single Char Wildcard',
        explanation: 'Find all serial codes that have exactly 4 characters, starting with "A" and ending with "9". Each underscore (_) represents exactly 1 character.',
        code: `SELECT product_id, product_name, serial_code
FROM serial_numbers
WHERE serial_code LIKE 'A__9';`
      },
      {
        step: 9,
        title: 'Precedence Trap: Omitting Parentheses in AND/OR (Buggy Query)',
        badge: 'Logic Hazard',
        explanation: 'Because AND evaluates before OR, this query mistakenly selects ALL Engineering employees regardless of salary, or Data Science employees over 90k!',
        code: `SELECT employee_id, first_name, department, salary
FROM employees
WHERE department = 'Engineering' OR department = 'Data Science' AND salary > 90000;`
      },
      {
        step: 10,
        title: 'Fixing Precedence: Enforcing Logic with Explicit Parentheses',
        badge: 'Logic Protection',
        explanation: 'Wrapping the department conditions inside parentheses ensures the salary > 90000 threshold applies to BOTH departments.',
        code: `SELECT employee_id, first_name, department, salary
FROM employees
WHERE (department = 'Engineering' OR department = 'Data Science') 
  AND salary > 90000;`
      },
      {
        step: 11,
        title: 'The NULL Trap: Why "= NULL" Always Returns 0 Rows',
        badge: '3VL Pitfall',
        explanation: 'In SQL Three-Valued Logic, comparing with "= NULL" produces UNKNOWN (treated as false). This query will never return any rows!',
        code: `SELECT employee_id, first_name, manager_id
FROM employees
WHERE manager_id = NULL;`
      },
      {
        step: 12,
        title: 'The Correct Nullity Check: IS NULL',
        badge: 'Nullity Verification',
        explanation: 'Use IS NULL to properly retrieve all top-level executives who do not have an assigned manager.',
        code: `SELECT employee_id, first_name, manager_id
FROM employees
WHERE manager_id IS NULL;`
      },
      {
        step: 13,
        title: 'Filtering Existing Records: IS NOT NULL',
        badge: 'Active Data Filter',
        explanation: 'Use IS NOT NULL to retrieve only employees who actively report to an assigned manager.',
        code: `SELECT employee_id, first_name, manager_id
FROM employees
WHERE manager_id IS NOT NULL;`
      }
    ],

    commonMistakes: [
      {
        title: 'Comparing Columns to NULL with "=" Instead of "IS NULL"',
        wrong: 'SELECT * FROM users WHERE deleted_at = NULL;',
        correct: 'SELECT * FROM users WHERE deleted_at IS NULL;',
        why: 'In ANSI SQL Three-Valued Logic, NULL represents unknown data. An unknown value cannot be equal to another unknown value, so "= NULL" always evaluates to UNKNOWN (treated as FALSE).'
      },
      {
        title: 'Omitting Parentheses in Mixed AND/OR Predicates',
        wrong: 'SELECT * FROM accounts WHERE status = 1 OR tier = 2 AND balance > 1000;',
        correct: 'SELECT * FROM accounts WHERE (status = 1 OR tier = 2) AND balance > 1000;',
        why: 'AND evaluates before OR. Without parentheses, any row matching status = 1 is selected regardless of balance.'
      }
    ],

    keyTakeaways: [
      'Arithmetic operations involving NULL automatically propagate to NULL; use COALESCE(col, 0) to guarantee a fallback numeric default.',
      'Comparison operators evaluate to TRUE, FALSE, or UNKNOWN. Always use IS NULL / IS NOT NULL rather than = NULL.',
      'AND has higher operator precedence than OR. Always wrap OR conditions in parentheses when combined with AND.',
      'BETWEEN is inclusive of both the start and end values (e.g. BETWEEN 1 AND 10 includes both 1 and 10).'
    ],

    prevTopicId: 'top-02-02',
    prevTopicName: 'SQL Data Types Deep Dive',
    nextTopicId: 'top-create-table',
    nextTopicName: 'CREATE (Tables & Databases)'
  }
};
