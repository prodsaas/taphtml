import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useDeleteLogo() {
    const { toast } = useToast();

    const widget = useAdminStore((s) => s.widget);
    const setWidget = useAdminStore((s) => s.setWidget);

    const [isDeleting, setDeleting] = useState(false);

    const deleteLogo = async (logoUrl, setForm) => {
        if (!logoUrl) return;

        try {
            setDeleting(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/widget/logo/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logo_url: logoUrl })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setForm((prev) => ({ ...prev, logo_url: "" }));
                setWidget({ ...widget, logo_url: "" });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setDeleting(false);
        }
    };

    return { isDeleting, deleteLogo };
}