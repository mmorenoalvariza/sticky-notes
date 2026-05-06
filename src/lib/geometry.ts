export type Rect = { x: number; y: number; width: number; height: number };

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Build a positive-area rect from two arbitrary corner points. */
export function normalizeRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Rect {
  const x = Math.min(ax, bx);
  const y = Math.min(ay, by);
  const width = Math.abs(bx - ax);
  const height = Math.abs(by - ay);
  return { x, y, width, height };
}

export function rectArea(r: Rect): number {
  return r.width * r.height;
}
