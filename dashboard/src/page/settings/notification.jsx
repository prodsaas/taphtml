import { useState, useEffect } from "preact/hooks";
import usePushNotification from "../../hook/setting/usePushNotification";
import useSlackNotification from "../../hook/setting/useSlackNotification";
import useDiscordNotification from "../../hook/setting/useDiscordNotification";
import useTelegramNotification from "../../hook/setting/useTelegramNotification";
import useAdminStore from "../../store/adminStore";
import { Spinner } from "../../component/loader";

const Notification = () => {
    const { isPushLoading, pushNotification } = usePushNotification();
    const { isSlackLoading, slackNotification } = useSlackNotification();
    const { isDiscordLoading, discordToggle, saveDiscordWebhookURL } = useDiscordNotification();
    const { isTelegramLoading, telegramToggle, saveTelegramChatID } = useTelegramNotification();

    const notifications = useAdminStore((s) => s.notifications);

    const [notifState, setNotifState] = useState({
        push: false,
        slack: false,
        discord: false,
        telegram: false
    });
    const [showDiscord, setShowDiscord] = useState(null);
    const [showTelegram, setShowTelegram] = useState(null);

    useEffect(() => {
        if (!notifications) return;

        const loadNotifications = async () => {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    const deviceNotification = notifications.push?.find(n => n.endpoint === subscription.endpoint);

                    if (deviceNotification) {
                        setNotifState(prev => ({
                            ...prev,
                            push: !!deviceNotification.is_active
                        }));
                    }
                }
            };

            if (notifications.slack) {
                setNotifState(prev => ({
                    ...prev,
                    slack: !!notifications.slack.is_active
                }));
            }

            if (notifications.discord) {
                setNotifState(prev => ({
                    ...prev,
                    discord: !!notifications.discord.is_active
                }));
            }

            if (notifications.telegram) {
                setNotifState(prev => ({
                    ...prev,
                    telegram: !!notifications.telegram.is_active
                }));
            }
        }

        loadNotifications();
    }, [notifications]);

    return (
        <section id="notification">
            <div className="setting-head">
                <h4>Notifications</h4>
                <p>Choose which alerts you want to recieve</p>
            </div>
            <div className="setting-card">
                <div className="setting-row">
                    <div className="setting-row-info">
                        <label>Push Notifications</label>
                        <span>Receive instant alerts on your device</span>
                    </div>
                    <input
                        className="setting-toggle"
                        type="checkbox"
                        checked={notifState.push}
                        disabled={isPushLoading}
                        onChange={(e) => pushNotification(e.target.checked, setNotifState)}
                    />
                </div>

                <hr />

                <div className="setting-row">
                    <div className="setting-row-info">
                        <label>Slack Notifications</label>
                        <span>Receive alerts on Slack workspace</span>
                    </div>
                    <input
                        className="setting-toggle"
                        type="checkbox"
                        checked={notifState.slack}
                        disabled={isSlackLoading}
                        onChange={(e) => slackNotification(e.target.checked, setNotifState)}
                    />
                </div>

                <hr />

                <div className="setting-row">
                    <div className="setting-row-info">
                        <label>Discord Notifications</label>
                        <span>Receive alerts on Discord channel</span>
                    </div>
                    {notifications?.discord && (
                        <input
                            className="setting-toggle"
                            type="checkbox"
                            checked={notifState.discord}
                            disabled={isDiscordLoading}
                            onChange={(e) => discordToggle(e.target.checked, setNotifState)}
                        />
                    )}
                </div>
                <div className="setting-extra-info">
                    {showDiscord === null ? (
                        <button
                            onClick={() => setShowDiscord(notifications?.discord?.url || "")}
                            className="setting-btn"
                        >
                            {notifications?.discord ? "Edit Webhook URL" : "Connect Discord"}
                        </button>
                    ) : (
                        <>
                            {!notifications?.discord && (
                                <ol>
                                    <li>Open Discord</li>
                                    <li>Select a server & channel</li>
                                    <li>Click ⚙️ &rarr; Integrations &rarr; Webhooks</li>
                                    <li>Create Webhook & copy URL</li>
                                    <li>Paste Webhook URL below and save</li>
                                </ol>
                            )}
                            <div className="setting-input">
                                <input
                                    id="webhook"
                                    type="url"
                                    placeholder="Discord Webhook URL"
                                    value={showDiscord}
                                    onChange={(e) => setShowDiscord(e.target.value)}
                                />
                                <button
                                    disabled={isDiscordLoading}
                                    onClick={() => saveDiscordWebhookURL(showDiscord, setShowDiscord)}
                                    className="setting-btn"
                                >
                                    {isDiscordLoading ? <Spinner /> : "Save"}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <hr />

                <div className="setting-row">
                    <div className="setting-row-info">
                        <label>Telegram Notifications</label>
                        <span>Receive alerts on Telegram</span>
                    </div>
                    {notifications?.telegram && (
                        <input
                            className="setting-toggle"
                            type="checkbox"
                            checked={notifState.telegram}
                            disabled={isTelegramLoading}
                            onChange={(e) => telegramToggle(e.target.checked, setNotifState)}
                        />
                    )}
                </div>
                <div className="setting-extra-info">
                    {showTelegram === null ? (
                        <button
                            onClick={() => setShowTelegram(notifications?.telegram?.chat_id || "")}
                            className="setting-btn"
                        >
                            {notifications?.telegram ? "Edit Chat ID" : "Connect Telegram"}
                        </button>
                    ) : (
                        <>
                            {!notifications?.telegram && (
                                <ol>
                                    <li>
                                        Open Telegram bot:{" "}
                                        <a
                                            href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME?.replace(/^@/, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <b>{import.meta.env.VITE_TELEGRAM_BOT_USERNAME}</b>
                                        </a>
                                    </li>
                                    <li>Click Start button or type /start in input</li>
                                    <li>Bot will show your Chat ID</li>
                                    <li>Paste Chat ID below and save</li>
                                </ol>
                            )}
                            <div className="setting-input">
                                <input
                                    type="number"
                                    placeholder="Telegram Chat ID"
                                    value={showTelegram}
                                    onChange={(e) => setShowTelegram(e.target.value)}
                                />
                                <button
                                    disabled={isTelegramLoading}
                                    onClick={() => saveTelegramChatID(showTelegram, setShowTelegram)}
                                    className="setting-btn"
                                >
                                    {isTelegramLoading ? <Spinner /> : "Save"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default Notification