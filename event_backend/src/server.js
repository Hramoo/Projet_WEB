const express = require("express");
const cors = require("cors");

const eventsRoutes = require("./event/events_routes");
const adminRoutes = require("./admin/admin_routes");

const { signup, login } = require("./auth/authController");
const { requireAuth } = require("./auth/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/signup", signup);
app.post("/api/login", login);

app.get("/api/validate", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.use("/api/events", eventsRoutes);

// ✅ Admin API protégée
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
