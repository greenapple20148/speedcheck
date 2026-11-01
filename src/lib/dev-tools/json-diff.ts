import { typeName } from "@/lib/dev-tools/json";

export interface DiffEntry {
  kind: "added" | "removed" | "modified";
  path: string;
  left?: unknown;
  right?: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childPath(parent: string, key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return `${parent}.${key}`;
  return `${parent}[${JSON.stringify(key)}]`;
}

function preview(value: unknown): string {
  const text = JSON.stringify(value) ?? "undefined";
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

/**
 * Structural compare. Object key order is ignored. Arrays are compared by index.
 * Number 1 and string "1" are different.
 */
export function diffJson(left: unknown, right: unknown): DiffEntry[] {
  const changes: DiffEntry[] = [];
  walk("$", left, right, changes);
  return changes;
}

function walk(path: string, left: unknown, right: unknown, changes: DiffEntry[]) {
  if (isPlainObject(left) && isPlainObject(right)) {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const key of [...Object.keys(left), ...Object.keys(right)]) {
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
    for (const key of keys) {
      const next = childPath(path, key);
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
      const hasRight = Object.prototype.hasOwnProperty.call(right, key);
      if (!hasLeft) changes.push({ kind: "added", path: next, right: right[key] });
      else if (!hasRight) changes.push({ kind: "removed", path: next, left: left[key] });
      else walk(next, left[key], right[key], changes);
    }
    return;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    const count = Math.max(left.length, right.length);
    for (let index = 0; index < count; index += 1) {
      const next = `${path}[${index}]`;
      if (index >= left.length) changes.push({ kind: "added", path: next, right: right[index] });
      else if (index >= right.length) changes.push({ kind: "removed", path: next, left: left[index] });
      else walk(next, left[index], right[index], changes);
    }
    return;
  }
  if (typeName(left) !== typeName(right) || !Object.is(left, right)) {
    changes.push({ kind: "modified", path, left, right });
  }
}

export function summarizeDiff(changes: DiffEntry[]): string {
  if (changes.length === 0) {
    return "No structural differences.\nObject key order is ignored. Arrays are compared by index.";
  }
  const lines = [
    `${changes.length} structural ${changes.length === 1 ? "change" : "changes"}.`,
    "",
  ];
  for (const change of changes) {
    if (change.kind === "added") lines.push(`Added ${change.path} = ${preview(change.right)}`);
    if (change.kind === "removed") lines.push(`Removed ${change.path} = ${preview(change.left)}`);
    if (change.kind === "modified") {
      lines.push(
        `Modified ${change.path}: ${preview(change.left)} (${typeName(change.left)}) → ${preview(change.right)} (${typeName(change.right)})`,
      );
    }
  }
  lines.push("", "Object key order is ignored. Arrays are compared by index.");
  return lines.join("\n");
}
