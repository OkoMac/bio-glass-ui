// BION Service Worker — offline shell + caching + push notifications
//
// CACHE_NAME contains a build placeholder (__BION_BUILD__) that the
// postbuild script (scripts/inject-sw-version.mjs) replaces with a
// per-deploy hash. The byte change makes the browser detect this as a
// new SW on every deploy, which triggers reg.update() in main.tsx and
// auto-reloads the page on the user's next visit — even when no other
// SW logic changed. Without this, deploys that only touched app code
// (not /sw.js itself) would leave users on the previous version
// indefinitely because the SW byte-comparison would say "no change".
const CACHE_NAME = "bion-__BION_BUILD__";
const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

// Install: cache shell assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push notification: triggered by Web Push API or local triggers
self.addEventListener("push", (e) => {
  let payload = {};
  try {
    payload = e.data ? e.data.json() : {};
  } catch {
    payload = { title: "BION", body: e.data?.text() ?? "You have a new notification" };
  }

  const title = payload.title ?? "BION";
  const options = {
    body: payload.body ?? "Tap to open BION",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag ?? "bion-notif",
    data: { url: payload.url ?? "/" },
    requireInteraction: payload.priority === "high",
    vibrate: payload.priority === "high" ? [200, 100, 200] : [100],
    actions: payload.actions ?? [],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: focus existing window or open new
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "navigate", url });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Listen for messages from the app (e.g. to schedule local notifications)
self.addEventListener("message", (e) => {
  if (e.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, url, tag } = e.data;
    self.registration.showNotification(title ?? "BION", {
      body: body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag ?? "bion-local",
      data: { url: url ?? "/" },
      vibrate: [100],
    });
  }
});

// Fetch: network-first for pages/images, cache-first only for hashed bundles
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Hashed Vite bundles (e.g. /assets/index-Ab1Cd2.js): cache-first (hash changes on rebuild)
  if (url.pathname.startsWith("/assets/") && /\.[a-f0-9]{8,}\.(js|css)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Images, icons, fonts, manifest: network-first (updates propagate immediately)
  if (/\.(png|jpg|jpeg|svg|ico|webp|woff2?|json)$/.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML pages: network-first, fall back to cached shell, then offline page
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful HTML responses for offline access
        if (res.ok) {
          const clone = res.clone();
          caches.open("bion-pages-v1").then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
      .then(res => res || caches.match("/") || caches.match("/offline.html"))
  );
});
