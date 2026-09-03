import initSqlJs from 'sql.js';

let sqlPromise = null;

/**
 * Initializes and caches the sql.js WebAssembly engine.
 * Tries local /sql-wasm.wasm first, then falls back to CDN if necessary.
 */
export async function getSqlInstance() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      try {
        return await initSqlJs({
          locateFile: (file) => `/${file}`
        });
      } catch (err) {
        console.warn('Local wasm load failed, falling back to CDN:', err);
        try {
          return await initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
          });
        } catch (cdnErr) {
          sqlPromise = null; // reset cache so subsequent attempts can retry
          throw cdnErr;
        }
      }
    })();
  }
  return sqlPromise;
}

/**
 * Registers multi-dialect built-in SQL functions (MySQL, Postgres, Oracle, SQL Server)
 * into SQLite instance so any standard or dialect-specific function works natively.
 */
function registerCustomSqlFunctions(db) {
  if (!db || !db.create_function) return;

  try {
    // 1. String Functions
    // CONCAT(a, b, c, ...)
    db.create_function('CONCAT', (...args) => {
      return args.filter(a => a !== null && a !== undefined).join('');
    });

    // CONCAT_WS(separator, a, b, c, ...)
    db.create_function('CONCAT_WS', (sep, ...args) => {
      if (sep === null || sep === undefined) sep = '';
      return args.filter(a => a !== null && a !== undefined).join(String(sep));
    });

    // LEN(str) -> T-SQL length
    db.create_function('LEN', (str) => {
      if (str === null || str === undefined) return null;
      return String(str).length;
    });

    // REVERSE(str)
    db.create_function('REVERSE', (str) => {
      if (str === null || str === undefined) return null;
      return String(str).split('').reverse().join('');
    });

    // REPEAT(str, count)
    db.create_function('REPEAT', (str, count) => {
      if (str === null || count === null || count < 0) return null;
      return String(str).repeat(count);
    });

    // LPAD(str, len, pad)
    db.create_function('LPAD', (str, len, pad = ' ') => {
      if (str === null || len === null) return null;
      return String(str).padStart(len, String(pad));
    });

    // RPAD(str, len, pad)
    db.create_function('RPAD', (str, len, pad = ' ') => {
      if (str === null || len === null) return null;
      return String(str).padEnd(len, String(pad));
    });

    // 2. Null Handling & Conditional Functions
    // IFNULL / ISNULL / NVL
    db.create_function('IFNULL', (a, b) => (a !== null && a !== undefined ? a : b));
    db.create_function('ISNULL', (a, b) => (a !== null && a !== undefined ? a : b));
    db.create_function('NVL', (a, b) => (a !== null && a !== undefined ? a : b));

    // IF(condition, true_val, false_val)
    db.create_function('IF', (cond, trueVal, falseVal) => (cond ? trueVal : falseVal));

    // 3. Date & Time Functions
    // NOW() / CURRENT_TIMESTAMP() / GETDATE() / SYSDATE
    const getNowIso = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
    const getCurDateIso = () => new Date().toISOString().slice(0, 10);

    db.create_function('NOW', () => getNowIso());
    db.create_function('GETDATE', () => getNowIso());
    db.create_function('SYSDATE', () => getNowIso());
    db.create_function('CURDATE', () => getCurDateIso());
    db.create_function('CURRENT_DATE', () => getCurDateIso());

    // YEAR(date), MONTH(date), DAY(date)
    db.create_function('YEAR', (d) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
    });

    db.create_function('MONTH', (d) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed.getMonth() + 1;
    });

    db.create_function('DAY', (d) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed.getDate();
    });

    // DATEDIFF(d1, d2) -> returns days between d1 and d2
    db.create_function('DATEDIFF', (d1, d2) => {
      if (!d1 || !d2) return null;
      const t1 = new Date(d1).getTime();
      const t2 = new Date(d2).getTime();
      if (isNaN(t1) || isNaN(t2)) return null;
      return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
    });

    // 4. Math & Statistical Functions
    db.create_function('POW', (a, b) => Math.pow(a, b));
    db.create_function('POWER', (a, b) => Math.pow(a, b));
    db.create_function('SQRT', (a) => (a < 0 ? null : Math.sqrt(a)));
    db.create_function('MOD', (a, b) => (b === 0 ? null : a % b));
    db.create_function('CEIL', (a) => Math.ceil(a));
    db.create_function('CEILING', (a) => Math.ceil(a));
    db.create_function('FLOOR', (a) => Math.floor(a));
    db.create_function('GREATEST', (...args) => Math.max(...args.filter(n => typeof n === 'number')));
    db.create_function('LEAST', (...args) => Math.min(...args.filter(n => typeof n === 'number')));

  } catch (err) {
    console.warn('Failed to register custom SQLite functions:', err);
  }
}

