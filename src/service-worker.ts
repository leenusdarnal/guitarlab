/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, prerendered, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_PREFIX = 'guitarlab';
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${version}`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${version}`;
const PRECACHE_URLS = [...build, ...files, ...prerendered];
const MAX_CACHED_PAGES = 40;

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

function isCacheableNavigation(
  request: Request,
  response: Response,
  url: URL
) {
  if (request.method !== 'GET' || request.mode !== 'navigate') return false;
  if (url.origin !== worker.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (response.status !== 200 || response.type !== 'basic') return false;
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return false;
  }
  if (response.headers.has('set-cookie')) return false;

  const cacheControl =
    response.headers.get('cache-control')?.toLowerCase() ?? '';
  return (
    !cacheControl.includes('private') && !cacheControl.includes('no-store')
  );
}

async function trimPageCache(cache: Cache) {
  const keys = await cache.keys();
  const pageRequests = keys.filter((request) => request.mode === 'navigate');
  const excess = pageRequests.length - MAX_CACHED_PAGES;
  if (excess > 0) {
    await Promise.all(
      pageRequests
        .slice(0, excess)
        .map((request) => cache.delete(request))
    );
  }
}

worker.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
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
    event.respondWith(
      (async () => {
        const pages = await caches.open(PAGE_CACHE);
        try {
          const response = await fetch(request);
          if (isCacheableNavigation(request, response, url)) {
            await pages.put(request, response.clone());
            await trimPageCache(pages);
          }
          return response;
        } catch {
          const cached = await pages.match(request);
          if (cached) return cached;
          return new Response(OFFLINE_HTML, {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          });
        }
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
