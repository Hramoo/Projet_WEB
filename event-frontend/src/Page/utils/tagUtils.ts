export type TagColorsMap = Record<string, string>;

export const TAG_PALETTE = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#0f766e",
  "#be123c",
  "#ca8a04",
];

export function toTags(value: string) {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function isHexColor(value: string | undefined) {
  if (!value) return false;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pickColor(tag: string) {
  const idx = hashString(tag) % TAG_PALETTE.length;
  return TAG_PALETTE[idx];
}

export function buildTagColors(tags: string[], existing: TagColorsMap) {
  const out: TagColorsMap = {};
  const lowerExisting = new Map(
    Object.entries(existing || {}).map(([key, color]) => [
      key.toLowerCase(),
      color,
    ])
  );
  tags.forEach((tag) => {
    const fromExisting = lowerExisting.get(tag.toLowerCase());
    out[tag] = isHexColor(fromExisting) ? String(fromExisting) : pickColor(tag);
  });
  return out;
}

export function normalizeTagColors(tags: string[], input: TagColorsMap) {
  const out: TagColorsMap = {};
  const lowerMap = new Map(
    Object.entries(input || {}).map(([key, color]) => [
      key.toLowerCase(),
      color,
    ])
  );
  tags.forEach((tag) => {
    const fromExisting = lowerMap.get(tag.toLowerCase());
    if (isHexColor(fromExisting)) {
      out[tag] = String(fromExisting);
    }
  });
  return out;
}

export function normalizeHex(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : null;
}

export function getTagColor(tag: string, colors?: TagColorsMap) {
  if (!colors) return null;
  if (colors[tag]) return normalizeHex(colors[tag]);
  const lower = tag.toLowerCase();
  const match = Object.entries(colors).find(([key]) => key.toLowerCase() === lower);
  return match ? normalizeHex(match[1]) : null;
}

type EventTagsSource = {
  tags?: string[];
  tags_colors?: TagColorsMap;
};

export function buildAllTags(events: EventTagsSource[]) {
  const map = new Map<string, string | null>();
  events.forEach((ev) => {
    const tags = Array.isArray(ev.tags) ? ev.tags : [];
    const colors = ev.tags_colors ?? {};
    tags.forEach((t) => {
      const norm = String(t).trim();
      if (!norm) return;
      if (!map.has(norm)) {
        map.set(norm, getTagColor(norm, colors));
      }
    });
  });
  return Array.from(map.entries())
    .map(([tag, color]) => ({ tag, color }))
    .sort((a, b) => a.tag.localeCompare(b.tag, "fr"));
}
