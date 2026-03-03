

export const OUTBOX_BATCH_SIZE = 20
export const OUTBOX_LOCK_MS = 30_000

export function backoffMs(attempts: number) {
    const ms = Math.min(60_000, 1000 * Math.pow(2, Math.max(0, attempts)))
    return ms
}