// Session-level virtual database catalog registry across runs
const virtualDatabases = new Set();

/**
 * Reset all virtual databases in the session (e.g. when resetting the lab)
 */
export function resetVirtualDatabases() {
  virtualDatabases.clear();
}

/**
 * Universal SQL Preprocessor
 * Translates multi-dialect keywords and commands into SQLite compatible syntax
 */
function preprocessQueryForSqlite(sql) {
  let processed = (sql || '').trim();

  // 1. MySQL: SHOW TABLES; / SHOW FULL TABLES;
  if (/^SHOW\s+(?:FULL\s+)?TABLES(?:\s+LIKE\s+['"][^'"]+['"])?\s*;?/i.test(processed)) {
    return `SELECT name AS Tables_in_database FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__catalog_%';`;
  }

  // 2. MySQL: SHOW DATABASES;
  if (/^SHOW\s+DATABASES\s*;?/i.test(processed)) {
    return `SELECT 'main' AS Database_Name 
            UNION SELECT 'temp' AS Database_Name 
            UNION 
            SELECT REPLACE(name, '__catalog_', '') AS Database_Name 
            FROM sqlite_master 
            WHERE type='table' AND name LIKE '__catalog_%' 
            ORDER BY Database_Name ASC;`;
  }

  // 3. MySQL / Oracle: DESCRIBE table; / DESC table; / SHOW COLUMNS FROM table;
  if (/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    const match = processed.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+([a-zA-Z0-9_]+)/i);
    const tableName = match[1];
    return `PRAGMA table_info(${tableName});`;
  }

  // 4. TRUNCATE TABLE foo; -> DELETE FROM foo; in SQLite
  processed = processed.replace(/TRUNCATE\s+(?:TABLE\s+)?([a-zA-Z0-9_]+)\s*;?/gi, 'DELETE FROM $1;');

  // 5. CREATE DATABASE / DROP DATABASE -> simulated catalog table in in-memory SQLite
  if (/^(CREATE|DROP)\s+DATABASE\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    const match = processed.match(/^(CREATE|DROP)\s+DATABASE\s+([a-zA-Z0-9_]+)/i);
    const action = match[1].toUpperCase();
    const dbName = match[2].toLowerCase();
    if (action === 'CREATE') {
      virtualDatabases.add(dbName);
      return `CREATE TABLE IF NOT EXISTS __catalog_${dbName} (created_at TEXT);`;
    } else {
      virtualDatabases.delete(dbName);
      return `DROP TABLE IF EXISTS __catalog_${dbName};`;
    }
  }

  // 6. USE database_name -> session context switch simulation
  if (/^USE\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    return `SELECT 1 AS session_active;`;
  }

  // 7. ALTER TABLE ... MODIFY COLUMN / ALTER TABLE ... CHANGE COLUMN
  if (/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+MODIFY\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+([^;]+);?/i.test(processed)) {
    return `SELECT 1 AS column_modified;`;
  }
  if (/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+CHANGE\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s+([^;]+);?/i.test(processed)) {
    const match = processed.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+CHANGE\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/i);
    return `ALTER TABLE ${match[1]} RENAME COLUMN ${match[2]} TO ${match[3]};`;
  }

  // 8. RENAME TABLE t1 TO t2 -> ALTER TABLE t1 RENAME TO t2;
  if (/^RENAME\s+TABLE\s+([a-zA-Z0-9_]+)\s+TO\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    const match = processed.match(/^RENAME\s+TABLE\s+([a-zA-Z0-9_]+)\s+TO\s+([a-zA-Z0-9_]+)/i);
    return `ALTER TABLE ${match[1]} RENAME TO ${match[2]};`;
  }

  // 9. T-SQL: SELECT TOP N / TOP (N) -> Standard SQL LIMIT N
  if (/^\s*SELECT\s+(DISTINCT\s+)?TOP\s+(?:\(?\s*(\d+)\s*\)?)\s+(.+)$/is.test(processed)) {
    processed = processed.replace(
      /^\s*SELECT\s+(DISTINCT\s+)?TOP\s+(?:\(?\s*(\d+)\s*\)?)\s+(.+?)(?:\s*;)?$/is,
      (match, distinct = '', limitCount, rest) => {
        const cleanRest = rest.replace(/;\s*$/, '').trim();
        if (/\bLIMIT\s+\d+/i.test(cleanRest)) {
          return `SELECT ${distinct}${cleanRest};`;
        }
        return `SELECT ${distinct}${cleanRest} LIMIT ${limitCount};`;
      }
    );
  }

  // 10. Oracle / ANSI SQL: OFFSET M ROWS FETCH NEXT N ROWS ONLY / FETCH FIRST N ROWS ONLY
  if (/\bOFFSET\s+(\d+)\s+ROWS\s+FETCH\s+NEXT\s+(\d+)\s+ROWS\s+ONLY\b/i.test(processed)) {
    processed = processed.replace(
      /\bOFFSET\s+(\d+)\s+ROWS\s+FETCH\s+NEXT\s+(\d+)\s+ROWS\s+ONLY\b/gi,
      'LIMIT $2 OFFSET $1'
    );
  } else if (/\bFETCH\s+FIRST\s+(\d+)\s+ROWS\s+ONLY\b/i.test(processed)) {
    processed = processed.replace(/\bFETCH\s+FIRST\s+(\d+)\s+ROWS\s+ONLY\b/gi, 'LIMIT $1');
  }

  // 11. MySQL LIMIT offset, count -> LIMIT count OFFSET offset
  if (/\bLIMIT\s+(\d+)\s*,\s*(\d+)\b/i.test(processed)) {
    processed = processed.replace(/\bLIMIT\s+(\d+)\s*,\s*(\d+)\b/gi, 'LIMIT $2 OFFSET $1');
  }

  return processed;
}

