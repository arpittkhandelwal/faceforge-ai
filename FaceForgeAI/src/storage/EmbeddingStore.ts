/**
 * EmbeddingStore — Registered User CRUD via SQLite
 */

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeWrite } from './DatabaseManager';
import { RegisteredUser } from '../types';

interface UserRow {
  id: string;
  name: string;
  embedding_base64: string;
  photo_uri: string | null;
  created_at: number;
  last_auth_at: number | null;
  is_active: number;
}

function rowToUser(row: UserRow): RegisteredUser {
  return {
    id: row.id,
    name: row.name,
    embeddingBase64: row.embedding_base64,
    photoUri: row.photo_uri ?? undefined,
    createdAt: row.created_at,
    lastAuthAt: row.last_auth_at ?? undefined,
  };
}

// ─── Create ──────────────────────────────────────────────────
export async function registerUser(
  name: string,
  embeddingBase64: string,
  photoUri?: string,
): Promise<RegisteredUser> {
  const id = uuidv4();
  const now = Date.now();

  await executeWrite(
    `INSERT INTO users (id, name, embedding_base64, photo_uri, created_at, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [id, name, embeddingBase64, photoUri ?? null, now],
  );

  const user: RegisteredUser = { id, name, embeddingBase64, photoUri, createdAt: now };
  console.log(`[EmbeddingStore] ✅ Registered user: ${name} (${id})`);
  return user;
}

// ─── Read All ────────────────────────────────────────────────
export async function getAllUsers(): Promise<RegisteredUser[]> {
  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC',
  );
  return rows.map(rowToUser);
}

// ─── Read One ────────────────────────────────────────────────
export async function getUserById(id: string): Promise<RegisteredUser | null> {
  const rows = await executeQuery<UserRow>(
    'SELECT * FROM users WHERE id = ? AND is_active = 1',
    [id],
  );
  return rows.length > 0 ? rowToUser(rows[0]) : null;
}

// ─── Update last auth ────────────────────────────────────────
export async function updateLastAuthAt(userId: string, timestamp: number): Promise<void> {
  await executeWrite(
    'UPDATE users SET last_auth_at = ? WHERE id = ?',
    [timestamp, userId],
  );
}

// ─── Soft Delete ─────────────────────────────────────────────
export async function deleteUser(id: string): Promise<void> {
  await executeWrite(
    'UPDATE users SET is_active = 0 WHERE id = ?',
    [id],
  );
  console.log(`[EmbeddingStore] Deleted user: ${id}`);
}

// ─── Hard Delete All ─────────────────────────────────────────
export async function purgeAllUsers(): Promise<void> {
  await executeWrite('DELETE FROM users');
  console.log('[EmbeddingStore] Purged all users');
}

// ─── Count ───────────────────────────────────────────────────
export async function getUserCount(): Promise<number> {
  const rows = await executeQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM users WHERE is_active = 1',
  );
  return rows[0]?.count ?? 0;
}
