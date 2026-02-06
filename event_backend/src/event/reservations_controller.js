const pool = require("../db");
const { toDataUrl } = require("../lib/imageStore");

// Re-select event complet pour que le front puisse update la liste sans perdre owner_id
async function fetchEvent(eventId, is_reserved) {
  const out = await pool.query(
    `
    SELECT
      e.id,
      e.title,
      e.event_date,
      e.capacity,
      e.places_left,
      e.tags,
      e.tags_colors,
      e.owner_id,
      u.username AS owner_username,
      e.image_url,
      e.image_data,
      e.image_mime,
      e.created_at
    FROM events e
    JOIN users u ON u.id = e.owner_id
    WHERE e.id = $1
    `,
    [eventId]
  );

  if (out.rows.length === 0) return null;

  const r = out.rows[0];
  const image_data_url = toDataUrl(r.image_data, r.image_mime);
  // eslint-disable-next-line no-unused-vars
  const { image_data, ...rest } = r;

  return { ...rest, image_data_url, is_reserved: Boolean(is_reserved) };
}

exports.reserveEvent = async (req, res) => {
  const client = await pool.connect();
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    const evRes = await client.query(
      `SELECT * FROM events WHERE id = $1 FOR UPDATE`,
      [eventId]
    );

    if (evRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    const event = evRes.rows[0];

    // if (event.owner_id === userId) {
    //   await client.query("ROLLBACK");
    //   return res.status(400).json({ error: "Tu ne peux pas réserver ton propre event" });
    // }

    if (event.places_left <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Complet" });
    }

    const already = await client.query(
      `SELECT 1 FROM user_events WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    if (already.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Déjà réservé" });
    }

    await client.query(
      `INSERT INTO user_events(user_id, event_id) VALUES ($1, $2)`,
      [userId, eventId]
    );

    await client.query(
      `UPDATE events SET places_left = places_left - 1 WHERE id = $1`,
      [eventId]
    );

    await client.query("COMMIT");

    const full = await fetchEvent(eventId, true);
    return res.json(full);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
};

exports.unreserveEvent = async (req, res) => {
  const client = await pool.connect();
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    const evRes = await client.query(
      `SELECT * FROM events WHERE id = $1 FOR UPDATE`,
      [eventId]
    );

    if (evRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    const del = await client.query(
      `DELETE FROM user_events WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    if (del.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Pas de réservation" });
    }

    await client.query(
      `UPDATE events SET places_left = LEAST(capacity, places_left + 1) WHERE id = $1`,
      [eventId]
    );

    await client.query("COMMIT");

    const full = await fetchEvent(eventId, false);
    return res.json(full);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
};

exports.deleteEvent = async (req, res) => {
  const client = await pool.connect();
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await client.query("BEGIN");

    const evRes = await client.query(
      `SELECT * FROM events WHERE id = $1 FOR UPDATE`,
      [eventId]
    );

    if (evRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event introuvable" });
    }

    const event = evRes.rows[0];

    if (event.owner_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Accès refusé" });
    }

    await client.query(`DELETE FROM user_events WHERE event_id = $1`, [eventId]);
    await client.query(`DELETE FROM events WHERE id = $1`, [eventId]);

    await client.query("COMMIT");
    return res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
};
