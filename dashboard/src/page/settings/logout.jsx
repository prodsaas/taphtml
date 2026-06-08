import useLogoutAdmin from "../../hook/auth/useLogoutAdmin";

const Logout = () => {
    const { logoutAdminAll } = useLogoutAdmin();

    return (
        <section id="logout">
            <div className="setting-head">
                <h4>Logout</h4>
                <p>Manage your sessions across devices</p>
            </div>
            <div className="setting-card">
                <p>End all active sessions across every device. This will log you out of all current browsers and extensions.</p>
                <div className="setting-btns">
                    <button
                        onClick={logoutAdminAll}
                        className="setting-btn danger"
                    >
                        Logout Everywhere
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Logout