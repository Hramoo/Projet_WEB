type Props = {
  view: "upcoming" | "started";
};

export default function EmptyState({ view }: Props) {
  return (
    <p className="empty-state">
      {view === "started"
        ? "Aucun événement déjà commencé."
        : "Aucun événement à venir."}
    </p>
  );
}
