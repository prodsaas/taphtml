import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useSlackNotification() {
    const { toast } = useToast();

    const notifications = useAdminStore((s) => s.notifications);
    const setNotifications = useAdminStore((s) => s.setNotifications);

    const [isSlackLoading, setSlackLoading] = useState(false);

    const slackNotification = async (isActive, setNotifState) => {
        if (!notifications.slack) {
            toast.load("Redirecting to Slack workspace...");
            window.location.href = `${import.meta.env.VITE_SERVER_URL}/setting/slack/connect`;
            return;
        }

        setSlackLoading(true);
        setNotifState(prev => ({ ...prev, slack: isActive }));

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/slack/toggle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: isActive })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setNotifications({
                    ...notifications,
                    slack: data.notification
                });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
            setNotifState(prev => ({ ...prev, slack: !isActive }));
        }
        finally {
            setSlackLoading(false);
        }
    };

    return { isSlackLoading, slackNotification };
}