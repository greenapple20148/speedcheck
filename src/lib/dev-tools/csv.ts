export type CsvDelimiter = "," | ";" | "\t";

export interface CsvSuccess {
  ok: true;
  csv: string;
  headers: string[];
  rows: string[][];
  warnings: string[];
}

export interface CsvFailure {
  ok: false;
  error: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Nested objects become dot paths (`address.city`).
 * Nested arrays are not expanded into rows; each one is a single JSON cell.
 * A key that itself contains a dot can collide with a nested path.
 */
export function jsonToCsv(
  value: unknown,
  options: { delimiter: CsvDelimiter; header: boolean },
): CsvSuccess | CsvFailure {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error: "JSON to CSV expects an array of objects. Wrap a single object in [ ] if you want one row.",
    };
  }
  if (value.length === 0) {
    return { ok: true, csv: "", headers: [], rows: [], warnings: [] };
  }
  const warnings: string[] = [];
  const headers: string[] = [];
  const headerSet = new Set<string>();
  const flatRows: Record<string, string>[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const row = value[index];
    if (!isPlainObject(row)) {
      return {
        ok: false,
        error: `Item ${index + 1} is ${row === null ? "null" : Array.isArray(row) ? "an array" : `a ${typeof row}`}. Each item needs to be an object.`,
      };
    }
    const flat: Record<string, string> = {};
    flatten(row, "", flat, warnings);
    flatRows.push(flat);
    for (const key of Object.keys(flat)) {
      if (!headerSet.has(key)) {
        headerSet.add(key);
        headers.push(key);
      }
    }
  }

  const rows = flatRows.map((flat) => headers.map((key) => flat[key] ?? ""));
  const lines: string[] = [];
  if (options.header) lines.push(headers.map((cell) => quoteCell(cell, options.delimiter)).join(options.delimiter));
  for (const row of rows) {
    lines.push(row.map((cell) => quoteCell(cell, options.delimiter)).join(options.delimiter));
  }
  return { ok: true, csv: lines.join("\r\n"), headers, rows, warnings };
}

function flatten(value: Record<string, unknown>, prefix: string, out: Record<string, string>, warnings: string[]) {
  for (const key of Object.keys(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (isPlainObject(child)) {
      flatten(child, path, out, warnings);
      continue;
    }
    let cell = "";
    if (child == null) cell = "";
    else if (Array.isArray(child)) cell = JSON.stringify(child);
    else cell = String(child);
    if (Object.prototype.hasOwnProperty.call(out, path)) {
      warnings.push(`Column "${path}" was produced more than once in one row. The later value is kept.`);
    }
    out[path] = cell;
  }
}

/** RFC 4180-style quoting: delimiter, quotes, and line breaks are wrapped; quotes are doubled. */
export function quoteCell(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes("\n") || value.includes("\r") || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
