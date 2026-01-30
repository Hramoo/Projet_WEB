const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../auth/authMiddleware");
const admin = require("./admin_controller");

router.get("/users", requireAuth, requireAdmin, admin.listUsers);
router.put("/users/:id", requireAuth, requireAdmin, admin.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, admin.deleteUser);

module.exports = router;
