require("dotenv").config({ quiet: true });
const http = require("http");
const app = require("./app");
const socket = require("./socket");
const { verifyMailer } = require("./utils/mailer");
const { connectRedis } = require("./config/redis");
const { connectDatabase } = require("./config/db");
const pollTelegram = require("./utils/telegram");

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, async () => {
    console.log("Server running");

    try {
        const io = await socket(server);
        app.set("io", io);

        await verifyMailer();
        await connectRedis();
        await connectDatabase();

        pollTelegram();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});