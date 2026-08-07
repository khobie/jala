import env from './env.js';

/**
 * Parse mysql://user:pass@host:port/db — handles special characters in passwords
 * (Aiven passwords often contain @, #, etc.) by splitting on the last "@".
 */
function parseDatabaseUrl(raw) {
  const trimmed = raw.trim().replace(/^mysql2:\/\//, 'mysql://');
  if (!trimmed.startsWith('mysql://')) {
    throw new Error('DATABASE_URL must start with mysql:// (not postgres://)');
  }

  const rest = trimmed.slice('mysql://'.length);
  const at = rest.lastIndexOf('@');
  if (at === -1) throw new Error('DATABASE_URL is missing @ between credentials and host');

  const creds = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);
  const slash = hostPart.indexOf('/');
  if (slash === -1) throw new Error('DATABASE_URL is missing database name after host');

  const database = hostPart.slice(slash + 1).split('?')[0];
  const hostPort = hostPart.slice(0, slash);
  const colon = creds.indexOf(':');
  const user = decodeURIComponent(colon >= 0 ? creds.slice(0, colon) : creds);
  const password = decodeURIComponent(colon >= 0 ? creds.slice(colon + 1) : '');

  const portSep = hostPort.lastIndexOf(':');
  const host = portSep >= 0 ? hostPort.slice(0, portSep) : hostPort;
  const port = parseInt(portSep >= 0 ? hostPort.slice(portSep + 1) : '3306', 10);

  if (!host || !database) throw new Error('DATABASE_URL must include host and database name');

  return { host, port, user, password, database };
}

function sslConfig() {
  return process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false };
}

function fromIndividualVars({ includeDatabase = true } = {}) {
  const config = {
    host: process.env.DB_HOST || env.db.host,
    port: parseInt(process.env.DB_PORT || String(env.db.port), 10),
    user: process.env.DB_USER || env.db.user,
    password: process.env.DB_PASSWORD ?? env.db.password,
  };
  if (includeDatabase) {
    config.database = process.env.DB_NAME || env.db.database;
  }
  if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
    config.ssl = sslConfig();
  }
  return config;
}

/**
 * Build mysql2 pool options for local XAMPP or cloud MySQL (Render + Aiven).
 * Prefers a valid DATABASE_URL; otherwise uses DB_HOST/DB_USER/...
 * Invalid DATABASE_URL (e.g. postgres://) is ignored when DB_* vars are set.
 */
export function getDbConfig({ includeDatabase = true } = {}) {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
      const config = {
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        ssl: sslConfig(),
      };
      if (includeDatabase) config.database = parsed.database;
      return config;
    } catch (err) {
      console.error('⚠ Invalid DATABASE_URL:', err.message);
      console.error('  Delete DATABASE_URL on Render or replace it with a mysql:// URL.');
      if (hasIndividualDbVars()) {
        console.error('  Using DB_HOST/DB_USER/... env vars instead.');
        return fromIndividualVars({ includeDatabase });
      }
    }
  } else if (hasIndividualDbVars()) {
    return fromIndividualVars({ includeDatabase });
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('✗ No cloud database configured on Render.');
    console.error('  Add DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (and DB_SSL=true).');
  }

  return fromIndividualVars({ includeDatabase });
}

function hasIndividualDbVars() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

export function isCloudDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
}

/** Safe summary for logs / health checks (no secrets). */
export function getDbTarget() {
  if (process.env.DATABASE_URL) {
    try {
      const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
      return {
        source: 'DATABASE_URL',
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        user: parsed.user,
        ssl: process.env.DB_SSL !== 'false',
      };
    } catch (err) {
      return { source: 'DATABASE_URL', error: err.message };
    }
  }

  if (process.env.DB_HOST) {
    return {
      source: 'DB_* env vars',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || env.db.database,
      user: process.env.DB_USER || env.db.user,
      ssl: process.env.DB_SSL === 'true',
    };
  }

  if (process.env.DATABASE_URL) {
    return {
      source: 'DATABASE_URL',
      error: 'Invalid DATABASE_URL — delete it on Render or use mysql://',
      warning: 'App is falling back to localhost and will not work on Render',
    };
  }

  return {
    source: 'local defaults',
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    ssl: false,
    warning:
      process.env.NODE_ENV === 'production'
        ? 'Render has no cloud DB configured — set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME'
        : undefined,
  };
}
