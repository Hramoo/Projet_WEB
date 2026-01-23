const express = require("express");
const cors = require("cors");

const { login, signup } = require("./auth/authController");
const { requireAuth } = require("./auth/authMiddleware");

const pool = require("./db"); // PostgreSQL

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/signup", signup);
app.post("/api/login", login);
app.post("/api/validate", requireAuth);


// GET events + is_reserved pour le user connecté
app.get("/api/events", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT
        e.id,
        e.title,
        e.event_date,
        e.capacity,
        e.places_left,
        e.owner_id,
        e.image_url,
        e.created_at,
        (ue.user_id IS NOT NULL) AS is_reserved
      FROM events e
      LEFT JOIN user_events ue
        ON ue.event_id = e.id
       AND ue.user_id = ${userId}
      ORDER BY e.event_date ASC
    `;

    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// creation event
app.post("/api/events", requireAuth, async (req, res) => {
  try {
    const { title, date, capacity, image_url } = req.body;

    if (!title || !date || capacity === undefined) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      return res.status(400).json({ error: "capacity doit être un nombre > 0" });
    }

    const ownerId = req.user.id;

    const sql = `
      INSERT INTO events (
        title,
        event_date,
        capacity,
        places_left,
        owner_id,
        image_url
      )
      VALUES (
        '${title}',
        '${date}',
        ${cap},
        ${cap},
        ${ownerId},
        ${image_url ? `'${image_url}'` : "NULL"}
      )
      RETURNING
        id,
        title,
        event_date,
        capacity,
        places_left,
        owner_id,
        image_url,
        created_at
    `;

    const { rows } = await pool.query(sql);
    res.json({ ...rows[0], is_reserved: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 
app.post("/api/events/:id/reserve", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    // lock event
    const lockSql = `
      SELECT *
      FROM events
      WHERE id = ${eventId}
      FOR UPDATE
    `;
    const ev = await client.query(lockSql);

    if (ev.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    const event = ev.rows[0];

    if (event.owner_id === userId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Tu ne peux pas réserver ton propre event",
      });
    }

    if (event.places_left <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Plus de places" });
    }

    // déjà réservé ?
    const checkSql = `
      SELECT 1
      FROM user_events
      WHERE user_id = ${userId}
        AND event_id = ${eventId}
    `;
    const existing = await client.query(checkSql);

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Déjà réservé" });
    }

    // insert relation
    const insertSql = `
      INSERT INTO user_events (user_id, event_id)
      VALUES (${userId}, ${eventId})
    `;
    await client.query(insertSql);

    // décrémente places
    const updateSql = `
      UPDATE events
      SET places_left = places_left - 1
      WHERE id = ${eventId}
      RETURNING
        id,
        title,
        event_date,
        capacity,
        places_left,
        owner_id,
        image_url,
        created_at
    `;
    const updated = await client.query(updateSql);

    await client.query("COMMIT");
    res.json({ ...updated.rows[0], is_reserved: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
});

// UNRESERVE
app.post("/api/events/:id/unreserve", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    const lockSql = `
      SELECT *
      FROM events
      WHERE id = ${eventId}
      FOR UPDATE
    `;
    const ev = await client.query(lockSql);

    if (ev.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    const deleteSql = `
      DELETE FROM user_events
      WHERE user_id = ${userId}
        AND event_id = ${eventId}
      RETURNING *
    `;
    const del = await client.query(deleteSql);

    if (del.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas de réservation" });
    }

    const updateSql = `
      UPDATE events
      SET places_left = LEAST(capacity, places_left + 1)
      WHERE id = ${eventId}
      RETURNING
        id,
        title,
        event_date,
        capacity,
        places_left,
        owner_id,
        image_url,
        created_at
    `;
    const updated = await client.query(updateSql);

    await client.query("COMMIT");
    res.json({ ...updated.rows[0], is_reserved: false });
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
