// Sınıf Pusulası · çevrimdışı önbellek
// Sayfa ve uygulama dosyaları her açılışta önce internetten taze alınır; internet yoksa önbellekten açılır.
const V = 'sp-v54';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const CDN = /^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com)$/;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function fresh(req, key) {
  return fetch(req, { cache: 'no-cache' }).then(res => {
    if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(key || req, cp)); }
    return res;
  }).catch(() => caches.match(key || req, { ignoreSearch: !key }).then(x => x || caches.match(key === 'birebir.html' ? 'birebir.html' : 'index.html')));
}
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate') { e.respondWith(fresh(r, /birebir(\.html)?\/?$/.test(u.pathname) ? 'birebir.html' : 'index.html')); return; }
  if (u.origin === location.origin) { e.respondWith(fresh(r)); return; }
  if (CDN.test(u.hostname)) {
    // kütüphaneler ve yazı tipleri değişmez: önce önbellek
    e.respondWith(caches.open(V).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }))));
  }
});

// ---- bildirimler (Web Push) ----
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Sınıf Pusulası', body: e.data ? e.data.text() : '' }; }
  const t = d.title || 'Sınıf Pusulası';
  e.waitUntil(self.registration.showNotification(t, {
    body: d.body || '', icon: d.icon || 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => {
    const same = L.find(c => c.url.split('#')[0].split('?')[0] === url.split('#')[0].split('?')[0]);
    if (same) return same.focus();
    const any = L.find(c => c.url.startsWith(self.registration.scope));
    if (any && any.navigate) return any.navigate(url).then(c => c && c.focus());
    return self.clients.openWindow(url);
  }));
});
