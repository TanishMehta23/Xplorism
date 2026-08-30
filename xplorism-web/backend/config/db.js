import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory (parent of config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const isLocal = connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'));

// Helper to resolve hostname via DNS over HTTPS (DoH) if standard DNS is blocked by ISP
async function resolveHostWithDoH(hostname) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const json = await res.json();
    const aRecord = json.Answer && json.Answer.find(ans => ans.type === 1);
    if (aRecord && aRecord.data) {
      return aRecord.data;
    }
  } catch (err) {
    console.warn('[DB] DoH lookup failed:', err.message);
  }
  return null;
}

let pool;

if (!connectionString || isLocal) {
  pool = new Pool({
    connectionString,
    ssl: false
  });
} else {
  const parsed = new URL(connectionString);
  const originalHost = parsed.hostname;

  // Attempt pre-resolving IP in background/at import
  const dohIp = await resolveHostWithDoH(originalHost);

  pool = new Pool({
    host: dohIp || originalHost,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    ssl: {
      rejectUnauthorized: false,
      servername: originalHost
    }
  });

  if (dohIp) {
    console.log(`[DB] Successfully resolved database host ${originalHost} -> ${dohIp} via secure DNS`);
  }
}

// Helper query function
export const query = (text, params) => pool.query(text, params);

export default pool;


