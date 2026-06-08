const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const {
    fetchSettings,
    editAccount,
    deleteAccount,
    togglePush,
    slackConnect,
    slackCallback,
    toggleSlack,
    saveDiscordWebhookURL,
    toggleDiscord,
    saveTelegramChatID,
    toggleTelegram,
} = require("../controller/settingController");

const router = express.Router();

router.get("/", verifyAuth, fetchSettings);
router.put("/account", verifyAuth, editAccount);
router.delete("/account", verifyAuth, deleteAccount);
router.post("/push/toggle", verifyAuth, togglePush);
router.get("/slack/connect", verifyAuth, slackConnect);
router.get("/slack/callback", slackCallback);
router.post("/slack/toggle", verifyAuth, toggleSlack);
router.post("/discord/save", verifyAuth, saveDiscordWebhookURL);
router.post("/discord/toggle", verifyAuth, toggleDiscord);
router.post("/telegram/save", verifyAuth, saveTelegramChatID);
router.post("/telegram/toggle", verifyAuth, toggleTelegram);

module.exports = router;