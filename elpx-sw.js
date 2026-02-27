self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/__elpx/")) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return new Response("ELPX resource not found", { status: 404, statusText: "Not Found" });
    })
  );
});
