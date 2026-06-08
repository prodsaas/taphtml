const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");
const { FIELD_LABELS, COLOR_REGEX } = require("../data/widget");

exports.uploadLogo = async (req, res) => {
    try {
        const widgetID = req.admin.widget_id;
        const logo = req.file;

        if (!logo) {
            return res.status(400).json({ message: "Logo is required" });
        }

        const { rows } = await pool.query("SELECT logo_url FROM widgets WHERE id = $1", [widgetID]);

        if (rows.length > 0 && rows[0].logo_url) {
            let oldLogoUrl = rows[0].logo_url;
            oldLogoUrl = "/uploads/" + oldLogoUrl.split("/uploads/")[1];

            if (oldLogoUrl.startsWith("/uploads/")) {
                const oldPath = path.join(__dirname, "../../public", oldLogoUrl);

                fs.access(oldPath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(oldPath, (unlinkErr) => {
                            if (unlinkErr) console.error("Failed deleting old logo:", unlinkErr);
                        });
                    }
                });
            }
        }

        const logoUrl = `/uploads/${logo.filename}`;

        const { rows: widgets } = await pool.query(
            "UPDATE widgets SET logo_url = $2 WHERE id = $1 RETURNING *",
            [widgetID, logoUrl]
        );

        const widget = widgets[0];

        const io = req.app.get("io");
        io.to(`visitor-${widgetID}`).emit("widget:update", widget);

        res.status(200).json({
            message: "Logo uploaded",
            logo_url: logoUrl
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.deleteLogo = async (req, res) => {
    try {
        const widgetID = req.admin.widget_id;
        let { logo_url } = req.body ?? {};

        if (!logo_url) {
            return res.status(400).json({ message: "Logo url is required" });
        }
        else if (!logo_url.startsWith("/uploads/")) {
            return res.status(400).json({ message: "Invalid logo url" });
        }

        const { rows } = await pool.query(
            "UPDATE widgets SET logo_url = NULL WHERE id = $1 RETURNING *",
            [widgetID]
        );

        const widget = rows[0];

        const io = req.app.get("io");
        io.to(`visitor-${widgetID}`).emit("widget:update", widget);

        logo_url = "/uploads/" + logo_url.split("/uploads/")[1];
        const oldPath = path.join(__dirname, "../../public", logo_url);

        fs.access(oldPath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(200).json({ message: "Logo deleted" });
            }
            fs.unlink(oldPath, (unlinkErr) => {
                if (unlinkErr) {
                    return res.status(200).json({ message: "Logo deleted" });
                }
                return res.status(200).json({ message: "Logo deleted", widget });
            });
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.customizeWidget = async (req, res) => {
    try {
        const widgetID = req.admin.widget_id;
        const body = req.body ?? {};

        for (const [key, value] of Object.entries(body)) {
            if (value === undefined || value === null) continue;

            const stringValue = String(value);
            const label = FIELD_LABELS[key] || key;

            if (key.endsWith("_title") || key.endsWith("_text")) {
                if (stringValue.trim().length > 50) {
                    return res.status(400).json({ message: `${label} cannot exceed 50 characters.` });
                }
            }

            if (key.endsWith("_bg") || key.endsWith("_color") || key.endsWith("_border") || key.endsWith("_shadow")) {
                if (!COLOR_REGEX.test(stringValue)) {
                    return res.status(400).json({ message: `Invalid ${label}. Must be a valid 6 or 8-digit color.` });
                }
            }
        }

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
        } = body;

        const { rows } = await pool.query(
            `UPDATE widgets SET
                logo_url = COALESCE($2, logo_url),
                widget_bg = COALESCE($3, widget_bg),
                widget_border = COALESCE($4, widget_border),
                title_color = COALESCE($5, title_color),
                hover_title = COALESCE($6, hover_title),
                open_title = COALESCE($7, open_title),
                status_color = COALESCE($8, status_color),
                online_text = COALESCE($9, online_text),
                offline_text = COALESCE($10, offline_text),
                arrow_color = COALESCE($11, arrow_color),
                chat_bg = COALESCE($12, chat_bg),
                date_color = COALESCE($13, date_color),
                visitor_bg = COALESCE($14, visitor_bg),
                visitor_color = COALESCE($15, visitor_color),
                visitor_shadow = COALESCE($16, visitor_shadow),
                admin_bg = COALESCE($17, admin_bg),
                admin_color = COALESCE($18, admin_color),
                admin_shadow = COALESCE($19, admin_shadow),
                time_color = COALESCE($20, time_color),
                input_bg = COALESCE($21, input_bg),
                input_color = COALESCE($22, input_color),
                send_bg = COALESCE($23, send_bg),
                send_color = COALESCE($24, send_color),
                send_border = COALESCE($25, send_border),
                send_shadow = COALESCE($26, send_shadow)
            WHERE id = $1 RETURNING *`,
            [
                widgetID,
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
            ]
        );

        const widget = rows[0];

        const io = req.app.get("io");
        io.to(`visitor-${widgetID}`).emit("widget:update", widget);

        res.status(200).json({
            message: "Widget updated",
            widget
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};