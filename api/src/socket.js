const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { pool } = require("./config/db");
const sendNotification = require("./utils/notification");
const TIMEZONES = require("./data/timezones");

module.exports = async function socket(server) {
    try {
        const io = new Server(server, {
            cors: { origin: true, credentials: true }
        });

        io.engine.use(cookieParser());

        io.use(async (socket, next) => {
            try {
                const { role } = socket.handshake.query;

                if (role === "VISITOR") {
                    const { widgetID, visitorID, timezone } = socket.handshake.query;

                    if (!widgetID || !isValidUUID(widgetID)) {
                        return next(new Error("Incorrect widgetID"));
                    }

                    const countries = TIMEZONES[timezone];
                    let country = null;
                    if (Array.isArray(countries) && countries.length > 0) {
                        country = countries[0];
                    }

                    const { rows, rowCount } = await pool.query(
                        "SELECT * FROM widgets WHERE id = $1 LIMIT 1",
                        [widgetID]
                    );

                    if (!rowCount) {
                        return next(new Error("Incorrect widgetID"));
                    }

                    socket.role = role;
                    socket.widget = rows[0];
                    socket.visitor = { id: visitorID || null, email: null, country };
                    return next();
                }
                else if (role === "ADMIN") {
                    const accessToken = socket.request.cookies?.accessToken;
                    if (!accessToken) {
                        return next(new Error("Missing access token"));
                    }

                    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

                    const adminID = decoded.id;

                    if (!isValidUUID(adminID)) {
                        return next(new Error("Unauthorized"));
                    }

                    const { rows, rowCount } = await pool.query(
                        `SELECT 
                            a.name, 
                            a.is_active, 
                            to_jsonb(w.*) AS widget_data
                        FROM admins a
                        INNER JOIN widgets w ON a.widget_id = w.id
                        WHERE a.id = $1 LIMIT 1`,
                        [adminID]
                    );

                    const admin = rows[0];

                    if (!rowCount || !admin.is_active) {
                        return next(new Error("Unauthorized"));
                    }

                    socket.role = role;
                    socket.widget = admin.widget_data;
                    socket.admin = { id: adminID, name: admin.name };
                    return next();
                }
                else {
                    return next(new Error("Invalid role"));
                }
            }
            catch {
                return next(new Error("Authentication failed"));
            }
        });

        io.on("connection", (socket) => {
            const role = socket.role;
            const widgetID = socket.widget.id;

            if (role === "VISITOR") {
                socket.join(`visitor-${widgetID}`);

                const adminRoom = io.sockets.adapter.rooms.get(`admin-${widgetID}`);
                if (adminRoom?.size > 0) {
                    socket.emit("admin:online");
                }

                handleVisitorSocket(io, socket);
            }
            else if (role === "ADMIN") {
                socket.join(`admin-${widgetID}`);

                io.to(`visitor-${widgetID}`).emit("admin:online");

                const visitorRoom = io.sockets.adapter.rooms.get(`visitor-${widgetID}`);
                if (visitorRoom) {
                    const processed = new Set();
                    for (const socketId of visitorRoom) {
                        const vSocket = io.of("/").sockets.get(socketId);
                        const vID = vSocket?.visitor?.id;
                        if (vID && !processed.has(vID)) {
                            socket.emit("visitor:online", vID);
                            processed.add(vID);
                        }
                    }
                }

                handleAdminSocket(io, socket);
            }

            socket.on("disconnect", () => {
                if (role === "VISITOR") {
                    const visitorID = socket.visitor?.id;
                    if (!visitorID) return;

                    const room = io.sockets.adapter.rooms.get(`visitor-${widgetID}`);
                    let stillConnected = false;

                    if (room) {
                        for (const socketId of room) {
                            const s = io.of("/").sockets.get(socketId);
                            if (s && s.visitor?.id === visitorID) {
                                stillConnected = true;
                                break;
                            }
                        }
                    }

                    if (!stillConnected) {
                        io.to(`admin-${widgetID}`).emit("visitor:offline", visitorID);
                    }
                }
                else if (role === "ADMIN") {
                    const adminRoom = io.sockets.adapter.rooms.get(`admin-${widgetID}`);

                    if (!adminRoom || adminRoom.size === 0) {
                        io.to(`visitor-${widgetID}`).emit("admin:offline");
                    }

                    if (socket.activeChatID) {
                        socket.leave(`chat-${socket.activeChatID}`);
                    }
                }
            });
        });

        console.log("Socket running");
        return io;
    }
    catch (error) {
        throw new Error(`Socket Error: ${error.message}`);
    }
};

