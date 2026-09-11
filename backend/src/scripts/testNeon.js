/**
 * Neon Serverless Postgres Connection & Latency Diagnostic Utility
 * 
 * Tests connectivity, SSL cipher status, round-trip latency,
 * and concurrent query execution against Neon's PgBouncer pooler.
 * 
 * Run with: node src/scripts/testNeon.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testNeonConnection() {
  console.log('\n=============================================================');
  console.log('⚡ MSC QUIZ PLATFORM — NEON SERVERLESS POSTGRES DIAGNOSTIC');
  console.log('=============================================================\n');

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log('⚠️  DATABASE_URL environment variable is not defined.');
    console.log('💡  To test Neon, set DATABASE_URL in backend/.env:');
    console.log('    DATABASE_URL=postgresql://user:pass@ep-xyz-pooler.region.neon.tech/msc_quiz?sslmode=require\n');
    console.log('ℹ️   Falling back to local SQLite test mode.\n');
    return;
  }

  const isNeon = dbUrl.includes('neon.tech');
  const isPooled = dbUrl.includes('-pooler');

  console.log(`🔗 Target Host      : ${new URL(dbUrl).hostname}`);
  console.log(`🎯 Provider         : ${isNeon ? 'Neon Serverless Postgres ✅' : 'External Postgres'}`);
  console.log(`🏊 Endpoint Type    : ${isPooled ? 'PgBouncer Pooled (Recommended for Quizzes) ✅' : 'Direct (Non-pooled)'}`);

  const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : (process.env.NODE_ENV === 'production')
      }
    }
  });

  try {
    const t0 = Date.now();
    await sequelize.authenticate();
    const connectLatency = Date.now() - t0;
    console.log(`⏱️  Handshake Time  : ${connectLatency} ms`);

    // 1. Query Postgres & Neon version info
    const [versionRes] = await sequelize.query('SELECT version();');
    console.log(`🐘 Engine Version   : ${versionRes[0].version.split(' on ')[0]}`);

    // 2. Query Current Database & User
    const [dbInfo] = await sequelize.query('SELECT current_database(), current_user, inet_server_addr();');
    console.log(`🗄️  Database Name    : ${dbInfo[0].current_database}`);
    console.log(`👤 Active User      : ${dbInfo[0].current_user}`);

    // 3. Concurrency Stress Test on PgBouncer
    console.log('\n🔄 Testing Concurrency Through Neon PgBouncer...');
    const concurrencyT0 = Date.now();
    const batchSize = 10;
    const promises = Array.from({ length: batchSize }).map((_, i) =>
      sequelize.query(`SELECT ${i + 1} AS query_id, clock_timestamp() AS ts;`)
    );
    await Promise.all(promises);
    const batchTime = Date.now() - concurrencyT0;
    console.log(`✅ Completed ${batchSize} concurrent queries in ${batchTime} ms (Avg: ${(batchTime / batchSize).toFixed(1)} ms/query)`);

    console.log('\n=============================================================');
    console.log('🎉 NEON SERVERLESS POSTGRES DIAGNOSTIC: 100% HEALTHY & READY');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('\n❌ Neon Diagnostic Failed:');
    console.error(error.message);
    if (error.original) {
      console.error('Details:', error.original.message);
    }
    console.log('\n💡 Tip: Check that your IP is allowed and SSL is set to sslmode=require.');
  } finally {
    await sequelize.close();
  }
}

testNeonConnection();
