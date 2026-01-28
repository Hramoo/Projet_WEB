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
  is_reserved: boolean;
};

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

export default function EventCard({
  ev,
  isOwner,
  onEdit,
  onDelete,
  onReserve,
  onUnreserve,
}: {
  ev: EventItem;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReserve: () => void;
  onUnreserve: () => void;
}) {
  const isFull = ev.places_left === 0;

  // priorité à l’image stockée en DB (BYTEA), fallback sur l’URL
  const img = ev.image_data_url || ev.image_url;

  return (
    <div className="card">
      {img && (
        <div
          className="card-image"
          style={{ backgroundImage: `url(${img})` }}
        />
      )}

      <h2>{ev.title}</h2>
      <p>Créé par : {ev.owner_username}</p>
      <p>Date : {formatDate(ev.event_date)}</p>

      <span className="badge">
        {ev.places_left}/{ev.capacity} places
      </span>

      <div className="spacer" />

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {/* Actions OWNER */}
        {isOwner && (
          <>
            <button
              className="btn icon"
              onClick={onEdit}
              title="Modifier l’événement"
            >
              ✏️
            </button>
            <button
              className="btn icon danger"
              onClick={onDelete}
              title="Supprimer l’événement"
            >
              🗑️
            </button>
            <span className="badge">Ton événement</span>
          </>
        )}

        {/* Actions NON-OWNER */}
        {!isOwner &&
          (ev.is_reserved ? (
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
          ))}
      </div>
    </div>
  );
}
