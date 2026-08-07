/**
 * Creates tables in an existing cloud MySQL database (no CREATE DATABASE).
 * Usage: npm run db:migrate
 * Set DATABASE_URL or DB_* env vars before running.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { getDbConfig } from '../config/dbConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema-tables.sql');

async function run() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const conn = await mysql.createConnection({
    ...getDbConfig(),
    multipleStatements: true,
  });

  console.log('Running schema-tables.sql on', getDbConfig().database || '(default db)');
  await conn.query(sql);
  console.log('✓ Tables created/verified');
  await conn.end();
}

run().catch((err) => {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
});
