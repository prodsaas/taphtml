import { useState } from "preact/hooks";
import { useToast } from "../../context/toastContext";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useInviteTeam() {
    const { toast } = useToast();

    const teams = useAdminStore((s) => s.teams);
    const setTeams = useAdminStore((s) => s.setTeams);

    const [isInviteLoading, setInviteLoading] = useState(false);

    const inviteTeam = async (members, setMembers, setShowModal) => {
        for (const m of members) {
            if (!m.email) {
                return toast.error("Email is required");
            }
            else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(m.email)) {
                return toast.error("Enter valid email address");
            }
            else if (!m.role) {
                return toast.error("Role is required");
            }
            else if (!["OWNER", "TEAM"].includes(m.role)) {
                return toast.error("Select valid role");
            }
            else if (teams.some(t => t.email.toLowerCase() === m.email.toLowerCase())) {
                return toast.error(`${m.email} is already in the team`);
            }
        }

        try {
            setInviteLoading(true);

            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/team`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ members }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setShowModal(false);
                setTeams([...teams, ...data.admins]);
                setMembers([{ id: "", email: "", role: "TEAM" }]);
            }
            else toast.error(data.message);
        }
        catch {
            toast.error("Something went wrong! Try again.");
        }
        finally {
            setInviteLoading(false);
        }
    };

    return { isInviteLoading, inviteTeam };
}