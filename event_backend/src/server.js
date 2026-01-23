const express = require("express");
const cors = require("cors");

const { login, signup } = require("./auth/authController");
const { requireAuth } = require("./auth/authMiddleware");

const pool = require("./db"); // PostgreSQL

const app = express();
app.use(express.json());
app.use(cors());

// routes test
app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// auth
app.post("/api/signup", signup);
app.post("/api/login", login);
app.post("/api/validate", requireAuth);

// =======================
// EVENTS
// =======================

// GET events + is_reserved pour le user connecté
app.get("/api/events", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         e.id, e.title, e.event_date, e.capacity, e.places_left, e.owner_id, e.created_at,
         CASE WHEN ue.user_id IS NULL THEN false ELSE true END AS is_reserved
       FROM events e
       LEFT JOIN user_events ue
         ON ue.event_id = e.id AND ue.user_id = $1
       ORDER BY e.event_date ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// CREATE event (owner_id = user connecté, places_left = capacity)
app.post("/api/events", requireAuth, async (req, res) => {
  try {
    const { title, date, capacity } = req.body;

    if (!title || !date || capacity === undefined) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      return res.status(400).json({ error: "capacity doit être un nombre > 0" });
    }

    const ownerId = req.user.id;

    const result = await pool.query(
      `INSERT INTO events (title, event_date, capacity, places_left, owner_id)
       VALUES ($1, $2, $3, $3, $4)
       RETURNING id, title, event_date, capacity, places_left, owner_id, created_at`,
      [title, date, cap, ownerId]
    );

    // on ajoute is_reserved = false pour être cohérent avec le GET
    res.json({ ...result.rows[0], is_reserved: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// RESERVE (1 fois max par user) + décrémente places_left (transaction)
app.post("/api/events/:id/reserve", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    // lock l'event
    const ev = await client.query(
      "SELECT * FROM events WHERE id = $1 FOR UPDATE",
      [eventId]
    );

    if (ev.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    if (ev.rows[0].places_left <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Plus de places" });
    }

    // déjà réservé ?
    const existing = await client.query(
      "SELECT 1 FROM user_events WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Déjà réservé" });
    }

    // insert relation
    await client.query(
      "INSERT INTO user_events (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );

    // décrémente stock
    const updated = await client.query(
      `UPDATE events
       SET places_left = places_left - 1
       WHERE id = $1
       RETURNING id, title, event_date, capacity, places_left, owner_id, created_at`,
      [eventId]
    );

    await client.query("COMMIT");

    // renvoyer aussi is_reserved=true pour le front
    res.json({ ...updated.rows[0], is_reserved: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
