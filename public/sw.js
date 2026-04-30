self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))

      const registrations = await self.registration.unregister()
      if (registrations) {
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" })
        await Promise.all(clients.map((client) => client.navigate(client.url)))
      }
    })(),
  )
})
