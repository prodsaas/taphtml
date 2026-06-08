const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { client } = require("../config/redis");
const { isPushEnvSet } = require("../config/webpush");
const { clearTokens } = require("../utils/cookie");

const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URL, TELEGRAM_BOT_TOKEN } = process.env;
const isSlackEnvSet = Boolean(SLACK_CLIENT_ID && SLACK_CLIENT_SECRET && SLACK_REDIRECT_URL);
const isTelegramEnvSet = Boolean(TELEGRAM_BOT_TOKEN);

exports.fetchSettings = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;

        const [gmailRes, pushRes, slackRes, discordRes, telegramRes] = await Promise.all([
            pool.query("SELECT email FROM gmail_tokens WHERE admin_id = $1", [id]),
            pool.query("SELECT id, endpoint, is_active FROM push_notifications WHERE widget_id = $1 AND admin_id = $2", [widget_id, id]),
            pool.query("SELECT id, is_active FROM slack_notifications WHERE widget_id = $1 AND admin_id = $2", [widget_id, id]),
            pool.query("SELECT id, url, is_active FROM discord_notifications WHERE widget_id = $1 AND admin_id = $2", [widget_id, id]),
            pool.query("SELECT id, chat_id, is_active FROM telegram_notifications WHERE widget_id = $1 AND admin_id = $2", [widget_id, id])
        ]);

        res.status(200).json({
            gmail: gmailRes.rows[0] || null,
            notifications: {
                push: pushRes.rows,
                slack: slackRes.rows[0] || null,
                discord: discordRes.rows[0] || null,
                telegram: telegramRes.rows[0] || null
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.editAccount = async (req, res) => {
    const { id } = req.admin;
    const { name, email } = req.body ?? {};

    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    else if (name.length > 100) {
        return res.status(400).json({ message: "Name must be at most 100 characters" });
    }
    else if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }

    try {
        await pool.query("UPDATE admins SET name = $1, email = $2 WHERE id = $3", [name, email, id]);

        req.admin.name = name;
        req.admin.email = email;

        res.status(200).json({ message: "Changes saved" });
    }
    catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "This email is already in use" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.admin;
        const { accessToken } = req.cookies ?? {};

        if (accessToken) {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await client.setEx(`blacklist:${accessToken}`, ttl, "true");
                }
            }
        }

        const tokens = await client.sMembers(`sessions:${id}`);
        if (tokens.length > 0) {
            const keysToDelete = tokens.map(token => `refresh:${token}`);
            await client.del([...keysToDelete, `sessions:${id}`]);
        }

        await pool.query("DELETE FROM admins WHERE id = $1", [id]);

        clearTokens(res);

        res.status(200).json({ message: "Account deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.togglePush = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { subscription, is_active } = req.body ?? {};
        const { endpoint, keys } = subscription ?? {};

        if (!isPushEnvSet) {
            console.error("Vapid .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }
        else if (!widget_id || !endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }

        const { rows } = await pool.query(
            `INSERT INTO push_notifications (admin_id, widget_id, endpoint, p256dh, auth, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (admin_id, endpoint)
            DO UPDATE SET is_active = EXCLUDED.is_active
            RETURNING id, endpoint, is_active`,
            [id, widget_id, endpoint, keys.p256dh, keys.auth, is_active]
        );

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.slackConnect = async (req, res) => {
    const { id, widget_id } = req.admin;

    if (!isSlackEnvSet) {
        console.error("Slack .env keys not found");
        return res.status(400).json({ message: "Server Error" });
    }

    const params = new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        scope: "incoming-webhook",
        redirect_uri: process.env.SLACK_REDIRECT_URL,
        state: `${id}:${widget_id}`
    });

    return res.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
};

exports.slackCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!isSlackEnvSet) {
            console.error("Slack .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }

        const [admin_id, widget_id] = (state || "").split(":");

        const response = await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: process.env.SLACK_REDIRECT_URL
            })
        });
        const data = await response.json();

        if (!data.ok) {
            return res.redirect(`${process.env.DASHBOARD_URL}/settings?slack=error`);
        }

        const webhook = data.incoming_webhook;

        await pool.query(
            `INSERT INTO slack_notifications (admin_id, widget_id, url, channel, channel_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (admin_id, widget_id)
            DO UPDATE SET url = EXCLUDED.url, channel = EXCLUDED.channel, channel_id = EXCLUDED.channel_id`,
            [admin_id, widget_id, webhook.url, webhook.channel, webhook.channel_id]
        );

        res.redirect(`${process.env.DASHBOARD_URL}/settings`);
    }
    catch (error) {
        res.redirect(`${process.env.DASHBOARD_URL}/settings`);
    }
};

