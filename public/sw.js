/**
 * Airports Viewer service worker: keeps the app shell available offline.
 *
 * Strategies:
 * - Navigations (HTML) and RSC requests: network-first, falling back to the
 *   cached copy, then to /offline.html for pages never visited.
 * - Build assets (/_next/static, fonts, icons): cache-first (they're content-hashed).
 * - /api/*: not handled here; the app keeps its own airports cache so it can tell
 *   the user how old the data is.
 */
const VERSION = "v1";
const SHELL_CACHE = `airports-shell-${VERSION}`;
const ASSET_CACHE = `airports-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = ["/", OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("airports-") && ![SHELL_CACHE, ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isRscRequest(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

async function networkFirst(request, { fallbackUrl } = {}) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, { fallbackUrl: OFFLINE_URL }));
  } else if (isRscRequest(request, url)) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith("/_next/static/") || /\.(?:ico|png|svg|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
