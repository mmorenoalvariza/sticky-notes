import { normalizeRect, rectArea } from "../lib/geometry";
import {
  MIN_CREATE_AREA,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  type Action,
  type Note,
  type State,
} from "./types";

export const initialState: State = {
  notes: {},
  order: [],
  drag: null,
  nextColor: "yellow",
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        notes: action.payload.notes,
        order: action.payload.order,
        drag: null,
      };

    case "SET_NEXT_COLOR":
      return { ...state, nextColor: action.color };

    case "BRING_TO_FRONT": {
      const idx = state.order.indexOf(action.id);
      if (idx === -1 || idx === state.order.length - 1) return state;
      const order = [...state.order];
      order.splice(idx, 1);
      order.push(action.id);
      return { ...state, order };
    }

    case "SET_TEXT": {
      const note = state.notes[action.id];
      if (!note) return state;
      return {
        ...state,
        notes: { ...state.notes, [action.id]: { ...note, text: action.text } },
      };
    }

    case "DELETE_NOTE":
      return deleteNote(state, action.id);

    case "CLAMP_TO_VIEWPORT": {
      // Keep each note fully inside the visible workspace. If a note is wider
      // than the workspace, just snap its left edge to 0 (we don't shrink the
      // note — the user can always resize it manually).
      const { width, height } = action;
      const next: Record<string, Note> = {};
      let changed = false;
      for (const id of state.order) {
        const note = state.notes[id];
        if (!note) continue;
        const maxX = Math.max(0, width - note.width);
        const maxY = Math.max(0, height - note.height);
        const nextX = Math.max(0, Math.min(note.x, maxX));
        const nextY = Math.max(0, Math.min(note.y, maxY));
        if (nextX !== note.x || nextY !== note.y) {
          next[id] = { ...note, x: nextX, y: nextY };
          changed = true;
        } else {
          next[id] = note;
        }
      }
      return changed ? { ...state, notes: next } : state;
    }

    case "DRAG_CREATE_START":
      return {
        ...state,
        drag: {
          kind: "create",
          startX: action.x,
          startY: action.y,
          currentX: action.x,
          currentY: action.y,
          color: state.nextColor,
        },
      };

    case "DRAG_CREATE_UPDATE":
      if (state.drag?.kind !== "create") return state;
      return {
        ...state,
        drag: { ...state.drag, currentX: action.x, currentY: action.y },
      };

    case "DRAG_CREATE_END": {
      if (state.drag?.kind !== "create") return state;
      const rect = normalizeRect(
        state.drag.startX,
        state.drag.startY,
        state.drag.currentX,
        state.drag.currentY,
      );
      if (rectArea(rect) < MIN_CREATE_AREA) {
        return { ...state, drag: null };
      }
      const note: Note = {
        id: action.id,
        x: rect.x,
        y: rect.y,
        width: Math.max(MIN_NOTE_WIDTH, rect.width),
        height: Math.max(MIN_NOTE_HEIGHT, rect.height),
        text: "",
        color: state.drag.color,
      };
      return {
        ...state,
        notes: { ...state.notes, [note.id]: note },
        order: [...state.order, note.id],
        drag: null,
      };
    }

    case "DRAG_MOVE_START": {
      const note = state.notes[action.id];
      if (!note) return state;
      return {
        ...state,
        drag: {
          kind: "move",
          noteId: action.id,
          startX: note.x,
          startY: note.y,
          deltaX: 0,
          deltaY: 0,
          overTrash: false,
        },
      };
    }

    case "DRAG_MOVE_UPDATE":
      if (state.drag?.kind !== "move") return state;
      return {
        ...state,
        drag: {
          ...state.drag,
          deltaX: action.deltaX,
          deltaY: action.deltaY,
          overTrash: action.overTrash,
        },
      };

    case "DRAG_MOVE_END": {
      if (state.drag?.kind !== "move") return state;
      const drag = state.drag;
      if (drag.overTrash) {
        return deleteNote({ ...state, drag: null }, drag.noteId);
      }
      const note = state.notes[drag.noteId];
      if (!note) return { ...state, drag: null };
      return {
        ...state,
        notes: {
          ...state.notes,
          [drag.noteId]: {
            ...note,
            x: drag.startX + drag.deltaX,
            y: drag.startY + drag.deltaY,
          },
        },
        drag: null,
      };
    }

    case "DRAG_RESIZE_START": {
      const note = state.notes[action.id];
      if (!note) return state;
      return {
        ...state,
        drag: {
          kind: "resize",
          noteId: action.id,
          startWidth: note.width,
          startHeight: note.height,
          deltaX: 0,
          deltaY: 0,
        },
      };
    }

    case "DRAG_RESIZE_UPDATE":
      if (state.drag?.kind !== "resize") return state;
      return {
        ...state,
        drag: { ...state.drag, deltaX: action.deltaX, deltaY: action.deltaY },
      };

    case "DRAG_RESIZE_END": {
      if (state.drag?.kind !== "resize") return state;
      const drag = state.drag;
      const note = state.notes[drag.noteId];
      if (!note) return { ...state, drag: null };
      return {
        ...state,
        notes: {
          ...state.notes,
          [drag.noteId]: {
            ...note,
            width: Math.max(MIN_NOTE_WIDTH, drag.startWidth + drag.deltaX),
            height: Math.max(MIN_NOTE_HEIGHT, drag.startHeight + drag.deltaY),
          },
        },
        drag: null,
      };
    }
  }
}

function deleteNote(state: State, id: string): State {
  if (!state.notes[id]) return state;
  const { [id]: _removed, ...rest } = state.notes;
  void _removed;
  return {
    ...state,
    notes: rest,
    order: state.order.filter((x) => x !== id),
    drag:
      state.drag && "noteId" in state.drag && state.drag.noteId === id
        ? null
        : state.drag,
  };
}
