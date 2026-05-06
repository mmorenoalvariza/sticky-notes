import { COLORS, type Color, type Note } from './types';

const STORAGE_KEY = 'sticky-notes/v1';

type Snapshot = {
  notes: Record<string, Note>;
  order: string[];
};

/**
 * Validate a parsed snapshot. We don't trust localStorage: it can be edited by
 * the user, corrupted, or written by an older app version. If anything looks
 * off, we throw away the data and start fresh rather than crash the UI.
 */
function isValidSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.order)) return false;
  if (typeof v.notes !== 'object' || v.notes === null) return false;
  const notes = v.notes as Record<string, unknown>;
  for (const id of v.order) {
    if (typeof id !== 'string') return false;
    const n = notes[id];
    if (!isValidNote(n)) return false;
  }
  return true;
}

function isValidNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    typeof n.id === 'string' &&
    typeof n.x === 'number' &&
    typeof n.y === 'number' &&
    typeof n.width === 'number' &&
    typeof n.height === 'number' &&
    typeof n.text === 'string' &&
    typeof n.color === 'string' &&
    (COLORS as readonly string[]).includes(n.color as Color)
  );
}

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage can throw on quota exceeded or in private mode. Silently
    // give up: the app keeps working in-memory.
  }
}
