import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useTelegramNotification() {
    const { toast } = useToast();

    const notifications = useAdminStore((s) => s.notifications);
    const setNotifications = useAdminStore((s) => s.setNotifications);

    const [isTelegramLoading, setTelegramLoading] = useState(false);

    const telegramToggle = async (isActive, setNotifState) => {
        setTelegramLoading(true);
        setNotifState(prev => ({ ...prev, telegram: isActive }));

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/telegram/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: isActive })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    telegram: data.notification
                });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
            setNotifState(prev => ({ ...prev, telegram: !isActive }));
        }
        finally {
            setTelegramLoading(false);
        }
    };

    const saveTelegramChatID = async (showTelegram, setShowTelegram) => {
        const chat_id = showTelegram?.trim() || "";

        setTelegramLoading(true);

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/telegram/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    telegram: data.notification
                });
                setShowTelegram(null);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Failed to save chat id");
        }
        finally {
            setTelegramLoading(false);
        }
    };

    return { isTelegramLoading, telegramToggle, saveTelegramChatID };
}