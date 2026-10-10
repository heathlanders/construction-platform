// lib/status-queue.ts — offline queue for trade/structural status PATCHes.
// When a status change fails because the device is offline (network error, not a 4xx),
// the screen enqueues {endpoint,id,status,version} here and optimistically updates locally.
// flushStatusQueue() drains it on reconnect (wired into runSyncSweep). A 409 on flush means
// the server row moved while we were offline — that queued change is dropped (the next pull
// shows the server's value); only a connectivity failure retries.
// Storage + retry policy come from the shared `offline-queue`.

import { mobileApi } from './api';
import { enqueue, flushQueue, QUEUE_KEYS } from './offline-queue';

export interface QueuedStatus {
  endpoint: string; // e.g. '/electrical-circuits'
  id: string;
  status: string;
  version: number;
}

export async function enqueueStatusUpdate(item: QueuedStatus): Promise<void> {
  // Collapse repeated edits to the same record — keep only the latest queued status.
  await enqueue(QUEUE_KEYS.statusUpdates, item, {
    sameAs: (q, incoming) => q.endpoint === incoming.endpoint && q.id === incoming.id,
  });
}

export async function flushStatusQueue(): Promise<void> {
  await flushQueue<QueuedStatus>(QUEUE_KEYS.statusUpdates, async (item) => {
    await mobileApi(`${item.endpoint}/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: item.status, version: item.version }),
    });
  });
}
