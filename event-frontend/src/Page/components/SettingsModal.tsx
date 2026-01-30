import { useMemo, useState } from "react";

export type UserSettings = {
  theme: "light" | "dark";
  primary_color: string; // #RRGGBB
  compact: boolean;
  show_images: boolean;
};

function isHexColor(s: string) {
  return /^#[0-9a-fA-F]{6}$/.test(s.trim());
}

export default function SettingsModal({
  value,
  onClose,
  onChange,
}: {
  value: UserSettings;
  onClose: () => void;
  onChange: (next: UserSettings) => void;
}) {
  const [draft, setDraft] = useState<UserSettings>(value);
  const colorOk = useMemo(() => isHexColor(draft.primary_color), [draft.primary_color]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>Personnalisation</strong>
          <button className="btn soft" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div className="modal-body">
          <label>
            Thème
            <select
              value={draft.theme}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  theme: e.target.value === "dark" ? "dark" : "light",
                }))
              }
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </label>

          <label>
            Couleur principale
            <input
              value={draft.primary_color}
              onChange={(e) =>
                setDraft((p) => ({ ...p, primary_color: e.target.value }))
              }
              placeholder="#111827"
            />
            {!colorOk && (
              <small style={{ color: "#dc2626", fontWeight: 700 }}>
                Format attendu : #RRGGBB
              </small>
            )}
          </label>

          <label style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={draft.compact}
              onChange={(e) => setDraft((p) => ({ ...p, compact: e.target.checked }))}
            />
            Mode compact
          </label>

          <label style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={draft.show_images}
              onChange={(e) => setDraft((p) => ({ ...p, show_images: e.target.checked }))}
            />
            Afficher les images
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn soft" onClick={onClose}>
            Annuler
          </button>
          <button
            className={`btn primary ${!colorOk ? "disabled" : ""}`}
            disabled={!colorOk}
            onClick={() => onChange(draft)}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
