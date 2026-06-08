const { pool } = require("../config/db");

async function getAccessToken(id, access_token, refresh_token, expiry_date) {
    if (Date.now() < (Number(expiry_date) - 60000)) {
        return access_token;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refresh_token,
            grant_type: "refresh_token",
        })
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error_description);

    const newExpiry = Date.now() + (data.expires_in * 1000);

    await pool.query(
        "UPDATE gmail_tokens SET access_token = $1, expiry_date = $2 WHERE id = $3",
        [data.access_token, newExpiry, id]
    );

    return data.access_token;
}

exports.gmailAuth = async (req, res) => {
    const adminID = req.admin.id;
    const { chatID } = req.query;

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_GMAIL_REDIRECT_URL,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
        access_type: "offline",
        prompt: "consent",
        state: JSON.stringify({
            adminID,
            chatID: chatID || null
        })
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

exports.gmailCallback = async (req, res) => {
    try {
        let { code, state } = req.query;
        const parsedState = state ? JSON.parse(state) : {};
        const { adminID, chatID } = parsedState;

        if (!code || !adminID) {
            return res.redirect(`${process.env.DASHBOARD_URL}/settings`);
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_GMAIL_REDIRECT_URL,
                grant_type: "authorization_code",
            }),
        });
        const tokens = await tokenResponse.json();

        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const profile = await profileResponse.json();

        const expiryDate = Date.now() + (tokens.expires_in * 1000);

        await pool.query(
            `INSERT INTO gmail_tokens (admin_id, email, access_token, refresh_token, expiry_date)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (admin_id) DO UPDATE SET
                email = EXCLUDED.email,
                access_token = EXCLUDED.access_token,
                refresh_token = COALESCE(EXCLUDED.refresh_token, gmail_tokens.refresh_token),
                expiry_date = EXCLUDED.expiry_date`,
            [adminID, profile.email, tokens.access_token, tokens.refresh_token, expiryDate]
        );

        return res.redirect(`${process.env.DASHBOARD_URL}${chatID ? `/chats/${chatID}` : "/settings"}`);
    }
    catch (error) {
        return res.redirect(`${process.env.DASHBOARD_URL}/settings`);
    }
};

exports.sendMail = async (req, res) => {
    try {
        const io = req.app.get("io");
        const admin = req.admin;
        const { chatID, message } = req.body;

        if (!chatID) {
            return res.status(404).json({ message: "Chat ID is required" });
        }
        else if (!message) {
            return res.status(404).json({ message: "Message is required" });
        }

        const { rows: tokens } = await pool.query("SELECT * FROM gmail_tokens WHERE admin_id = $1", [admin.id]);

        if (!tokens.length) {
            return res.status(404).json({
                isConnected: false,
                message: "Gmail account not linked. Please connect your Gmail."
            });
        }

        const { id, access_token, refresh_token, expiry_date } = tokens[0];

        let accessToken;
        try {
            accessToken = await getAccessToken(id, access_token, refresh_token, expiry_date);
        }
        catch {
            return res.status(400).json({
                isConnected: false,
                message: "Gmail connection has expired or been revoked. Please reconnect."
            });
        }

        const { rows: chats } = await pool.query(`
            SELECT c.widget_id, v.email FROM chats c 
            JOIN visitors v ON c.visitor_id = v.id WHERE c.id = $1 LIMIT 1`,
            [chatID]
        );

        if (!chats.length) return res.status(404).json({ message: "Chat not found" });

        const { widget_id, email } = chats[0];

        const emailContent = [
            `To: ${email}`,
            `Subject: Support Chat`,
            `Content-Type: text/plain; charset="UTF-8"`,
            ``,
            message
        ].join("\r\n");

        const encodedEmail = Buffer.from(emailContent)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw: encodedEmail }),
        });
        const sentData = await gmailResponse.json();

        const { rows: messages } = await pool.query(
            `INSERT INTO messages (chat_id, sender_type, admin_id, message) VALUES ($1, 'ADMIN', $2, $3)
            RETURNING sender_type, message, created_at`,
            [chatID, admin.id, message]
        );

        io.to(`visitor-${widget_id}`).emit("visitor:message", messages[0]);

        const chatData = {
            chat_id: chatID,
            sender_type: messages[0].sender_type,
            admin_id: admin.id,
            admin_name: admin.name,
            message: messages[0].message,
            created_at: messages[0].created_at
        };

        io.to(`admin-${widget_id}`).emit("admin:message:response", chatData);

        res.status(200).json({ message: "Mail sent" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};