exports.toggleSlack = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { is_active } = req.body;

        if (!isSlackEnvSet) {
            console.error("Slack .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }

        const { rows, rowCount } = await pool.query(
            "UPDATE slack_notifications SET is_active = $1 WHERE admin_id = $2 AND widget_id = $3 RETURNING id, is_active",
            [is_active, id, widget_id]
        );

        if (!rowCount) {
            return res.status(400).json({ message: "Slack not connected" });
        }

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.saveDiscordWebhookURL = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { url } = req.body ?? {};

        if (!url) {
            await pool.query(
                "DELETE FROM discord_notifications WHERE admin_id = $1 AND widget_id = $2",
                [id, widget_id]
            );

            return res.status(200).json({
                message: "Changes saved",
                notification: null
            });
        }

        if (!url.startsWith("https://discord.com/api/webhooks/")) {
            return res.status(400).json({ message: "Invalid webhook URL" });
        }

        const { rows } = await pool.query(
            `INSERT INTO discord_notifications (admin_id, widget_id, url) VALUES ($1, $2, $3)
            ON CONFLICT (admin_id, widget_id) DO UPDATE SET url = EXCLUDED.url
            RETURNING id, url, is_active`,
            [id, widget_id, url]
        );

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.toggleDiscord = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { is_active } = req.body ?? {};

        const { rows, rowCount } = await pool.query(
            "UPDATE discord_notifications SET is_active = $1 WHERE admin_id = $2 AND widget_id = $3 RETURNING id, url, is_active",
            [is_active, id, widget_id]
        );

        if (!rowCount) {
            return res.status(400).json({ message: "Discord not connected" });
        }

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.saveTelegramChatID = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { chat_id } = req.body ?? {};

        if (!isTelegramEnvSet) {
            console.error("Telegram .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }

        if (!chat_id) {
            await pool.query(
                "DELETE FROM telegram_notifications WHERE admin_id = $1 AND widget_id = $2",
                [id, widget_id]
            );

            return res.status(200).json({
                message: "Changes saved",
                notification: null
            });
        }

        if (isNaN(chat_id)) {
            return res.status(400).json({ message: "Invalid chat id" });
        }

        const { rows } = await pool.query(
            `INSERT INTO telegram_notifications (admin_id, widget_id, chat_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (admin_id, widget_id)
            DO UPDATE SET chat_id = EXCLUDED.chat_id
            RETURNING id, chat_id, is_active`,
            [id, widget_id, chat_id]
        );

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.toggleTelegram = async (req, res) => {
    try {
        const { id, widget_id } = req.admin;
        const { is_active } = req.body ?? {};

        if (!isTelegramEnvSet) {
            console.error("Telegram .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }

        const { rows, rowCount } = await pool.query(
            `UPDATE telegram_notifications SET is_active = $1 WHERE admin_id = $2 AND widget_id = $3
            RETURNING id, chat_id, is_active`,
            [is_active, id, widget_id]
        );

        if (!rowCount) {
            return res.status(400).json({ message: "Telegram not connected" });
        }

        res.status(200).json({
            message: "Changes saved",
            notification: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};