import EventCard, { type EventItem } from "./EventCard";

type Props = {
  events: EventItem[];
  userId: number | null;
  userRole: "user" | "admin" | null;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onReserve: (id: number) => void;
  onUnreserve: (id: number) => void;
};

export default function EventGrid({
  events,
  userId,
  userRole,
  onEdit,
  onDelete,
  onReserve,
  onUnreserve,
}: Props) {
  return (
    <div className="grid">
      {events.map((ev) => {
        const isOwner = userId !== null && Number(ev.owner_id) === Number(userId);
        const canManage = isOwner || userRole === "admin";

        return (
          <EventCard
            key={ev.id}
            ev={ev}
            isOwner={isOwner}
            canManage={canManage}
            onEdit={() => onEdit(ev)}
            onDelete={() => onDelete(ev)}
            onReserve={() => onReserve(ev.id)}
            onUnreserve={() => onUnreserve(ev.id)}
          />
        );
      })}
    </div>
  );
}
