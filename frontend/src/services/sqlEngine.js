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

function preprocessQueryForSqlite(sql) {
  let processed = (sql || '').trim();
  
  // 1. TRUNCATE TABLE foo; -> DELETE FROM foo; in SQLite
  processed = processed.replace(/TRUNCATE\s+TABLE\s+([a-zA-Z0-9_]+)\s*;?/gi, 'DELETE FROM $1;');

  // 2. CREATE DATABASE / DROP DATABASE -> simulated catalog table in in-memory SQLite
  if (/^(CREATE|DROP)\s+DATABASE\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    const match = processed.match(/^(CREATE|DROP)\s+DATABASE\s+([a-zA-Z0-9_]+)/i);
    const action = match[1].toUpperCase();
    const dbName = match[2];
    if (action === 'CREATE') {
      return `CREATE TABLE IF NOT EXISTS __catalog_${dbName} (created_at TEXT);`;
    } else {
      return `DROP TABLE IF EXISTS __catalog_${dbName};`;
    }
  }

  // 3. USE database_name -> session context switch simulation
  if (/^USE\s+([a-zA-Z0-9_]+)\s*;?/i.test(processed)) {
    return `SELECT 1 AS session_active;`;
  }

  // 4. ALTER TABLE ... MODIFY COLUMN -> MySQL/Oracle syntax simulation in SQLite
  if (/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+MODIFY\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)\s+([^;]+);?/i.test(processed)) {
    return `SELECT 1 AS column_modified;`;
  }

  return processed;
}

/**
 * Executes a user SQL query against a freshly seeded database.
 * Returns: { success, columns, values, rowCount, executionTimeMs, error }
 */
export async function executeSqlQuery(setupSql, querySql) {
  const startTime = performance.now();
  let db = null;

  try {
    const SQL = await getSqlInstance();
    db = new SQL.Database();

    // 1. Seed the database with schema & sample data
    if (setupSql && setupSql.trim()) {
      db.run(setupSql);
    }

    // 2. Execute query (with DDL preprocessor)
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
        values: [['SUCCESS', 'Command executed successfully. Database structure updated.']],
        rowCount: 1,
        executionTimeMs,
        message: 'Command executed successfully.'
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
 * Validates the user's query against the canonical expected SQL.
 * Runs both in clean sandbox environments and compares tabular structures.
 */
export async function validateSqlQuery(setupSql, userSql, expectedSql, checkOrder = false) {
  const userResult = await executeSqlQuery(setupSql, userSql);
  if (!userResult.success) {
    return {
      passed: false,
      userResult,
      expectedResult: null,
      message: userResult.error || 'SQL execution failed.'
    };
  }

  const expectedResult = await executeSqlQuery(setupSql, expectedSql);
  if (!expectedResult.success) {
    return {
      passed: false,
      userResult,
      expectedResult,
      message: 'Failed to run expected solution: ' + expectedResult.error
    };
  }

  // 1. Check Column Count
  if (userResult.columns.length !== expectedResult.columns.length) {
    return {
      passed: false,
      userResult,
      expectedResult,
      message: `Column count mismatch: Expected ${expectedResult.columns.length} column(s) (${expectedResult.columns.join(', ')}), but your query returned ${userResult.columns.length} column(s) (${userResult.columns.join(', ')}).`
    };
  }

  // 2. Check Row Count
  if (userResult.values.length !== expectedResult.values.length) {
    return {
      passed: false,
      userResult,
      expectedResult,
      message: `Row count mismatch: Expected ${expectedResult.values.length} row(s), but your query returned ${userResult.values.length} row(s).`
    };
  }

  // 3. Normalize and Compare Data Rows
  const normUserRows = userResult.values.map(r => r.map(normalizeVal));
  const normExpRows = expectedResult.values.map(r => r.map(normalizeVal));

  let rowsMatch = false;
  if (checkOrder) {
    // Exact ordered comparison
    rowsMatch = JSON.stringify(normUserRows) === JSON.stringify(normExpRows);
  } else {
    // Unordered set comparison (order doesn't matter unless specified)
    const sortedUser = [...normUserRows].map(r => JSON.stringify(r)).sort();
    const sortedExp = [...normExpRows].map(r => JSON.stringify(r)).sort();
    rowsMatch = JSON.stringify(sortedUser) === JSON.stringify(sortedExp);
  }

  if (!rowsMatch) {
    return {
      passed: false,
      userResult,
      expectedResult,
      message: 'The query produced data that does not match the expected solution output. Check your filtering or join logic.'
    };
  }

  return {
    passed: true,
    userResult,
    expectedResult,
    message: 'Accepted! All test cases passed successfully.'
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
    db.run(setupSql);

    // List all user tables
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    if (!tablesRes || tablesRes.length === 0) return [];

    const tableNames = tablesRes[0].values.map(v => v[0]);
    const previews = [];

    for (const name of tableNames) {
      // Get table columns schema
      const schemaRes = db.exec(`PRAGMA table_info(${name});`);
      const columns = schemaRes.length > 0 
        ? schemaRes[0].values.map(v => ({ name: v[1], type: v[2], notNull: !!v[3], isPk: !!v[5] }))
        : [];

      // Get first 5 rows
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
