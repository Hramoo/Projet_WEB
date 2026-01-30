export default function Topbar({
  onAdd,
  onLogout,
  onSettings,
}: {
  onAdd: () => void;
  onLogout: () => void;
  onSettings: () => void;
}) {
  return (
    <header className="topbar">
      <h1 className="brand">EventSquare</h1>

      <div className="actions">
        <button className="btn soft" onClick={onSettings}>
          Personnaliser
        </button>

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
