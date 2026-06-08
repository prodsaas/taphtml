const { pool } = require("../config/db");
const { webpush, isPushEnvSet } = require("../config/webpush");

const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URL, TELEGRAM_BOT_TOKEN } = process.env;
const isSlackEnvSet = Boolean(SLACK_CLIENT_ID && SLACK_CLIENT_SECRET && SLACK_REDIRECT_URL);
const isTelegramEnvSet = Boolean(TELEGRAM_BOT_TOKEN);

async function sendNotification(widgetID, { email, message, chatID }) {
    const [pushRes, slackRes, discordRes, telegramRes] = await Promise.all([
        isPushEnvSet
            ? pool.query("SELECT endpoint, p256dh, auth FROM push_notifications WHERE widget_id = $1 AND is_active = true", [widgetID])
            : Promise.resolve({ rows: [] }),

        isSlackEnvSet
            ? pool.query("SELECT url FROM slack_notifications WHERE widget_id = $1 AND is_active = true", [widgetID])
            : Promise.resolve({ rows: [] }),

        pool.query("SELECT url FROM discord_notifications WHERE widget_id = $1 AND is_active = true", [widgetID]),

        isTelegramEnvSet
            ? pool.query("SELECT chat_id FROM telegram_notifications WHERE widget_id = $1 AND is_active = true", [widgetID])
            : Promise.resolve({ rows: [] }),
    ]);

    const pushPromises = isPushEnvSet
        ? pushRes.rows.map(push =>
            webpush.sendNotification(
                {
                    endpoint: push.endpoint,
                    keys: { p256dh: push.p256dh, auth: push.auth }
                },
                JSON.stringify({
                    title: email,
                    body: message,
                    url: `/chats/${chatID}`
                })
            )
        ) : [];

    const slackPromises = isSlackEnvSet
        ? slackRes.rows.map(slack =>
            fetch(slack.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: "New message",
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `*From:* ${email}\n*Message:* ${message}`
                            }
                        },
                        {
                            type: "actions",
                            elements: [
                                {
                                    type: "button",
                                    text: { type: "plain_text", text: "Open Chat" },
                                    url: `${process.env.DASHBOARD_URL}/chats/${chatID}`
                                }
                            ]
                        }
                    ]
                })
            })
        ) : [];

    const discordPromises = discordRes.rows.map(discord =>
        fetch(discord.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [
                    {
                        description: `**From:** ${email}\n**Message:** ${message}\n\n[Open Chat](${process.env.DASHBOARD_URL}/chats/${chatID})`,
                        color: 10761712
                    }
                ]
            })
        })
    );

    const telegramPromises = isTelegramEnvSet
        ? telegramRes.rows.map(tg =>
            fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: tg.chat_id,
                    parse_mode: "Markdown",
                    text:
                        `*From:* ${email}\n` +
                        `*Message:* ${message}\n\n` +
                        `*Open Chat:* ${process.env.DASHBOARD_URL}/chats/${chatID}`
                })
            })
        ) : [];

    await Promise.allSettled([
        ...pushPromises,
        ...slackPromises,
        ...discordPromises,
        ...telegramPromises
    ]);
}

module.exports = sendNotification;