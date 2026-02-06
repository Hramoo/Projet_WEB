import Topbar from "./Topbar";
import EventControls from "./EventControls";

type TagItem = {
  tag: string;
  color?: string | null;
};

type Props = {
  userRole: "user" | "admin" | null;
  onAdd: () => void;
  onLogout: () => void;
  onAdmin: () => void;
  view: "upcoming" | "started";
  onViewChange: (view: "upcoming" | "started") => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  onResetTagFilter: () => void;
  allTags: TagItem[];
  selectedTags: string[];
};

export default function EventHeader({
  userRole,
  onAdd,
  onLogout,
  onAdmin,
  view,
  onViewChange,
  tagFilter,
  onTagFilterChange,
  onResetTagFilter,
  allTags,
  selectedTags,
}: Props) {
  return (
    <>
      <Topbar
        onAdd={onAdd}
        onLogout={onLogout}
        // IMPORTANT: ne pas afficher Admin tant qu'on n'a pas chargé le rôle
        isAdmin={userRole === "admin"}
        onAdmin={onAdmin}
      />

      <EventControls
        view={view}
        onViewChange={onViewChange}
        tagFilter={tagFilter}
        onTagFilterChange={onTagFilterChange}
        onResetTagFilter={onResetTagFilter}
        allTags={allTags}
        selectedTags={selectedTags}
      />
    </>
  );
}
