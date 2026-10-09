import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var dbOfflineUntil: number | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Execute a DB query with rapid circuit breaker and timeout.
 * If the DB is unreachable, fails fast (under 600ms) and caches failure for 15s
 * so subsequent page renders are instantaneous (< 5ms).
 */
export async function safeDb<T>(fn: () => Promise<T>, fallback: T, timeoutMs = 600): Promise<T> {
  const now = Date.now()
  if (global.dbOfflineUntil && now < global.dbOfflineUntil) {
    return fallback
  }

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), timeoutMs)
      ),
    ])
    // Success, clear offline flag
    global.dbOfflineUntil = undefined
    return result
  } catch {
    // Trip circuit breaker for 15 seconds so other queries don't lag
    global.dbOfflineUntil = Date.now() + 15000
    return fallback
  }
}
