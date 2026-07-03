import app from './app.js';
import env from './config/env.js';
import { testConnection } from './config/db.js';

async function start() {
  try {
    await testConnection();
    console.log('✓ Database connection OK');
  } catch (err) {
    console.warn('⚠ Database connection failed:', err.message);
    console.warn('  The API will start, but DB-backed routes will error until MySQL is reachable.');
    console.warn('  Check your backend/.env DB_* settings and that MySQL is running.');
  }

  app.listen(env.port, () => {
    console.log(`✓ Artisan API running at http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
  });
}

start();
