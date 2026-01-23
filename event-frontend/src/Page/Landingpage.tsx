import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // modal ajout
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  function formatDate(iso: string) {
    return iso?.slice(0, 10);
  }

  const gradients = useMemo(
    () => [
      "linear-gradient(135deg, #eef2ff, #fce7f3)",
      "linear-gradient(135deg, #ecfeff, #e0f2fe)",
      "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      "linear-gradient(135deg, #fff7ed, #ffedd5)",
      "linear-gradient(135deg, #fdf2f8, #ffe4e6)",
      "linear-gradient(135deg, #f8fafc, #e2e8f0)",
    ],
    []
  );

  async function loadEvents() {
    setMessage("");
    const token = getToken();
    if (!token) return navigate("/login");

    try {
      const res = await fetch("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      setEvents(data);
    } catch {
      setMessage("Erreur serveur");
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const token = getToken();
    if (!token) return navigate("/login");

    try {
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

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setOpen(false);
      setTitle("");
      setDate("");
      setCapacity("");

      // ajoute direct en haut (ou reload)
      await loadEvents();
    } catch {
      setMessage("Erreur serveur");
    }
  }

  async function handleReserve(eventId: number) {
    setMessage("");

    const token = getToken();
    if (!token) return navigate("/login");

    try {
      const res = await fetch(`/api/events/${eventId}/reserve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || "Impossible de réserver");
        return;
      }

      // backend renvoie l'event updated + is_reserved:true
      setEvents((prev) => prev.map((e) => (e.id === eventId ? data : e)));
    } catch {
      setMessage("Erreur serveur");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const styles = {
    page: { minHeight: "100vh", background: "#f4f6fb", padding: 24 } as const,
    topbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    } as const,
    brand: { margin: 0, fontSize: 22, fontWeight: 900, color: "#111827" } as const,
    actions: { display: "flex", gap: 10 } as const,

    btn: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: "#111827",
      color: "white",
      fontWeight: 800,
      cursor: "pointer",
    } as const,
    btnSoft: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #d6d9e6",
      background: "white",
      color: "#111827",
      fontWeight: 800,
      cursor: "pointer",
    } as const,
    btnDisabled: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: "#d1d5db",
      color: "#6b7280",
      fontWeight: 800,
      cursor: "not-allowed",
    } as const,

    message: { margin: "10px 0 0", color: "#dc2626", fontWeight: 700 } as const,

    grid: {
      display: "grid",
      gap: 16,
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      marginTop: 16,
    } as const,

    // carré + shadow box
    card: {
      background: "white",
      borderRadius: 16,
      padding: 16,
      aspectRatio: "1 / 1",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
      border: "1px solid rgba(17,24,39,0.06)",
    } as const,
    title: { margin: 0, fontSize: 18, fontWeight: 900, color: "#111827" } as const,
    meta: { margin: "8px 0 0", color: "#374151", fontWeight: 700 } as const,
    badge: {
      marginTop: 10,
      width: "fit-content",
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.75)",
      border: "1px solid rgba(17,24,39,0.10)",
      fontWeight: 900,
      color: "#111827",
    } as const,
    spacer: { flex: 1 } as const,

    // modal
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    } as const,
    modal: {
      width: "min(520px, 100%)",
      background: "white",
      borderRadius: 16,
      boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
      overflow: "hidden" as const,
    } as const,
    modalHeader: {
      padding: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #eef0f6",
    } as const,
    modalBody: { padding: 14, display: "grid", gap: 10 } as const,
    label: { display: "grid", gap: 6, fontWeight: 800, color: "#111827" } as const,
    input: {
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #d6d9e6",
      outline: "none",
    } as const,
    modalFooter: {
      padding: 14,
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      borderTop: "1px solid #eef0f6",
    } as const,
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h1 style={styles.brand}>EventSquare</h1>
        <div style={styles.actions}>
          <button style={styles.btnSoft} onClick={() => setOpen(true)}>
            + Ajouter
          </button>
          <button style={styles.btn} onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.grid}>
        {events.map((ev, idx) => {
          const disabled = ev.places_left <= 0 || ev.is_reserved;
          const bg = gradients[idx % gradients.length];

          return (
            <div key={ev.id} style={{ ...styles.card, background: bg }}>
              <h2 style={styles.title}>{ev.title}</h2>
              <p style={styles.meta}>Date : {formatDate(ev.event_date)}</p>

              <div style={styles.badge}>
                {ev.places_left}/{ev.capacity} places
              </div>

              <div style={styles.spacer} />

              <button
                onClick={() => handleReserve(ev.id)}
                disabled={disabled}
                style={disabled ? styles.btnDisabled : styles.btnSoft}
              >
                {ev.is_reserved ? "Déjà réservé" : ev.places_left <= 0 ? "Complet" : "Réserver"}
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div
          style={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Ajouter un événement</h3>
              <button style={styles.btnSoft} onClick={() => setOpen(false)}>
                Fermer
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              <div style={styles.modalBody}>
                <label style={styles.label}>
                  Titre
                  <input
                    style={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>

                <label style={styles.label}>
                  Date
                  <input
                    style={styles.input}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                <label style={styles.label}>
                  Capacité
                  <input
                    style={styles.input}
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </label>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSoft} onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  style={styles.btn}
                  disabled={!title || !date || !capacity}
                >
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
