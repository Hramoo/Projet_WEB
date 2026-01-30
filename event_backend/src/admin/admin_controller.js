const pool = require("../db");

// GET /api/admin/users
exports.listUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, role FROM public.users ORDER BY id DESC"
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, role } = req.body || {};

    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { rows } = await pool.query(
      `UPDATE public.users
       SET username = COALESCE($2, username),
           role = COALESCE($3, role)
       WHERE id = $1
       RETURNING id, username, role`,
      [id, username ?? null, role ?? null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // empêche l'admin de se supprimer lui-même
    if (req.user.id === id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const r = await pool.query("DELETE FROM public.users WHERE id = $1", [id]);

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
