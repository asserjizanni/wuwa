import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var dbOfflineUntil: number | undefined
  // eslint-disable-next-line no-var
  var dbMemoryCache: Map<string, { data: any; expiresAt: number }> | undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbOfflineUntil: number | undefined
  dbMemoryCache: Map<string, { data: any; expiresAt: number }> | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

globalForPrisma.prisma = prisma

const memoryCache = globalForPrisma.dbMemoryCache ?? new Map<string, { data: any; expiresAt: number }>()
globalForPrisma.dbMemoryCache = memoryCache

/**
 * Execute a DB query with rapid circuit breaker, timeout, and optional in-memory cache.
 * If cached, returns instantaneously (< 1ms).
 * If the DB is unreachable, fails fast and caches failure for 5s.
 */
export async function safeDb<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs = 1500,
  cacheKey?: string,
  ttlSeconds = 120
): Promise<T> {
  const now = Date.now()

  if (cacheKey) {
    const cached = memoryCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.data as T
    }
  }

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

    if (cacheKey && result !== null && result !== undefined) {
      memoryCache.set(cacheKey, { data: result, expiresAt: now + ttlSeconds * 1000 })
    }

    return result
  } catch {
    // Trip circuit breaker briefly (5s) so other queries don't lag
    global.dbOfflineUntil = Date.now() + 3000
    return fallback
  }
}

export function clearDbCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear()
    return
  }
  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k)
    }
  }
}
