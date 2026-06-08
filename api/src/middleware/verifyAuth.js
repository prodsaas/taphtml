const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { client } = require("../config/redis");
const { clearTokens } = require("../utils/cookie");

const verifyAuth = async (req, res, next) => {
    try {
        const { accessToken, refreshToken } = req.cookies ?? {};

        if (!refreshToken) {
            return res.status(400).json({ message: "Missing refresh token" });
        }
        else if (!accessToken) {
            return res.status(401).json({ message: "Missing access token" });
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

        const isBlacklisted = await client.get(`blacklist:${accessToken}`);
        if (isBlacklisted) {
            clearTokens(res);
            return res.status(400).json({ message: "Session revoked" });
        }

        const { rows } = await pool.query(
            "SELECT id, name, email, role, widget_id, is_active, token_version FROM admins WHERE id = $1",
            [decoded.id]
        );
        const admin = rows[0];

        if (!admin || !admin.is_active || decoded.version !== admin.token_version) {
            clearTokens(res);
            return res.status(400).json({ message: "Unauthorized account" });
        }

        req.admin = admin;
        next();
    }
    catch (error) {
        clearTokens(res);
        res.status(400).json({ message: "Session expired or invalid" });
    }
};

module.exports = verifyAuth;