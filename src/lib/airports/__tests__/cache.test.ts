import {
  AIRPORTS_CACHE_NAME,
  createCacheStorageStore,
  createDefaultStore,
  memoryStore,
} from "../cache";
import { airports } from "@/test/fixtures";

/** Minimal in-memory CacheStorage double (jsdom has no Cache Storage API). */
function fakeCacheStorage() {
  const caches = new Map<string, Map<string, string>>();
  const storage = {
    open: jest.fn(async (name: string) => {
      if (!caches.has(name)) caches.set(name, new Map());
      const entries = caches.get(name)!;
      return {
        match: async (key: string) => {
          const body = entries.get(key);
          return body === undefined ? undefined : { json: async () => JSON.parse(body) };
        },
        put: async (key: string, response: { text: () => Promise<string> }) => {
          entries.set(key, await response.text());
        },
      };
    }),
    delete: jest.fn(async (name: string) => caches.delete(name)),
  };
  return { storage: storage as unknown as CacheStorage, caches };
}

// jsdom lacks a global Response; the store only needs text() from it.
beforeAll(() => {
  if (typeof Response === "undefined") {
    (global as unknown as { Response: unknown }).Response = class {
      constructor(private body: string) {}
      text = async () => this.body;
    };
  }
});

describe("createCacheStorageStore", () => {
  it("returns null when nothing has been saved", async () => {
    const { storage } = fakeCacheStorage();
    await expect(createCacheStorageStore(storage).read()).resolves.toBeNull();
  });

  it("round-trips airports with their saved timestamp", async () => {
    const { storage, caches } = fakeCacheStorage();
    const store = createCacheStorageStore(storage);
    await store.write(airports, 1234);
    await expect(store.read()).resolves.toEqual({ airports, savedAt: 1234 });
    expect(caches.has(AIRPORTS_CACHE_NAME)).toBe(true);
  });

  it("ignores corrupted entries", async () => {
    const { storage } = fakeCacheStorage();
    const cache = await storage.open(AIRPORTS_CACHE_NAME);
    await cache.put("/__cache__/airports", new Response(JSON.stringify({ nope: true })));
    await expect(createCacheStorageStore(storage).read()).resolves.toBeNull();
  });

  it("clears the cache", async () => {
    const { storage } = fakeCacheStorage();
    const store = createCacheStorageStore(storage);
    await store.write(airports, 1);
    await store.clear();
    await expect(store.read()).resolves.toBeNull();
  });

  it("never throws when storage is unavailable", async () => {
    const broken = {
      open: jest.fn().mockRejectedValue(new DOMException("denied", "SecurityError")),
      delete: jest.fn().mockRejectedValue(new Error("nope")),
    } as unknown as CacheStorage;
    const store = createCacheStorageStore(broken);
    await expect(store.read()).resolves.toBeNull();
    await expect(store.write(airports)).resolves.toBeUndefined();
    await expect(store.clear()).resolves.toBeUndefined();
  });
});

describe("memoryStore", () => {
  it("keeps data in memory", async () => {
    const store = memoryStore();
    await store.write(airports, 42);
    await expect(store.read()).resolves.toEqual({ airports, savedAt: 42 });
    await store.clear();
    await expect(store.read()).resolves.toBeNull();
  });
});

describe("createDefaultStore", () => {
  it("falls back to memory when Cache Storage is unavailable", async () => {
    const store = createDefaultStore();
    await store.write(airports, 7);
    await expect(store.read()).resolves.toEqual({ airports, savedAt: 7 });
  });
});
