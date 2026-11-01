/** Undo stacks for the planner. The present value lives in React state. */

export function recordPast<T>(past: T[], present: T, limit = 40): T[] {
  const cap = Math.max(1, Math.floor(limit) || 1);
  return [...past, present].slice(-cap);
}

export function undoStacks<T>(past: T[], present: T, future: T[]): { past: T[]; present: T; future: T[] } | null {
  if (past.length === 0) return null;
  const previous = past[past.length - 1];
  if (previous === undefined) return null;
  return { past: past.slice(0, -1), present: previous, future: [...future, present] };
}

export function redoStacks<T>(past: T[], present: T, future: T[]): { past: T[]; present: T; future: T[] } | null {
  if (future.length === 0) return null;
  const next = future[future.length - 1];
  if (next === undefined) return null;
  return { past: [...past, present], present: next, future: future.slice(0, -1) };
}
