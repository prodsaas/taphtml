const express = require("express");
const verifyAuth = require("../middleware/verifyAuth");
const {
    fetchTeam,
    addTeam,
    editTeam,
    deleteTeam
} = require("../controller/teamController");

const router = express.Router();

router.get("/", verifyAuth, fetchTeam);
router.post("/", verifyAuth, addTeam);
router.patch("/", verifyAuth, editTeam);
router.delete("/", verifyAuth, deleteTeam);

module.exports = router;