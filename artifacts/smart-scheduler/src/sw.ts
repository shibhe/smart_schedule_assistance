import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: { revision: string | null; url: string }[];

cleanupOutdatedCaches();
precacheAndRoute(__WB_MANIFEST);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data: { title?: string; body?: string; icon?: string } = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Smart Scheduler", {
      body: data.body ?? "",
      icon: data.icon ?? "/logo.svg",
      badge: "/logo.svg",
      tag: "smart-scheduler",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    // @ts-ignore
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: WindowClient[]) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      // @ts-ignore
      if (clients.openWindow) return clients.openWindow("/");
    }),
  );
});
