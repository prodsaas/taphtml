import useAdminStore from "../store/adminStore";

let refreshPromise = null;

const fetchAPI = async (url, options = {}) => {
    const fetchOptions = {
        ...options,
        credentials: "include"
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401) {
        if (!refreshPromise) {
            refreshPromise = fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh`, {
                method: "GET",
                credentials: "include",
            }).finally(() => {
                refreshPromise = null;
            });
        }

        try {
            const refreshResponse = await refreshPromise;

            if (refreshResponse && refreshResponse.ok) {
                response = await fetch(url, fetchOptions);
            }
            else {
                useAdminStore.getState().removeSession();
            }
        }
        catch {
            useAdminStore.getState().removeSession();
        }
    }

    return response;
};

export default fetchAPI;