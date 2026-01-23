const jwt = require("jsonwebtoken");

const JWT_SECRET = "supersecrekey";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ error: "No Authorization header" });
  }

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Bad Authorization format" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireAuth };
