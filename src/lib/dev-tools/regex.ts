/**
 * Limits are duplicated as literals inside executeRegex so the function can be
 * copied into a worker with Function#toString and still enforce them.
 * REGEX_LIMITS must stay equal to those literals. Unit tests lock that in.
 */
export const REGEX_LIMITS = {
  maxPatternLength: 256,
  maxTextLength: 50_000,
  maxMatches: 200,
  timeoutMs: 200,
} as const;

export interface RegexMatch {
  index: number;
  text: string;
  groups: Array<string | null>;
  named: Record<string, string>;
}

export type RegexResult =
  | {
      ok: true;
      matches: RegexMatch[];
      truncated: boolean;
      replaced?: string;
    }
  | { ok: false; code: "limit" | "syntax" | "timeout" | "flags"; error: string };

export function regexInputError(input: { pattern?: string; text?: string }): string | null {
  const pattern = input.pattern ?? "";
  const text = input.text ?? "";
  if (pattern.length > REGEX_LIMITS.maxPatternLength) {
    return `That pattern is longer than ${REGEX_LIMITS.maxPatternLength} characters.`;
  }
  if (text.length > REGEX_LIMITS.maxTextLength) {
    return `The test text is longer than ${REGEX_LIMITS.maxTextLength.toLocaleString("en-US")} characters.`;
  }
  return null;
}

export function settleRegexRun(elapsedMs: number, deadlineMs: number, result: RegexResult | null): RegexResult {
  if (result == null || elapsedMs > deadlineMs) {
    return {
      ok: false,
      code: "timeout",
      error: "This pattern took too long and was stopped. Shorten the pattern or the test text.",
    };
  }
  return result;
}

export function executeRegex(input: {
  pattern?: string;
  flags?: string;
  text?: string;
  replacement?: string;
}): RegexResult {
  const maxPatternLength = 256;
  const maxTextLength = 50000;
  const maxMatches = 200;
  const pattern = typeof input.pattern === "string" ? input.pattern : "";
  const flags = typeof input.flags === "string" ? input.flags : "";
  const text = typeof input.text === "string" ? input.text : "";
  if (pattern.length > maxPatternLength) {
    return { ok: false, code: "limit", error: "That pattern is longer than 256 characters." };
  }
  if (text.length > maxTextLength) {
    return { ok: false, code: "limit", error: "The test text is longer than 50,000 characters." };
  }
  const seen: Record<string, boolean> = {};
  for (let i = 0; i < flags.length; i += 1) {
    const flag = flags.charAt(i);
    if ("gimsuy".indexOf(flag) === -1) {
      return { ok: false, code: "flags", error: "Flags can only include g, i, m, s, u, and y." };
    }
    if (seen[flag]) return { ok: false, code: "flags", error: "Each flag can be used once." };
    seen[flag] = true;
  }
  let expression: RegExp;
  let globalExpression: RegExp;
  try {
    expression = new RegExp(pattern, flags);
    const globalFlags = flags.indexOf("g") === -1 ? `${flags}g` : flags;
    globalExpression = new RegExp(pattern, globalFlags);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid regular expression.";
    return { ok: false, code: "syntax", error: message };
  }
  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null = globalExpression.exec(text);
  let steps = 0;
  while (match) {
    steps += 1;
    if (matches.length < maxMatches) {
      const groups: Array<string | null> = [];
      for (let i = 1; i < match.length; i += 1) groups.push(match[i] == null ? null : match[i]);
      const named: Record<string, string> = {};
      if (match.groups) {
        const keys = Object.keys(match.groups);
        for (let i = 0; i < keys.length; i += 1) {
          const value = match.groups[keys[i]];
          if (typeof value === "string") named[keys[i]] = value;
        }
      }
      matches.push({ index: match.index, text: match[0], groups, named });
    }
    if (match[0] === "") globalExpression.lastIndex += 1;
    if (steps >= maxMatches || globalExpression.lastIndex > text.length) break;
    match = globalExpression.exec(text);
  }
  let replaced: string | undefined;
  if (typeof input.replacement === "string") {
    try {
      replaced = text.replace(expression, input.replacement);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The replacement could not be applied.";
      return { ok: false, code: "syntax", error: message };
    }
  }
  return { ok: true, matches, truncated: steps >= maxMatches, replaced };
}
