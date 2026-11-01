const MAX_VISITS = 10_000;
const MAX_MATCHES = 200;

export interface JsonPathMatch {
  path: string;
  value: unknown;
}

type Op = "==" | "!=" | "<" | "<=" | ">" | ">=";

type Segment =
  | { t: "child"; key: string }
  | { t: "wild" }
  | { t: "index"; index: number }
  | { t: "slice"; start: number | null; end: number | null }
  | { t: "desc"; key: string }
  | { t: "filter"; key: string; op: Op; value: string | number | boolean | null };

interface Node {
  path: string;
  value: unknown;
}

/**
 * Supported subset:
 * `$`, `.name`, `["name"]`, `[index]` (negative from the end), `[*]`, `[start:end]`,
 * `..name`, and `[?(@.key == value)]` with == != < <= > >=.
 * Filters select array items. Dot names read object keys and do not auto-map arrays.
 */
export function queryJsonPath(
  data: unknown,
  expression: string,
): { ok: true; matches: JsonPathMatch[]; truncated: boolean } | { ok: false; error: string } {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Enter a JSONPath expression. Start with $." };
  if (trimmed.length > 500) return { ok: false, error: "That expression is longer than 500 characters." };
  const parsed = parsePath(trimmed);
  if (!parsed.ok) return parsed;
  return evaluate(data, parsed.segments);
}

function parsePath(source: string): { ok: true; segments: Segment[] } | { ok: false; error: string } {
  if (!source.startsWith("$")) return { ok: false, error: "A path starts with $." };
  let i = 1;
  const segments: Segment[] = [];
  while (i < source.length) {
    if (source[i] === "." && source[i + 1] === ".") {
      i += 2;
      const ident = readIdent(source, i);
      if (!ident) return { ok: false, error: "A descendant step needs a name, as in ..title." };
      i = ident.next;
      segments.push({ t: "desc", key: ident.value });
      continue;
    }
    if (source[i] === ".") {
      i += 1;
      if (source[i] === "*") {
        i += 1;
        segments.push({ t: "wild" });
        continue;
      }
      const ident = readIdent(source, i);
      if (!ident) return { ok: false, error: "Expected a property name after the dot." };
      i = ident.next;
      segments.push({ t: "child", key: ident.value });
      continue;
    }
    if (source[i] === "[") {
      const bracket = parseBracket(source, i);
      if (!bracket.ok) return bracket;
      segments.push(bracket.segment);
      i = bracket.next;
      continue;
    }
    return { ok: false, error: `Unexpected character at position ${i + 1}.` };
  }
  return { ok: true, segments };
}

function parseBracket(
  source: string,
  start: number,
): { ok: true; segment: Segment; next: number } | { ok: false; error: string } {
  let i = start + 1;
  while (source[i] === " ") i += 1;
  if (source.startsWith("?(", i)) return parseFilter(source, i);
  if (source[i] === "*" && source[i + 1] === "]") return { ok: true, segment: { t: "wild" }, next: i + 2 };
  if (source[i] === "'" || source[i] === '"') {
    const text = readString(source, i);
    if (!text.ok) return text;
    if (source[text.next] !== "]") return { ok: false, error: "A quoted name must end with ]." };
    return { ok: true, segment: { t: "child", key: text.value }, next: text.next + 1 };
  }
  const slice = /^(-?\d+)?\s*:\s*(-?\d+)?\]/.exec(source.slice(i));
  if (slice) {
    return {
      ok: true,
      segment: {
        t: "slice",
        start: slice[1] == null ? null : Number(slice[1]),
        end: slice[2] == null ? null : Number(slice[2]),
      },
      next: i + slice[0].length,
    };
  }
  const index = /^(-?\d+)\]/.exec(source.slice(i));
  if (index) return { ok: true, segment: { t: "index", index: Number(index[1]) }, next: i + index[0].length };
  return { ok: false, error: "Unsupported bracket. Use an index, a slice, a quoted name, *, or a filter." };
}

function parseFilter(
  source: string,
  start: number,
): { ok: true; segment: Segment; next: number } | { ok: false; error: string } {
  const body = /^(\?\(\s*@\.([A-Za-z_][A-Za-z0-9_]*)\s*(==|!=|<=|>=|<|>)\s*)/.exec(source.slice(start));
  if (!body) return { ok: false, error: "Filters look like [?(@.price < 10)]. Nested paths inside a filter are not supported." };
  let i = start + body[0].length;
  const literal = readLiteral(source, i);
  if (!literal.ok) return literal;
  i = literal.next;
  while (source[i] === " ") i += 1;
  if (source[i] !== ")" || source[i + 1] !== "]") return { ok: false, error: "Close the filter with )]." };
  return {
    ok: true,
    segment: { t: "filter", key: body[2], op: body[3] as Op, value: literal.value },
    next: i + 2,
  };
}

function readIdent(source: string, start: number): { value: string; next: number } | null {
  const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(start));
  if (!match) return null;
  return { value: match[0], next: start + match[0].length };
}

function readString(
  source: string,
  start: number,
): { ok: true; value: string; next: number } | { ok: false; error: string } {
  const quote = source[start];
  let value = "";
  let i = start + 1;
  while (i < source.length) {
    const char = source[i];
    if (char === "\\") {
      const next = source[i + 1];
      if (next === undefined) return { ok: false, error: "A string escape is unfinished." };
      value += next === "n" ? "\n" : next === "t" ? "\t" : next;
      i += 2;
      continue;
    }
    if (char === quote) return { ok: true, value, next: i + 1 };
    value += char;
    i += 1;
  }
  return { ok: false, error: "A quoted name is missing its closing quote." };
}

