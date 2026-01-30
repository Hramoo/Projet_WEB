export default function Topbar({
  onAdd,
  onLogout,
  isAdmin,
  onAdmin,
}: {
  onAdd: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  onAdmin: () => void;
}) {
  return (
    <header className="topbar">
      <h1 className="brand">EventSquare</h1>

      <div className="actions">
        {isAdmin && (
          <button className="btn soft" onClick={onAdmin}>
            Admin
          </button>
        )}

        <button className="btn soft" onClick={onAdd}>
          + Ajouter
        </button>

        <button className="btn primary" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
