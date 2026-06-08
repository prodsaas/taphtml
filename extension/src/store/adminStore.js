import { create } from "zustand";
import useSocketStore from "./socketStore";
import fetchAPI from "../util/fetch";

const useAdminStore = create((set, get) => ({
    isAuthenticating: true,
    isAuthenticated: false,
    admin: null,

    fetchSession: async () => {
        if (get().isAuthenticated) return;

        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/session`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) {
                set({ admin: data.admin, isAuthenticated: true });
                useSocketStore.getState().connectSocket();
            }
            else {
                get().removeSession();
            }
        }
        catch {
            get().removeSession();
        }
        finally {
            set({ isAuthenticating: false });
        }
    },

    removeSession: async () => {
        useSocketStore.getState().disconnectSocket();

        set({ isAuthenticating: false, isAuthenticated: false, admin: null });
    },

    loginAdmin: async (email, password, setError, setLoading) => {
        try {
            setLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) get().fetchSession();
            else setError(Object.values(data).join(", "));
        }
        catch {
            setError("Something went wrong! Try again.");
        }
        finally {
            setLoading(false);
        }
    },

    logoutAdmin: async () => {
        try {
            set({ isAuthenticating: false });
            await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
                method: "POST"
            });
        }
        finally {
            get().removeSession();
        }
    }
}));

export default useAdminStore;