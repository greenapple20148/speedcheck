/** Nudge label boxes so they overlap less. Stored coordinates are not changed. */

export interface LabelBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function nudgeLabels(boxes: LabelBox[]): Record<string, { dx: number; dy: number }> {
  const placed: LabelBox[] = [];
  const offsets: Record<string, { dx: number; dy: number }> = {};
  for (const box of boxes) {
    let dy = 0;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const trial = { ...box, y: box.y + dy };
      const hit = placed.find((other) => overlaps(trial, other));
      if (!hit) break;
      dy += Math.max(0.4, hit.h * 0.9);
    }
    offsets[box.id] = { dx: 0, dy };
    placed.push({ ...box, y: box.y + dy });
  }
  return offsets;
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
