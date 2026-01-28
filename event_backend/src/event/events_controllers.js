const pool = require("../db");
const { toDataUrl, resolveIncomingImage } = require("../lib/imageStore");

// Helper: transforme une row DB en objet front (sans renvoyer image_data brut)
function mapEventRow(row, is_reserved) {
  const image_data_url = toDataUrl(row.image_data, row.image_mime);
  // eslint-disable-next-line no-unused-vars
  const { image_data, ...rest } = row;
  return {
    ...rest,
    image_data_url,
    is_reserved: Boolean(is_reserved),
  };
}

/* =======================
   GET EVENTS
======================= */

exports.getEvents = async (req, res) => {
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
        u.username AS owner_username,
        e.image_url,
        e.image_data,
        e.image_mime,
        e.created_at,
        (ue.user_id IS NOT NULL) AS is_reserved
      FROM events e
      JOIN users u ON u.id = e.owner_id
      LEFT JOIN user_events ue
        ON ue.event_id = e.id
       AND ue.user_id = $1
      ORDER BY e.event_date ASC
    `;

    const { rows } = await pool.query(sql, [userId]);

    const out = rows.map((r) => mapEventRow(r, r.is_reserved));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/* =======================
   CREATE EVENT
======================= */

exports.createEvent = async (req, res) => {
  try {
    const { title, date, capacity } = req.body;
    const image_url = req.body.image_url ?? null;

    if (!title || !date || capacity === undefined) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      return res.status(400).json({ error: "capacity invalide" });
    }

    const ownerId = req.user.id;

    let imageData = null;
    let imageMime = null;

    try {
      const resolved = await resolveIncomingImage({ body: req.body, imageUrl: image_url });
      imageData = resolved.imageData;
      imageMime = resolved.imageMime;
    } catch (e) {
      return res.status(400).json({ error: `Image invalide: ${e.message}` });
    }

    const sql = `
      INSERT INTO events (
        title, event_date, capacity, places_left, owner_id,
        image_url, image_data, image_mime
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
      RETURNING
        id, title, event_date, capacity, places_left,
        owner_id, image_url, image_data, image_mime, created_at
    `;

    const { rows } = await pool.query(sql, [
      title,
      date,
      cap,
      ownerId,
      image_url,
      imageData,
      imageMime,
    ]);

    const r = rows[0];

    res.json({
      id: r.id,
      title: r.title,
      event_date: r.event_date,
      capacity: r.capacity,
      places_left: r.places_left,
      owner_id: r.owner_id,
      owner_username: req.user.username ?? null, // le middleware met username dans le token
      image_url: r.image_url,
      image_mime: r.image_mime,
      image_data_url: toDataUrl(r.image_data, r.image_mime),
      created_at: r.created_at,
      is_reserved: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/* =======================
   UPDATE EVENT (OWNER)
======================= */

exports.updateEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    const { title, date, capacity } = req.body;
    const image_url = req.body.image_url ?? null;

    if (!Number.isInteger(eventId)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const cap = Number(capacity);
    if (!title || !date || !Number.isInteger(cap) || cap <= 0) {
      return res.status(400).json({ error: "Données invalides" });
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

    // éviter capacity < réservations existantes
    const taken = event.capacity - event.places_left;
    if (cap < taken) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `${taken} places déjà réservées` });
    }

    let imageData = event.image_data;
    let imageMime = event.image_mime;

    try {
      // 1) si le client envoie une image (dataurl/base64/hex) -> remplace
      const fromBody = await resolveIncomingImage({ body: req.body, imageUrl: null });
      if (fromBody.imageData) {
        imageData = fromBody.imageData;
        imageMime = fromBody.imageMime;
      } else if (image_url && image_url !== event.image_url) {
        // 2) sinon si URL change -> télécharge
        const fromUrl = await resolveIncomingImage({ body: {}, imageUrl: image_url });
        imageData = fromUrl.imageData;
        imageMime = fromUrl.imageMime;
      }
      // 3) sinon -> conserve
    } catch (e) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Image invalide: ${e.message}` });
    }

    const newPlacesLeft = cap - taken;

    await client.query(
      `
      UPDATE events
      SET
        title = $1,
        event_date = $2,
        capacity = $3,
        places_left = $4,
        image_url = $5,
        image_data = $6,
        image_mime = $7
      WHERE id = $8
      `,
      [title, date, cap, newPlacesLeft, image_url, imageData, imageMime, eventId]
    );

    await client.query("COMMIT");

    const out = await pool.query(
      `
      SELECT
        e.id, e.title, e.event_date, e.capacity, e.places_left,
        e.owner_id, u.username AS owner_username,
        e.image_url, e.image_data, e.image_mime, e.created_at
      FROM events e
      JOIN users u ON u.id = e.owner_id
      WHERE e.id = $1
      `,
      [eventId]
    );

    if (out.rows.length === 0) return res.status(404).json({ error: "Event introuvable" });

    res.json(mapEventRow(out.rows[0], false));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    client.release();
  }
};
