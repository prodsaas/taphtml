import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useDiscordNotification() {
    const { toast } = useToast();

    const notifications = useAdminStore((s) => s.notifications);
    const setNotifications = useAdminStore((s) => s.setNotifications);

    const [isDiscordLoading, setDiscordLoading] = useState(false);

    const discordToggle = async (isActive, setNotifState) => {
        setDiscordLoading(true);
        setNotifState(prev => ({ ...prev, discord: isActive }));

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/discord/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: isActive })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    discord: data.notification
                });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
            setNotifState(prev => ({ ...prev, discord: !isActive }));
        }
        finally {
            setDiscordLoading(false);
        }
    };

    const saveDiscordWebhookURL = async (showDiscord, setShowDiscord) => {
        const url = showDiscord?.trim() || "";

        if (url !== "" && !url.startsWith("https://discord.com/api/webhooks/")) {
            return toast.error("Invalid webhook URL");
        }

        setDiscordLoading(true);

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/discord/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    discord: data.notification
                });
                setShowDiscord(null);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Failed to save webhook url");
        }
        finally {
            setDiscordLoading(false);
        }
    };

    return { isDiscordLoading, discordToggle, saveDiscordWebhookURL };
}