function readLiteral(
  source: string,
  start: number,
): { ok: true; value: string | number | boolean | null; next: number } | { ok: false; error: string } {
  if (source[start] === '"' || source[start] === "'") {
    const text = readString(source, start);
    if (!text.ok) return text;
    return { ok: true, value: text.value, next: text.next };
  }
  const word = /^(true|false|null)/.exec(source.slice(start));
  if (word) {
    const value = word[1] === "true" ? true : word[1] === "false" ? false : null;
    return { ok: true, value, next: start + word[1].length };
  }
  const number = /^-?\d+(?:\.\d+)?/.exec(source.slice(start));
  if (number) return { ok: true, value: Number(number[0]), next: start + number[0].length };
  return { ok: false, error: "A filter value must be a string, number, true, false, or null." };
}

function evaluate(
  data: unknown,
  segments: Segment[],
): { ok: true; matches: JsonPathMatch[]; truncated: boolean } | { ok: false; error: string } {
  let current: Node[] = [{ path: "$", value: data }];
  let visits = 0;
  let truncated = false;
  const overBudget = () => {
    visits += 1;
    return visits > MAX_VISITS;
  };
  for (const segment of segments) {
    const next: Node[] = [];
    for (const node of current) {
      if (overBudget()) return { ok: false, error: "This query visited too many values. Narrow the path." };
      const added = applySegment(node, segment, overBudget);
      if (added === "budget") return { ok: false, error: "This query visited too many values. Narrow the path." };
      for (const item of added) {
        if (next.length >= MAX_MATCHES) {
          truncated = true;
          break;
        }
        next.push(item);
      }
      if (truncated) break;
    }
    current = next;
    if (truncated) break;
  }
  return { ok: true, matches: current, truncated };
}

function applySegment(node: Node, segment: Segment, overBudget: () => boolean): Node[] | "budget" {
  if (segment.t === "desc") return descend(node, segment.key, overBudget);
  if (segment.t === "filter") return filterArray(node, segment);
  if (segment.t === "wild") return wildcard(node);
  if (segment.t === "index") return indexAt(node, segment.index);
  if (segment.t === "slice") return sliceAt(node, segment.start, segment.end);
  if (!isPlainObject(node.value) || !Object.prototype.hasOwnProperty.call(node.value, segment.key)) return [];
  return [{ path: childPath(node.path, segment.key), value: node.value[segment.key] }];
}

function descend(node: Node, key: string, overBudget: () => boolean): Node[] | "budget" {
  const found: Node[] = [];
  const visit = (current: Node): "budget" | undefined => {
    if (Array.isArray(current.value)) {
      for (let index = 0; index < current.value.length; index += 1) {
        if (overBudget()) return "budget";
        const nested = visit({ path: `${current.path}[${index}]`, value: current.value[index] });
        if (nested === "budget") return "budget";
      }
      return;
    }
    if (!isPlainObject(current.value)) return;
    for (const childKey of Object.keys(current.value)) {
      if (overBudget()) return "budget";
      const child = { path: childPath(current.path, childKey), value: current.value[childKey] };
      if (childKey === key) found.push(child);
      if (found.length > MAX_MATCHES) return;
      const nested = visit(child);
      if (nested === "budget") return "budget";
    }
  };
  const result = visit(node);
  if (result === "budget") return "budget";
  return found;
}

function filterArray(node: Node, segment: Extract<Segment, { t: "filter" }>): Node[] {
  if (!Array.isArray(node.value)) return [];
  const matches: Node[] = [];
  node.value.forEach((item, index) => {
    if (!isPlainObject(item) || !Object.prototype.hasOwnProperty.call(item, segment.key)) return;
    if (compare(item[segment.key], segment.op, segment.value)) {
      matches.push({ path: `${node.path}[${index}]`, value: item });
    }
  });
  return matches;
}

function compare(left: unknown, op: Op, right: string | number | boolean | null): boolean {
  if (op === "==") return Object.is(left, right);
  if (op === "!=") return !Object.is(left, right);
  if (typeof left !== "number" || typeof right !== "number") return false;
  if (op === "<") return left < right;
  if (op === "<=") return left <= right;
  if (op === ">") return left > right;
  return left >= right;
}

function wildcard(node: Node): Node[] {
  const value = node.value;
  if (Array.isArray(value)) {
    return value.map((item, index) => ({ path: `${node.path}[${index}]`, value: item }));
  }
  if (isPlainObject(value)) {
    return Object.keys(value).map((key) => ({ path: childPath(node.path, key), value: value[key] }));
  }
  return [];
}

function indexAt(node: Node, index: number): Node[] {
  if (!Array.isArray(node.value)) return [];
  const resolved = index < 0 ? node.value.length + index : index;
  if (resolved < 0 || resolved >= node.value.length) return [];
  return [{ path: `${node.path}[${resolved}]`, value: node.value[resolved] }];
}

function sliceAt(node: Node, start: number | null, end: number | null): Node[] {
  if (!Array.isArray(node.value)) return [];
  const length = node.value.length;
  const from = start == null ? 0 : start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
  const to = end == null ? length : end < 0 ? Math.max(length + end, 0) : Math.min(end, length);
  const matches: Node[] = [];
  for (let index = from; index < to; index += 1) {
    matches.push({ path: `${node.path}[${index}]`, value: node.value[index] });
  }
  return matches;
}

function childPath(parent: string, key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return `${parent}.${key}`;
  return `${parent}[${JSON.stringify(key)}]`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
