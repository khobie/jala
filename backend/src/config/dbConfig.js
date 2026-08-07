import env from './env.js';

/**
 * Build mysql2 pool/connection options for local Docker or cloud MySQL (Render + Aiven/PlanetScale/etc.).
 * Supports either individual DB_* vars or a single DATABASE_URL (mysql://user:pass@host:3306/dbname).
 */
export function getDbConfig({ includeDatabase = true } = {}) {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    };
    if (includeDatabase) {
      config.database = url.pathname.replace(/^\//, '');
    }
    return config;
  }

  const config = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  };
  if (includeDatabase) config.database = env.db.database;
  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }
  return config;
}

export function isCloudDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
