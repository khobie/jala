import app from './app.js';
import env from './config/env.js';
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
    console.warn('  Check DATABASE_URL / DB_* on Render and that Aiven allows external connections.');
  }
}

async function start() {
  // Listen immediately so Render health checks and cold starts do not hang forever
  // if the database host is slow or unreachable.
  app.listen(env.port, () => {
    console.log(`✓ Artisan API running at http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
    checkDatabase();
  });
}

start();
