import mysql from 'mysql2/promise';
import env from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

/**
 * Run a query and return rows.
 */
export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Run a query and return the first row (or null).
 */
export async function queryOne(sql, params = {}) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

export async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

export default pool;
