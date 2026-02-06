import React from "react";

import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";
import type { EventItem } from "./EventCard";
import type { TagColorsMap } from "../utils/tagUtils";

type FormState = {
  title: string;
  date: string;
  capacity: string;
  imageUrl: string;
  tags: string;
  tagColors: TagColorsMap;
};

type Props = {
  isAddOpen: boolean;
  addForm: FormState;
  setAddForm: React.Dispatch<React.SetStateAction<FormState>>;
  onAddSubmit: (e: React.FormEvent) => void;
  onCloseAdd: () => void;
  isEditOpen: boolean;
  editTarget: EventItem | null;
  editForm: FormState;
  setEditForm: React.Dispatch<React.SetStateAction<FormState>>;
  onEditSubmit: (e: React.FormEvent) => void;
  onCloseEdit: () => void;
};

export default function EventModals({
  isAddOpen,
  addForm,
  setAddForm,
  onAddSubmit,
  onCloseAdd,
  isEditOpen,
  editTarget,
  editForm,
  setEditForm,
  onEditSubmit,
  onCloseEdit,
}: Props) {
  return (
    <>
      {isAddOpen && (
        <AddEventModal
          form={addForm}
          setForm={setAddForm}
          onClose={onCloseAdd}
          onSubmit={onAddSubmit}
        />
      )}

      {isEditOpen && editTarget && (
        <EditEventModal
          form={editForm}
          setForm={setEditForm}
          onClose={onCloseEdit}
          onSubmit={onEditSubmit}
        />
      )}
    </>
  );
}
