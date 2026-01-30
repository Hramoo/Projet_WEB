import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "./components/Topbar";
import EventCard, { type EventItem } from "./components/EventCard";
import AddEventModal from "./components/AddEventModal";
import EditEventModal from "./components/EditEventModal";

import "./style/Landingpage.css";

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

  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    date: "",
    capacity: "",
    imageUrl: "",
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState({
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

      if (!res.ok && res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }

      return res;
    },
    [navigate, requireAuth]
  );

  const loadMe = useCallback(async () => {
    const res = await authFetch("/api/validate");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    const id = data?.user?.id;
    const role = data?.user?.role;

    setUserId(id != null ? Number(id) : null);
    setUserRole(role === "admin" ? "admin" : "user");
  }, [authFetch]);

  const loadEvents = useCallback(async () => {
    const res = await authFetch("/api/events");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    setEvents(Array.isArray(data) ? (data as EventItem[]) : []);
  }, [authFetch]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadMe();
    loadEvents();
  }, [loadEvents, loadMe, navigate, token]);

  const updateEventInList = useCallback((updated: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }, []);

  const removeEventFromList = useCallback((id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleReservation = useCallback(
    async (id: number, action: "reserve" | "unreserve") => {
      setMessage("");

      const res = await authFetch(`/api/events/${id}/${action}`, {
        method: "POST",
      });
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
          title: addForm.title,
          date: addForm.date,
          capacity: Number(addForm.capacity),
          image_url: addForm.imageUrl,
        }),
      });

      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setIsAddOpen(false);
      setAddForm({ title: "", date: "", capacity: "", imageUrl: "" });
      loadEvents();
    },
    [addForm, authFetch, loadEvents]
  );

  const openEdit = useCallback((ev: EventItem) => {
    setMessage("");
    setEditTarget(ev);
    setEditForm({
      title: ev.title,
      date: formatDate(ev.event_date),
      capacity: String(ev.capacity),
      imageUrl: ev.image_url ?? "",
    });
    setIsEditOpen(true);
  }, []);

  const handleEditEvent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage("");

      if (!editTarget) return;

      const res = await authFetch(`/api/events/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          date: editForm.date,
          capacity: Number(editForm.capacity),
          image_url: editForm.imageUrl,
        }),
      });

      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setIsEditOpen(false);
      setEditTarget(null);
      updateEventInList(data as EventItem);
    },
    [authFetch, editForm, editTarget, updateEventInList]
  );

  const handleDeleteEvent = useCallback(
    async (ev: EventItem) => {
      setMessage("");

      const ok = window.confirm(`Supprimer l'événement "${ev.title}" ?`);
      if (!ok) return;

      const res = await authFetch(`/api/events/${ev.id}`, { method: "DELETE" });
      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      removeEventFromList(ev.id);
    },
    [authFetch, removeEventFromList]
  );

  return (
    <div className="page">
      <Topbar
        onAdd={() => setIsAddOpen(true)}
        onLogout={handleLogout}
        // ✅ IMPORTANT: ne pas afficher Admin tant qu'on n'a pas chargé le rôle
        isAdmin={userRole === "admin"}
        onAdmin={() => navigate("/admin")}
      />

      {message && <p className="message">{message}</p>}

      <div className="grid">
        {events.map((ev) => {
          const isOwner =
            userId !== null && Number(ev.owner_id) === Number(userId);

          return (
            <EventCard
              key={ev.id}
              ev={ev}
              isOwner={isOwner}
              onEdit={() => openEdit(ev)}
              onDelete={() => handleDeleteEvent(ev)}
              onReserve={() => toggleReservation(ev.id, "reserve")}
              onUnreserve={() => toggleReservation(ev.id, "unreserve")}
            />
          );
        })}
      </div>

      {isAddOpen && (
        <AddEventModal
          form={addForm}
          setForm={setAddForm}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleAddEvent}
        />
      )}

      {isEditOpen && editTarget && (
        <EditEventModal
          form={editForm}
          setForm={setEditForm}
          onClose={() => {
            setIsEditOpen(false);
            setEditTarget(null);
          }}
          onSubmit={handleEditEvent}
        />
      )}
    </div>
  );
}
