import { parseJson } from "@/lib/dev-tools/json";

const RESERVED = /^(?:true|false|null|yes|no|on|off|~|n|y)$/i;
const NUMERIC = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function needsQuotes(value: string): boolean {
  if (value === "") return true;
  if (/[:#&*!|>%@`'"[\]{},\n\r\t]/.test(value)) return true;
  if (/^\s|\s$/.test(value)) return true;
  if (RESERVED.test(value) || NUMERIC.test(value)) return true;
  if (value.startsWith("-") || value.startsWith("?") || value.startsWith("*")) return true;
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) < 32) return true;
  }
  return false;
}

function formatKey(key: string): string {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(key) ? key : JSON.stringify(key);
}

function inline(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : "null";
  if (typeof value === "string") return needsQuotes(value) ? JSON.stringify(value) : value;
  if (Array.isArray(value)) return "[]";
  if (isPlainObject(value)) return "{}";
  return "null";
}

function dump(value: unknown, indent: number): string[] {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    const lines: string[] = [];
    for (const item of value) {
      if (isPlainObject(item) && Object.keys(item).length > 0) {
        const child = dump(item, indent + 2);
        const first = child[0]?.slice(indent + 2) ?? "";
        lines.push(`${pad}- ${first}`);
        for (const line of child.slice(1)) lines.push(line);
      } else if (Array.isArray(item) && item.length > 0) {
        lines.push(`${pad}-`);
        lines.push(...dump(item, indent + 2));
      } else {
        lines.push(`${pad}- ${inline(item)}`);
      }
    }
    return lines;
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return [`${pad}{}`];
    const lines: string[] = [];
    for (const [key, child] of entries) {
      const name = formatKey(key);
      const nested =
        (isPlainObject(child) && Object.keys(child).length > 0) || (Array.isArray(child) && child.length > 0);
      if (nested) {
        lines.push(`${pad}${name}:`);
        lines.push(...dump(child, indent + 2));
      } else {
        lines.push(`${pad}${name}: ${inline(child)}`);
      }
    }
    return lines;
  }
  return [`${pad}${inline(value)}`];
}

/** YAML 1.2-style block output for JSON values only. No anchors, tags, or comments. */
export function jsonToYaml(value: unknown): string {
  return `${dump(value, 0).join("\n")}\n`;
}

export function jsonTextToYaml(input: string) {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return { ok: true as const, yaml: jsonToYaml(parsed.value) };
}
