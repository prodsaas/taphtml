const { pool } = require("../config/db");
const { client } = require("../config/redis");
const { sendMail, isMailerEnvSet } = require("../utils/mailer");

exports.fetchTeam = async (req, res) => {
    try {
        const admin = req.admin;

        const { rows } = await pool.query(
            "SELECT id, name, email, role, is_active FROM admins WHERE widget_id = $1",
            [admin.widget_id]
        );

        return res.status(200).json(rows);
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.addTeam = async (req, res) => {
    try {
        const admin = req.admin;
        const { members } = req.body ?? {};

        if (!isMailerEnvSet) {
            console.error("Mailer .env keys not found");
            return res.status(400).json({ message: "Server Error" });
        }
        else if (admin.role !== "OWNER") {
            return res.status(403).json({ message: "Only owners can add team members" });
        }

        for (const m of members) {
            if (!m.email) {
                return toast.error("Email is required");
            }
            else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(m.email)) {
                return toast.error("Enter valid email address");
            }
            else if (!m.role) {
                return toast.error("Role is required");
            }
            else if (!["OWNER", "TEAM"].includes(m.role)) {
                return toast.error("Select valid role");
            }

            const { rowCount } = await pool.query("SELECT 1 FROM admins WHERE email = $1", [m.email]);
            if (rowCount) {
                return res.status(400).json({ message: `${m.email} is already in the team` });
            }
        }

        const addedAdmins = [];

        for (const m of members) {
            const newAdmin = (await pool.query(
                "INSERT INTO admins (widget_id, email, role) VALUES ($1, $2, $3) RETURNING id, email, role, is_active",
                [admin.widget_id, m.email, m.role]
            )).rows[0];

            await sendMail({
                from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_ADDRESS}>`,
                to: m.email,
                subject: "Invitation to join team",
                html: `
                    <div>
                        ${admin.name} has invited you to join their team at TapHTML.<br /><br />
                        Click on the <a href="${process.env.DASHBOARD_URL}/signup?email=${m.email}">link</a> to complete your account registration.<br /><br />
                        If the link does not work, copy and paste the following link into your browser address bar:<br />
                        ${process.env.DASHBOARD_URL}/signup?email=${m.email}
                    </div>
                `
            });

            addedAdmins.push(newAdmin);
        }

        res.status(201).json({
            message: "Invitations sent via mail",
            admins: addedAdmins
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.editTeam = async (req, res) => {
    try {
        const admin = req.admin;
        const { id, email, role } = req.body ?? {};

        if (!id) {
            return res.status(400).json({ message: "Admin ID is required" });
        }
        else if (id === admin.id) {
            return res.status(400).json({ message: "Go to Settings to edit your own account" });
        }
        else if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }
        else if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }
        else if (!["OWNER", "TEAM"].includes(role)) {
            return res.status(400).json({ message: "Invalid role selected" });
        }
        else if (admin.role !== "OWNER") {
            return res.status(403).json({ message: "Only owners can edit team members" });
        }

        const { rows } = await pool.query("SELECT id, email, role, widget_id FROM admins WHERE widget_id = $1", [admin.widget_id]);

        if (!rows.find(r => r.id === id)) {
            return res.status(404).json({ message: "Admin not found" });
        }
        else if (rows.some(r => r.id !== id && r.email === email)) {
            return res.status(400).json({ message: "Email already exists" });
        }
        else if (role === "TEAM" && !rows.some(r => r.id !== id && r.role === "OWNER")) {
            return res.status(400).json({ message: "There must be at least one owner in the team" });
        }

        await pool.query("UPDATE admins SET email = $1, role = $2 WHERE id = $3", [email, role, id]);

        res.status(200).json({ message: "Team updated" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const admin = req.admin;
        const { id } = req.body ?? {};

        if (!id) {
            return res.status(400).json({ message: "Admin ID is required" });
        }
        else if (id === admin.id) {
            return res.status(400).json({ message: "Go to Settings to delete your own account" });
        }
        else if (admin.role !== "OWNER") {
            return res.status(403).json({ message: "Only owners can delete team members" });
        }

        const memberTokens = await client.sMembers(`sessions:${id}`);
        if (memberTokens.length > 0) {
            const keysToDelete = memberTokens.map(token => `refresh:${token}`);
            await client.del([...keysToDelete, `sessions:${id}`]);
        }

        const { rowCount } = await pool.query(
            "DELETE FROM admins WHERE id = $1 AND widget_id = $2",
            [id, admin.widget_id]
        );

        if (!rowCount) {
            return res.status(404).json({ message: "Account not found" });
        }

        res.status(200).json({ message: "Team deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};