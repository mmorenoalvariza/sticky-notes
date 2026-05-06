import { useCallback, useRef } from 'react';

/**
 * Generic pointer-drag hook.
 *
 * - Captures the pointer on the source element so subsequent move/up events are
 *   delivered to it even if the cursor leaves the element or the window.
 * - Handlers are read through a ref so the returned `onPointerDown` is stable
 *   and doesn't force re-renders downstream when the handlers' closures change.
 * - Generic `Ctx` lets each caller carry its own per-drag state (pointer offset,
 *   start size, etc.) without a separate ref.
 */

export type DragHandlers<Ctx> = {
  /** Called once on pointerdown. Return `false` to cancel (no listeners attached). */
  onStart: (event: React.PointerEvent<HTMLElement>) => Ctx | false;
  /** Called on every pointermove until release. Native event, with capture. */
  onMove: (event: PointerEvent, ctx: Ctx) => void;
  /** Called once on pointerup or pointercancel. */
  onEnd: (ctx: Ctx, cancelled: boolean) => void;
};

export function usePointerDrag<Ctx>(handlers: DragHandlers<Ctx>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  return useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    const ctx = handlersRef.current.onStart(event);
    if (ctx === false) return;

    const target = event.currentTarget;
    const pointerId = event.pointerId;

    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Some environments (very rare) don't support capture; we still attach
      // listeners — they'll fire as long as the cursor stays in window.
    }

    // Coalesce pointermove events with requestAnimationFrame: a high-rate
    // pointer (250+ Hz on modern hardware) would otherwise trigger one React
    // dispatch per event. rAF throttles to the display refresh rate.
    let pending: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      lastEvent = ev;
      if (pending !== null) return;
      pending = requestAnimationFrame(() => {
        pending = null;
        if (lastEvent) handlersRef.current.onMove(lastEvent, ctx);
      });
    };
    const finish = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (pending !== null) {
        cancelAnimationFrame(pending);
        pending = null;
      }
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', finish);
      target.removeEventListener('pointercancel', finish);
      try {
        target.releasePointerCapture(pointerId);
      } catch {
        // Already released; ignore.
      }
      handlersRef.current.onEnd(ctx, ev.type === 'pointercancel');
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', finish);
    target.addEventListener('pointercancel', finish);
  }, []);
}
