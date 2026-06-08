import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useFetchSession from "./useFetchSession";
import fetchAPI from "../../util/fetch";
import { encodeArrayBufferToBase64, decodeBase64ToArrayBuffer } from "../../util/passkey";

export default function usePasskeySignup() {
    const { toast } = useToast();

    const { fetchSession } = useFetchSession();

    const [isPasskeyLoading, setPasskeyLoading] = useState(false);

    const passkeySignup = async (name, email) => {
        if (!name) {
            return toast.error("Name is required");
        }
        else if (name.length > 100) {
            return toast.error("Name must be at most 100 characters");
        }
        else if (!email) {
            return toast.error("Email is required");
        }
        else if (!/^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
            return toast.error("Please enter a valid email address");
        }

        try {
            setPasskeyLoading(true);

            const optionRes = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/passkey/register/options`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email })
            });
            const optionData = await optionRes.json();

            if (!optionRes.ok) {
                setPasskeyLoading(false);
                toast.error(optionData.message);
                return;
            }

            const publicKey = {
                ...optionData,
                challenge: decodeBase64ToArrayBuffer(optionData.challenge),
                user: { ...optionData.user, id: decodeBase64ToArrayBuffer(optionData.user.id) },
                excludeCredentials: (optionData.excludeCredentials || []).map(cred => ({
                    ...cred, id: decodeBase64ToArrayBuffer(cred.id)
                }))
            };

            const credential = await navigator.credentials.create({ publicKey });
            if (!credential) {
                setPasskeyLoading(false);
                return;
            }

            const verifyRes = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/passkey/register/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    credential: {
                        id: credential.id,
                        rawId: encodeArrayBufferToBase64(credential.rawId),
                        response: {
                            attestationObject: encodeArrayBufferToBase64(credential.response.attestationObject),
                            clientDataJSON: encodeArrayBufferToBase64(credential.response.clientDataJSON),
                            transports: credential.response.getTransports ? credential.response.getTransports() : []
                        }
                    }
                })
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
                sessionStorage.setItem("saveRoute", "/install");
                fetchSession();
            }
            else toast.error(verifyData.message);
        }
        catch (error) {
            if (["NotReadableError", "InvalidStateError"].includes(error.name)) {
                toast.success("Device already registered! Login with Passkey to proceed.");
            }
            else if (error.name === "NotSupportedError") {
                toast.error("Browser not supported for passkey");
            }
            else if (error.name !== "NotAllowedError") {
                toast.error(error.message);
            }
        }
        finally {
            setPasskeyLoading(false);
        }
    };

    return { isPasskeyLoading, passkeySignup };
}