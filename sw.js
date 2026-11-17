/* Selam Market service worker: makes the site installable and fast on slow connections.
   Pages and code: network first (so updates show at once), saved copy when offline.
   Pictures and fonts: saved copy first, refreshed in the background. Orders and logins always go to the network. */
var V = "selam-v1";
var CORE = ["./", "index.html", "app.js", "i18n.js", "config.js", "captcha.js", "stats.js", "pwa.js", "favicon.svg", "manifest.webmanifest", "icons/icon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req) {
  return fetch(req).then(function (r) {
    if (r && r.ok) { var c = r.clone(); caches.open(V).then(function (cc) { cc.put(req, c); }); }
    return r;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (m) { return m || caches.match("index.html"); });
  });
}
function staleWhileRevalidate(req) {
  return caches.open(V).then(function (c) {
    return c.match(req).then(function (m) {
      var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(function () { return m; });
      return m || net;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(u.pathname)) { e.respondWith(staleWhileRevalidate(req)); return; }
    if (/admin\.html$/.test(u.pathname)) return; // admin always live
    e.respondWith(networkFirst(req)); return;
  }
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com" ||
      ((u.hostname === "cdn.jsdelivr.net" || u.hostname === "unpkg.com") && /@\d/.test(u.pathname)) ||
      (/\.supabase\.co$/.test(u.hostname) && u.pathname.indexOf("/storage/v1/object/public/") === 0)) {
    e.respondWith(staleWhileRevalidate(req));
  }
  // everything else (orders, logins, data) goes straight to the network
});
