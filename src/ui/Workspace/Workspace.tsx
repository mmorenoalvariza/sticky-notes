import { useEffect, useRef } from 'react';

import { newId } from '../../lib/id';
import { usePointerDrag } from '../../lib/usePointerDrag';
import { useNotesDispatch, useNotesState } from '../../notes/NotesContext';

import { Marquee } from '../Marquee';
import { Note } from '../Note';
import { TrashZone } from '../TrashZone';
import styles from './Workspace.module.css';

type DragCtx = { rect: DOMRect };

/**
 * The drawing canvas. Owns the pointer-down handler that starts a "create"
 * drag when the user clicks on empty space. Notes intercept the pointer for
 * their own move/resize drags via their own handlers; we filter on
 * `event.target === event.currentTarget` to know whether we're clicking the
 * canvas itself or a child note.
 */
export function Workspace() {
  const state = useNotesState();
  const dispatch = useNotesDispatch();
  const ref = useRef<HTMLDivElement | null>(null);

  // Whenever the workspace's box changes (window resize, devtools opening,
  // toolbar wrap, etc.) clamp every note back inside the visible area.
  // ResizeObserver fires once initially too, so this also runs on mount.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = null;
        dispatch({ type: 'CLAMP_TO_VIEWPORT', width, height });
      });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [dispatch]);

  const onPointerDown = usePointerDrag<DragCtx>({
    onStart: (event) => {
      if (event.target !== event.currentTarget) return false;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      dispatch({ type: 'DRAG_CREATE_START', x, y });
      return { rect };
    },
    onMove: (event, ctx) => {
      const x = event.clientX - ctx.rect.left;
      const y = event.clientY - ctx.rect.top;
      dispatch({ type: 'DRAG_CREATE_UPDATE', x, y });
    },
    onEnd: () => {
      dispatch({ type: 'DRAG_CREATE_END', id: newId() });
    },
  });

  return (
    <div ref={ref} className={styles.workspace} onPointerDown={onPointerDown}>
      {state.order.map((id) => {
        const note = state.notes[id];
        if (!note) return null;
        return <Note key={id} note={note} />;
      })}
      <Marquee />
      <TrashZone />
    </div>
  );
}
