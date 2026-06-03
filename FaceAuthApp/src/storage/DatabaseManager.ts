/**
 * DatabaseManager — SQLite initialization and schema management
 * Uses react-native-sqlite-storage
 */

import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);
SQLite.DEBUG(false);

const DB_NAME = 'FaceAuthDB.db';
const DB_VERSION = '1.0';
const DB_DISPLAY_NAME = 'Face Auth Database';
const DB_SIZE = 200000; // 200KB initial size

let db: SQLiteDatabase | null = null;

// ─── Schema ──────────────────────────────────────────────────
const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    embedding_base64 TEXT NOT NULL,
    photo_uri TEXT,
    created_at INTEGER NOT NULL,
    last_auth_at INTEGER,
    is_active INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS auth_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    user_name TEXT,
    timestamp INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    result TEXT NOT NULL,
    confidence REAL,
    synced INTEGER DEFAULT 0,
    device_id TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`,
  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_auth_logs_timestamp ON auth_logs(timestamp)`,
  `CREATE INDEX IF NOT EXISTS idx_auth_logs_synced ON auth_logs(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type)`,
];

// ─── Initialize ──────────────────────────────────────────────
export async function initDatabase(): Promise<SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });

    // Run schema creation
    await db.transaction(tx => {
      SCHEMA_SQL.forEach(sql => {
        tx.executeSql(sql, []);
      });
    });

    console.log('[DB] ✅ Database initialized');
    return db;
  } catch (error) {
    console.error('[DB] ❌ Init failed:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    console.log('[DB] Database closed');
  }
}

// ─── Generic Query Helpers ───────────────────────────────────
export async function executeQuery<T>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const database = await getDatabase();
  const [results] = await database.executeSql(sql, params);
  const rows: T[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i) as T);
  }
  return rows;
}

export async function executeWrite(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<{ insertId: number; rowsAffected: number }> {
  const database = await getDatabase();
  const [results] = await database.executeSql(sql, params);
  return {
    insertId: results.insertId,
    rowsAffected: results.rowsAffected,
  };
}

export async function executeTransaction(
  operations: Array<{ sql: string; params?: (string | number | null)[] }>,
): Promise<void> {
  const database = await getDatabase();
  await database.transaction(tx => {
    operations.forEach(({ sql, params = [] }) => {
      tx.executeSql(sql, params);
    });
  });
}