/**
 * Executes an SQL query against a freshly seeded database.
 * Returns: { success, columns, values, rowCount, executionTimeMs, error }
 */
export async function executeSqlQuery(setupSql, querySql) {
  const startTime = performance.now();
  let db = null;

  try {
    const SQL = await getSqlInstance();
    db = new SQL.Database();

    // Register all cross-dialect helper functions (CONCAT, IFNULL, DATEDIFF, NOW, etc.)
    registerCustomSqlFunctions(db);

    // 1. Seed the database with schema & sample data
    if (setupSql && setupSql.trim()) {
      db.run(setupSql);
    }

    // Seed any session-created virtual databases
    virtualDatabases.forEach((vDb) => {
      try {
        db.run(`CREATE TABLE IF NOT EXISTS __catalog_${vDb} (created_at TEXT);`);
      } catch (_) {}
    });

    // 2. Execute query (with multi-dialect preprocessor)
    const trimmedQuery = (querySql || '').trim();
    if (!trimmedQuery) {
      throw new Error('Query is empty. Write an SQL statement to run.');
    }

    const sqliteReadyQuery = preprocessQueryForSqlite(trimmedQuery);
    const execResults = db.exec(sqliteReadyQuery);
    const executionTimeMs = +(performance.now() - startTime).toFixed(2);

    if (!execResults || execResults.length === 0) {
      return {
        success: true,
        columns: ['Status', 'Message'],
        values: [['SUCCESS', 'Query executed successfully. 0 rows returned.']],
        rowCount: 0,
        executionTimeMs,
        error: null
      };
    }

    // Take the last result set (in case of multiple queries)
    const lastResult = execResults[execResults.length - 1];
    return {
      success: true,
      columns: lastResult.columns || [],
      values: lastResult.values || [],
      rowCount: (lastResult.values && lastResult.values.length) || 0,
      executionTimeMs,
      error: null
    };
  } catch (err) {
    const executionTimeMs = +(performance.now() - startTime).toFixed(2);
    return {
      success: false,
      columns: [],
      values: [],
      rowCount: 0,
      executionTimeMs,
      error: cleanSqlError(err.message)
    };
  } finally {
    if (db) {
      try {
        db.close();
      } catch (_) {}
    }
  }
}

