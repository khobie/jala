/**
 * Creates the database and tables by executing db/schema.sql.
 * Usage: npm run db:init
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { getDbConfig, isCloudDatabase } from '../config/dbConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');

async function run() {
  if (isCloudDatabase()) {
    console.log('DATABASE_URL detected — use npm run db:migrate for cloud MySQL instead.');
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Connect without selecting a database (schema.sql creates it).
  const conn = await mysql.createConnection({
    ...getDbConfig({ includeDatabase: false }),
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
