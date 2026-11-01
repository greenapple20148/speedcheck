import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { encodeBytes, encodeUtf8, decodeToBytes, decodeUtf8 } from "@/lib/dev-tools/base64";
import { DEVELOPER_TOOL_PATHS, DEVELOPER_TOOLS } from "@/lib/dev-tools/catalog";
import { jsonToCsv } from "@/lib/dev-tools/csv";
import { diffJson } from "@/lib/dev-tools/json-diff";
import { formatJsonText, locateJsonError, minifyJsonText, parseJson } from "@/lib/dev-tools/json";
import { queryJsonPath } from "@/lib/dev-tools/jsonpath";
import { validateSchema } from "@/lib/dev-tools/json-schema";
import { decodeJwt, unsignedJwt } from "@/lib/dev-tools/jwt";
import { executeRegex, REGEX_LIMITS, regexInputError, settleRegexRun } from "@/lib/dev-tools/regex";
import { dateToUnix, formatRelative, unixToParts } from "@/lib/dev-tools/timestamp";
import { decodeComponent, encodeComponent, encodeUrl, parseUrlQuery } from "@/lib/dev-tools/url-codec";
import { jsonToYaml } from "@/lib/dev-tools/yaml";

describe("developer JSON tools", () => {
  it("reports a line and column for invalid JSON and formats or minifies valid JSON", () => {
    const invalid = parseJson('{\n"a": 1,}');
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.line).toBe(2);
      expect(invalid.column).toBe(8);
    }
    expect(locateJsonError("abc\nde", "Unexpected token at position 4")).toEqual({
      line: 2,
      column: 1,
      position: 4,
    });

    const formatted = formatJsonText('{"b":1,"a":2}', 2);
    expect(formatted.ok).toBe(true);
    if (!formatted.ok) return;
    expect(formatted.text).toBe('{\n  "b": 1,\n  "a": 2\n}');
    const four = formatJsonText('{"a":1}', 4);
    expect(four.ok && four.text).toBe('{\n    "a": 1\n}');
    const minified = minifyJsonText(formatted.text);
    expect(minified.ok && minified.text).toBe('{"b":1,"a":2}');
  });

  it("diffs by structure, ignoring key order and comparing arrays by index", () => {
    expect(diffJson({ z: 1, a: 2 }, { a: 2, z: 1 })).toEqual([]);
    expect(diffJson({ n: 1 }, { n: "1" })).toEqual([{ kind: "modified", path: "$.n", left: 1, right: "1" }]);
    expect(diffJson([1], [1, 2])).toEqual([{ kind: "added", path: "$[1]", right: 2 }]);
    expect(
      diffJson(
        { b: 1, a: "1", items: [1, 2], extra: true },
        { a: "1", b: 1, items: [1, "2"], added: false },
      ),
    ).toEqual([
      { kind: "modified", path: "$.items[1]", left: 2, right: "2" },
      { kind: "removed", path: "$.extra", left: true },
      { kind: "added", path: "$.added", right: false },
    ]);
  });

  it("escapes CSV cells and keeps nested arrays in one column", () => {
    const result = jsonToCsv(
      [{ name: "A, B", note: 'say "hi"', meta: { city: "Paris" }, tags: ["x", "y"] }],
      { delimiter: ",", header: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.headers).toEqual(["name", "note", "meta.city", "tags"]);
    expect(result.csv).toBe('name,note,meta.city,tags\r\n"A, B","say ""hi""",Paris,"[""x"",""y""]"');
    expect(jsonToCsv({ name: "Ada" }, { delimiter: ",", header: true }).ok).toBe(false);
  });
});

describe("developer encoding tools", () => {
  it("round-trips Unicode Base64 and the URL-safe alphabet", () => {
    const text = "héllo 😀";
    const encoded = encodeUtf8(text, "standard");
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(decodeUtf8(encoded.encoded, "standard")).toMatchObject({ ok: true, text });

    const bytes = new Uint8Array([251, 239, 255, 250, 0, 1, 62, 63]);
    expect(encodeBytes(bytes, "standard")).toBe("++//+gABPj8=");
    const url = encodeBytes(bytes, "url");
    expect(url).toBe("--__-gABPj8");
    expect(url).not.toMatch(/[+/=]/);
    const decoded = decodeToBytes(url, "url");
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(Array.from(decoded.bytes)).toEqual(Array.from(bytes));
    expect(decodeToBytes("====", "standard").ok).toBe(false);
  });

  it("decodes a JWT without treating it as verified and flags an expired exp", () => {
    const token = unsignedJwt(
      { alg: "HS256", typ: "JWT" },
      { sub: "123", exp: 1000, iat: 900, aud: "api", iss: "https://example.com" },
    );
    const decoded = decodeJwt(token, 2_000_000);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.signatureChecked).toBe(false);
    expect(decoded.expired).toBe(true);
    expect(decoded.exp?.iso).toBe("1970-01-01T00:16:40.000Z");
    expect(decoded.iat?.iso).toBe("1970-01-01T00:15:00.000Z");
    expect(decoded.aud).toBe("api");
    expect(decoded.iss).toBe("https://example.com");
    expect(JSON.stringify(decoded)).not.toContain('"verified":true');
    expect(decoded.notice.toLowerCase()).not.toContain("verified");
    const fresh = decodeJwt(token, 500_000);
    expect(fresh.ok && fresh.expired).toBe(false);
  });

  it("encodes and decodes URL components and rejects a broken percent sequence", () => {
    expect(encodeComponent("a b/ç")).toBe("a%20b%2F%C3%A7");
    expect(encodeUrl("https://example.com/a b")).toBe("https://example.com/a%20b");
    expect(decodeComponent("%E0%A4%A").ok).toBe(false);
    expect(decodeComponent("%").ok).toBe(false);
    const parsed = parseUrlQuery("https://example.com/search?q=caf%C3%A9&x=1");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.params).toEqual([
      { key: "q", value: "café" },
      { key: "x", value: "1" },
    ]);
    expect(parseUrlQuery("https://example.com/?q=%").ok).toBe(false);
  });
});

