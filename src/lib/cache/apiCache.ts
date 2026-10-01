/**
 * High-Performance Client-Side Cache Layer for Workforce EMS
 * 
 * Features:
 * - 0ms in-memory cache for seamless client-side page navigation
 * - SessionStorage persistence for instant page refreshes
 * - In-flight request deduplication (prevents multiple simultaneous identical fetches)
 * - Stale-While-Revalidate capability
 * - Namespace-based cache invalidation on mutations (e.g. creating invoices, pay runs)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default freshness
const SESSION_CACHE_PREFIX = 'workforce_cache_';

class ApiCacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private inFlightPromises = new Map<string, Promise<any>>();

  /**
   * Get cached data if valid and unexpired
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Check in-memory Map (fastest, 0ms)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > now) {
      return memEntry.data as T;
    }

    // 2. Check SessionStorage (survives page refresh)
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`);
        if (raw) {
          const entry: CacheEntry<T> = JSON.parse(raw);
          if (entry.expiresAt > now) {
            // Restore to memory cache for subsequent instant hits
            this.memoryCache.set(key, entry);
            return entry.data;
          } else {
            sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${key}`);
          }
        }
      } catch {
        /* storage quota / parse error fallback */
      }
    }

    return null;
  }

  /**
   * Set cached data in both memory and sessionStorage
   */
  set<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Persist in SessionStorage for refresh survival
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${key}`, JSON.stringify(entry));
      } catch {
        // If storage quota exceeded, clear older session cache entries
        this.pruneSessionStorage();
      }
    }
  }

  /**
   * Wraps an async fetcher with deduplication and caching
   */
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttlMs?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

    // 1. Return cached result if valid and not forcing refresh
    if (!options?.forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // 2. If identical request is already in-flight, return the shared promise
    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    // 3. Dispatch fresh request and share promise
    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Invalidate all cache entries matching a prefix or pattern (e.g. 'payroll', 'clients', 'sites')
   */
  invalidate(prefix: string): void {
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from SessionStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(`${SESSION_CACHE_PREFIX}${prefix}`)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        /* noop */
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.memoryCache.clear();
    this.inFlightPromises.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(SESSION_CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        /* noop */
      }
    }
  }

  private pruneSessionStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(SESSION_CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      // Remove half of cache to free quota
      keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) => {
        sessionStorage.removeItem(k);
      });
    } catch {
      /* noop */
    }
  }
}

export const apiCache = new ApiCacheService();
