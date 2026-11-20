/**
 * Persistent browser cache for the airport list.
 *
 * The last successful response is saved with a timestamp in the Cache Storage
 * API (it comfortably holds the ~2.6 MB payload, unlike localStorage's ~5 MB
 * UTF-16 quota). AirportsProvider shows cached airports instantly on start-up
 * and falls back to them when the network or API is unavailable.
 */
import type { Airport } from "./types";

export const AIRPORTS_CACHE_NAME = "airports-data-v1";
const CACHE_KEY = "/__cache__/airports";

export interface CachedAirports {
  airports: Airport[];
  /** Epoch milliseconds when the data was fetched from the network. */
  savedAt: number;
}

export interface AirportsStore {
  read(): Promise<CachedAirports | null>;
  write(airports: Airport[], savedAt?: number): Promise<void>;
  clear(): Promise<void>;
}

/** Used where no persistent storage is available (SSR, old browsers, tests). */
export const memoryStore = (): AirportsStore => {
  let value: CachedAirports | null = null;
  return {
    read: async () => value,
    write: async (airports, savedAt = Date.now()) => {
      value = { airports, savedAt };
    },
    clear: async () => {
      value = null;
    },
  };
};

function isCachedAirports(value: unknown): value is CachedAirports {
  const candidate = value as CachedAirports | null;
  return Boolean(candidate && Array.isArray(candidate.airports) && typeof candidate.savedAt === "number");
}

export function createCacheStorageStore(cacheStorage: CacheStorage): AirportsStore {
  return {
    async read() {
      try {
        const cache = await cacheStorage.open(AIRPORTS_CACHE_NAME);
        const response = await cache.match(CACHE_KEY);
        if (!response) return null;
        const body: unknown = await response.json();
        return isCachedAirports(body) ? body : null;
      } catch {
        return null;
      }
    },
    async write(airports, savedAt = Date.now()) {
      try {
        const cache = await cacheStorage.open(AIRPORTS_CACHE_NAME);
        const body = JSON.stringify({ airports, savedAt } satisfies CachedAirports);
        await cache.put(CACHE_KEY, new Response(body, { headers: { "Content-Type": "application/json" } }));
      } catch {
        // Quota exceeded or storage disabled (e.g. private mode): caching is best-effort.
      }
    },
    async clear() {
      try {
        await cacheStorage.delete(AIRPORTS_CACHE_NAME);
      } catch {
        // Ignore: nothing to clear.
      }
    },
  };
}

/** Cache Storage in the browser, otherwise an in-memory store. */
export function createDefaultStore(): AirportsStore {
  if (typeof window !== "undefined" && "caches" in window) {
    return createCacheStorageStore(window.caches);
  }
  return memoryStore();
}
