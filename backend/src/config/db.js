import mysql from 'mysql2/promise';
import { getDbConfig } from './dbConfig.js';

export const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
  connectTimeout: 10_000,
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
