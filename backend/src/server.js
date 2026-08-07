import app from './app.js';
import env from './config/env.js';
import { getDbTarget } from './config/dbConfig.js';
import { testConnection } from './config/db.js';

async function checkDatabase() {
  try {
    await Promise.race([
      testConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timed out after 10s')), 10_000)
      ),
    ]);
    console.log('✓ Database connection OK');
  } catch (err) {
    console.warn('⚠ Database connection failed:', err.message);
    console.warn('  The API is running, but auth and data routes will fail until MySQL is reachable.');
    console.warn('  On Render, set DATABASE_URL (mysql://...) or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
  }
}

function start() {
  const dbTarget = getDbTarget();
  console.log(`  Database target: ${dbTarget.host}:${dbTarget.port}/${dbTarget.database} (${dbTarget.source})`);
  if (dbTarget.warning) console.warn(`⚠ ${dbTarget.warning}`);
  if (dbTarget.error) console.warn(`⚠ DATABASE_URL error: ${dbTarget.error}`);

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`✓ Artisan API listening on port ${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  Health check: /api/health`);
    checkDatabase();
  });

  server.on('error', (err) => {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('✗ Unhandled rejection:', err);
});

start();
