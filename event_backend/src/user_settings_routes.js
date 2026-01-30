const express = require("express");
const router = express.Router();
const { requireAuth } = require("../auth/authMiddleware");
const settings = require("./user_settings_controller");

router.get("/me/settings", requireAuth, settings.getMySettings);
router.put("/me/settings", requireAuth, settings.updateMySettings);

module.exports = router;
