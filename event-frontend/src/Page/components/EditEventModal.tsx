import React from "react";

type FormState = {
  title: string;
  date: string;
  capacity: string;
  imageUrl: string;
};

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EditEventModal({ form, setForm, onClose, onSubmit }: Props) {
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>Modifier l’événement</h3>
          <button type="button" className="btn soft" onClick={onClose}>
            Fermer
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <label>
            Titre
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </label>

          <label>
            Capacité
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
              required
            />
          </label>

          <label>
            Image (URL)
            <input
              placeholder="https://images.unsplash.com/..."
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
            />
          </label>

          <div className="modal-footer">
            <button type="submit" className="btn primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
