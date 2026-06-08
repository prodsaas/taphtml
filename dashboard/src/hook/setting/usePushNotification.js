import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function usePushNotification() {
    const { toast } = useToast();

    const notifications = useAdminStore((s) => s.notifications);
    const setNotifications = useAdminStore((s) => s.setNotifications);

    const [isPushLoading, setPushLoading] = useState(false);

    const pushNotification = async (isActive, setNotifState) => {
        setPushLoading(true);
        setNotifState(prev => ({ ...prev, push: isActive }));
        toast.load(`${isActive ? "Enabling" : "Disabling"} push notifications...`);

        try {
            let sub = null;

            if (isActive) {
                const perm = await Notification.requestPermission();

                if (perm !== "granted") {
                    setNotifState(prev => ({ ...prev, push: false }));
                    toast.error("Notification permission denied by browser");
                    return;
                }

                const reg = await navigator.serviceWorker.ready;

                sub = await reg.pushManager.getSubscription();

                if (!sub) {
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
                    });
                }
            }
            else {
                const reg = await navigator.serviceWorker.ready;
                sub = await reg.pushManager.getSubscription();
            }

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/push/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscription: sub,
                    is_active: isActive
                })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    push: [
                        ...(notifications.push || []).filter(n => n.id !== data.notification.id),
                        data.notification
                    ]
                });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
            setNotifState(prev => ({ ...prev, push: !isActive }));
        }
        finally {
            setPushLoading(false);
        }
    };

    return { isPushLoading, pushNotification };
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);
    const result = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        result[i] = rawData.charCodeAt(i);
    }
    return result;
}