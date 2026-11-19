/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { assets, immutable, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { resolve } from '$app/paths';
import {
  isCacheablePublicNavigation,
  isEligiblePublicNavigation,
  resolvePublicNavigation
} from '../lib/offline-cache-policy';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'guitarlab';
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${version}`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${version}`;
// Precache only build assets. HTML documents are added to PAGE_CACHE only
// after a successful visit, so an unvisited page is not silently available
// offline merely because it was prerendered at build time.
const PRECACHE_URLS = [
  ...immutable.map((file) => resolve(file.path)),
  ...assets.map((file) => resolve(file.path))
];
const MAX_CACHED_PAGES = 40;

// Prerendered routes are implicitly public. Dynamic routes must explicitly opt
// in with Cache-Control: public before their HTML can enter the offline cache.
const PUBLIC_PAGE_PATHS = new Set(
  prerendered.map(
    (page) => new URL(resolve(page.path), worker.location.origin).pathname
  )
);

function isEligiblePublicPage(url: URL) {
  return isEligiblePublicNavigation(url, worker.location.origin);
}

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#171715">
    <title>You're offline — GuitarLab</title>
    <style>
      :root{color-scheme:dark;font-family:system-ui,sans-serif;background:#171715;color:#f3f0e8}
      body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box}
      main{max-width:34rem;border:1px solid #45443e;border-radius:18px;padding:clamp(24px,6vw,42px);background:#22221e}
      p{color:#c1beb3;line-height:1.7}a{color:#d6b77a}h1{font-size:clamp(2rem,7vw,3rem);line-height:1.05}
    </style>
  </head>
  <body><main>
    <p>GUITARLAB · OFFLINE MODE</p>
    <h1>Keep your practice going.</h1>
    <p>This page has not been saved on this device yet. Reconnect to open it once, then previously visited lessons and the app's saved assets can be available offline.</p>
    <p>Your locally saved lesson progress remains in this browser. It is not uploaded while you are offline.</p>
    <p><a href="/">Try the dashboard again</a></p>
  </main></body>
</html>`;

function createOfflineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function isCacheableNavigation(request: Request, response: Response, url: URL) {
  return isCacheablePublicNavigation(
    request,
    response,
    url,
    worker.location.origin,
    PUBLIC_PAGE_PATHS
  );
}

async function removeNonPublicPageEntries(cache: Cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.map(async (request) => {
      const url = new URL(request.url);
      const cached = await cache.match(request);
      if (!cached || !isCacheableNavigation(request, cached, url)) {
        await cache.delete(request);
      }
    })
  );
}

async function trimPageCache(cache: Cache) {
  const keys = await cache.keys();
  const pageRequests = keys.filter((request) => request.mode === 'navigate');
  const excess = pageRequests.length - MAX_CACHED_PAGES;
  if (excess > 0) {
    await Promise.all(
      pageRequests.slice(0, excess).map((request) => cache.delete(request))
    );
  }
}

worker.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(precacheAssets(caches, ASSET_CACHE, PRECACHE_URLS));
});

worker.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(`${CACHE_PREFIX}-`) &&
              key !== ASSET_CACHE &&
              key !== PAGE_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await caches
        .open(PAGE_CACHE)
        .then(removeNonPublicPageEntries)
        .catch(() => undefined);
      await worker.clients.claim();
    })
  );
});

worker.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== worker.location.origin) return;

  if (request.mode === 'navigate') {
    // Private routes never read from Cache Storage. The shared resolver also
    // returns the offline fallback directly when the browser is offline.
    event.respondWith(
      (async () => {
        const pages = isEligiblePublicPage(url)
          ? await caches.open(PAGE_CACHE).catch(() => null)
          : null;
        return resolvePublicNavigation(
          request,
          pages,
          url,
          worker.location.origin,
          PUBLIC_PAGE_PATHS,
          {
            // Always try the request: navigator.onLine is only a hint and can
            // be stale. The resolver falls back to public cache/offline HTML.
            // Bypass the browser HTTP cache. Offline pages are available
            // only through the explicitly validated GuitarLab Cache Storage.
            fetchNavigation: () => fetch(request, { cache: 'no-store' }),
            offlineResponse: createOfflineResponse,
            afterCacheWrite: pages ? () => trimPageCache(pages) : undefined
          }
        );
      })()
    );
    return;
  }

  // The precache contains immutable app build assets and static files. Do not
  // runtime-cache API responses, learner data, audio input or arbitrary URLs.
  if (
    url.pathname.startsWith('/_app/immutable/') ||
    url.pathname.includes('.')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
  }
});
