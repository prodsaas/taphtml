import "./styles.css";
import { useState, useMemo, useEffect } from "preact/hooks";
import useFetchTeam from "../../hook/team/useFetchTeam";
import useInviteTeam from "../../hook/team/useInviteTeam";
import useUpdateTeam from "../../hook/team/useUpdateTeam";
import useDeleteTeam from "../../hook/team/useDeleteTeam";
import useAdminStore from "../../store/adminStore";
import { Skeleton, Spinner } from "../../component/loader";
import HighlightText from "../../component/highlight";

export default function Team() {
    const { fetchTeam } = useFetchTeam();
    const { isInviteLoading, inviteTeam } = useInviteTeam();
    const { isUpdateLoading, updateTeam } = useUpdateTeam();
    const { isDeleteLoading, deleteTeam } = useDeleteTeam();

    const admin = useAdminStore((s) => s.admin);
    const teams = useAdminStore((s) => s.teams);
    const isTeamLoading = useAdminStore((s) => s.isTeamLoading);

    const [showModal, setShowModal] = useState(false);
    const [showDelete, setShowDelete] = useState(null);
    const [search, setSearch] = useState("");
    const [members, setMembers] = useState([{ id: "", email: "", role: "TEAM" }]);

    const showAdd = () => {
        setMembers([{ id: "", email: "", role: "TEAM" }]);
        setShowModal(true);
    }

    const showEdit = (id) => {
        const t = teams.find(t => t.id === id);
        if (!t) return;

        setMembers([{ id: t.id, email: t.email, role: t.role }]);
        setShowModal(true);
    };

    const addMember = () => {
        setMembers([...members, { id: "", email: "", role: "TEAM" }]);
    }

    const removeMember = (index) => {
        setMembers(members.filter((_, i) => i !== index));
    }

    const updateMember = (index, field, val) => {
        const updated = [...members];
        updated[index][field] = val;
        setMembers(updated);
    };

    const handleTeamForm = async (e) => {
        e.preventDefault();

        if (members[0].id) {
            await updateTeam(members[0], setMembers, setShowModal);
        }
        else {
            await inviteTeam(members, setMembers, setShowModal);
        }
    };

    const handleDeleteForm = async (e) => {
        e.preventDefault();
        await deleteTeam(showDelete, setShowDelete);
    }

    const filteredTeams = useMemo(() => {
        if (!teams?.length) return [];

        const query = search.toLowerCase();
        if (!query) return teams;

        return teams.filter(({ name, email, role }) => [name, email, role].some(field => field?.toLowerCase().includes(query)));
    }, [teams, search]);

    useEffect(() => {
        if (!teams) fetchTeam();
    }, [teams, fetchTeam]);

    return (
        <div className="layout">
            <h3>
                Team
                {admin?.role !== "TEAM" && (
                    <button
                        onClick={showAdd}
                        className="invite-btn"
                    >
                        Invite Team
                    </button>
                )}
            </h3>

            <div className="team">
                <div className="search">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email or role"
                        />
                    </form>
                </div>

                <div className="team-box">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                {admin?.role !== "TEAM" && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isTeamLoading && (
                                <tr>
                                    <td><Skeleton /></td>
                                    <td><Skeleton /></td>
                                    <td><Skeleton /></td>
                                    <td><Skeleton /></td>
                                </tr>
                            )}
                            {filteredTeams.map(t => (
                                <tr key={t.id}>
                                    <td><HighlightText text={t.name} query={search} /></td>
                                    <td><HighlightText text={t.email} query={search} /></td>
                                    <td><HighlightText text={t.role} query={search} /></td>
                                    <td>{t.is_active ? "Active" : "Pending"}</td>
                                    {admin?.role !== "TEAM" && t.id !== admin?.id && (
                                        <td>
                                            <button onClick={() => showEdit(t.id)} />
                                            <button onClick={() => setShowDelete(t.id)} />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    className="modal"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="modal-content"
                    >
                        <div className="modal-head">
                            <p>{members[0].id ? "Edit" : "Add"} Team</p>
                            <button type="button" onClick={() => setShowModal(false)} />
                        </div>
                        <form
                            onSubmit={handleTeamForm}
                            className="modal-body"
                        >
                            {members.map((m, index) => (
                                <div key={index} className="modal-card">
                                    <div>
                                        <label>Email</label>
                                        {members.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMember(index)}
                                                className="remove-btn"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <input
                                            type="email"
                                            required
                                            value={m.email}
                                            onChange={(e) => updateMember(index, "email", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label>Role</label>
                                        <select
                                            value={m.role}
                                            onChange={(e) => updateMember(index, "role", e.target.value)}
                                        >
                                            <option value="TEAM">TEAM</option>
                                            <option value="OWNER">OWNER</option>
                                        </select>
                                    </div>
                                </div>
                            ))}

                            <div className="modal-btns">
                                <button
                                    type="button"
                                    onClick={() => members[0].id ? setShowModal(false) : addMember()}
                                    className="modal-btn tertiary"
                                >
                                    {members[0].id ? "Cancel" : "Add Member"}
                                </button>
                                <button
                                    type="submit"
                                    className="modal-btn primary"
                                    disabled={isInviteLoading || isUpdateLoading}
                                >
                                    {isInviteLoading || isUpdateLoading ? <Spinner /> : members[0].id ? "Save" : "Send Invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDelete !== null && (
                <div
                    onClick={() => setShowDelete(null)}
                    className="modal"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="modal-content"
                    >
                        <div className="modal-head">
                            <p>Remove Team</p>
                            <button type="button" onClick={() => setShowDelete(null)} />
                        </div>
                        <form
                            onSubmit={handleDeleteForm}
                            className="modal-body"
                        >
                            <p>Are you sure you want to delete this team member? All their data will be permanently removed and cannot be recovered.</p>
                            <div className="modal-btns">
                                <button
                                    type="button"
                                    onClick={() => setShowDelete(null)}
                                    className="modal-btn tertiary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-btn secondary"
                                    disabled={isDeleteLoading}
                                >
                                    {isDeleteLoading ? <Spinner /> : "Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}