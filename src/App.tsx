import { useState } from 'react';

import { NotesProvider } from './notes/NotesContext';
import { PersistenceBridge } from './notes/PersistenceBridge';
import { loadSnapshot } from './notes/persistence';
import { initialState } from './notes/reducer';
import type { State } from './notes/types';

import { Toolbar } from './ui/Toolbar';
import { Workspace } from './ui/Workspace';
import styles from './App.module.css';

export function App() {
  // Hydrate synchronously from localStorage so there's no flash of empty
  // state. useState's lazy initializer guarantees this runs once.
  const [initial] = useState<State>(() => {
    const snapshot = loadSnapshot();
    if (!snapshot) return initialState;
    return { ...initialState, notes: snapshot.notes, order: snapshot.order };
  });

  return (
    <div className={styles.app}>
      <NotesProvider initial={initial}>
        <Toolbar />
        <Workspace />
        <PersistenceBridge />
      </NotesProvider>
    </div>
  );
}
