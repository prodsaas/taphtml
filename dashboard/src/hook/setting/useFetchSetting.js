import { useCallback } from "preact/hooks";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useFetchSetting() {
    const setGmail = useAdminStore((s) => s.setGmail);
    const setNotifications = useAdminStore((s) => s.setNotifications);
    const setSettingLoading = useAdminStore((s) => s.setSettingLoading);

    const fetchSetting = useCallback(async () => {
        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) {
                setGmail(data.gmail);
                setNotifications(data.notifications);
            }
        }
        finally {
            setSettingLoading(false);
        }
    }, [setGmail, setNotifications, setSettingLoading]);

    return { fetchSetting };
}