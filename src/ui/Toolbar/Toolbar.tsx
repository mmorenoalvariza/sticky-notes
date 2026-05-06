import { ColorPicker } from './ColorPicker';
import styles from './Toolbar.module.css';

export function Toolbar() {
  return (
    <header className={styles.toolbar}>
      <h1 className={styles.title}>Sticky Notes</h1>
      <div className={styles.spacer} />
      <ColorPicker />
      <div className={styles.hint}>
        Drag on the canvas to create. Drag a note to move it. Drag the corner
        to resize. Drag onto trash to delete. Double-click to edit.
      </div>
    </header>
  );
}
