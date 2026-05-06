import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import { initialState, reducer } from './reducer';
import type { Action, State } from './types';

/**
 * State and dispatch are exposed via two separate contexts.
 *
 * Components that only dispatch (toolbar buttons, the workspace's pointer-down
 * handler) subscribe to `DispatchContext` only and never re-render when state
 * changes. Components that need state (the Note list, marquee, trash zone)
 * subscribe to `StateContext`. This avoids the classic "every consumer of the
 * combined context re-renders on every dispatch" pitfall without bringing in
 * a state-management library.
 */
const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function NotesProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: State;
}) {
  const [state, dispatch] = useReducer(reducer, initial ?? initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useNotesState(): State {
  const ctx = useContext(StateContext);
  if (ctx === null) throw new Error('useNotesState must be used inside NotesProvider');
  return ctx;
}

export function useNotesDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (ctx === null) throw new Error('useNotesDispatch must be used inside NotesProvider');
  return ctx;
}
