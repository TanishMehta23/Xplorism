import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkLocks() {
  try {
    console.log('Checking for active queries and locks...');
    
    // 1. Get active queries
    const queriesRes = await pool.query(`
      SELECT pid, state, query, query_start, state_change
      FROM pg_stat_activity
      WHERE state IS NOT NULL AND query NOT LIKE '%pg_stat_activity%';
    `);
    console.log('\nActive Queries:');
    console.log(queriesRes.rows);

    // 2. Get locks
    const locksRes = await pool.query(`
      SELECT blocked_locks.pid     AS blocked_pid,
             blocked_activity.usename  AS blocked_user,
             blocking_locks.pid    AS blocking_pid,
             blocking_activity.usename AS blocking_user,
             blocked_activity.query    AS blocked_statement,
             blocking_activity.query   AS current_statement_in_blocking_process
      FROM  pg_catalog.pg_locks         blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks         blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted;
    `);
    console.log('\nBlocked Locks:');
    console.log(locksRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkLocks();
