const MAX_URL_CHARS = 100_000;

export function encodeComponent(value: string): string {
  return encodeURIComponent(value);
}

/** Encodes a full URL. Leaves : / ? # and similar structural characters alone. */
export function encodeUrl(value: string): string {
  return encodeURI(value);
}

export function decodeComponent(value: string): { ok: true; value: string } | { ok: false; error: string } {
  if (value.length > MAX_URL_CHARS) return { ok: false, error: "That text is longer than 100,000 characters." };
  if (hasInvalidPercent(value)) {
    return { ok: false, error: "Invalid percent-encoding. Each % must be followed by two hexadecimal digits." };
  }
  try {
    return { ok: true, value: decodeURIComponent(value) };
  } catch {
    return { ok: false, error: "Invalid percent-encoding. Each % must be followed by two hexadecimal digits." };
  }
}

export function decodeUrl(value: string): { ok: true; value: string } | { ok: false; error: string } {
  if (value.length > MAX_URL_CHARS) return { ok: false, error: "That text is longer than 100,000 characters." };
  if (hasInvalidPercent(value)) {
    return { ok: false, error: "Invalid percent-encoding. Each % must be followed by two hexadecimal digits." };
  }
  try {
    return { ok: true, value: decodeURI(value) };
  } catch {
    return { ok: false, error: "Invalid percent-encoding. Each % must be followed by two hexadecimal digits." };
  }
}

export interface QueryParam {
  key: string;
  value: string;
}

export function parseUrlQuery(
  input: string,
): { ok: true; base: string; params: QueryParam[] } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (trimmed.length > MAX_URL_CHARS) return { ok: false, error: "That URL is longer than 100,000 characters." };
  if (hasInvalidPercent(trimmed)) {
    return { ok: false, error: "Invalid percent-encoding. Each % must be followed by two hexadecimal digits." };
  }
  let base = "";
  let query = trimmed;
  if (trimmed.includes("://")) {
    try {
      const url = new URL(trimmed);
      base = `${url.origin}${url.pathname}`;
      query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
    } catch {
      return { ok: false, error: "That does not look like a valid absolute URL." };
    }
  } else {
    const splitAt = trimmed.indexOf("?");
    if (splitAt >= 0) {
      base = trimmed.slice(0, splitAt);
      query = trimmed.slice(splitAt + 1);
    } else if (trimmed.startsWith("?")) {
      query = trimmed.slice(1);
    }
  }
  const hash = query.indexOf("#");
  if (hash >= 0) query = query.slice(0, hash);
  const params = new URLSearchParams(query);
  const rows: QueryParam[] = [];
  params.forEach((value, key) => rows.push({ key, value }));
  return { ok: true, base, params: rows };
}

/** Rebuilds a query with URLSearchParams, which encodes spaces as +. */
export function buildUrl(base: string, params: QueryParam[]): string {
  const search = new URLSearchParams();
  for (const param of params) search.append(param.key, param.value);
  const query = search.toString();
  if (!base) return query;
  const head = base.split("?")[0]?.split("#")[0] ?? base;
  return query ? `${head}?${query}` : head;
}

function hasInvalidPercent(value: string): boolean {
  return /%(?![0-9A-Fa-f]{2})/.test(value);
}
