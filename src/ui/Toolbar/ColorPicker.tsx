import { useNotesDispatch, useNotesState } from '../../notes/NotesContext';
import { COLORS } from '../../notes/types';

import { ColorSwatch } from './ColorSwatch';
import styles from './ColorPicker.module.css';

/**
 * Group of color buttons. The selected one is the color the next created note
 * will use. Behaves as a single radio-group from the a11y point of view.
 */
export function ColorPicker() {
  const state = useNotesState();
  const dispatch = useNotesDispatch();
  return (
    <div
      className={styles.colorPicker}
      role="radiogroup"
      aria-label="Note color"
    >
      {COLORS.map((c) => (
        <ColorSwatch
          key={c}
          color={c}
          selected={state.nextColor === c}
          onSelect={() => dispatch({ type: 'SET_NEXT_COLOR', color: c })}
        />
      ))}
    </div>
  );
}
