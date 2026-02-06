import { useMemo } from "react";

import type { EventItem } from "../components/EventCard";
import { formatDate } from "../utils/dateUtils";
import { buildAllTags, toTags } from "../utils/tagUtils";

export function useEventFilters(
  events: EventItem[],
  view: "upcoming" | "started",
  tagFilter: string
) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedTags = useMemo(() => toTags(tagFilter), [tagFilter]);
  const selectedTagsLower = useMemo(
    () => selectedTags.map((tag) => tag.toLowerCase()),
    [selectedTags]
  );

  const displayEvents = useMemo(() => {
    const isStarted = (ev: EventItem) => formatDate(ev.event_date) < todayIso;
    const byView = events.filter((ev) =>
      view === "started" ? isStarted(ev) : !isStarted(ev)
    );
    if (selectedTagsLower.length === 0) return byView;
    return byView.filter((ev) => {
      const tags = Array.isArray(ev.tags) ? ev.tags : [];
      const set = new Set(tags.map((t) => String(t).toLowerCase()));
      return selectedTagsLower.some((t) => set.has(t));
    });
  }, [events, selectedTagsLower, todayIso, view]);

  const allTags = useMemo(() => buildAllTags(events), [events]);

  return { displayEvents, allTags, selectedTags };
}
