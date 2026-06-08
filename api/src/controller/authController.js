const { Fido2Lib } = require("fido2-lib");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { client } = require("../config/redis");
const { sendMail, isMailerEnvSet } = require("../utils/mailer");
const { generateTokens, clearTokens } = require("../utils/cookie");
const { bufferToBase64, base64ToBuffer } = require("../utils/passkey");

const f2l = new Fido2Lib({
    timeout: 60000,
    rpId: new URL(process.env.DASHBOARD_URL).hostname,
    rpName: "TapHTML",
    challengeSize: 32,
    cryptoParams: [-7, -257]
});

exports.fetchSession = async (req, res) => {
    try {
        const { id, widget_id, name, email, role } = req.admin;

        const { rows } = await pool.query("SELECT * FROM widgets WHERE id = $1 LIMIT 1", [widget_id]);

        res.status(200).json({
            admin: { id, name, email, role },
            widget: rows[0]
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies ?? {};
        if (!refreshToken) {
            return res.status(404).json({ message: "Missing refresh token" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const adminID = decoded.id;

        const [storedAdminID, { rows }] = await Promise.all([
            client.get(`refresh:${refreshToken}`),
            pool.query("SELECT token_version FROM admins WHERE id = $1", [adminID])
        ]);

        const admin = rows[0];

        if (!storedAdminID || !admin || decoded.version !== admin.token_version) {
            const tokens = await client.sMembers(`sessions:${adminID}`);
            if (tokens.length > 0) {
                const keysToDelete = tokens.map(token => `refresh:${token}`);
                await client.del([...keysToDelete, `sessions:${adminID}`]);
            }
            clearTokens(res);
            return res.status(403).json({ message: "Session revoked" });
        }

        await client.del(`refresh:${refreshToken}`);
        await client.sRem(`sessions:${adminID}`, refreshToken);
        await generateTokens(res, adminID, admin.token_version);

        res.status(200).json({ message: "Tokens rotated" });
    }
    catch (error) {
        clearTokens(res);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.googleAuth = async (req, res) => {
    const email = req.query.email || "";
    const from = req.query.from || "web";

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_AUTH_REDIRECT_URL,
        response_type: "code",
        scope: "openid email profile",
        state: from
    });

    if (email) params.set("login_hint", email);

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

exports.googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.redirect(`${process.env.DASHBOARD_URL}/login`);
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_AUTH_REDIRECT_URL,
                grant_type: "authorization_code",
            }),
        });
        if (!tokenResponse.ok) {
            throw new Error("Failed to fetch Google OAuth token");
        }

        const { access_token } = await tokenResponse.json();

        const accountResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        if (!accountResponse.ok) {
            throw new Error("Failed to fetch Google account info");
        }

        const { name, email } = await accountResponse.json();

        const { rows } = await pool.query(`
            INSERT INTO admins (name, email, is_active) VALUES ($1, $2, true)
            ON CONFLICT (email) DO UPDATE SET
                is_active = true,
                name = CASE 
                    WHEN admins.name IS NULL OR admins.name = '' THEN EXCLUDED.name 
                    ELSE admins.name 
                END
            RETURNING *, (xmax = 0) AS new_user`,
            [name, email]
        );
        const admin = rows[0];

        await generateTokens(res, admin.id, admin.token_version);

        if (state === "extension") return res.send("<script>window.close()</script>");
        return res.redirect(`${process.env.DASHBOARD_URL}${admin.new_user ? "?page=/install" : ""}`);
    }
    catch (error) {
        return res.redirect(`${process.env.DASHBOARD_URL}/login`);
    }
};

