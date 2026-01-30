const pool = require("../db"); // adapte le chemin si besoin

function normalizeHexColor(input) {
  if (typeof input !== "string") return null;
  const s = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : null;
}

exports.getMySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // crée la ligne si elle n'existe pas
    await pool.query(
      `INSERT INTO user_settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    const { rows } = await pool.query(
      `SELECT theme, primary_color, compact, show_images
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    return res.json({ ok: true, settings: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.updateMySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, primary_color, compact, show_images } = req.body || {};

    // validation simple
    const nextTheme =
      theme === "light" || theme === "dark" ? theme : null;
    const nextColor = normalizeHexColor(primary_color);

    const nextCompact =
      typeof compact === "boolean" ? compact : null;
    const nextShowImages =
      typeof show_images === "boolean" ? show_images : null;

    // On met à jour uniquement ce qui est fourni
    const current = await pool.query(
      `SELECT theme, primary_color, compact, show_images
       FROM user_settings
       WHERE user_id = $1`,
      [userId]
    );

    if (current.rowCount === 0) {
      await pool.query(
        `INSERT INTO user_settings (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
    }

    const merged = {
      theme: nextTheme ?? current.rows[0]?.theme ?? "light",
      primary_color: nextColor ?? current.rows[0]?.primary_color ?? "#111827",
      compact: nextCompact ?? current.rows[0]?.compact ?? false,
      show_images: nextShowImages ?? current.rows[0]?.show_images ?? true,
    };

    await pool.query(
      `UPDATE user_settings
       SET theme = $2,
           primary_color = $3,
           compact = $4,
           show_images = $5,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, merged.theme, merged.primary_color, merged.compact, merged.show_images]
    );

    return res.json({ ok: true, settings: merged });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
