export default function Topbar({
  onAdd,
  onLogout,
}: {
  onAdd: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <h1 className="brand">EventSquare</h1>
      <div className="actions">
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
