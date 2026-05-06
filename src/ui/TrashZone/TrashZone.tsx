import { useNotesState } from '../../notes/NotesContext';
import styles from './TrashZone.module.css';

/**
 * Predefined drop area. Detection uses the `data-trash="true"` attribute and
 * `getBoundingClientRect` from inside the moving Note, so this component
 * doesn't need to register listeners — it only renders.
 */
export function TrashZone() {
  const { drag } = useNotesState();
  const active = drag?.kind === 'move' && drag.overTrash;
  return (
    <div
      className={`${styles.zone} ${active ? styles.active : ''}`}
      data-trash="true"
      aria-label="Drop here to delete"
    >
      <div className={styles.label}>{active ? 'Release to delete' : 'Trash'}</div>
    </div>
  );
}
