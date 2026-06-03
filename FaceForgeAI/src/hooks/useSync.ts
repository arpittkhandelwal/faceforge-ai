/**
 * useSync — Sync status subscriber hook
 */

import { useState, useEffect } from 'react';
import { subscribeSyncStatus, triggerManualSync } from '../storage/SyncQueue';
import { SyncStatus } from '../types';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: false,
    pendingCount: 0,
    isSyncing: false,
  });

  useEffect(() => {
    const unsub = subscribeSyncStatus(setStatus);
    return unsub;
  }, []);

  return { ...status, triggerSync: triggerManualSync };
}
