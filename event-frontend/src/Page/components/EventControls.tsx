import { getReadableTextColor } from "../utils/colorUtils";

type TagItem = {
  tag: string;
  color?: string | null;
};

type Props = {
  view: "upcoming" | "started";
  onViewChange: (view: "upcoming" | "started") => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  onResetTagFilter: () => void;
  allTags: TagItem[];
  selectedTags: string[];
};

export default function EventControls({
  view,
  onViewChange,
  tagFilter,
  onTagFilterChange,
  onResetTagFilter,
  allTags,
  selectedTags,
}: Props) {
  return (
    <div className="controls-row">
      <div className="event-tabs">
        <button
          className={view === "upcoming" ? "tab active" : "tab"}
          onClick={() => onViewChange("upcoming")}
          type="button"
        >
          À venir
        </button>
        <button
          className={view === "started" ? "tab active" : "tab"}
          onClick={() => onViewChange("started")}
          type="button"
        >
          en cours / terminé
        </button>
      </div>

      <div className="tag-filter-wrapper">
        <div className="tag-filter card tag-filter-card">
          <div className="tag-filter-row">
            <label htmlFor="tagFilterInput">Filtrer par tags</label>
            <input
              id="tagFilterInput"
              placeholder="ex: tech, meetup"
              value={tagFilter}
              onChange={(e) => onTagFilterChange(e.target.value)}
            />
            <button
              className="btn soft"
              type="button"
              onClick={onResetTagFilter}
              disabled={tagFilter.trim().length === 0}
            >
              Réinitialiser
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="tag-list">
              {allTags.map(({ tag, color }) => {
                const isActive = selectedTags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase()
                );
                const style = color
                  ? {
                      backgroundColor: color,
                      color: getReadableTextColor(color),
                      borderColor: "transparent",
                    }
                  : undefined;
                return (
                  <button
                    key={`filter-${tag}`}
                    type="button"
                    className={`tag-chip ${color ? "tag-chip-colored" : ""} ${
                      isActive ? "active" : ""
                    }`}
                    style={style}
                    onClick={() => {
                      if (isActive) {
                        const next = selectedTags.filter(
                          (t) => t.toLowerCase() !== tag.toLowerCase()
                        );
                        onTagFilterChange(next.join(", "));
                      } else {
                        onTagFilterChange(
                          [...selectedTags, tag].filter(Boolean).join(", ")
                        );
                      }
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
