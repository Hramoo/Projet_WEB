import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import EventHeader from "./components/EventHeader";
import EventGrid from "./components/EventGrid";
import EventModals from "./components/EventModals";
import EmptyState from "./components/EmptyState";
import type { EventItem } from "./components/EventCard";

import { useEventFilters } from "./hooks/useEventFilters";
import { formatDate } from "./utils/dateUtils";
import { safeJson } from "./utils/http";
import { normalizeTagColors, toTags, type TagColorsMap } from "./utils/tagUtils";

import "./style/Landingpage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"upcoming" | "started">("upcoming");
  const [tagFilter, setTagFilter] = useState("");

  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    date: "",
    capacity: "",
    imageUrl: "",
    tags: "",
    tagColors: {} as TagColorsMap,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    capacity: "",
    imageUrl: "",
    tags: "",
    tagColors: {} as TagColorsMap,
  });

  const token = useMemo(() => localStorage.getItem("token"), []);
  const { displayEvents, allTags, selectedTags } = useEventFilters(
    events,
    view,
    tagFilter
  );

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
    async (e: FormEvent) => {
      e.preventDefault();
      setMessage("");

      const normalizedTags = toTags(addForm.tags);
      const tagsColors = normalizeTagColors(normalizedTags, addForm.tagColors);

      const res = await authFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title,
          date: addForm.date,
          capacity: Number(addForm.capacity),
          image_url: addForm.imageUrl,
          tags: addForm.tags,
          tags_colors: tagsColors,
        }),
      });

      if (!res) return;

      const data = await safeJson(res);

      if (!res.ok) {
        setMessage(data?.error || "Erreur");
        return;
      }

      setIsAddOpen(false);
      setAddForm({
        title: "",
        date: "",
        capacity: "",
        imageUrl: "",
        tags: "",
        tagColors: {},
      });
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
      tags: Array.isArray(ev.tags) ? ev.tags.join(", ") : "",
      tagColors: ev.tags_colors ?? {},
    });
    setIsEditOpen(true);
  }, []);

  const handleEditEvent = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setMessage("");

      if (!editTarget) return;

      const normalizedTags = toTags(editForm.tags);
      const tagsColors = normalizeTagColors(normalizedTags, editForm.tagColors);

      const res = await authFetch(`/api/events/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          date: editForm.date,
          capacity: Number(editForm.capacity),
          image_url: editForm.imageUrl,
          tags: editForm.tags,
          tags_colors: tagsColors,
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
      <EventHeader
        userRole={userRole}
        onAdd={() => setIsAddOpen(true)}
        onLogout={handleLogout}
        onAdmin={() => navigate("/admin")}
        view={view}
        onViewChange={setView}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        onResetTagFilter={() => setTagFilter("")}
        allTags={allTags}
        selectedTags={selectedTags}
      />

      {message && <p className="message">{message}</p>}

      <EventGrid
        events={displayEvents}
        userId={userId}
        userRole={userRole}
        onEdit={openEdit}
        onDelete={handleDeleteEvent}
        onReserve={(id) => toggleReservation(id, "reserve")}
        onUnreserve={(id) => toggleReservation(id, "unreserve")}
      />

      {displayEvents.length === 0 && <EmptyState view={view} />}

      <EventModals
        isAddOpen={isAddOpen}
        addForm={addForm}
        setAddForm={setAddForm}
        onAddSubmit={handleAddEvent}
        onCloseAdd={() => setIsAddOpen(false)}
        isEditOpen={isEditOpen}
        editTarget={editTarget}
        editForm={editForm}
        setEditForm={setEditForm}
        onEditSubmit={handleEditEvent}
        onCloseEdit={() => {
          setIsEditOpen(false);
          setEditTarget(null);
        }}
      />
    </div>
  );
}
