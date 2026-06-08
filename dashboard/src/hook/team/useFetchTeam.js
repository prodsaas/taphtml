import { useCallback } from "preact/hooks";
import useAdminStore from "../../store/adminStore";
import fetchAPI from "../../util/fetch";

export default function useFetchTeam() {
    const setTeams = useAdminStore((s) => s.setTeams);
    const setTeamLoading = useAdminStore((s) => s.setTeamLoading);

    const fetchTeam = useCallback(async () => {
        try {
            const res = await fetchAPI(`${import.meta.env.VITE_SERVER_URL}/team`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();

            if (res.ok) setTeams(data);
        }
        finally {
            setTeamLoading(false);
        }
    }, [setTeamLoading, setTeams]);

    return { fetchTeam };
}