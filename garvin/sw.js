/* Ersetzt den alten Yuna-Service-Worker an der Startadresse.
   Bestehende Installationen laden diese Datei beim nächsten Besuch,
   leeren den Cache und melden sich ab, damit die Rätsel-Seite erscheint. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window" });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
      await self.registration.unregister();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
