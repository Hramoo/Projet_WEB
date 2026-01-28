const express = require("express");
const cors = require("cors");

const eventsRoutes = require("./event/events_routes");
const { signup, login } = require("./auth/authController");
const { requireAuth } = require("./auth/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Auth
app.post("/api/signup", signup);
app.post("/api/login", login);

// Optionnel : valider le token
app.get("/api/validate", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Events
app.use("/api/events", eventsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
