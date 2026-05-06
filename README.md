# Sticky Notes

Single-page sticky-notes app built with React 19 + TypeScript. Solution for a two-task
take-home assessment:

1. **Task 1** — sticky notes SPA implementing all 4 mandatory features and 4 of the 5
   bonus features (everything except the mock REST API).
2. **Task 2** — code review of `SimpleCache<K, V>`. The review is in
   [`SimpleCache.md`](./SimpleCache.md).

## Quick start

```sh
npm install
npm run dev      # http://localhost:5173/
```

```sh
npm run build    # tsc -b && vite build  → dist/
npm run preview  # serve the production build
```

Tested in latest Chrome, Firefox, Edge at 1024×768 and above.

## Implemented features

Mandatory:

- [x] **(1) Create note at specified position and size.** Drag on empty workspace area;
      a marquee shows the rectangle being drawn, and the new note is committed on release.
- [x] **(2) Resize note by dragging.** Bottom-right corner handle.
- [x] **(3) Move note by dragging.** Anywhere on the note body.
- [x] **(4) Remove note by dragging onto a trash zone.** Predefined area in the bottom-
      right of the workspace; it highlights when a note is over it, and releases delete.

Bonuses:

- [x] **(I) Edit note text.** Double-click the note body. `Esc` or click-out exits edit
      mode.
- [x] **(II) Bring to front on click.** Pointer-down on a note moves it to the top of the
      z-stack.
- [x] **(III) Persist to localStorage.** State is hydrated synchronously on mount; writes
      are debounced (250 ms) so a single drag doesn't issue dozens of synchronous writes.
- [x] **(IV) Multiple colors.** Yellow, pink, blue, green, lavender, picked from the
      toolbar and applied to the next created note.

Out of scope (deliberately, to fit the time budget):

- [ ] **(V) Async REST mock.** Same persistence boundary as localStorage — drop-in.

## Architecture description

The app is built around a single pure reducer (`src/notes/reducer.ts`) and a Context
provider (`src/notes/NotesContext.tsx`). Every piece of workspace state — the committed
notes, the z-order, **and** the transient drag session — lives in the reducer's `State`,
so the marquee, the moving-note preview, and the highlighted trash zone are all functions
of the same source. State and dispatch are exposed via two separate contexts so that
components which only dispatch (toolbar buttons, `usePointerDrag` callbacks) don't re-
render on every state change.

The drag system is implemented from scratch with native Pointer Events through a single
generic hook (`src/lib/usePointerDrag.ts`) reused by Workspace (create-by-marquee), Note
(move) and ResizeHandle (resize). On pointerdown the hook calls `setPointerCapture` so
subsequent move/up events are delivered even if the cursor leaves the element or the
window — the classic "lost mouseup" bug doesn't apply. Move events are coalesced through
`requestAnimationFrame` to avoid firing one React dispatch per high-rate pointer event
(modern hardware reports at 250+ Hz). The Note tracks pointer deltas in client
coordinates rather than workspace-local ones, which keeps the reducer free of layout-
dependent computations; only the create-marquee needs the workspace's bounding rect, and
it captures it once at drag start.

Trash detection is done from inside the Note's pointermove handler with
`document.elementsFromPoint(clientX, clientY)`, looking for any element marked with
`data-trash="true"`. This avoids coupling the Note component to a TrashZone ref or
context: the trash zone is a dumb visual that highlights when the reducer reports
`drag.overTrash`. Persistence (`src/notes/persistence.ts`) lives entirely outside the
reducer: the App owns a `PersistenceBridge` side-effect-only component that subscribes
to state and writes to localStorage with a small debounce. Stored snapshots are validated
on hydrate; corrupted or older-version data is silently discarded so the UI never crashes.

## Project layout

One folder per component under `src/ui/`. Each folder co-locates the
component's `.tsx`, its scoped `.module.css`, any private sub-components,
and an `index.ts` barrel so callers import the folder rather than a
specific file inside it.

