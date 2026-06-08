import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useEditAccount() {
    const { toast } = useToast();

    const admin = useAdminStore((s) => s.admin);
    const setAdmin = useAdminStore((s) => s.setAdmin);
    const teams = useAdminStore((s) => s.teams);
    const setTeams = useAdminStore((s) => s.setTeams);

    const [isEditLoading, setEditLoading] = useState(false);

    const editAccount = async (account) => {
        const { name, email } = account;

        if (!name) {
            return toast.error("Name is required");
        }
        else if (name.length > 100) {
            return toast.error("Name must be at most 100 characters");
        }
        else if (!email) {
            return toast.error("Email is required");
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return toast.error("Please enter a valid email address");
        }

        try {
            setEditLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/setting/account`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setAdmin({ ...admin, name, email });
                if (teams) setTeams(teams.map(t => t.id === admin?.id ? { ...t, name, email } : t));
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setEditLoading(false);
        }
    }

    return { isEditLoading, editAccount };
}