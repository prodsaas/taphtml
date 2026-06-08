import { useState } from "preact/hooks";
import useFetchSession from "./useFetchSession";
import fetchAPI from "../../util/fetch";

export default function useLoginAdmin() {
    const { fetchSession } = useFetchSession();

    const [isLoginLoading, setLoginLoading] = useState(false);

    const loginAdmin = async (email, password, setErrors) => {
        const newErrors = {};

        if (!email) {
            newErrors.email = "Email is required";
        }
        else if (!/^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        else if (!password) {
            newErrors.password = "Password is required";
        }
        else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        else if (password.length > 50) {
            newErrors.password = "Password must be at most 50 characters";
        }

        if (Object.keys(newErrors).length > 0) {
            newErrors.ts = Date.now();
            setErrors(newErrors);
            return;
        }

        try {
            setLoginLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok) await fetchSession();
            else setErrors({ ...data, ts: Date.now() });
        }
        catch {
            setErrors({ submit: "Something went wrong! Try again.", ts: Date.now() });
        }
        finally {
            setLoginLoading(false);
        }
    };

    return { isLoginLoading, loginAdmin };
}