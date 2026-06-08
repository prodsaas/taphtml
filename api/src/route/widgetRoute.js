const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const uploadImage = require("../middleware/uploadImage");
const {
    uploadLogo,
    deleteLogo,
    customizeWidget
} = require("../controller/widgetController");

const router = express.Router();

router.post("/logo/upload", verifyAuth, uploadImage, uploadLogo);
router.delete("/logo/delete", verifyAuth, deleteLogo);
router.patch("/customize", verifyAuth, customizeWidget);

module.exports = router;