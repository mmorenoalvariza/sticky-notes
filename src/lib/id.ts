/**
 * Tiny ID generator. Uses the Web Crypto API where available (all our target
 * browsers); falls back to a non-cryptographic random for older environments.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
