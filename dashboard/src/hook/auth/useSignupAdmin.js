import { useState } from "preact/hooks";
import useFetchSession from "./useFetchSession";
import fetchAPI from "../../util/fetch";

export default function useSignupAdmin() {
    const { fetchSession } = useFetchSession();

    const [step, setStep] = useState(0);
    const [isRegistering, setRegistering] = useState(false);
    const [isVerifying, setVerifying] = useState(false);

    const signupAdmin = async (name, email, password, setErrors) => {
        const newErrors = {};

        if (!name) {
            newErrors.name = "Name is required";
        }
        else if (name.length > 100) {
            newErrors.password = "Name must be at most 100 characters";
        }
        else if (!email) {
            newErrors.email = "Email is required";
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
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
            setRegistering(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (res.ok) setStep(1);
            else setErrors({ ...data, ts: Date.now() });
        }
        catch {
            setErrors({ submit: "Something went wrong! Try again.", ts: Date.now() });
        }
        finally {
            setRegistering(false);
        }
    };

    const verifyAdmin = async (name, email, password, otp, setErrors) => {
        const newErrors = {};

        if (!name) {
            newErrors.name = "Name is required";
        }
        else if (name.length > 100) {
            newErrors.password = "Name must be at most 100 characters";
        }
        else if (!email) {
            newErrors.email = "Email is required";
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
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
        else if (!otp) {
            newErrors.otp = "OTP is required";
        }
        else if (!/^\d{6}$/.test(otp)) {
            newErrors.otp = "OTP must be a 6-digit number";
        }

        if (Object.keys(newErrors).length > 0) {
            newErrors.ts = Date.now();
            setErrors(newErrors);
            return;
        }

        try {
            setVerifying(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, otp }),
            });
            const data = await res.json();

            if (res.ok) {
                sessionStorage.setItem("saveRoute", "/install");
                await fetchSession();
            }
            else setErrors({ ...data, ts: Date.now() });
        }
        catch {
            setErrors({ submit: "Something went wrong! Try again.", ts: Date.now() });
        }
        finally {
            setVerifying(false);
        }
    };

    return { step, isRegistering, signupAdmin, isVerifying, verifyAdmin };
}