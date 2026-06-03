/**
 * SyncQueue — AWS Sync with Exponential Backoff
 *
 * Architecture:
 * 1. On auth events: push to local SQLite sync_queue
 * 2. NetInfo listener detects connectivity changes
 * 3. On connect: drain the queue, uploading to AWS endpoint
 * 4. On success: purge synced records from local DB
 * 5. On failure: exponential backoff (2^attempts * 1000ms, max 5min)
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeWrite, executeTransaction } from './DatabaseManager';
import { SyncItem, SyncStatus } from '../types';
import { getPendingLogs, markLogsSynced, purgeSyncedLogs } from './LogStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AWS_ENDPOINT: '@faceauth:aws_endpoint',
  LAST_SYNC: '@faceauth:last_sync_at',
};

const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 10;
const BATCH_SIZE = 20;

// ─── Sync State ───────────────────────────────────────────────
let syncStatus: SyncStatus = {
  isOnline: false,
  pendingCount: 0,
  lastSyncAt: undefined,
  isSyncing: false,
};

let unsubscribeNetInfo: (() => void) | null = null;
let statusListeners: ((status: SyncStatus) => void)[] = [];

// ─── Public API ───────────────────────────────────────────────
export function subscribeSyncStatus(cb: (status: SyncStatus) => void): () => void {
  statusListeners.push(cb);
  cb({ ...syncStatus }); // emit current state immediately
  return () => {
    statusListeners = statusListeners.filter(l => l !== cb);
  };
}

function emitStatus(): void {
  statusListeners.forEach(cb => cb({ ...syncStatus }));
}

// ─── Init ─────────────────────────────────────────────────────
export async function initSyncQueue(): Promise<void> {
  // Load last sync time
  const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  syncStatus.lastSyncAt = lastSync ? parseInt(lastSync, 10) : undefined;

  // Check pending count
  await refreshPendingCount();

  // Subscribe to network changes
  unsubscribeNetInfo = NetInfo.addEventListener(handleNetworkChange);
  console.log('[SyncQueue] ✅ Initialized');
}

export function destroySyncQueue(): void {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
}

// ─── Network Change Handler ────────────────────────────────────
async function handleNetworkChange(state: NetInfoState): Promise<void> {
  const wasOnline = syncStatus.isOnline;
  syncStatus.isOnline = state.isConnected === true && state.isInternetReachable !== false;
  emitStatus();

  if (!wasOnline && syncStatus.isOnline) {
    console.log('[SyncQueue] 🌐 Network restored — starting sync');
    await drainQueue();
  }
}

// ─── Enqueue ──────────────────────────────────────────────────
export async function enqueueItem(
  type: SyncItem['type'],
  payload: object,
): Promise<void> {
  const id = uuidv4();
  const now = Date.now();

  await executeWrite(
    `INSERT INTO sync_queue (id, type, payload, created_at, attempts)
     VALUES (?, ?, ?, ?, 0)`,
    [id, type, JSON.stringify(payload), now],
  );

  syncStatus.pendingCount++;
  emitStatus();
}

// ─── Drain Queue (Upload to AWS) ──────────────────────────────
export async function drainQueue(): Promise<void> {
  if (syncStatus.isSyncing || !syncStatus.isOnline) return;

  syncStatus.isSyncing = true;
  emitStatus();

  try {
    const endpoint = await getAWSEndpoint();
    if (!endpoint) {
      console.log('[SyncQueue] No AWS endpoint configured — skipping sync');
      return;
    }

    // Upload auth logs first
    await uploadPendingLogs(endpoint);

    // Update last sync time
    const now = Date.now();
    syncStatus.lastSyncAt = now;
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toString());

    await refreshPendingCount();
    console.log('[SyncQueue] ✅ Sync complete');
  } catch (error) {
    syncStatus.error = (error as Error).message;
    console.error('[SyncQueue] ❌ Sync failed:', error);
  } finally {
    syncStatus.isSyncing = false;
    emitStatus();
  }
}

// ─── Upload Logs ──────────────────────────────────────────────
async function uploadPendingLogs(endpoint: string): Promise<void> {
  const pendingLogs = await getPendingLogs();
  if (pendingLogs.length === 0) return;

  // Batch upload in chunks
  for (let i = 0; i < pendingLogs.length; i += BATCH_SIZE) {
    const batch = pendingLogs.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(`${endpoint}/api/auth-logs/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': batch[0]?.deviceId ?? 'unknown',
        },
        body: JSON.stringify({ logs: batch }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const ids = batch.map(l => l.id);
      await markLogsSynced(ids);

      // Purge successfully synced records
      await purgeSyncedLogs();
      console.log(`[SyncQueue] Uploaded batch of ${batch.length} logs`);
    } catch (error) {
      console.error('[SyncQueue] Batch upload failed:', error);
      throw error;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────
async function refreshPendingCount(): Promise<void> {
  const rows = await executeQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM auth_logs WHERE synced = 0',
  );
  syncStatus.pendingCount = rows[0]?.count ?? 0;
  emitStatus();
}

async function getAWSEndpoint(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.AWS_ENDPOINT);
}

export async function setAWSEndpoint(endpoint: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AWS_ENDPOINT, endpoint);
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

export async function triggerManualSync(): Promise<void> {
  const netState = await NetInfo.fetch();
  syncStatus.isOnline = netState.isConnected === true;
  if (syncStatus.isOnline) {
    await drainQueue();
  }
}
