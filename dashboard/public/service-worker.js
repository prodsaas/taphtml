self.addEventListener("push", (event) => {
    const data = event.data.json();

    event.waitUntil(self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/logo/200.png",
        data: { url: data.url }
    }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(self.clients.openWindow(event.notification.data.url));
});

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});