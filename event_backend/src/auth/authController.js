const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "supersecrekey";

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, password } = req.body;

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

    await pool.query(
      "INSERT INTO public.users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    );

    return res.json({ message: "Compte cree" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM public.users WHERE username = $1",
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

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
