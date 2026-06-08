import { useCallback } from "preact/hooks";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useFetchDashboard() {
    const setDashboard = useAdminStore((s) => s.setDashboard);
    const setDashboardLoading = useAdminStore((s) => s.setDashboardLoading);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/dashboard`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            });
            const data = await res.json();

            setDashboard(data);
        }
        finally {
            setDashboardLoading(false);
        }
    }, [setDashboardLoading, setDashboard]);

    return { fetchDashboard };
}