exports.passkeyRegisterOptions = async (req, res) => {
    try {
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

        let adminResult = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
        if (adminResult.rows.length === 0) {
            adminResult = await pool.query("INSERT INTO admins (name, email) VALUES ($1, $2) RETURNING *", [name, email]);
        }

        const admin = adminResult.rows[0];

        const existingAuths = await pool.query("SELECT credential_id FROM passkey_authenticators WHERE admin_id = $1", [admin.id]);

        const options = await f2l.attestationOptions();
        options.attestation = "none";
        options.authenticatorSelection = {
            userVerification: "required",
            residentKey: "required"
        };

        options.user.id = bufferToBase64(Buffer.from(admin.id.toString()));
        options.user.name = email;
        options.user.displayName = email;
        options.challenge = bufferToBase64(options.challenge);
        options.excludeCredentials = existingAuths.rows.map(auth => ({ id: auth.credential_id, type: "public-key" }));

        await pool.query("UPDATE admins SET current_challenge = $1 WHERE id = $2", [options.challenge, admin.id]);

        res.status(201).json(options);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.passkeyRegisterVerify = async (req, res) => {
    const { name, email, credential } = req.body ?? {};

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
        const adminRes = await pool.query(`
            INSERT INTO admins (name, email) VALUES ($1, $2)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
            [name, email]
        );

        if (adminRes.rows.length === 0) {
            return res.status(404).json({ message: "Account not found." });
        }
        const admin = adminRes.rows[0];

        const regResult = await f2l.attestationResult({
            id: credential.id,
            rawId: base64ToBuffer(credential.rawId),
            response: {
                clientDataJSON: base64ToBuffer(credential.response.clientDataJSON),
                attestationObject: base64ToBuffer(credential.response.attestationObject)
            }
        }, {
            challenge: admin.current_challenge,
            origin: process.env.DASHBOARD_URL,
            factor: "either"
        });

        await pool.query(
            "INSERT INTO passkey_authenticators (admin_id, credential_id, public_key, counter, transports) VALUES ($1, $2, $3, $4, $5)",
            [
                admin.id,
                bufferToBase64(regResult.authnrData.get("credId")),
                regResult.authnrData.get("credentialPublicKeyPem"),
                0,
                JSON.stringify(credential.response.transports)
            ]
        );
        await pool.query("UPDATE admins SET current_challenge = NULL, is_active=true WHERE id = $1", [admin.id]);

        await generateTokens(res, admin.id, admin.token_version);

        res.status(200).json({ message: "Device registered" });
    }
    catch (error) {
        if (email) {
            await pool.query("UPDATE admins SET current_challenge = NULL, is_active=false WHERE email = $1", [email]);
        }
        res.status(500).json({ message: error.message });
    }
};

exports.passkeyLoginOptions = async (req, res) => {
    try {
        const options = await f2l.assertionOptions();
        options.userVerification = "required";
        const challengeBase64 = bufferToBase64(options.challenge);

        await pool.query("DELETE FROM passkey_challenges WHERE created_at < NOW() - INTERVAL '5 minutes'");
        await pool.query("INSERT INTO passkey_challenges (challenge) VALUES ($1)", [challengeBase64]);

        options.challenge = challengeBase64;
        options.allowCredentials = [];

        res.status(200).json(options);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.passkeyLoginVerify = async (req, res) => {
    try {
        const { credential } = req.body;

        const challengeRes = await pool.query("SELECT * FROM passkey_challenges WHERE challenge = $1", [credential.challenge]);
        if (challengeRes.rows.length === 0) {
            return res.status(403).json({ message: "Invalid or expired session." });
        }
        await pool.query("DELETE FROM passkey_challenges WHERE id = $1", [challengeRes.rows[0].id]);

        if (!credential.response.userHandle) {
            return res.status(400).json({ message: "Authenticator did not provide user handle." });
        }

        const adminId = Buffer.from(credential.response.userHandle, "base64").toString();
        const adminRes = await pool.query("SELECT * FROM admins WHERE id = $1", [adminId]);

        if (adminRes.rows.length === 0) {
            return res.status(404).json({ message: "Account not found" });
        }
        const admin = adminRes.rows[0];

        if (!admin.is_active) {
            return res.status(400).json({ message: "Account not created yet! Signup with Passkey to proceed." });
        }

        const authRes = await pool.query("SELECT * FROM passkey_authenticators WHERE credential_id = $1 AND admin_id = $2", [credential.rawId, admin.id]);
        if (authRes.rows.length === 0) {
            return res.status(404).json({ message: "Passkey not recognized for this account." });
        }
        const dbAuth = authRes.rows[0];

        const loginResult = await f2l.assertionResult({
            id: credential.id,
            rawId: base64ToBuffer(credential.rawId),
            response: {
                clientDataJSON: base64ToBuffer(credential.response.clientDataJSON),
                authenticatorData: base64ToBuffer(credential.response.authenticatorData),
                signature: base64ToBuffer(credential.response.signature),
                userHandle: base64ToBuffer(credential.response.userHandle)
            }
        }, {
            challenge: credential.challenge,
            origin: process.env.DASHBOARD_URL,
            factor: "either",
            publicKey: dbAuth.public_key,
            prevCounter: dbAuth.counter,
            userHandle: base64ToBuffer(bufferToBase64(Buffer.from(admin.id.toString())))
        });

        await pool.query("UPDATE passkey_authenticators SET counter = $1 WHERE id = $2", [loginResult.authnrData.get("counter"), dbAuth.id]);
        await pool.query("UPDATE admins SET current_challenge = NULL WHERE id = $1", [admin.id]);

        await generateTokens(res, admin.id, admin.token_version);

        res.status(200).json({ message: "Passkey authenticated" });
    }
    catch (error) {
        res.status(500).json({ message: "Verification failed: " + error.message });
    }
};

exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email) {
        return res.status(400).json({ email: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ email: "Please enter a valid email address" });
    }
    else if (!password) {
        return res.status(400).json({ password: "Password is required" });
    }
    else if (password.length < 6) {
        return res.status(400).json({ password: "Password must be at least 6 characters" });
    }
    else if (password.length > 50) {
        return res.status(400).json({ password: "Password must be at most 50 characters" });
    }

    try {
        const { rows, rowCount } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);

        if (!rowCount) {
            return res.status(400).json({ submit: "Incorrect email or password" });
        }

        const admin = rows[0];

        if (!admin.is_active) {
            return res.status(400).json({ submit: "Account not created yet! Click on Signup" });
        }
        else if (!admin.password) {
            return res.status(400).json({ submit: "You have not created your password yet. Click on Reset Password." });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ submit: "Incorrect email or password" });
        }

        await generateTokens(res, admin.id, admin.token_version);

        res.status(200).json({ message: "Logged in" });
    }
    catch (error) {
        res.status(500).json({ submit: "Internal Server Error" });
    }
};

exports.registerAdmin = async (req, res) => {
    const { name, email, password } = req.body ?? {};

    if (!isMailerEnvSet) {
        console.error("Mailer .env keys not found");
        return res.status(400).json({ submit: "Server Error" });
    }
    else if (!name) {
        return res.status(400).json({ name: "Name is required" });
    }
    else if (name.length > 100) {
        return res.status(400).json({ name: "Name must be at most 100 characters" });
    }
    else if (!email) {
        return res.status(400).json({ email: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ email: "Please enter a valid email address" });
    }
    else if (!password) {
        return res.status(400).json({ password: "Password is required" });
    }
    else if (password.length < 6) {
        return res.status(400).json({ password: "Password must be at least 6 characters" });
    }
    else if (password.length > 50) {
        return res.status(400).json({ password: "Password must be at most 50 characters" });
    }

    try {
        const { rows, rowCount } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
        const admin = rows[0];

        if (rowCount && admin.is_active) {
            return res.status(400).json({ submit: "Account already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
            [name, email, hashedPassword]
        );

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await client.setEx(`verify:${email}`, 300, otp);

        await sendMail({
            from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_ADDRESS}>`,
            to: email,
            subject: `Your OTP is ${otp}`,
            html: `<p>Here&apos;s your OTP for your account registration: <b>${otp}</b></p>`
        });

        res.status(201).json({ message: "Check your email for OTP to verify your account" });
    }
    catch (error) {
        res.status(500).json({ submit: "Internal Server Error" });
    }
};

