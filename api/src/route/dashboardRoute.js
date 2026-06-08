const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const { fetchDashboard } = require("../controller/dashboardController");

const router = express.Router();

router.get("/", verifyAuth, fetchDashboard);

module.exports = router;