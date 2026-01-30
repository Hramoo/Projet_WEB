const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "supersecrekey";

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const existing = await pool.query(
      "SELECT id FROM public.users WHERE username = $1",
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Utilisateur deja existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ role par défaut
    const created = await pool.query(
      "INSERT INTO public.users (username, password, role) VALUES ($1, $2, 'user') RETURNING id, username, role",
      [username, hashedPassword]
    );

    const user = created.rows[0];
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    const result = await pool.query(
      "SELECT id, username, password, role FROM public.users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Erreur bg" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "flop bg" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