```
src/
├── main.tsx                       React entry
├── App.tsx                        composition root only
├── App.module.css
├── styles/
│   ├── reset.css
│   └── tokens.css                 design tokens (colors, sizes)
├── notes/                         domain (types + reducer) + React adapters
│   ├── types.ts                   Note, DragSession, State, Action
│   ├── reducer.ts                 pure (State, Action) => State
│   ├── persistence.ts             localStorage load/save with validation
│   ├── NotesContext.tsx           Provider + useNotesState / useNotesDispatch
│   └── PersistenceBridge.tsx      side-effect-only: writes state to localStorage
├── ui/
│   ├── Workspace/                 canvas + create-marquee drag + ResizeObserver clamp
│   ├── Note/                      move drag, edit-text, color, over-trash opacity
│   │   ├── Note.tsx
│   │   ├── Note.module.css
│   │   ├── ResizeHandle.tsx       private sub-component (corner drag)
│   │   ├── ResizeHandle.module.css
│   │   └── index.ts
│   ├── Marquee/                   dashed rectangle while creating
│   ├── TrashZone/                 highlight when a note is over it
│   └── Toolbar/                   header + ColorPicker + usage hint
│       ├── Toolbar.tsx
│       ├── Toolbar.module.css
│       ├── ColorPicker.tsx        radiogroup wrapper around the swatches
│       ├── ColorPicker.module.css
│       ├── ColorSwatch.tsx        individual color button
│       ├── ColorSwatch.module.css
│       └── index.ts
└── lib/
    ├── usePointerDrag.ts          pointer-capture drag hook with rAF coalescing
    ├── geometry.ts                normalizeRect, rectArea, clamp
    └── id.ts                      crypto.randomUUID with fallback
```

## Decisions and trade-offs

- **No external UI / DnD libraries.** The brief explicitly asks to avoid readymade
  solutions. Everything below the React level is hand-written: drag system, marquee,
  resize, trash detection, color picker.
- **State management is `useReducer` + Context, not Zustand or Redux.** A single reducer
  is enough at this scale, and keeping it pure gives a clean boundary for testing
  without React.
- **Two separate contexts (state vs. dispatch).** Avoids the classic "every consumer re-
  renders on every dispatch" pitfall that a single combined context would cause, without
  pulling in `useSyncExternalStore` or a third-party store.
- **rAF coalescing in `usePointerDrag`.** Pointers on modern hardware fire at 250+ Hz; a
  React dispatch per move would do roughly four times more work than needed and
  introduce input lag for no benefit. One rAF per visible frame is enough.
- **`document.elementsFromPoint` for trash hit-testing.** Cheaper and looser-coupled than
  threading a TrashZone ref through context, and survives any future re-layout of the
  trash zone.
- **`crypto.randomUUID()` for note ids.** Collision-free across reloads and
  cross-device-friendly should the app ever need to sync.
- **CSS modules.** Scoped, zero-runtime, no extra dependency.

## Responsiveness

The app works fluidly down to 1024×768 (the spec minimum) and survives smaller widths
(e.g. when devtools opens). A `ResizeObserver` on the workspace dispatches a
`CLAMP_TO_VIEWPORT` action whenever its box changes, so notes that would otherwise be
clipped by `overflow: hidden` are pulled back inside the visible area. The clamp only
moves notes — it never shrinks them — because resizing is a manual action.

## Known limitations / what I'd add with more time

- **Tests for the reducer.** Reducer is pure; would add Vitest tests covering the
  drag-create / move / resize / delete-by-trash flows + the validity guards in
  `persistence.ts`.
- **Keyboard accessibility for move/resize.** The `<textarea>` is fully accessible, but
  drag-to-move/resize/trash has no keyboard equivalent.
- **Undo/redo.** Easy to add given the reducer shape: stack of past `State`s, but
  out of scope for the time budget.
