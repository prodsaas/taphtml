import { useState } from "preact/hooks";
import useEditAccount from "../../hook/setting/useEditAccount";
import useAdminStore from "../../store/adminStore";
import { Spinner } from "../../component/loader";

const Account = () => {
    const { isEditLoading, editAccount } = useEditAccount();

    const admin = useAdminStore((s) => s.admin);

    const [account, setAccount] = useState({
        name: admin?.name || "",
        email: admin?.email || ""
    });

    return (
        <section id="account">
            <div className="setting-head">
                <h4>Account</h4>
                <p>Manage your account settings</p>
            </div>
            <div className="setting-card">
                <div className="setting-input">
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={account.name}
                        onChange={(e) => setAccount(prev => ({ ...prev, name: e.target.value }))}
                    />
                </div>
                <div className="setting-input">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={account.email}
                        onChange={(e) => setAccount(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>
                <button
                    disabled={isEditLoading}
                    onClick={() => editAccount(account)}
                    className="setting-btn"
                >
                    {isEditLoading ? <Spinner /> : "Save Changes"}
                </button>
            </div>
        </section>
    )
}

export default Account