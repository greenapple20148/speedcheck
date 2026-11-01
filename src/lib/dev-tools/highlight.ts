export interface JsonToken {
  kind: "key" | "string" | "number" | "literal" | "punct" | "plain";
  text: string;
}

export function tokenizeJson(text: string): JsonToken[] {
  const raw: JsonToken[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i] ?? "";
    if (char === '"') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === "\\") {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      raw.push({ kind: "string", text: text.slice(i, j) });
      i = j;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      let j = i + 1;
      while (j < text.length && /[0-9eE+.-]/.test(text[j] ?? "")) j += 1;
      raw.push({ kind: "number", text: text.slice(i, j) });
      i = j;
      continue;
    }
    const word = text.startsWith("true", i) ? "true" : text.startsWith("false", i) ? "false" : text.startsWith("null", i) ? "null" : "";
    if (word) {
      raw.push({ kind: "literal", text: word });
      i += word.length;
      continue;
    }
    if ("{}[],:".includes(char)) {
      raw.push({ kind: "punct", text: char });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < text.length) {
      const next = text[j] ?? "";
      if ('"{}[],:'.includes(next) || next === "-" || (next >= "0" && next <= "9")) break;
      if (text.startsWith("true", j) || text.startsWith("false", j) || text.startsWith("null", j)) break;
      j += 1;
    }
    raw.push({ kind: "plain", text: text.slice(i, j) });
    i = j;
  }
  return raw.map((token, index) => {
    if (token.kind !== "string") return token;
    let next = index + 1;
    while (next < raw.length && raw[next]?.kind === "plain" && raw[next]?.text.trim() === "") next += 1;
    if (raw[next]?.text === ":") return { kind: "key", text: token.text };
    return token;
  });
}
