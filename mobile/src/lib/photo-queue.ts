// lib/photo-queue.ts — offline queue for task QA/proof photos (Doc 19 #3, Mobile Enterprise Plan §B4).
// Capture offline → enqueue {taskId, projectId, localUri} → on reconnect, flushTaskPhotoQueue()
// (wired into runSyncSweep) uploads via the T-27 quarantine pipeline then attaches to the task.
// Storage/retry now live in the shared `offline-queue` (backoff + attempt cap); the
// ImagePicker cache uri must still be valid at flush time (deferred-grade, like the
// inspection-defect queue).

import { mobileApi, uploadFile } from './api';
import { enqueue, flushQueue, QUEUE_KEYS } from './offline-queue';

interface QueuedTaskPhoto { taskId: string; projectId: string; localUri: string; }

export async function enqueueTaskPhoto(item: QueuedTaskPhoto): Promise<void> {
  await enqueue(QUEUE_KEYS.taskPhotos, item);
}

/** Attach an already-uploaded file to a task, polling past FILE_NOT_READY while the scan runs. */
async function attachWithRetry(taskId: string, fileId: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    try {
      await mobileApi(`/schedule-tasks/${taskId}/photos`, {
        method: 'POST', body: JSON.stringify({ file_id: fileId, photo_type: 'proof' }),
      });
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/scanning|not ready|FILE_NOT_READY/i.test(msg)) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      throw e;
    }
  }
  // Still scanning after ~18s — throw so the queue retries on a later sweep.
  throw new Error('FILE_NOT_READY: scan still running');
}

/** Drains the offline task-photo queue on reconnect (wired into runSyncSweep).
 *  Per-item: uploadFile (presigned PUT to quarantine) → attach.
 *  `retryServerErrors` because the attach legitimately 409s until the scan promotes
 *  the file — that's a "come back later", not a verdict. */
export async function flushTaskPhotoQueue(): Promise<void> {
  await flushQueue<QueuedTaskPhoto>(
    QUEUE_KEYS.taskPhotos,
    async (item) => {
      const fileId = await uploadFile(item.localUri, `task-${Date.now()}.jpg`, item.projectId);
      await attachWithRetry(item.taskId, fileId);
    },
    { retryServerErrors: true },
  );
}
