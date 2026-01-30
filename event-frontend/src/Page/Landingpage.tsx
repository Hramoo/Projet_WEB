import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Topbar from "./components/Topbar";
import EventCard, { type EventItem } from "./components/EventCard";
import AddEventModal from "./components/AddEventModal";
import EditEventModal from "./components/EditEventModal";
import SettingsModal, { type UserSettings } from "./components/SettingsModal";

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

function applySettings(s: UserSettings) {
  const root = document.documentElement;

  root.style.setProperty("--primary", s.primary_color);

  if (s.theme === "dark") {
    root.style.setProperty("--bg", "#0b1220");
    root.style.setProperty("--card", "#0f172a");
    root.style.setProperty("--text", "#e5e7eb");
    root.style.setProperty("--muted", "#94a3b8");
    root.style.setProperty("--soft", "#1f2937");
  } else {
    root.style.setProperty("--bg", "#f4f6fb");
    root.style.setProperty("--card", "#ffffff");
    root.style.setProperty("--text", "#111827");
    root.style.setProperty("--muted", "#374151");
    root.style.setProperty("--soft", "#e5e7eb");
  }

  root.dataset.compact = String(s.compact);
  root.dataset.showImages = String(s.show_images);
}

export default function LandingPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

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

  // ✅ Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    primary_color: "#111827",
    compact: false,
    show_images: true,
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
    // ✅ IMPORTANT: ton backend expose GET /api/validate
    const res = await authFetch("/api/validate");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    const id = data?.user?.id;
    setUserId(id != null ? Number(id) : null);
  }, [authFetch]);

  const loadEvents = useCallback(async () => {
    const res = await authFetch("/api/events");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    setEvents(Array.isArray(data) ? (data as EventItem[]) : []);
  }, [authFetch]);

  const loadSettings = useCallback(async () => {
    const res = await authFetch("/api/me/settings");
    if (!res) return;

    const data = await safeJson(res);
    if (!res.ok) return;

    const s = data?.settings;
    if (s) {
      const next: UserSettings = {
        theme: s.theme === "dark" ? "dark" : "light",
        primary_color:
          typeof s.primary_color === "string" ? s.primary_color : "#111827",
        compact: !!s.compact,
        show_images: s.show_images !== false,
      };
      setSettings(next);
      applySettings(next);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadMe();
    loadEvents();
    loadSettings();
  }, [loadEvents, loadMe, loadSettings, navigate, token]);

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

  const saveSettings = useCallback(
    async (next: UserSettings) => {
      setSettings(next);
      applySettings(next);

      const res = await authFetch("/api/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (!res) return;
      const data = await safeJson(res);
      if (!res.ok) {
        setMessage(data?.error || "Erreur settings");
        return;
      }

      const s = data?.settings;
      if (s) {
        const normalized: UserSettings = {
          theme: s.theme === "dark" ? "dark" : "light",
          primary_color:
            typeof s.primary_color === "string" ? s.primary_color : "#111827",
          compact: !!s.compact,
          show_images: s.show_images !== false,
        };
        setSettings(normalized);
        applySettings(normalized);
      }
    },
    [authFetch]
  );

  return (
    <div className="page">
      <Topbar
        onAdd={() => setIsAddOpen(true)}
        onLogout={handleLogout}
        onSettings={() => setIsSettingsOpen(true)}
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

      {isSettingsOpen && (
        <SettingsModal
          value={settings}
          onClose={() => setIsSettingsOpen(false)}
          onChange={saveSettings}
        />
      )}
    </div>
  );
}
