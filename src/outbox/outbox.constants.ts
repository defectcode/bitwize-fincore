

export const OUTBOX_BATCH_SIZE = 20;
export const OUTBOX_LOCK_MS = 30_000;
export const OUTBOX_LOOP_DELAY_MS = 1000;
export const OUTBOX_MAX_BACKOFF_MS = 60_000;

export function getBackoffMs(attempts: number): number {
  return Math.min(OUTBOX_MAX_BACKOFF_MS, 1000 * Math.pow(2, attempts));
}