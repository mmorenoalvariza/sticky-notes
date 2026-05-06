import { usePointerDrag } from '../../lib/usePointerDrag';
import { useNotesDispatch } from '../../notes/NotesContext';
import styles from './ResizeHandle.module.css';

type DragCtx = { startClientX: number; startClientY: number };

export function ResizeHandle({ noteId }: { noteId: string }) {
  const dispatch = useNotesDispatch();

  const onPointerDown = usePointerDrag<DragCtx>({
    onStart: (event) => {
      // Stop the parent Note's onPointerDown from also firing (which would
      // start a move drag).
      event.stopPropagation();
      dispatch({ type: 'DRAG_RESIZE_START', id: noteId });
      return { startClientX: event.clientX, startClientY: event.clientY };
    },
    onMove: (event, ctx) => {
      const deltaX = event.clientX - ctx.startClientX;
      const deltaY = event.clientY - ctx.startClientY;
      dispatch({ type: 'DRAG_RESIZE_UPDATE', deltaX, deltaY });
    },
    onEnd: () => {
      dispatch({ type: 'DRAG_RESIZE_END' });
    },
  });

  return (
    <div
      className={styles.handle}
      onPointerDown={onPointerDown}
      aria-label="Resize note"
    />
  );
}