async function handleVisitorSocket(io, socket) {
    const { widget } = socket;
    const widgetID = widget.id;

    socket.on("visitor:init", async () => {
        try {
            if (!socket.visitor.id || !isValidUUID(socket.visitor.id)) {
                socket.visitor.id = null;
                return socket.emit("visitor:init:response", {
                    visitorID: null,
                    widget,
                    chatID: null,
                    email: false,
                    messages: []
                });
            }

            const [visitorRes, chatRes] = await Promise.all([
                pool.query("SELECT id, email FROM visitors WHERE id = $1 LIMIT 1", [socket.visitor.id]),
                pool.query("SELECT id FROM chats WHERE visitor_id = $1 LIMIT 1", [socket.visitor.id])
            ]);

            const visitor = visitorRes.rows[0];
            const chat = chatRes.rows[0];

            if (!visitor) {
                socket.visitor.id = null;

                return socket.emit("visitor:init:response", {
                    visitorID: null,
                    widget,
                    chatID: null,
                    email: false,
                    messages: []
                });
            }

            socket.visitor.email = visitor?.email;

            const chatID = chat?.id;

            const messages = chatID ? (await pool.query(
                "SELECT sender_type, message, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
                [chatID]
            )).rows : [];

            io.to(`admin-${widgetID}`).emit("visitor:online", socket.visitor.id);

            socket.emit("visitor:init:response", {
                visitorID: visitor.id,
                widget,
                chatID: chatID ?? null,
                email: !!visitor.email,
                messages
            });
        }
        catch (err) { console.error(err) }
    });

    socket.on("visitor:email", async ({ email }) => {
        try {
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

            const result = await pool.query(`
                WITH visitor_insert AS (
                    INSERT INTO visitors (widget_id, email, country)
                    VALUES ($1, $2, $3)
                    RETURNING id
                ),
                chat_insert AS (
                    INSERT INTO chats (widget_id, visitor_id)
                    SELECT $1, id FROM visitor_insert
                    RETURNING id
                )
                SELECT 
                    (SELECT id FROM visitor_insert) AS visitor_id,
                    (SELECT id FROM chat_insert) AS chat_id`,
                [widgetID, email, socket.visitor.country]
            );

            const visitorID = result.rows[0].visitor_id;
            const chatID = result.rows[0].chat_id;

            socket.visitor.id = visitorID;
            socket.visitor.email = email;

            io.to(`admin-${widgetID}`).emit("visitor:online", socket.visitor.id);

            socket.emit("visitor:email:response", {
                visitorID: socket.visitor.id,
                chatID
            });

            const chatData = {
                chat_id: chatID,
                visitor_id: socket.visitor.id,
                email: socket.visitor.email,
                country: socket.visitor.country,
                sender_type: "VISITOR",
                message: "New Chat Request",
                created_at: new Date().toISOString()
            };

            io.to(`admin-${widgetID}`).emit("admin:message:response", chatData);

            await sendNotification(widgetID, {
                email: socket.visitor.email,
                message: chatData.message,
                chatID
            }).catch(console.error);
        }
        catch (err) { console.error(err) }
    });

    socket.on("visitor:message:send", async ({ chatID, message }) => {
        try {
            if (!socket.visitor.id || !socket.visitor.email || !chatID || !message) return;

            if (!isValidUUID(chatID)) return;

            const room = io.sockets.adapter.rooms.get(`chat-${chatID}`);
            const isActiveChat = room && room.size > 0;

            const { rows: messages } = await pool.query(
                `INSERT INTO messages (chat_id, sender_type, message, is_read)
                VALUES ($1, 'VISITOR', $2, $3)
                RETURNING sender_type, message, created_at, is_read`,
                [chatID, message, !!isActiveChat]
            );

            socket.to(`visitor-${widgetID}`).emit("visitor:message", messages[0]);

            const chatData = {
                chat_id: chatID,
                sender_type: messages[0].sender_type,
                message: messages[0].message,
                is_read: messages[0].is_read,
                created_at: messages[0].created_at
            };

            io.to(`admin-${widgetID}`).emit("admin:message:response", chatData);

            if (!isActiveChat) {
                await sendNotification(widgetID, {
                    email: socket.visitor.email,
                    message: chatData.message,
                    chatID
                }).catch(console.error);
            }
        }
        catch (err) { console.error(err) }
    });
}

