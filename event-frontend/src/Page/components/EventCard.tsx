import { formatDate } from "../utils/dateUtils";
import { getReadableTextColor } from "../utils/colorUtils";
import { getTagColor, type TagColorsMap } from "../utils/tagUtils";

export type EventItem = {
  id: number;
  title: string;
  event_date: string;
  capacity: number;
  places_left: number;
  owner_id: number;
  owner_username: string;
  image_url: string | null;
  image_data_url: string | null;
  tags?: string[];
  tags_colors?: TagColorsMap;
  is_reserved: boolean;
};

export default function EventCard({
  ev,
  isOwner,
  canManage,
  onEdit,
  onDelete,
  onReserve,
  onUnreserve,
}: {
  ev: EventItem;
  isOwner: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReserve: () => void;
  onUnreserve: () => void;
}) {
  const isFull = ev.places_left === 0;
  const img = ev.image_data_url || ev.image_url;
  const hasImage = Boolean(img);
  const tags = Array.isArray(ev.tags) ? ev.tags : [];
  const tagColors = ev.tags_colors ?? {};

  return (
    <div
      className={`card ${isOwner ? "has-owner" : ""} ${
        hasImage ? "has-image" : "no-image"
      }`}
    >
      {isOwner && <span className="owner-badge">Ton événement</span>}

      <div
        className={`card-image ${img ? "has-image" : "placeholder"}`}
        style={img ? { backgroundImage: `url(${img})` } : undefined}
      />

      <h2>{ev.title}</h2>
      <p>Créé par : {ev.owner_username}</p>
      <p>Date : {formatDate(ev.event_date)}</p>

      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((tag) => {
            const color = getTagColor(tag, tagColors);
            const style = color
              ? {
                  backgroundColor: color,
                  color: getReadableTextColor(color),
                  borderColor: "transparent",
                }
              : undefined;
            return (
              <span
                key={`${ev.id}-${tag}`}
                className={`tag-chip ${color ? "tag-chip-colored" : ""}`}
                style={style}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}

      <span className="badge">
        {ev.places_left}/{ev.capacity} places
      </span>

      <div className="spacer" />

      <div className="card-actions">
        {canManage && (
          <button
            className="btn icon"
            onClick={onEdit}
            title="Modifier l'événement"
          >
            ✏️
          </button>
        )}
        {isOwner && (
          <button
            className="btn icon danger"
            onClick={onDelete}
            title="Supprimer l'événement"
          >
            🗑️
          </button>
        )}

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
            {isFull ? "Complet" : "S'inscrire"}
          </button>
        )}
      </div>
    </div>
  );
}
