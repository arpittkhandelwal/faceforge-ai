/**
 * LogStore — Authentication Event Log Storage
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeWrite } from './DatabaseManager';
import { AuthLog } from '../types';
import DeviceInfo from 'react-native-device-info';

interface LogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  result: string;
  confidence: number | null;
  synced: number;
  device_id: string;
}

function rowToLog(row: LogRow): AuthLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    timestamp: row.timestamp,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    result: row.result as AuthLog['result'],
    confidence: row.confidence ?? undefined,
    synced: row.synced === 1,
    deviceId: row.device_id,
  };
}

// ─── Create ──────────────────────────────────────────────────
export async function insertAuthLog(
  log: Omit<AuthLog, 'id' | 'deviceId' | 'synced'>,
): Promise<AuthLog> {
  const id = uuidv4();
  const deviceId = DeviceInfo.getUniqueIdSync();

  await executeWrite(
    `INSERT INTO auth_logs (id, user_id, user_name, timestamp, latitude, longitude, result, confidence, synced, device_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      log.userId ?? null,
      log.userName ?? null,
      log.timestamp,
      log.latitude ?? null,
      log.longitude ?? null,
      log.result,
      log.confidence ?? null,
      deviceId,
    ],
  );

  const fullLog: AuthLog = { ...log, id, deviceId, synced: false };
  console.log(`[LogStore] 📝 Logged: ${log.result} at ${new Date(log.timestamp).toISOString()}`);
  return fullLog;
}

// ─── Read ─────────────────────────────────────────────────────
export async function getRecentLogs(limit = 50, offset = 0): Promise<AuthLog[]> {
  const rows = await executeQuery<LogRow>(
    'SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    [limit, offset],
  );
  return rows.map(rowToLog);
}

export async function getPendingLogs(): Promise<AuthLog[]> {
  const rows = await executeQuery<LogRow>(
    'SELECT * FROM auth_logs WHERE synced = 0 ORDER BY timestamp ASC',
  );
  return rows.map(rowToLog);
}

// ─── Update ───────────────────────────────────────────────────
export async function markLogsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  await executeWrite(
    `UPDATE auth_logs SET synced = 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

// ─── Purge synced ────────────────────────────────────────────
export async function purgeSyncedLogs(): Promise<number> {
  const result = await executeWrite(
    'DELETE FROM auth_logs WHERE synced = 1',
  );
  console.log(`[LogStore] 🗑 Purged ${result.rowsAffected} synced logs`);
  return result.rowsAffected;
}

// ─── Stats ────────────────────────────────────────────────────
export async function getLogStats(): Promise<{
  total: number;
  successes: number;
  failures: number;
  pending: number;
}> {
  const rows = await executeQuery<{
    total: number;
    successes: number;
    failures: number;
    pending: number;
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as successes,
      SUM(CASE WHEN result != 'success' THEN 1 ELSE 0 END) as failures,
      SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) as pending
    FROM auth_logs`,
  );
  return rows[0] ?? { total: 0, successes: 0, failures: 0, pending: 0 };
}