async function handleAdminSocket(io, socket) {
    const { widget, admin } = socket;
    const widgetID = widget.id;

    socket.on("admin:chats", async () => {
        try {
            const { rows: chats } = await pool.query(
                `SELECT 
                    c.id AS chat_id,
                    c.visitor_id,
                    v.email,
                    v.country,
                    m.message,
                    COALESCE(m.created_at, c.created_at) AS created_at,
                    (
                        SELECT COUNT(*)::int
                        FROM messages
                        WHERE chat_id = c.id
                        AND sender_type = 'VISITOR'
                        AND is_read = false
                    ) AS unread
                FROM chats c
                LEFT JOIN visitors v ON v.id = c.visitor_id
                LEFT JOIN LATERAL (
                    SELECT message, created_at
                    FROM messages
                    WHERE chat_id = c.id
                    ORDER BY created_at DESC
                    LIMIT 1
                ) m ON true
                WHERE c.widget_id = $1
                ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
                [widgetID]
            );

            socket.emit("admin:chats:response", chats);
        }
        catch (err) { console.error(err) }
    });

    socket.on("admin:chat", async (chatID) => {
        try {
            if (!chatID) return;

            if (!isValidUUID(chatID)) {
                return socket.emit("admin:chat:response", {
                    chat: false,
                    messages: []
                });
            }

            const { rowCount } = await pool.query(
                "SELECT 1 FROM chats WHERE id = $1 AND widget_id = $2 LIMIT 1",
                [chatID, widgetID]
            );

            if (!rowCount) {
                return socket.emit("admin:chat:response", {
                    chat: false,
                    messages: []
                });
            }

            if (socket.activeChatID && socket.activeChatID !== chatID) {
                socket.leave(`chat-${socket.activeChatID}`);
            }
            socket.join(`chat-${chatID}`);
            socket.activeChatID = chatID;

            const [messages] = await Promise.all([
                pool.query(
                    `SELECT
                        m.id,
                        m.sender_type,
                        m.message,
                        m.created_at,
                        a.id AS admin_id,
                        a.name AS admin_name
                    FROM messages m
                    LEFT JOIN admins a ON m.sender_type = 'ADMIN' AND m.admin_id = a.id
                    WHERE m.chat_id = $1
                    ORDER BY m.created_at ASC`,
                    [chatID]
                ),
                pool.query(
                    "UPDATE messages SET is_read = true WHERE chat_id = $1 AND sender_type = 'VISITOR' AND is_read = false",
                    [chatID]
                ),
            ]);

            io.to(`admin-${widgetID}`).emit("admin:chat:read", chatID);

            socket.emit("admin:chat:response", {
                chat: true,
                messages: messages.rows
            });
        }
        catch (err) { console.error(err) }
    });

    socket.on("admin:message", async ({ chatID, message }) => {
        try {
            if (!chatID || !message) return;

            if (!isValidUUID(chatID)) return;

            const { rowCount } = await pool.query(
                "SELECT visitor_id FROM chats WHERE id = $1 AND widget_id = $2 LIMIT 1",
                [chatID, widgetID]
            );

            if (!rowCount) return;

            const { rows: messages } = await pool.query(
                `INSERT INTO messages (chat_id, sender_type, admin_id, message) VALUES ($1, 'ADMIN', $2, $3)
                RETURNING sender_type, message, created_at`,
                [chatID, admin.id, message]
            );

            io.to(`visitor-${widgetID}`).emit("visitor:message", messages[0]);

            const chatData = {
                chat_id: chatID,
                sender_type: messages[0].sender_type,
                admin_id: admin.id,
                admin_name: admin.name,
                message: messages[0].message,
                created_at: messages[0].created_at
            };

            socket.to(`admin-${widgetID}`).emit("admin:message:response", chatData);
        }
        catch (err) { console.error(err) }
    });
}

const isValidUUID = (id) => {
    if (!id || typeof id !== "string") return false;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(id);
};