import { useEffect, useRef } from 'react';

import { useNotesState } from './NotesContext';
import { saveSnapshot } from './persistence';

const PERSIST_DEBOUNCE_MS = 250;

/**
 * Side-effect-only component: subscribes to state and writes the persistable
 * slice (notes + order) to localStorage with a small debounce so a single
 * drag gesture doesn't issue dozens of synchronous writes.
 *
 * Renders nothing. Mount it once inside `NotesProvider`.
 */
export function PersistenceBridge() {
  const state = useNotesState();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      saveSnapshot({ notes: state.notes, order: state.order });
      timerRef.current = null;
    }, PERSIST_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.notes, state.order]);

  return null;
}
