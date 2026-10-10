// studio/circuit.ts — minimal per-provider circuit breaker in Redis (T-22 shape): opens after 5
// consecutive failures, stays open 5 minutes, then the next call is a half-open probe. Breaker
// trouble (Redis down) never blocks a call — it fails open.

import { redis } from '../redis.js';

const THRESHOLD = 5;
const OPEN_SECONDS = 300;
const key = (name: string) => `circuit:studio:${name}`;

export async function circuitOpen(name: string): Promise<boolean> {
  try {
    return (await redis.get(`${key(name)}:open`)) === '1';
  } catch {
    return false;
  }
}

export async function recordProviderResult(name: string, ok: boolean): Promise<void> {
  try {
    if (ok) {
      await redis.del(`${key(name)}:fails`);
      return;
    }
    const n = await redis.incr(`${key(name)}:fails`);
    await redis.expire(`${key(name)}:fails`, OPEN_SECONDS * 2);
    if (n >= THRESHOLD) {
      await redis.set(`${key(name)}:open`, '1', 'EX', OPEN_SECONDS);
      await redis.del(`${key(name)}:fails`);
    }
  } catch {
    /* fail open */
  }
}
