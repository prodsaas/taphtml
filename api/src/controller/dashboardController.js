const { pool } = require("../config/db");

function validateTimezone(tz) {
    if (!tz) return "UTC";

    const aliases = {
        "Asia/Calcutta": "Asia/Kolkata"
    };

    try {
        const normalized = aliases[tz] || tz;
        Intl.DateTimeFormat(undefined, { timeZone: normalized });
        return normalized;
    }
    catch {
        return "UTC";
    }
};

exports.fetchDashboard = async (req, res) => {
    try {
        const widgetId = req.admin.widget_id;
        const timezone = validateTimezone(req.headers["x-timezone"]);

        const [
            cTotal, cToday, cActive, cWeek, cCountry, cHeatmap
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM chats WHERE widget_id = $1", [widgetId]),
            pool.query(
                `SELECT COUNT(*) FROM chats WHERE widget_id = $1
                AND created_at AT TIME ZONE $2 >= DATE_TRUNC('day', NOW() AT TIME ZONE $2)
                AND created_at AT TIME ZONE $2 < DATE_TRUNC('day', NOW() AT TIME ZONE $2) + INTERVAL '1 day'`,
                [widgetId, timezone]
            ),
            pool.query(
                `SELECT COUNT(DISTINCT m.chat_id) FROM messages m
                INNER JOIN chats c ON m.chat_id = c.id
                WHERE m.created_at > NOW() - INTERVAL '24 hours'
                AND c.widget_id = $1`,
                [widgetId]
            ),
            pool.query(
                `SELECT TO_CHAR(d.day, 'YYYY-MM-DD') AS day, COUNT(c.id) AS count
                FROM generate_series(
                    DATE_TRUNC('day', NOW() AT TIME ZONE $2) - INTERVAL '6 days',
                    DATE_TRUNC('day', NOW() AT TIME ZONE $2),
                    INTERVAL '1 day'
                ) AS d(day)
                LEFT JOIN chats c ON c.widget_id = $1
                    AND DATE_TRUNC('day', c.created_at AT TIME ZONE $2) = d.day
                GROUP BY d.day ORDER BY d.day`,
                [widgetId, timezone]
            ),
            pool.query(
                "SELECT country, COUNT(*) AS total FROM visitors WHERE widget_id = $1 GROUP BY country ORDER BY total DESC",
                [widgetId]
            ),
            pool.query(
                `SELECT h.hour, COALESCE(COUNT(m.id), 0) AS count
                FROM generate_series(0, 23) AS h(hour)
                LEFT JOIN messages m ON EXTRACT(HOUR FROM m.created_at AT TIME ZONE $2) = h.hour
                    AND EXISTS (
                        SELECT 1 FROM chats c 
                        WHERE c.id = m.chat_id 
                        AND c.widget_id = $1
                    )
                GROUP BY h.hour ORDER BY h.hour`,
                [widgetId, timezone]
            ),
        ]);

        res.status(200).json({
            chats: {
                total: cTotal.rows[0].count,
                today: cToday.rows[0].count,
                active: cActive.rows[0].count,
                week: cWeek.rows,
                country: cCountry.rows,
                heatmap: cHeatmap.rows,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};