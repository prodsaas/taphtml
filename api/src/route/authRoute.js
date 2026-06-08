const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const {
    fetchSession,
    refreshToken,
    googleAuth,
    googleCallback,
    passkeyRegisterOptions,
    passkeyRegisterVerify,
    passkeyLoginOptions,
    passkeyLoginVerify,
    loginAdmin,
    registerAdmin,
    verifyAdmin,
    forgotPassword,
    resetPassword,
    logoutAdmin,
    logoutAdminAll
} = require("../controller/authController");

const router = express.Router();

router.get("/session", verifyAuth, fetchSession);
router.get("/refresh", refreshToken);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/passkey/register/options", passkeyRegisterOptions);
router.post("/passkey/register/verify", passkeyRegisterVerify);
router.post("/passkey/login/options", passkeyLoginOptions);
router.post("/passkey/login/verify", passkeyLoginVerify);
router.post("/login", loginAdmin);
router.post("/register", registerAdmin);
router.post("/verify", verifyAdmin);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.post("/logout", verifyAuth, logoutAdmin);
router.post("/logout/all", verifyAuth, logoutAdminAll);

module.exports = router;