exports.verifyAdmin = async (req, res) => {
    const { name, email, password, otp } = req.body ?? {};

    if (!name) {
        return res.status(400).json({ name: "Name is required" });
    }
    else if (name.length > 100) {
        return res.status(400).json({ name: "Name must be at most 100 characters" });
    }
    else if (!email) {
        return res.status(400).json({ email: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ email: "Please enter a valid email address" });
    }
    else if (!password) {
        return res.status(400).json({ password: "Password is required" });
    }
    else if (password.length < 6) {
        return res.status(400).json({ password: "Password must be at least 6 characters" });
    }
    else if (password.length > 50) {
        return res.status(400).json({ password: "Password must be at most 50 characters" });
    }
    else if (!otp) {
        return res.status(400).json({ otp: "OTP is required" });
    }
    else if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ otp: "OTP must be a 6-digit number" });
    }

    try {
        const storedOtp = await client.get(`verify:${email}`);
        if (!storedOtp) {
            return res.status(400).json({ submit: "OTP expired or invalid" });
        }
        else if (storedOtp !== otp) {
            return res.status(400).json({ otp: "Incorrect OTP" });
        }
        await client.del(`verify:${email}`);

        const hashedPassword = await bcrypt.hash(password, 10);

        const { rows, rowCount } = await pool.query(`
            INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) 
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password RETURNING *`,
            [name, email, hashedPassword]
        );

        if (!rowCount) {
            return res.status(400).json({ submit: "Account not found" });
        }

        const admin = rows[0];

        if (admin.is_active) {
            return res.status(400).json({ submit: "Account already exists" });
        }

        await pool.query(
            "UPDATE admins SET is_active = true WHERE id = $1",
            [admin.id]
        );

        await generateTokens(res, admin.id, admin.token_version);

        res.status(200).json({ message: "Account verified" });
    }
    catch (error) {
        res.status(500).json({ submit: "Internal Server Error" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body ?? {};

    if (!isMailerEnvSet) {
        console.error("Mailer .env keys not found");
        return res.status(400).json({ submit: "Server Error" });
    }
    else if (!email) {
        return res.status(400).json({ email: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ email: "Please enter a valid email address" });
    }

    try {
        const { rowCount } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);

        if (!rowCount) {
            return res.status(400).json({ submit: "Account not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await client.setEx(`forgot:${email}`, 300, otp);

        await sendMail({
            from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_ADDRESS}>`,
            to: email,
            subject: `Your OTP is ${otp}`,
            html: `<p>Here&apos;s your OTP for your reset password: <b>${otp}</b></p>`
        });

        res.status(200).json({ message: "Check your email for OTP to reset your password" });
    }
    catch (error) {
        res.status(500).json({ submit: "Internal Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, password } = req.body ?? {};

    if (!email) {
        return res.status(400).json({ email: "Email is required" });
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({ email: "Please enter a valid email address" });
    }
    else if (!otp) {
        return res.status(400).json({ otp: "OTP is required" });
    }
    else if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ otp: "OTP must be a 6-digit number" });
    }
    else if (!password) {
        return res.status(400).json({ password: "Password is required" });
    }
    else if (password.length < 6) {
        return res.status(400).json({ password: "Password must be at least 6 characters" });
    }
    else if (password.length > 50) {
        return res.status(400).json({ password: "Password must be at most 50 characters" });
    }

    try {
        const storedOtp = await client.get(`forgot:${email}`);

        if (!storedOtp) {
            return res.status(400).json({ submit: "OTP expired or invalid" });
        }
        else if (storedOtp !== otp) {
            return res.status(400).json({ otp: "Incorrect OTP" });
        }

        await client.del(`forgot:${email}`);

        const { rows, rowCount } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);

        if (!rowCount) {
            return res.status(400).json({ submit: "Account not found" });
        }

        const admin = rows[0];

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "UPDATE admins SET password = $1, is_active = $2 WHERE id = $3",
            [hashedPassword, true, admin.id]
        );

        await generateTokens(res, admin.id, admin.token_version);

        res.status(200).json({ message: "Password updated" });
    }
    catch (error) {
        res.status(500).json({ submit: "Internal Server Error" });
    }
};

exports.logoutAdmin = async (req, res) => {
    try {
        const { accessToken, refreshToken } = req.cookies ?? {};

        if (accessToken) {
            const decodedAccess = jwt.decode(accessToken);
            if (decodedAccess && decodedAccess.exp) {
                const ttl = decodedAccess.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await client.setEx(`blacklist:${accessToken}`, ttl, "true");
                }
            }
        }

        if (refreshToken) {
            const decodedRefresh = jwt.decode(refreshToken);
            if (decodedRefresh && decodedRefresh.id) {
                await client.del(`refresh:${refreshToken}`);
                await client.sRem(`sessions:${decodedRefresh.id}`, refreshToken);
            }
        }

        clearTokens(res);
        res.status(200).json({ message: "Logged out" });
    }
    catch (error) {
        clearTokens(res);
        res.status(200).json({ message: "Logged out" });
    }
};

exports.logoutAdminAll = async (req, res) => {
    try {
        const adminID = req.admin.id;
        const { accessToken } = req.cookies ?? {};

        await pool.query("UPDATE admins SET token_version = token_version + 1 WHERE id = $1", [adminID]);

        if (accessToken) {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await client.setEx(`blacklist:${accessToken}`, ttl, "true");
                }
            }
        }

        const tokens = await client.sMembers(`sessions:${adminID}`);
        if (tokens.length > 0) {
            const keysToDelete = tokens.map(token => `refresh:${token}`);
            await client.del([...keysToDelete, `sessions:${adminID}`]);
        }

        clearTokens(res);
        res.status(200).json({ message: "Logged out from all devices" });
    }
    catch (error) {
        clearTokens(res);
        res.status(200).json({ message: "Logged out" });
    }
};