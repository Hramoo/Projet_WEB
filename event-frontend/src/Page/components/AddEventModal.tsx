import React from "react";

import { getReadableTextColor } from "../utils/colorUtils";
import {
  buildTagColors,
  pickColor,
  toTags,
  type TagColorsMap,
} from "../utils/tagUtils";

type FormState = {
  title: string;
  date: string;
  capacity: string;
  imageUrl: string;
  tags: string;
  tagColors: TagColorsMap;
};

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function AddEventModal({ form, setForm, onClose, onSubmit }: Props) {
  const previewTags = toTags(form.tags);
  const previewColors = buildTagColors(previewTags, form.tagColors);

  const handleTagsChange = (value: string) => {
    const tags = toTags(value);
    setForm((p) => ({
      ...p,
      tags: value,
      tagColors: buildTagColors(tags, p.tagColors),
    }));
  };

  const handleColorChange = (tag: string, color: string) => {
    setForm((p) => ({
      ...p,
      tagColors: { ...p.tagColors, [tag]: color },
    }));
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>Ajouter un événement</h3>
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

          <label>
            Tags (séparés par des virgules)
            <input
              placeholder="tech, meetup, devops"
              value={form.tags}
              onChange={(e) => handleTagsChange(e.target.value)}
            />
          </label>

          {previewTags.length > 0 && (
            <div className="tag-color-list">
              {previewTags.map((tag) => {
                const color = previewColors[tag] || pickColor(tag);
                return (
                  <div key={`add-${tag}`} className="tag-color-item">
                    <span
                      className="tag-chip tag-chip-colored"
                      style={{
                        backgroundColor: color,
                        color: getReadableTextColor(color),
                        borderColor: "transparent",
                      }}
                    >
                      {tag}
                    </span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(tag, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="modal-footer">
            <button type="submit" className="btn primary">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
