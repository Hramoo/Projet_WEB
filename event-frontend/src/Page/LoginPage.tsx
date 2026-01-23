import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/LoginPage.scss";

type Mode = "login" | "signup";

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const url = mode === "login" ? "/api/login" : "/api/signup";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Erreur");
        return;
      }

      if (mode === "login") {
        localStorage.setItem("token", data.token);
        setMessage("Connecté");
        navigate("/"); // ✅ redirection landing
      } else {
        setMessage("Compte créé, tu peux te connecter");
        setMode("login");
      }
    } catch {
      setMessage("Erreur serveur");
    }
  }

  return (
    <div className={`auth-page ${mode}`}>
      <div className="auth-card">
        <div className="tabs">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            type="button"
          >
            Connexion
          </button>

          <button
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            type="button"
          >
            Créer un compte
          </button>
        </div>

        <div className="left">
          <h1 className="title">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="subtitle">{mode === "login" ? "" : ""}</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="primary" type="submit">
            {mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>

          {message && <p className="message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
