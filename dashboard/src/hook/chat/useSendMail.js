import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import fetchAPI from "../../util/fetch";

export default function useSendMail() {
    const { toast } = useToast();

    const [isMailLoading, setMailLoading] = useState(false);

    const sendMail = async (chatID, messageInput, setMessageInput, setShowGmail) => {
        const message = messageInput.trim();

        if (!chatID) {
            return toast.error("Chat ID is required");
        }
        else if (!message) {
            return toast.error("Message is required");
        }

        try {
            setMailLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/chat/mail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatID, message })
            });
            const data = await res.json();

            if (res.ok) setMessageInput("");
            else {
                if (!data.isConnected) setShowGmail(true);
                else toast.error(data.message);
            }
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setMailLoading(false);
        }
    }

    return { isMailLoading, sendMail };
}