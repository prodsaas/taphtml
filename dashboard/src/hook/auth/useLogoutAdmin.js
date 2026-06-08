import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useLogoutAdmin() {
    const setAuthenticating = useAdminStore((s) => s.setAuthenticating);
    const removeSession = useAdminStore((s) => s.removeSession);

    const logoutAdmin = async () => {
        try {
            setAuthenticating(true);
            await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
                method: "POST"
            });
        }
        finally {
            removeSession();
        }
    };
    
    const logoutAdminAll = async () => {
        try {
            setAuthenticating(true);
            await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/logout/all`, {
                method: "POST"
            });
        }
        finally {
            removeSession();
        }
    };

    return { logoutAdmin, logoutAdminAll };
};