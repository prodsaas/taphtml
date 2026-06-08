import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";
import { FIELD_LABELS, COLOR_REGEX } from "../../data/widget";

export default function useCustomizeWidget() {
    const { toast } = useToast();

    const setWidget = useAdminStore((s) => s.setWidget);

    const [isCustomizing, setCustomizing] = useState(false);

    const validateForm = (form) => {
        for (const [key, value] of Object.entries(form)) {
            if (typeof value !== "string") continue;

            const label = FIELD_LABELS[key] || key;

            if (key.endsWith("_title") || key.endsWith("_text")) {
                if (value.trim().length > 50) {
                    toast.error(`${label} cannot exceed 50 characters.`);
                    return false;
                }
            }

            if (key.endsWith("_bg") || key.endsWith("_color") || key.endsWith("_border") || key.endsWith("_shadow")) {
                if (!COLOR_REGEX.test(value)) {
                    toast.error(`Invalid ${label}. Must be a valid 6 or 8-digit color.`);
                    return false;
                }
            }
        }

        return true;
    };

    const customizeWidget = async (form) => {
        if (!validateForm(form)) return;

        try {
            setCustomizing(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/widget/customize`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setWidget(data.widget);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setCustomizing(false);
        }
    };

    return { isCustomizing, customizeWidget };
}