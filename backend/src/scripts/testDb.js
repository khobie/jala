/**
 * Test cloud MySQL connection using env vars.
 * Usage (PowerShell):
 *   $env:DB_HOST="mysql-xxxx.aivencloud.com"
 *   $env:DB_PORT="10446"
 *   $env:DB_USER="avnadmin"
 *   $env:DB_PASSWORD="your_password"
 *   $env:DB_NAME="defaultdb"
 *   $env:DB_SSL="true"
 *   npm run db:test
 */
import { getDbTarget } from '../config/dbConfig.js';
import { testConnection } from '../config/db.js';

const target = getDbTarget();
console.log('Target:', target);

try {
  await testConnection();
  console.log('✓ Database connection OK');
  process.exit(0);
} catch (err) {
  console.error('✗ Database connection failed:', err.message);
  if (err.code) console.error('  Code:', err.code);
  process.exit(1);
}
