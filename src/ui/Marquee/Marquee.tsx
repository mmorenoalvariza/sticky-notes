import { useNotesState } from '../../notes/NotesContext';
import { normalizeRect } from '../../lib/geometry';
import styles from './Marquee.module.css';

/** Dashed rectangle drawn while the user is dragging to create a new note. */
export function Marquee() {
  const { drag } = useNotesState();
  if (drag?.kind !== 'create') return null;
  const rect = normalizeRect(drag.startX, drag.startY, drag.currentX, drag.currentY);
  return (
    <div
      className={styles.marquee}
      style={{
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        background: `var(--note-${drag.color})`,
      }}
    />
  );
}
