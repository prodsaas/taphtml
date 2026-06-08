const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const {
    gmailAuth,
    gmailCallback,
    sendMail
} = require("../controller/chatController");

const router = express.Router();

router.get("/google", verifyAuth, gmailAuth);
router.get("/google/callback", gmailCallback);
router.post("/mail", verifyAuth, sendMail);

module.exports = router;