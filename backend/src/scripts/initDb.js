/**
 * Creates the database and tables by executing db/schema.sql.
 * Usage: npm run db:init
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');

async function run() {
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Connect without selecting a database (schema.sql creates it).
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  console.log('Running schema.sql ...');
  await conn.query(sql);
  console.log('✓ Database and tables created/verified');
  await conn.end();
}

run().catch((err) => {
  console.error('✗ DB init failed:', err.message);
  process.exit(1);
});
