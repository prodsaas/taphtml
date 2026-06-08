import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useUpdateTeam() {
    const { toast } = useToast();

    const teams = useAdminStore((s) => s.teams);
    const setTeams = useAdminStore((s) => s.setTeams);

    const [isUpdateLoading, setUpdateLoading] = useState(false);

    const updateTeam = async (member, setMembers, setShowModal) => {
        const { id, email, role } = member;

        if (!email) {
            return toast.error("Email is required");
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return toast.error("Please enter a valid email address");
        }
        else if (!role) {
            return toast.error("Role is required");
        }
        else if (!["OWNER", "TEAM"].includes(role)) {
            return toast.error("Invalid role selected");
        }
        else if (teams.some(t => t.id !== id && t.email.toLowerCase() === email.toLowerCase())) {
            return toast.error("Email already exists");
        }
        else if (role === "TEAM" && !teams.some(t => t.id !== id && t.role === "OWNER")) {
            return toast.error("There must be at least one owner in the team");
        }

        try {
            setUpdateLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/team`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, email, role }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setShowModal(false);
                setTeams(teams.map(t => t.id === id ? { ...t, email, role } : t));
                setMembers([{ id: "", email: "", role: "TEAM" }]);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setUpdateLoading(false);
        }
    }

    return { isUpdateLoading, updateTeam };
}