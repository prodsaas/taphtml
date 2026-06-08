import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useDeleteTeam() {
    const { toast } = useToast();

    const teams = useAdminStore((s) => s.teams);
    const setTeams = useAdminStore((s) => s.setTeams);

    const [isDeleteLoading, setDeleteLoading] = useState(false);

    const deleteTeam = async (showDelete, setShowDelete) => {
        try {
            setDeleteLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/team`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: showDelete }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setTeams(teams.filter(t => t.id !== showDelete));
                setShowDelete(null);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setDeleteLoading(false);
        }
    }

    return { isDeleteLoading, deleteTeam };
}