/**
 * Compares two result sets and computes diffs for missing/extra rows
 */
function computeResultDiff(userResult, expectedResult, checkOrder = false) {
  if (!userResult.success || !expectedResult.success) {
    return {
      passed: false,
      missingInUserIndices: [],
      extraInUserIndices: [],
      message: userResult.error || expectedResult.error || 'Execution error.'
    };
  }

  // 1. Check Column Count
  if (userResult.columns.length !== expectedResult.columns.length) {
    return {
      passed: false,
      missingInUserIndices: expectedResult.values.map((_, i) => i),
      extraInUserIndices: userResult.values.map((_, i) => i),
      message: `Column count mismatch: Expected ${expectedResult.columns.length} column(s) (${expectedResult.columns.join(', ')}), but got ${userResult.columns.length} column(s) (${userResult.columns.join(', ')}).`
    };
  }

  // Normalize string representations of rows
  const userRowStrings = userResult.values.map(r => JSON.stringify(r.map(normalizeVal)));
  const expRowStrings = expectedResult.values.map(r => JSON.stringify(r.map(normalizeVal)));

  const missingInUserIndices = [];
  const extraInUserIndices = [];

  // Find missing expected rows
  expRowStrings.forEach((expStr, idx) => {
    if (!userRowStrings.includes(expStr)) {
      missingInUserIndices.push(idx);
    }
  });

  // Find extra user rows
  userRowStrings.forEach((userStr, idx) => {
    if (!expRowStrings.includes(userStr)) {
      extraInUserIndices.push(idx);
    }
  });

  let passed = missingInUserIndices.length === 0 && extraInUserIndices.length === 0 && userResult.values.length === expectedResult.values.length;

  if (passed && checkOrder) {
    passed = JSON.stringify(userRowStrings) === JSON.stringify(expRowStrings);
  }

  let message = passed
    ? 'All row records and columns matched perfectly.'
    : userResult.values.length !== expectedResult.values.length
    ? `Row count mismatch: Expected ${expectedResult.values.length} row(s), but your query returned ${userResult.values.length} row(s).`
    : 'Data records mismatch: Some returned values do not match the expected result.';

  return {
    passed,
    missingInUserIndices,
    extraInUserIndices,
    message
  };
}

/**
 * Runs comprehensive multi-dataset test cases on user SQL
 */
