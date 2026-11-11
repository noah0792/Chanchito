/* Service worker: la app funciona sin conexión.
   Sube el número de VERSION cada vez que cambies index.html para forzar la actualización. */
const VERSION = 'viaticos-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Páginas: primero red (siempre la última versión), si falla, caché.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const cp = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', cp)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Resto de archivos: primero caché.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const cp = res.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); return res;
    }))
  );
});
