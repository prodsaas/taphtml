import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useDeleteAccount() {
    const { toast } = useToast();

    const removeSession = useAdminStore((s) => s.removeSession);

    const [isDeleteLoading, setDeleteLoading] = useState(false);

    const deleteAccount = async (e) => {
        e.preventDefault();

        try {
            setDeleteLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/account`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                removeSession();
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setDeleteLoading(false);
        }
    };

    return { isDeleteLoading, deleteAccount };
}