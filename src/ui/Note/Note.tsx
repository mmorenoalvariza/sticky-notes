import { useState, type KeyboardEvent, type PointerEvent } from 'react';

import { usePointerDrag } from '../../lib/usePointerDrag';
import { useNotesDispatch, useNotesState } from '../../notes/NotesContext';
import {
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  type Note as NoteType,
} from '../../notes/types';

import { ResizeHandle } from './ResizeHandle';
import styles from './Note.module.css';

const TRASH_SELECTOR = '[data-trash="true"]';

function isPointOverTrash(clientX: number, clientY: number): boolean {
  // We hit-test against the trash zone's bounding rect rather than using
  // `document.elementsFromPoint`, because the trash zone has
  // `pointer-events: none` so create-marquee drags can still be initiated on
  // top of it from the Workspace. Bounding-rect check is independent of the
  // pointer-events stacking and survives any future stacking/CSS changes.
  const trash = document.querySelector(TRASH_SELECTOR);
  if (!trash) return false;
  const rect = trash.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

type DragCtx = { startClientX: number; startClientY: number };

export function Note({ note }: { note: NoteType }) {
  const state = useNotesState();
  const dispatch = useNotesDispatch();
  const [editing, setEditing] = useState(false);

  // Live render values: committed state plus any in-flight drag delta.
  const drag = state.drag;
  const isMoving = drag?.kind === 'move' && drag.noteId === note.id;
  const isResizing = drag?.kind === 'resize' && drag.noteId === note.id;

  const x = isMoving ? drag.startX + drag.deltaX : note.x;
  const y = isMoving ? drag.startY + drag.deltaY : note.y;
  const width = isResizing
    ? Math.max(MIN_NOTE_WIDTH, drag.startWidth + drag.deltaX)
    : note.width;
  const height = isResizing
    ? Math.max(MIN_NOTE_HEIGHT, drag.startHeight + drag.deltaY)
    : note.height;

  const overTrash = isMoving && drag.overTrash;

  const onPointerDown = usePointerDrag<DragCtx>({
    onStart: (event) => {
      // Editing mode: let the textarea handle clicks normally.
      if (editing) return false;
      dispatch({ type: 'BRING_TO_FRONT', id: note.id });
      dispatch({ type: 'DRAG_MOVE_START', id: note.id });
      return { startClientX: event.clientX, startClientY: event.clientY };
    },
    onMove: (event, ctx) => {
      const deltaX = event.clientX - ctx.startClientX;
      const deltaY = event.clientY - ctx.startClientY;
      dispatch({
        type: 'DRAG_MOVE_UPDATE',
        deltaX,
        deltaY,
        overTrash: isPointOverTrash(event.clientX, event.clientY),
      });
    },
    onEnd: () => {
      dispatch({ type: 'DRAG_MOVE_END' });
    },
  });

  function onTextareaPointerDown(event: PointerEvent<HTMLTextAreaElement>) {
    // Stop the wrapper's pointer-down from kicking off a drag while editing.
    event.stopPropagation();
  }

  function onTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  }

  return (
    <div
      className={styles.note}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: `var(--note-${note.color})`,
        opacity: overTrash ? 0.5 : 1,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          className={styles.editor}
          autoFocus
          value={note.text}
          onChange={(e) =>
            dispatch({ type: 'SET_TEXT', id: note.id, text: e.target.value })
          }
          onBlur={() => setEditing(false)}
          onKeyDown={onTextareaKeyDown}
          onPointerDown={onTextareaPointerDown}
          placeholder="Type something…"
        />
      ) : (
        <div className={styles.text}>
          {note.text || (
            <span className={styles.placeholder}>Double-click to edit</span>
          )}
        </div>
      )}
      <ResizeHandle noteId={note.id} />
    </div>
  );
}