export async function validateChallengeWithTestcases(challenge, userSql) {
  if (!challenge || !challenge.expectedSql) {
    const execRes = await executeSqlQuery(challenge.setupSql, userSql);
    return {
      passed: execRes.success,
      totalCases: 1,
      passedCases: execRes.success ? 1 : 0,
      testcases: [
        {
          caseIndex: 1,
          name: 'Case 1: Standard Execution',
          passed: execRes.success,
          userResult: execRes,
          expectedResult: null,
          missingInUserIndices: [],
          extraInUserIndices: [],
          message: execRes.success ? 'Query executed successfully.' : execRes.error
        }
      ]
    };
  }

  // TEST CASE 1: Standard Challenge Dataset
  const userRes1 = await executeSqlQuery(challenge.setupSql, userSql);
  const expRes1 = await executeSqlQuery(challenge.setupSql, challenge.expectedSql);
  const diff1 = computeResultDiff(userRes1, expRes1, challenge.checkOrder);

  const testcase1 = {
    caseIndex: 1,
    name: 'Case 1: Primary Dataset',
    passed: diff1.passed,
    userResult: userRes1,
    expectedResult: expRes1,
    missingInUserIndices: diff1.missingInUserIndices,
    extraInUserIndices: diff1.extraInUserIndices,
    message: diff1.message
  };

  // TEST CASE 2: Edge-Case Dataset (with boundary records)
  let edgeSetupSql = challenge.setupSql;
  if (edgeSetupSql && edgeSetupSql.includes('INSERT INTO employees')) {
    edgeSetupSql += `\nINSERT INTO employees (id, first_name, last_name, email, department_id, salary, hire_date, manager_id)
      VALUES (999, 'Boundary', 'Tester', 'boundary@company.com', 1, 90000, '2024-02-01', 1);`;
  }

  const userRes2 = await executeSqlQuery(edgeSetupSql, userSql);
  const expRes2 = await executeSqlQuery(edgeSetupSql, challenge.expectedSql);
  const diff2 = computeResultDiff(userRes2, expRes2, challenge.checkOrder);

  const testcase2 = {
    caseIndex: 2,
    name: 'Case 2: Edge Case Dataset',
    passed: diff2.passed,
    userResult: userRes2,
    expectedResult: expRes2,
    missingInUserIndices: diff2.missingInUserIndices,
    extraInUserIndices: diff2.extraInUserIndices,
    message: diff2.message
  };

  const testcases = [testcase1, testcase2];
  const passedCases = testcases.filter(tc => tc.passed).length;
  const overallPassed = passedCases === testcases.length;

  return {
    passed: overallPassed,
    totalCases: testcases.length,
    passedCases,
    testcases,
    message: overallPassed
      ? 'Accepted! All test cases passed successfully.'
      : `${passedCases}/${testcases.length} test cases passed. Review discrepancies below.`
  };
}

/**
 * Validates the user's query against the canonical expected SQL.
 */
export async function validateSqlQuery(setupSql, expectedSql, userSql, checkOrder = false) {
  const userResult = await executeSqlQuery(setupSql, userSql);
  const expectedResult = await executeSqlQuery(setupSql, expectedSql);
  const diff = computeResultDiff(userResult, expectedResult, checkOrder);

  return {
    passed: diff.passed,
    userResult,
    expectedResult,
    missingInUserIndices: diff.missingInUserIndices,
    extraInUserIndices: diff.extraInUserIndices,
    message: diff.message
  };
}

/**
 * Fetches sample tables schema and first few rows for visual schema exploration.
 */
export async function getTablesPreview(setupSql) {
  let db = null;
  try {
    const SQL = await getSqlInstance();
    db = new SQL.Database();
    if (setupSql) db.run(setupSql);

    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    if (!tablesRes || tablesRes.length === 0) return [];

    const tableNames = tablesRes[0].values.map(v => v[0]);
    const previews = [];

    for (const name of tableNames) {
      const schemaRes = db.exec(`PRAGMA table_info(${name});`);
      const columns = schemaRes.length > 0 
        ? schemaRes[0].values.map(v => ({ name: v[1], type: v[2], notNull: !!v[3], isPk: !!v[5] }))
        : [];

      const dataRes = db.exec(`SELECT * FROM ${name} LIMIT 5;`);
      const sampleRows = dataRes.length > 0 ? dataRes[0].values : [];

      previews.push({
        tableName: name,
        columns,
        sampleRows
      });
    }

    return previews;
  } catch (err) {
    console.error('Error fetching table schema previews:', err);
    return [];
  } finally {
    if (db) {
      try { db.close(); } catch (_) {}
    }
  }
}

function normalizeVal(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val : +val.toFixed(4);
  }
  return String(val).trim();
}

function cleanSqlError(msg) {
  if (!msg) return 'Unknown SQL error';
  return msg
    .replace(/^Error:\s*/i, '')
    .replace(/at line \d+/i, (m) => m)
    .trim();
}
