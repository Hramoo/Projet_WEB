import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Landingpage.css";

type EventItem = {
  id: number;
  title: string;
  event_date: string;
  capacity: number;
  places_left: number;
  owner_id: number;
  is_reserved: boolean;
};

export default function LandingPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  function formatDate(date: string) {
    return date.slice(0, 10);
  }

  async function loadEvents() {
    const token = getToken();
    if (!token) return navigate("/login");

    const res = await fetch("/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      localStorage.removeItem("token");
      return navigate("/login");
    }

    setEvents(data);
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line
  }, []);

  async function handleReserve(id: number) {
    const token = getToken();
    if (!token) return navigate("/login");

    const res = await fetch(`/api/events/${id}/reserve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Erreur");
      return;
    }

    setEvents((prev) => prev.map((e) => (e.id === id ? data : e)));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();

    const token = getToken();
    if (!token) return navigate("/login");

    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        date,
        capacity: Number(capacity),
      }),
    });

    if (!res.ok) return;

    setOpen(false);
    setTitle("");
    setDate("");
    setCapacity("");
    loadEvents();
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">EventSquare</h1>
        <div className="actions">
          <button className="btn soft" onClick={() => setOpen(true)}>
            + Ajouter
          </button>
          <button className="btn primary" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {message && <p className="message">{message}</p>}

      <div className="grid">
        {events.map((ev) => {
          const disabled = ev.places_left === 0 || ev.is_reserved;

          return (
            <div className="card" key={ev.id}>
              <h2>{ev.title}</h2>
              <p>Date : {formatDate(ev.event_date)}</p>

              <span className="badge">
                {ev.places_left}/{ev.capacity} places
              </span>

              <div className="spacer" />

              <button
                className={`btn ${disabled ? "disabled" : "soft"}`}
                disabled={disabled}
                onClick={() => handleReserve(ev.id)}
              >
                {ev.is_reserved
                  ? "Déjà réservé"
                  : ev.places_left === 0
                  ? "Complet"
                  : "Réserver"}
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Ajouter un événement</h3>
              <button className="btn soft" onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="modal-body">
              <label>
                Titre
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>

              <label>
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>

              <label>
                Capacité
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </label>

              <div className="modal-footer">
                <button type="submit" className="btn primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