describe("developer regex and time tools", () => {
  it("matches groups and rejects a pattern or text that is too large", () => {
    const matched = executeRegex({ pattern: "h(el)lo", flags: "g", text: "hello hello", replacement: "hi" });
    expect(matched.ok).toBe(true);
    if (!matched.ok) return;
    expect(matched.matches).toHaveLength(2);
    expect(matched.matches[0]?.groups).toEqual(["el"]);
    expect(matched.replaced).toBe("hi hi");

    const oversized = "a".repeat(REGEX_LIMITS.maxPatternLength + 1);
    const blocked = executeRegex({ pattern: oversized, flags: "", text: "a" });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("limit");
    expect(regexInputError({ pattern: oversized, text: "a" })).toBeTruthy();
    expect(executeRegex({ pattern: "a".repeat(REGEX_LIMITS.maxPatternLength), flags: "", text: "a" }).ok).toBe(true);

    const longText = "a".repeat(REGEX_LIMITS.maxTextLength + 1);
    const textLimit = executeRegex({ pattern: "a", flags: "", text: longText });
    expect(textLimit.ok).toBe(false);
    if (!textLimit.ok) expect(textLimit.code).toBe("limit");

    const timedOut = settleRegexRun(REGEX_LIMITS.timeoutMs + 1, REGEX_LIMITS.timeoutMs, matched);
    expect(timedOut.ok).toBe(false);
    if (!timedOut.ok) expect(timedOut.code).toBe("timeout");
    expect(executeRegex({ pattern: "(", flags: "", text: "a" }).ok).toBe(false);
  });

  it("keeps seconds and milliseconds as different units", () => {
    const seconds = unixToParts("1700000000", "seconds", Date.parse("2023-11-14T22:13:20.000Z"));
    const millis = unixToParts("1700000000", "milliseconds", Date.parse("2023-11-14T22:13:20.000Z"));
    expect(seconds.ok && seconds.isoUtc).toBe("2023-11-14T22:13:20.000Z");
    expect(millis.ok && millis.isoUtc).toBe("1970-01-20T16:13:20.000Z");
    expect(millis.ok && millis.hint).toBeTruthy();
    const fromDate = dateToUnix("2023-11-14T22:13:20.000Z", "utc");
    expect(fromDate).toEqual({ ok: true, ms: 1_700_000_000_000, seconds: 1_700_000_000 });
    const now = Date.parse("2023-11-14T22:13:20.000Z");
    expect(formatRelative(now - 120_000, now)).toBe("2 minutes ago");
  });
});

describe("developer YAML, JSONPath, and schema subsets", () => {
  it("emits block YAML for JSON values", () => {
    expect(jsonToYaml({ title: "a: b", items: [{ id: 1 }] })).toBe('title: "a: b"\nitems:\n  - id: 1\n');
  });

  it("queries a documented JSONPath subset", () => {
    const data = { store: { book: [{ title: "A", price: 5 }, { title: "B", price: 12 }] } };
    expect(queryJsonPath(data, "$.store.book[0].title").ok && queryJsonPath(data, "$.store.book[0].title")).toMatchObject({
      ok: true,
      matches: [{ path: "$.store.book[0].title", value: "A" }],
    });
    const titles = queryJsonPath(data, "$..title");
    expect(titles.ok && titles.matches.map((match) => match.value)).toEqual(["A", "B"]);
    const filtered = queryJsonPath(data, "$.store.book[?(@.price < 10)].title");
    expect(filtered.ok && filtered.matches.map((match) => match.value)).toEqual(["A"]);
    const typed = queryJsonPath([{ id: 1 }, { id: "1" }], "$[?(@.id == 1)]");
    expect(typed.ok && typed.matches).toHaveLength(1);
  });

  it("validates a draft 2020-12 subset and rejects a string where a number is required", () => {
    const schema = {
      type: "object",
      required: ["id"],
      additionalProperties: false,
      properties: { id: { type: "number" } },
    };
    expect(validateSchema({ id: 1 }, schema).valid).toBe(true);
    expect(validateSchema({ id: "1" }, schema).valid).toBe(false);
    expect(validateSchema({ id: 1, extra: true }, schema).valid).toBe(false);
    const unsupported = validateSchema({ id: 1 }, { ...schema, patternProperties: { "^x": { type: "string" } } });
    expect(unsupported.valid).toBe(false);
    expect(unsupported.errors.some((error) => error.message.includes("patternProperties"))).toBe(true);
  });
});

describe("developer tool routes", () => {
  it("publishes a unique indexable path for every tool", () => {
    expect(new Set(DEVELOPER_TOOL_PATHS).size).toBe(DEVELOPER_TOOL_PATHS.length);
    expect(DEVELOPER_TOOLS).toHaveLength(11);
    const urls = sitemap().map((item) => item.url);
    for (const path of DEVELOPER_TOOL_PATHS) {
      expect(urls.some((url) => url.endsWith(path))).toBe(true);
    }
  });
});
