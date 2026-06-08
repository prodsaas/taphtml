import useAdminStore from "../../store/adminStore";

const Gmail = () => {
    const gmail = useAdminStore((s) => s.gmail);

    const gmailAuth = () => {
        window.location.href = `${import.meta.env.VITE_SERVER_URL}/chat/google`;
    };

    return (
        <section id="gmail">
            <div className="setting-head">
                <h4>Gmail</h4>
                <p>Connect your account to reply via email</p>
            </div>
            <div className="setting-card">
                <div className="setting-row">
                    <div className="setting-row-info">
                        <span>Connect your Gmail to reply to visitors directly from your email address. TapHTML only uses this to send the messages you write in the chat page. We will never read your inbox or send unauthorized emails from your account.</span>
                    </div>
                </div>
                <div className="setting-extra-info">
                    {gmail && <p>Gmail: {gmail.email}</p>}
                    <button
                        disabled={false}
                        onClick={gmailAuth}
                        className="setting-btn"
                    >
                        {gmail ? "Switch Account" : "Connect Gmail"}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Gmail