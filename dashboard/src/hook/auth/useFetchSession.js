import { useCallback } from "preact/hooks";
import useAdminStore from "../../store/adminStore";
import useSocketStore from "../../store/socketStore";
import fetchAPI from "../../util/fetch";

export default function useFetchSession() {
    const setAdmin = useAdminStore((s) => s.setAdmin);
    const setWidget = useAdminStore((s) => s.setWidget);
    const setAuthenticated = useAdminStore((s) => s.setAuthenticated);
    const setAuthenticating = useAdminStore((s) => s.setAuthenticating);
    const removeSession = useAdminStore((s) => s.removeSession);
    const connectSocket = useSocketStore((s) => s.connectSocket);

    const fetchSession = useCallback(async () => {
        try {
            setAuthenticating(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/session`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) {
                setAdmin(data.admin);
                setWidget(data.widget);
                setAuthenticated(true);
                connectSocket();
            }
            else removeSession();
        }
        catch {
            removeSession();
        }
        finally {
            setAuthenticating(false);
        }
    }, [setAdmin, setWidget, setAuthenticated, setAuthenticating, removeSession, connectSocket]);

    return { fetchSession };
};