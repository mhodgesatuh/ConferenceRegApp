// backend/src/middleware/emailIpLimiter.ts

type Key = string;

interface Bucket {
    attempts: number;
    firstAttemptAt: number; // ms since epoch
    blockedUntil?: number;  // ms since epoch
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;                  // allow up to 10 failed tries per window
const BLOCK_MS = 30 * 60 * 1000;  // 30 minutes block after exceeding limit

const buckets = new Map<Key, Bucket>();

function now() {
    return Date.now();
}

function makeKey(email: string, ip: string): Key {
    return `${email}|${ip}`;
}

/**
 * Check if the (email, ip) is currently blocked.
 * Returns {ok:true} or {ok:false, retryAfterMs:number}
 */
export function checkLimit(email: string, ip: string): { ok: true } | { ok: false; retryAfterMs: number } {
    const key = makeKey(email, ip);
    const b = buckets.get(key);
    const t = now();

    if (!b) return { ok: true };

    // if blocked
    if (b.blockedUntil && t < b.blockedUntil) {
        return { ok: false, retryAfterMs: b.blockedUntil - t };
    }

    // if window expired, reset
    if (t - b.firstAttemptAt > WINDOW_MS) {
        buckets.delete(key);
        return { ok: true };
    }

    return { ok: true };
}

/**
 * Record a FAILED attempt.
 * If limit exceeded, sets a block.
 */
export function recordFailure(email: string, ip: string) {
    const key = makeKey(email, ip);
    const t = now();
    const b = buckets.get(key);

    if (!b) {
        buckets.set(key, { attempts: 1, firstAttemptAt: t });
        return;
    }

    // reset window if expired or previously blocked period has passed
    if ((b.blockedUntil && t >= b.blockedUntil) || (t - b.firstAttemptAt > WINDOW_MS)) {
        buckets.set(key, { attempts: 1, firstAttemptAt: t });
        return;
    }

    b.attempts += 1;

    if (b.attempts > MAX_ATTEMPTS) {
        b.blockedUntil = t + BLOCK_MS;
    }

    buckets.set(key, b);
}

/** Clear counters after a SUCCESSFUL auth. */
export function resetCounter(email: string, ip: string) {
    const key = makeKey(email, ip);
    buckets.delete(key);
}
