// In-memory rate limiter.
// Resets on cold start (serverless), sufficient for abuse prevention.
// For multi-replica production deployments, replace Map with Upstash Redis.

interface RateLimitEntry {
  count: number
  resetAt: number // Unix ms
}

const store = new Map<string, RateLimitEntry>()

// Prune expired entries to prevent unbounded growth across warm invocations
function prune() {
  const now = Date.now()
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check and increment a rate limit counter.
 * @param key    Unique key (e.g. `${userId}:sms:${date}`)
 * @param limit  Max allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  prune()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export const DAY_MS  = 24 * 60 * 60 * 1000
export const HOUR_MS = 60 * 60 * 1000
