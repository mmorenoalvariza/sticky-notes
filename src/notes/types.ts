/**
 * Domain types for the sticky-notes workspace.
 *
 * The reducer in `reducer.ts` is the only place that mutates `State`; everything
 * else dispatches `Action`s. Transient drag state lives here too so that all
 * derived UI (the marquee, the moving-note preview, the highlighted trash zone)
 * is rendered from a single source of truth.
 */

export const COLORS = ['yellow', 'pink', 'blue', 'green', 'lavender'] as const;
export type Color = (typeof COLORS)[number];

export type Note = {
  id: string;
  x: number; // workspace-local px, top-left
  y: number;
  width: number;
  height: number;
  text: string;
  color: Color;
};

export type DragSession =
  | {
      // Create-by-marquee on empty workspace area. Coords are workspace-local
      // because we need an absolute position for the new note's top-left.
      kind: 'create';
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      color: Color;
    }
  | {
      // Move and resize use pointer deltas only — no workspace coordinate
      // conversion needed at the reducer level. The Note component reads
      // `start{X,Y,Width,Height}` from the committed state and adds the delta.
      kind: 'move';
      noteId: string;
      startX: number; // note.x at drag start (snapshot)
      startY: number;
      deltaX: number;
      deltaY: number;
      overTrash: boolean;
    }
  | {
      kind: 'resize';
      noteId: string;
      startWidth: number;
      startHeight: number;
      deltaX: number;
      deltaY: number;
    };

export type State = {
  notes: Record<string, Note>;
  order: string[]; // last entry renders on top
  drag: DragSession | null;
  nextColor: Color;
};

export type Action =
  | { type: 'HYDRATE'; payload: { notes: Record<string, Note>; order: string[] } }
  | { type: 'SET_NEXT_COLOR'; color: Color }
  | { type: 'BRING_TO_FRONT'; id: string }
  | { type: 'SET_TEXT'; id: string; text: string }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'CLAMP_TO_VIEWPORT'; width: number; height: number }
  | { type: 'DRAG_CREATE_START'; x: number; y: number }
  | { type: 'DRAG_CREATE_UPDATE'; x: number; y: number }
  | { type: 'DRAG_CREATE_END'; id: string } // id provided by caller (crypto.randomUUID)
  | { type: 'DRAG_MOVE_START'; id: string }
  | { type: 'DRAG_MOVE_UPDATE'; deltaX: number; deltaY: number; overTrash: boolean }
  | { type: 'DRAG_MOVE_END' }
  | { type: 'DRAG_RESIZE_START'; id: string }
  | { type: 'DRAG_RESIZE_UPDATE'; deltaX: number; deltaY: number }
  | { type: 'DRAG_RESIZE_END' };

export const MIN_NOTE_WIDTH = 60;
export const MIN_NOTE_HEIGHT = 40;
/** Below this footprint at drag-create time, we cancel the new note. */
export const MIN_CREATE_AREA = 24 * 24;
