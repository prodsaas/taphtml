import "./styles.css";
import { formatTime } from "../../util/time";

const Widget = ({ ui, settings, isOnline = true }) => {
    const {
        logo_url,
        widget_bg,
        widget_border,
        title_color,
        hover_title,
        open_title,
        status_color,
        online_text,
        offline_text,
        arrow_color,
        chat_bg,
        date_color,
        visitor_bg,
        visitor_color,
        visitor_shadow,
        admin_bg,
        admin_color,
        admin_shadow,
        time_color,
        input_bg,
        input_color,
        send_bg,
        send_color,
        send_border,
        send_shadow
    } = settings;

    const mode = "message";

    return (
        <div
            className={`widget ${ui}`}
            style={{
                "--widget-bg": widget_bg,
                "--widget-border": widget_border,
                "--title-color": title_color,
                "--status-color": status_color,
                "--arrow-color": arrow_color,
                "--chat-bg": chat_bg,
                "--date-color": date_color,
                "--visitor-bg": visitor_bg,
                "--visitor-color": visitor_color,
                "--visitor-shadow": visitor_shadow,
                "--admin-bg": admin_bg,
                "--admin-color": admin_color,
                "--admin-shadow": admin_shadow,
                "--time-color": time_color,
                "--input-bg": input_bg,
                "--input-color": input_color,
                "--send-bg": send_bg,
                "--send-color": send_color,
                "--send-border": send_border,
                "--send-shadow": send_shadow
            }}
        >
            <div className="header">
                <div className="logo">
                    <img
                        src={`${import.meta.env.VITE_SERVER_URL}/${logo_url}`}
                        alt=""
                        style={{ display: logo_url ? "block" : "none" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        onLoad={(e) => (e.currentTarget.style.display = "block")}
                    />
                </div>
                <div className="title">
                    <p>
                        {ui === "opened" ? open_title : hover_title}
                    </p>
                    <span className={isOnline ? "online" : ""}>
                        {isOnline ? online_text : offline_text}
                    </span>
                </div>
                <button className="arrow"><div /></button>
            </div>

            <div className="body">
                <div className="messages">
                    {[
                        [
                            "8 Apr 2026",
                            [
                                {
                                    "sender_type": "VISITOR",
                                    "message": "Hii",
                                    "created_at": "2026-04-08T05:58:07.619Z"
                                },
                                {
                                    "sender_type": "ADMIN",
                                    "message": "Hello, how can we help you?",
                                    "created_at": "2026-04-08T06:52:56.722Z"
                                }
                            ]
                        ]
                    ].map(([date, msgs]) => (
                        <div key={date} className="dates">
                            <p className="date">{date}</p>

                            {msgs.map((m, i) => (
                                <div key={i} className={`msg ${m.sender_type}`}>
                                    <p>{m.message}</p>
                                    <p>{formatTime(m.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <form onSubmit={e => e.preventDefault()}>
                    <textarea placeholder={mode === "email" ? "Enter your email address" : "Send us message..."} />
                    <button type="submit"><div /></button>
                </form>
            </div>
        </div>
    )
}

export default Widget