import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useUploadLogo() {
    const { toast } = useToast();

    const widget = useAdminStore((s) => s.widget);
    const setWidget = useAdminStore((s) => s.setWidget);

    const [isUploading, setUploading] = useState(false);

    const uploadLogo = async (file, setForm) => {
        const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/svg+xml"];
        const maxBytes = 5 * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            return toast.error("Only images (PNG, JPG, JPEG, WEBP, SVG) are allowed");
        }
        else if (file.size > maxBytes) {
            return toast.error("Image size cannot exceed 5 MB");
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("logo", file);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/widget/logo/upload`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setForm((prev) => ({ ...prev, logo_url: data.logo_url }));
                setWidget({ ...widget, logo_url: data.logo_url });
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setUploading(false);
        }
    };

    return { isUploading, uploadLogo };
}