import { sizeError } from "@/lib/dev-tools/limits";

export interface JsonFailure {
  ok: false;
  error: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface JsonStats {
  bytes: number;
  characters: number;
  type: string;
  keys: number;
  depth: number;
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
}

export function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  const bKeys = Object.keys(bRecord);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bRecord, key)) return false;
    if (!deepEqual(aRecord[key], bRecord[key])) return false;
  }
  return true;
}

/** Map a JSON.parse position, or the line and column when the engine includes them. */
export function locateJsonError(
  text: string,
  message: string,
): { line?: number; column?: number; position?: number } {
  const match = /position\s+(\d+)(?:\s+\(line\s+(\d+)\s+column\s+(\d+)\))?/i.exec(message);
  if (!match) return {};
  const position = Number(match[1]);
  if (match[2] && match[3]) {
    return { position, line: Number(match[2]), column: Number(match[3]) };
  }
  let line = 1;
  let column = 1;
  const end = Math.min(Math.max(position, 0), text.length);
  for (let i = 0; i < end; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { position, line, column };
}

export function parseJson(input: string): { ok: true; value: unknown } | JsonFailure {
  const tooBig = sizeError(input);
  if (tooBig) return { ok: false, error: tooBig };
  if (input.trim() === "") return { ok: false, error: "Enter JSON to continue." };
  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    const located = locateJsonError(input, message);
    const where =
      located.line && located.column ? ` Line ${located.line}, column ${located.column}.` : "";
    return { ok: false, error: `Invalid JSON.${where} ${message}`.replace(/\s+/g, " ").trim(), ...located };
  }
}

export function formatJsonText(
  input: string,
  space: 2 | 4,
): ({ ok: true; text: string; value: unknown } & { stats: JsonStats }) | JsonFailure {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const text = JSON.stringify(parsed.value, null, space) ?? "";
  return { ok: true, text, value: parsed.value, stats: jsonStats(parsed.value, text) };
}

export function minifyJsonText(
  input: string,
): ({ ok: true; text: string; value: unknown } & { stats: JsonStats }) | JsonFailure {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  const text = JSON.stringify(parsed.value) ?? "";
  return { ok: true, text, value: parsed.value, stats: jsonStats(parsed.value, text) };
}

export function jsonStats(value: unknown, text: string): JsonStats {
  const stats: JsonStats = {
    bytes: new TextEncoder().encode(text).length,
    characters: text.length,
    type: typeName(value),
    keys: 0,
    depth: 0,
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
  };
  walk(value, 1);
  return stats;

  function walk(node: unknown, depth: number) {
    if (depth > stats.depth) stats.depth = depth;
    if (node === null) {
      stats.nulls += 1;
      return;
    }
    if (Array.isArray(node)) {
      stats.arrays += 1;
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node === "object") {
      stats.objects += 1;
      const record = node as Record<string, unknown>;
      const keys = Object.keys(record);
      stats.keys += keys.length;
      for (const key of keys) walk(record[key], depth + 1);
      return;
    }
    if (typeof node === "string") stats.strings += 1;
    else if (typeof node === "number") stats.numbers += 1;
    else if (typeof node === "boolean") stats.booleans += 1;
  }
}

export function findMatches(text: string, query: string, caseSensitive: boolean): number[] {
  if (!query) return [];
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const found: number[] = [];
  let from = 0;
  while (found.length < 200) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    found.push(at);
    from = at + Math.max(needle.length, 1);
  }
  return found;
}
