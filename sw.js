/* ============================================================
 * SW.JS — Service Worker BEHAVANA
 * Stratégie: Cache First pour assets, Network First pour données
 * ============================================================ */

const CACHE_NAME    = 'behavana-v2';
const CACHE_VERSION = '2.1.0';
const FULL_CACHE    = `${CACHE_NAME}-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './src/styles/base.css',
    './src/styles/layout.css',
    './src/styles/ui.css',
    './src/core/state.js',
    './src/core/db.js',
    './src/core/router.js',
    './src/core/export.js',
    './src/components/toast.js',
    './src/components/modal.js',
    './src/components/form.js',
    './src/components/table.js',
    './src/pages/dashboard.js',
    './src/pages/collectors.js',
    './src/pages/advances.js',
    './src/pages/receptions.js',
    './src/pages/deliveries.js',
    './src/pages/expenses.js',
    './src/pages/analysis.js',
    './src/pages/qualities.js',
    './src/main.js',
    './manifest.json',
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(FULL_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch(err => console.warn('[SW] Install cache error:', err))
    );
});

// ── Activate (clean old caches) ───────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== FULL_CACHE)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch (Cache First + Network fallback) ────────────────────
self.addEventListener('fetch', event => {
    // Ignore non-GET and browser extensions
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Only cache valid responses
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(FULL_CACHE).then(cache => cache.put(event.request, responseClone));
                return response;
            }).catch(() => {
                // Offline fallback for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// ── Messages ──────────────────────────────────────────────────
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
