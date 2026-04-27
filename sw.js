/* ============================================================
 * SW.JS — Service Worker RISEVANILLA v3.0.0
 * Stratégie: Cache-First (assets locaux) + Stale-While-Revalidate (CDN)
 * Offline complet après premier chargement
 * ============================================================ */

const CACHE_NAME    = 'risevanilla-v3';
const CACHE_VERSION = '3.1.0';
const STATIC_CACHE  = `${CACHE_NAME}-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime-${CACHE_VERSION}`;

// ── Assets locaux à précacher (critique) ─────────────────────
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',

    // Styles
    './src/styles/base.css',
    './src/styles/layout.css',
    './src/styles/ui.css',
    './src/styles/search.css',

    // Core
    './src/core/state.js',
    './src/core/db.js',
    './src/core/router.js',
    './src/core/export.js',
    './src/core/search.js',

    // Components
    './src/components/toast.js',
    './src/components/modal.js',
    './src/components/form.js',
    './src/components/table.js',

    // Pages
    './src/pages/dashboard.js',
    './src/pages/collectors.js',
    './src/pages/advances.js',
    './src/pages/receptions.js',
    './src/pages/deliveries.js',
    './src/pages/expenses.js',
    './src/pages/analysis.js',
    './src/pages/qualities.js',

    './src/main.js',

    // Assets JS/CSS locaux (si présents)
    './assets/chart.min.js',
    './assets/xlsx.full.min.js',
];

// ── Assets image/logo (non bloquants si absents) ──────────────
const OPTIONAL_ASSETS = [
    './logo.jpg',
    './logo-192.png',
    './logo-512.png',
    './logo-maskable.png',
];

// ── Origines CDN à cacher à la volée ─────────────────────────
const CDN_ORIGINS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'use.fontawesome.com',
];

// ─────────────────────────────────────────────────────────────
// INSTALL — Précache des assets critiques
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
    console.log('[SW] Install — RISEVANILLA', CACHE_VERSION);

    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE);

        // Assets critiques : échec individuel non bloquant
        await Promise.allSettled(
            [...STATIC_ASSETS, ...OPTIONAL_ASSETS].map(url =>
                cache.add(url).catch(err =>
                    console.warn(`[SW] Précache ignoré (${url}):`, err.message)
                )
            )
        );

        console.log('[SW] Précache terminé');
        self.skipWaiting();
    })());
});

// ─────────────────────────────────────────────────────────────
// ACTIVATE — Nettoyage des anciens caches
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
    console.log('[SW] Activate — nettoyage caches obsolètes');

    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
                .map(k => {
                    console.log('[SW] Suppression:', k);
                    return caches.delete(k);
                })
        );
        await self.clients.claim();
        console.log('[SW] Activation complète — contrôle de tous les onglets');
    })());
});

// ─────────────────────────────────────────────────────────────
// FETCH — Aiguillage intelligent selon la ressource
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer non-GET et extensions navigateur
    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') return;

    // 1. Navigation HTML → Network-First + fallback SPA
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstSPA(request));
        return;
    }

    // 2. Ressources CDN → Stale-While-Revalidate
    if (CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
        return;
    }

    // 3. Assets locaux → Cache-First
    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
        return;
    }
});

// ─────────────────────────────────────────────────────────────
// STRATÉGIES
// ─────────────────────────────────────────────────────────────

/** Cache-First : cache → réseau → mise en cache */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (isValidResponse(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return fallbackFor(request);
    }
}

/** Network-First pour navigation SPA : réseau → cache → index.html */
async function networkFirstSPA(request) {
    try {
        const response = await fetch(request);
        if (isValidResponse(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Fallback SPA : toujours servir index.html
        const fallback = await caches.match('./index.html');
        return fallback || new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8">
            <title>RISEVANILLA — Hors ligne</title></head><body>
            <h2>📦 RISEVANILLA</h2>
            <p>Application hors ligne. Rechargez quand la connexion revient.</p>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

/** Stale-While-Revalidate : cache immédiat + mise à jour fond */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Lancer la requête réseau en arrière-plan sans bloquer
    const networkPromise = fetch(request)
        .then(response => {
            if (isValidResponse(response)) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Retourner le cache immédiatement si disponible
    return cached || networkPromise;
}

/** Réponses de fallback selon le type de fichier */
function fallbackFor(request) {
    const url = request.url;

    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url)) {
        return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                <rect width="48" height="48" fill="#f0f0f0" rx="8"/>
                <text x="50%" y="55%" text-anchor="middle" fill="#aaa" font-size="10">img</text>
            </svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
    if (/\.(woff2?|ttf|eot|otf)$/i.test(url)) {
        return new Response('', { status: 200, headers: { 'Content-Type': 'font/woff2' } });
    }
    if (/\.css$/i.test(url)) {
        return new Response('/* offline */', { headers: { 'Content-Type': 'text/css' } });
    }
    if (/\.js$/i.test(url)) {
        return new Response('/* offline */', { headers: { 'Content-Type': 'application/javascript' } });
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

/** Vérifie qu'une réponse est valide et cacheable */
function isValidResponse(response) {
    return response && response.status === 200 && response.type !== 'error';
}

// ─────────────────────────────────────────────────────────────
// MESSAGES — Commandes depuis l'application
// ─────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
    const { type } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            console.log('[SW] Force activation demandée');
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            event.ports[0]?.postMessage({
                cacheName: STATIC_CACHE,
                version: CACHE_VERSION
            });
            break;

        case 'CLEAR_RUNTIME_CACHE':
            caches.delete(RUNTIME_CACHE).then(() => {
                console.log('[SW] Cache runtime vidé');
                event.ports[0]?.postMessage({ success: true });
            });
            break;

        default:
            break;
    }
});
