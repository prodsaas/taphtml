import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useFetchSession from "./useFetchSession";
import fetchAPI from "../../util/fetch";
import { encodeArrayBufferToBase64, decodeBase64ToArrayBuffer } from "../../util/passkey";

export default function usePasskeyLogin() {
    const { toast } = useToast();

    const { fetchSession } = useFetchSession();

    const [isPasskeyLoading, setPasskeyLoading] = useState(false);

    const passkeyLogin = async () => {
        try {
            setPasskeyLoading(true);

            const optionRes = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/passkey/login/options`, {
                method: "POST"
            });
            const optionData = await optionRes.json();

            if (!optionRes.ok) {
                setPasskeyLoading(false);
                toast.error("Could not initialize login");
                return;
            }

            const publicKey = {
                ...optionData,
                challenge: decodeBase64ToArrayBuffer(optionData.challenge),
                allowCredentials: []
            };

            const assertion = await navigator.credentials.get({ publicKey });
            if (!assertion) {
                setPasskeyLoading(false);
                return;
            }

            const verifyRes = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/auth/passkey/login/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential: {
                        id: assertion.id,
                        rawId: encodeArrayBufferToBase64(assertion.rawId),
                        challenge: optionData.challenge,
                        response: {
                            authenticatorData: encodeArrayBufferToBase64(assertion.response.authenticatorData),
                            clientDataJSON: encodeArrayBufferToBase64(assertion.response.clientDataJSON),
                            signature: encodeArrayBufferToBase64(assertion.response.signature),
                            userHandle: assertion.response.userHandle ? encodeArrayBufferToBase64(assertion.response.userHandle) : null
                        }
                    }
                })
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok) fetchSession();
            else toast.error(verifyData.message);
        }
        catch (error) {
            if (error.name === "NotSupportedError") {
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

    return { isPasskeyLoading, passkeyLogin };
}