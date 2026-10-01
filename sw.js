// Renacer Estéreo — service worker sencillo: guarda la página para abrirla sin conexión.
// La señal en vivo y los datos de Firebase nunca se guardan en caché.
const CACHE = "renacer-v1";
const BASE = ["./", "./index.html", "./js/comun.js", "./js/firebase-config.js", "./img/logo.png", "./img/icon-192.png", "./manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith("admin.html")) return;
  e.respondWith(
    fetch(e.request).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request))
  );
});
