import { useState } from "preact/hooks";
import useFetchSession from "./useFetchSession";
import fetchAPI from "../../util/fetch";

export default function useForgotPass() {
    const { fetchSession } = useFetchSession();

    const [step, setStep] = useState(0);
    const [isVerifying, setVerifying] = useState(false);
    const [isResetting, setResetting] = useState(false);

    const forgotPassword = async (email, setErrors) => {
        const newErrors = {};

        if (!email) {
            newErrors.email = "Email is required";
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (Object.keys(newErrors).length > 0) {
            newErrors.ts = Date.now();
            setErrors(newErrors);
            return;
        }

        try {
            setVerifying(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/forgot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.ok) setStep(1);
            else setErrors({ ...data, ts: Date.now() });
        }
        catch {
            setErrors({ submit: "Something went wrong! Try again.", ts: Date.now() });
        }
        finally {
            setVerifying(false);
        }
    };

    const resetPassword = async (email, otp, password, confirm, setErrors) => {
        const newErrors = {};

        if (!email) {
            newErrors.email = "Email is required";
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }
        else if (!otp) {
            newErrors.otp = "OTP is required";
        }
        else if (!/^\d{6}$/.test(otp)) {
            newErrors.otp = "OTP must be a 6-digit number";
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
        else if (!confirm) {
            newErrors.confirm = "Confirm Password is required";
        }
        else if (password && confirm && password !== confirm) {
            newErrors.confirm = "Passwords do not match";
        }

        if (Object.keys(newErrors).length > 0) {
            newErrors.ts = Date.now();
            setErrors(newErrors);
            return;
        }

        try {
            setResetting(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, password }),
            });
            const data = await res.json();

            if (res.ok) await fetchSession();
            else setErrors({ ...data, ts: Date.now() });
        }
        catch {
            setErrors({ submit: "Something went wrong! Try again.", ts: Date.now() });
        }
        finally {
            setResetting(false);
        }
    };

    return { step, isVerifying, isResetting, forgotPassword, resetPassword };
}