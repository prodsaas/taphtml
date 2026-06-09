const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, cb) => {
        const allowed = [process.env.DASHBOARD_URL, process.env.EXTENSION_URL].filter(Boolean);
        if (
            !origin ||
            allowed.includes(origin) ||
            origin.startsWith("chrome-extension://") ||
            origin.startsWith("moz-extension://")
        ) return cb(null, true);
        cb(new Error("CORS Error"));
    },
    credentials: true
}));
app.use((req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    next();
});
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => res.status(200).send("OK!"));
app.use("/auth", require("./route/authRoute"));
app.use("/chat", require("./route/chatRoute"));
app.use("/dashboard", require("./route/dashboardRoute"));
app.use("/setting", require("./route/settingRoute"));
app.use("/team", require("./route/teamRoute"));
app.use("/widget", require("./route/widgetRoute"));
app.all(/.*/, (req, res) => res.status(404).send("Not found!"));

module.exports = app;