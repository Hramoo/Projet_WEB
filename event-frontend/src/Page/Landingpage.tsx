import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style/Landingpage.css";

type EventItem = {
  id: number;
  title: string;
  event_date: string;
  capacity: number;
  places_left: number;
  owner_id: number;
  image_url: string | null;
  is_reserved: boolean;
};

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function LandingPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: "",
    capacity: "",
    imageUrl: "",
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  const requireAuth = useCallback(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      navigate("/login");
      return null;
    }
    return t;
  }, [navigate]);

  const authFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      const t = requireAuth();
      if (!t) return null;

      const res = await fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${t}`,
        },
      });

      if (!res.ok) {
        // token invalide / expiré => on force relogin
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return null;
        }
      }

      return res;
    },
    [navigate, requireAuth]
  );

  const loadEvents = useCallback(async () => {
    const res = await authFetch("/api/events");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    setEvents(Array.isArray(data) ? data : []);
  }, [authFetch]);

  useEffect(() => {
    // si token absent => redirect
    if (!token) navigate("/login");
    else loadEvents();
  }, [loadEvents, navigate, token]);

  const updateEventInList = useCallback((updated: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const toggleReservation = useCallback(
    async (id: number, action: "reserve" | "unreserve") => {
      setMessage("");

      const res = await authFetch(`/api/events/${id}/${action}`, { method: "POST" });
      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      updateEventInList(data as EventItem);
    },
    [authFetch, updateEventInList]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const handleAddEvent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage("");

      const res = await authFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          capacity: Number(form.capacity),
          image_url: form.imageUrl,
        }),
      });

      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setIsAddOpen(false);
      setForm({ title: "", date: "", capacity: "", imageUrl: "" });
      loadEvents();
    },
    [authFetch, form, loadEvents]
  );

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">EventSquare</h1>
        <div className="actions">
          <button className="btn soft" onClick={() => setIsAddOpen(true)}>
            + Ajouter
          </button>
          <button className="btn primary" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {message && <p className="message">{message}</p>}

      <div className="grid">
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            ev={ev}
            onReserve={() => toggleReservation(ev.id, "reserve")}
            onUnreserve={() => toggleReservation(ev.id, "unreserve")}
          />
        ))}
      </div>

      {isAddOpen && (
        <AddEventModal
          form={form}
          setForm={setForm}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleAddEvent}
        />
      )}
    </div>
  );
}

function EventCard({
  ev,
  onReserve,
  onUnreserve,
}: {
  ev: EventItem;
  onReserve: () => void;
  onUnreserve: () => void;
}) {
  const isFull = ev.places_left === 0;

  return (
    <div className="card">
      {ev.image_url && (
        <div className="card-image" style={{ backgroundImage: `url(${ev.image_url})` }} />
      )}

      <h2>{ev.title}</h2>
      <p>Date : {formatDate(ev.event_date)}</p>

      <span className="badge">
        {ev.places_left}/{ev.capacity} places
      </span>

      <div className="spacer" />

      {ev.is_reserved ? (
        <button className="btn soft" onClick={onUnreserve}>
          Se désengager
        </button>
      ) : (
        <button
          className={`btn ${isFull ? "disabled" : "soft"}`}
          disabled={isFull}
          onClick={onReserve}
        >
          {isFull ? "Complet" : "Réserver"}
        </button>
      )}
    </div>
  );
}

function AddEventModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: { title: string; date: string; capacity: string; imageUrl: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ title: string; date: string; capacity: string; imageUrl: string }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Ajouter un événement</h3>
          <button className="btn soft" onClick={onClose}>
            Fermer
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <label>
            Titre
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </label>

          <label>
            Capacité
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
            />
          </label>

          <label>
            Image (URL)
            <input
              placeholder="https://images.unsplash.com/..."
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
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
  );
}
