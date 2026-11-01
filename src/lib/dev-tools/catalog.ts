import type { FaqItem } from "@/components/seo/faq-section";

export type DevCategory = "json" | "converters" | "encoders" | "security" | "text";

export interface DevExample {
  title: string;
  body: string;
}

export interface DevTool {
  id: string;
  name: string;
  href: string;
  /** Short line for the hub card. */
  summary: string;
  description: string;
  metaTitle: string;
  h1: string;
  intro: string;
  category: DevCategory;
  howTo: string[];
  examples: DevExample[];
  mistakes: string[];
  faqs: FaqItem[];
  related: string[];
  privacy: string;
}

const PRIVATE =
  "Processing stays in this browser tab. What you paste is not uploaded, and this tool does not write it to local storage.";

export const CATEGORIES: { id: "all" | DevCategory; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "json", label: "JSON" },
  { id: "converters", label: "Converters" },
  { id: "encoders", label: "Encoders" },
  { id: "security", label: "Security" },
  { id: "text", label: "Text & Data" },
];

export const CATEGORY_LABEL: Record<DevCategory, string> = {
  json: "JSON",
  converters: "Converters",
  encoders: "Encoders",
  security: "Security",
  text: "Text & Data",
};

export const HUB = {
  metaTitle: "Free Online Developer Tools",
  description:
    "Format, validate, convert, compare, and debug JSON and text in your browser. Free developer utilities with no account.",
  h1: "Free Online Developer Tools",
  intro:
    "Format, validate, convert, compare, and debug data without sending it to a server. Every tool on this page runs in your browser.",
  faqs: [
    {
      question: "Do these tools upload what I paste?",
      answer:
        "No. Parsing and conversion happen in your browser tab. The pages do not send document text, tokens, files, or regular expressions to analytics.",
    },
    {
      question: "Do I need an account?",
      answer: "No. The tools are free to use and do not ask you to sign in.",
    },
    {
      question: "Which tools should I open first?",
      answer:
        "Use the JSON formatter to check a document, the diff tool to compare two versions, and the converters when you need CSV or YAML. The hub search filters this list in the page; it does not create a separate URL.",
    },
  ] satisfies FaqItem[],
};

export const DEVELOPER_TOOLS: DevTool[] = [
  {
    id: "json-formatter",
    name: "JSON Formatter",
    href: "/developer-tools/json-formatter",
    summary: "Format, validate, and explore JSON with a tree view.",
    metaTitle: "JSON Formatter & Validator — Free Online Tool",
    h1: "JSON Formatter & Validator",
    description:
      "Validate, format, minify, and explore JSON in your browser, with syntax errors that include a line and column when the parser provides them.",
    intro:
      "Check that a document is valid JSON, then format it, minify it, or browse it as a tree. The formatter, validator, tree, and minify tabs share one input.",
    category: "json",
    howTo: [
      "Paste JSON or upload a local file up to 1.5 MB.",
      "Choose 2 or 4 spaces, then format. Ctrl+Enter or ⌘+Enter does the same.",
      "Open Validator for the error location, Tree to collapse objects, or Minify for a single line.",
      "Search the input, then copy or download the result.",
    ],
    examples: [
      {
        title: "Format an object",
        body: '{ "b": 1, "a": [true, null] }\n\nbecomes a two-space document with the same key order.',
      },
      {
        title: "Read a syntax error",
        body: '{ "ok": true, }\n\nA trailing comma is invalid. The message includes a line and column when the engine reports a position.',
      },
    ],
    mistakes: [
      "Comments and trailing commas are not valid JSON.",
      "Single quotes around keys or strings will fail validation.",
      "A large file over 1.5 MB is rejected before it is parsed.",
    ],
    faqs: [
      {
        question: "Does formatting change key order?",
        answer: "No. Format and minify keep the order JSON.parse produced, which is the order keys appear in the text.",
      },
      {
        question: "Where does the line and column come from?",
        answer:
          "When JSON.parse includes a character position, or an explicit line and column, the error shows both. Some engines only return a short message.",
      },
      {
        question: "Is the tree a different document?",
        answer: "No. Formatter, Validator, Tree, and Minify are views of the same input.",
      },
    ],
    related: ["json-diff", "json-to-csv", "json-schema"],
    privacy: PRIVATE,
  },
  {
    id: "json-diff",
    name: "JSON Diff",
    href: "/developer-tools/json-diff",
    summary: "Compare two JSON values and list what changed.",
    metaTitle: "JSON Diff Checker — Compare JSON Online",
    h1: "JSON Diff Checker",
    description:
      "Compare two JSON values by structure. Object key order is ignored, arrays are compared by index, and a number is not equal to the same digits in a string.",
    intro:
      "See what was added, removed, or modified between two JSON values. The comparison walks objects and arrays instead of lining up raw text.",
    category: "json",
    howTo: [
      "Paste the original JSON on the left and the revised JSON on the right.",
      "Fix either side if the validator reports a line and column.",
      "Read added, removed, and modified paths. Copy or download the summary.",
    ],
    examples: [
      {
        title: "Key order is not a change",
        body: '{ "z": 1, "a": 2 }\n{ "a": 2, "z": 1 }\n\nThese objects have no structural difference.',
      },
      {
        title: "Types stay distinct",
        body: '{ "n": 1 }\n{ "n": "1" }\n\nThe path $.n is modified because number 1 and string "1" are different.',
      },
    ],
    mistakes: [
      "Array items are paired by index, not by an id field.",
      "Reordering object keys does not show up as a change.",
      "Text formatting differences disappear after both sides parse.",
    ],
    faqs: [
      {
        question: "Why did reordering keys produce an empty diff?",
        answer: "Objects are compared by key name. Insertion order is ignored on purpose.",
      },
      {
        question: "How are arrays compared?",
        answer: "By index. An item inserted at the front marks every later index as modified or shifted. This tool does not align arrays by id.",
      },
      {
        question: "Does 1 equal \"1\"?",
        answer: "No. The summary names both the value and its JSON type.",
      },
    ],
    related: ["json-formatter", "jsonpath", "json-schema"],
    privacy: PRIVATE,
  },
  {
    id: "json-to-csv",
    name: "JSON to CSV",
    href: "/developer-tools/json-to-csv",
    summary: "Convert an array of objects into a CSV file.",
    metaTitle: "JSON to CSV Converter — Free Online Tool",
    h1: "JSON to CSV Converter",
    description:
      "Convert a JSON array of objects to CSV in your browser. Nested objects use dot paths, with RFC-style quoting and a preview table.",
    intro:
      "Turn an array of objects into a CSV file with headers, a choice of delimiter, and a preview before you download UTF-8 text.",
    category: "converters",
    howTo: [
      "Paste a JSON array of objects.",
      "Choose a comma, semicolon, or tab delimiter, and whether to include a header row.",
      "Review the preview table, then copy or download the CSV.",
    ],
    examples: [
      {
        title: "Nested object",
        body: '[{ "name": "Ada", "address": { "city": "Paris" } }]\n\nHeaders: name, address.city',
      },
      {
        title: "Nested array",
        body: '[{ "tags": ["json", "csv"] }]\n\nThe tags cell is the JSON text ["json","csv"]. It does not become two rows.',
      },
    ],
    mistakes: [
      "A bare object is rejected. Wrap it in an array for one row.",
      "Nested arrays stay in one cell. They are not exploded into rows.",
      "A key named address.city can collide with a nested address.city path.",
    ],
    faqs: [
      {
        question: "How are nested objects named?",
        answer: "Each level is joined with a dot. address.city comes from { \"address\": { \"city\": \"Paris\" } }.",
      },
      {
        question: "What quoting rules are used?",
        answer:
          "Cells that contain the delimiter, a double quote, or a line break are wrapped in quotes. A quote inside a cell is doubled, as in RFC 4180.",
      },
      {
        question: "Is the download UTF-8?",
        answer: "Yes. An optional byte-order mark can be added for spreadsheet apps. The preview itself has no mark.",
      },
    ],
    related: ["json-formatter", "json-to-yaml", "jsonpath"],
    privacy: PRIVATE,
  },
  {
    id: "json-to-yaml",
    name: "JSON to YAML",
    href: "/developer-tools/json-to-yaml",
    summary: "Turn JSON values into block YAML.",
    metaTitle: "JSON to YAML Converter — Free Online Tool",
    h1: "JSON to YAML Converter",
    description:
      "Convert JSON values to YAML in your browser. Objects, arrays, strings, numbers, booleans, and null are emitted as block YAML.",
    intro:
      "Parse JSON, then emit a YAML 1.2-style document for those values. The converter does not read YAML comments, anchors, or tags.",
    category: "converters",
    howTo: [
      "Paste JSON.",
      "Review the YAML block. Strings that could be misread as numbers or booleans are quoted.",
      "Copy or download the .yml file.",
    ],
    examples: [
      { title: "Quoted colon", body: '{ "title": "a: b" }\n\ntitle: "a: b"' },
      { title: "Array of objects", body: '{ "items": [{ "id": 1 }] }\n\nitems:\n  - id: 1' },
    ],
    mistakes: [
      "This is JSON to YAML only. Pasting YAML will fail the JSON parser.",
      "Comments in the JSON source are not valid and are not preserved.",
      "Anchors, merge keys, and custom tags are outside this converter.",
    ],
    faqs: [
      {
        question: "Which values can be converted?",
        answer: "Anything JSON.parse accepts: objects, arrays, strings, numbers, booleans, and null.",
      },
      {
        question: "Why are some strings quoted?",
        answer: "Words such as true, null, and yes, and strings that look like numbers or contain ': #', are quoted so a YAML parser keeps them as strings.",
      },
      {
        question: "Does key order change?",
        answer: "No. Keys stay in the order they had after parsing.",
      },
    ],
    related: ["json-formatter", "json-to-csv", "json-schema"],
    privacy: PRIVATE,
  },
  {
    id: "jsonpath",
    name: "JSONPath",
    href: "/developer-tools/jsonpath",
    summary: "Query JSON with a small, documented path language.",
    metaTitle: "JSONPath Tester — Query JSON Online",
    h1: "JSONPath Tester",
    description:
      "Query JSON with a documented subset: dot names, indexes, wildcards, slices, descendants, and simple comparisons.",
    intro:
      "Run a small JSONPath subset against a JSON document and list each match with its path. Script expressions and filters with nested paths are not included.",
    category: "json",
    howTo: [
      "Paste a JSON document.",
      "Enter a path that starts with $.",
      "Read the matching values. Use an example if you want a known query.",
    ],
    examples: [
      { title: "Index", body: "$.store.book[0].title" },
      { title: "Filter", body: "$.store.book[?(@.price < 10)].title" },
    ],
    mistakes: [
      "$.books.title does not walk an array. Use $.books[*].title.",
      "Filters only select items in an array, and the comparison is one field deep.",
      "A path that visits too many nodes is stopped.",
    ],
    faqs: [
      {
        question: "Which syntax is supported?",
        answer:
          "$, .name, [\"name\"], [index] including negative indexes, [*], [start:end], ..name, and [?(@.field == value)] with ==, !=, <, <=, >, and >=.",
      },
      {
        question: "Does == coerce types?",
        answer: "No. The number 1 does not match the string \"1\".",
      },
      {
        question: "Is this the whole JSONPath standard?",
        answer: "No. Unions, script expressions, and nested filter paths are omitted so the subset stays predictable.",
      },
    ],
    related: ["json-formatter", "json-schema", "json-diff"],
    privacy: PRIVATE,
  },
  {
    id: "json-schema",
    name: "JSON Schema",
    href: "/developer-tools/json-schema",
    summary: "Validate JSON against a draft 2020-12 subset.",
    metaTitle: "JSON Schema Validator — Free Online Tool",
    h1: "JSON Schema Validator",
    description:
      "Validate JSON against a documented subset of draft 2020-12. Unsupported keywords are reported instead of being ignored.",
    intro:
      "Check instance data against a schema object. The validator covers common assertions and local $ref pointers, and it tells you when a keyword is outside that subset.",
    category: "json",
    howTo: [
      "Paste the instance data and the schema. Both must be JSON.",
      "Validate. Errors name a path and the assertion that failed.",
      "Remove or replace unsupported keywords if the tool lists them.",
    ],
    examples: [
      {
        title: "Required number",
        body: '{ "type": "object", "required": ["id"], "properties": { "id": { "type": "number" } }, "additionalProperties": false }',
      },
      {
        title: "Local reference",
        body: '{ "$defs": { "id": { "type": "integer" } }, "properties": { "id": { "$ref": "#/$defs/id" } } }',
      },
    ],
    mistakes: [
      "Unknown keywords do not pass silently. The result stays invalid until they are removed.",
      "format checks for email, date-time, uri, and uuid are light pattern checks.",
      "$ref only resolves #/$defs/name and #/definitions/name.",
    ],
    faqs: [
      {
        question: "Which draft is this?",
        answer:
          "A subset of draft 2020-12: type, enum, const, required, properties, additionalProperties, items, length and numeric bounds, pattern, a few formats, anyOf, oneOf, allOf, not, if/then/else, and local $ref.",
      },
      {
        question: "Why did a valid-looking schema fail?",
        answer: "Keywords such as patternProperties, contains, and unevaluatedProperties are named in the errors and are not applied.",
      },
      {
        question: "Are schema patterns safe to run?",
        answer:
          "Patterns longer than 80 characters, nested quantifiers, and strings over 5,000 characters are refused instead of being executed.",
      },
    ],
    related: ["json-formatter", "jsonpath", "json-diff"],
    privacy: PRIVATE,
  },
  {
    id: "base64",
    name: "Base64",
    href: "/developer-tools/base64",
    summary: "Encode or decode UTF-8 text and small files.",
    metaTitle: "Base64 Encoder & Decoder — Free Online Tool",
    h1: "Base64 Encoder & Decoder",
    description:
      "Encode and decode Base64 in your browser, including UTF-8 text, the URL-safe alphabet, and small local files. Encoding is not encryption.",
    intro:
      "Turn UTF-8 text or a local file into Base64, or decode it back. Standard and URL-safe alphabets are both supported. Base64 hides nothing from someone who can read the text.",
    category: "encoders",
    howTo: [
      "Choose encode or decode, and standard or URL-safe output.",
      "Paste text or upload a file up to 1.5 MB.",
      "Copy the result or download decoded bytes when they are not UTF-8 text.",
    ],
    examples: [
      { title: "UTF-8", body: "héllo 😀 round-trips through standard Base64." },
      { title: "URL-safe", body: "The URL-safe form uses - and _ and omits = padding." },
    ],
    mistakes: [
      "Base64 is not encryption. Anyone can decode it.",
      "URL-safe text uses - and _ rather than + and /.",
      "Decoding a binary file as text fails when the bytes are not UTF-8. Download the bytes instead.",
    ],
    faqs: [
      {
        question: "Is Base64 encryption?",
        answer: "No. It is an encoding. Do not use it to protect a secret.",
      },
      {
        question: "How is Unicode handled?",
        answer: "Text is encoded as UTF-8 bytes before Base64, and decoded back as UTF-8. It is not treated as a series of Latin-1 characters.",
      },
      {
        question: "What does URL-safe change?",
        answer: "+ becomes -, / becomes _, and padding = is removed on encode. Decode accepts that form and restores the bytes.",
      },
    ],
    related: ["url-encoder", "jwt-decoder", "json-formatter"],
    privacy: PRIVATE,
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    href: "/developer-tools/jwt-decoder",
    summary: "Inspect a token header and payload. The signature is not checked.",
    metaTitle: "JWT Decoder — Inspect Tokens Online",
    h1: "JWT Decoder",
    description:
      "Decode a JWT header and payload in your browser. Expiration is formatted, the signature is not checked, and the token is not stored.",
    intro:
      "Inspect the header, payload, and registered time claims of a JSON Web Token. This page does not verify the signature and does not save the token.",
    category: "security",
    howTo: [
      "Paste a token with three segments. Leave the page to drop it from memory.",
      "Read the header and payload. iat and exp are shown as ISO-8601 UTC.",
      "If exp is in the past, the page says the token is expired. That still does not mean the signature was checked.",
    ],
    examples: [
      {
        title: "Three segments",
        body: "header.payload.signature\n\nEach of the first two segments is Base64URL JSON.",
      },
      {
        title: "Expiration",
        body: "exp is a NumericDate in seconds. The page compares it with the current time and does not call the token verified.",
      },
    ],
    mistakes: [
      "A decoded payload is not a verified token.",
      "alg in the header is displayed only. It is not used to check a signature.",
      "Do not paste a live production token into a shared computer.",
    ],
    faqs: [
      {
        question: "Does this verify the signature?",
        answer:
          "No. Verification needs the issuer's key and the correct algorithm. The page never says a token is verified.",
      },
      {
        question: "Is the token stored?",
        answer: "No. It is not written to local storage, sent to analytics, or uploaded.",
      },
      {
        question: "What does expired mean here?",
        answer: "exp is earlier than the current time. It is only a date comparison on the decoded claim.",
      },
    ],
    related: ["base64", "json-formatter", "url-encoder"],
    privacy: `${PRIVATE} The token is not saved. The signature is not checked, so a decoded payload is not verified.`,
  },
  {
    id: "url-encoder",
    name: "URL Encoder",
    href: "/developer-tools/url-encoder",
    summary: "Encode or decode URLs, query strings, and parameters.",
    metaTitle: "URL Encoder & Decoder — Free Online Tool",
    h1: "URL Encoder & Decoder",
    description:
      "Encode and decode URLs and query strings in your browser, with separate component and full-URL modes plus a query editor.",
    intro:
      "Encode a single component or a whole URL, decode percent-escapes, and edit query parameters. Invalid % sequences are reported instead of being guessed.",
    category: "encoders",
    howTo: [
      "Use component mode for one value, such as a query parameter. Use full URL mode when slashes and the scheme should stay intact.",
      "Decode only text whose % sequences are complete hex pairs.",
      "Open the query editor to change keys and values, then rebuild the URL.",
    ],
    examples: [
      { title: "Component", body: 'a b/ç\n\nencodeURIComponent → a%20b%2F%C3%A7' },
      { title: "Full URL", body: "https://example.com/a b\n\nencodeURI leaves : and / in place and encodes the space." },
    ],
    mistakes: [
      "encodeURIComponent encodes /, so it will break a full URL if you use it on the whole string.",
      "A trailing % or %ZZ is invalid and is not silently dropped.",
      "The query editor uses URLSearchParams, which encodes spaces as +.",
    ],
    faqs: [
      {
        question: "When should I use each mode?",
        answer:
          "Component mode is encodeURIComponent, for a single piece of a URL. Full URL mode is encodeURI, which preserves structural characters such as : / ? #.",
      },
      {
        question: "How are Unicode characters encoded?",
        answer: "As UTF-8 percent-bytes. café in a component becomes caf%C3%A9.",
      },
      {
        question: "What is an invalid percent sequence?",
        answer: "A % that is not followed by two hexadecimal digits, such as % or %ZZ.",
      },
    ],
    related: ["base64", "regex-tester", "json-to-csv"],
    privacy: PRIVATE,
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    href: "/developer-tools/regex-tester",
    summary: "Test a pattern, see groups, and preview a replacement.",
    metaTitle: "Regex Tester — Test Regular Expressions",
    h1: "Regex Tester",
    description:
      "Test a regular expression in your browser with match highlights, capture groups, and a replace preview. Patterns run with a time and size limit.",
    intro:
      "Try a JavaScript regular expression against sample text. Matches, groups, and an optional replacement stay on this page, and a pattern that runs too long is stopped.",
    category: "text",
    howTo: [
      "Enter a pattern, flags, and the test text.",
      "Run the test. Highlights and capture groups appear when the pattern is valid.",
      "Add a replacement to preview JavaScript replace rules, including $1.",
    ],
    examples: [
      { title: "Groups", body: "h(el)lo with the g flag on \"hello hello\" finds two matches and the group el." },
      { title: "Date pieces", body: "(\\d{4})-(\\d{2})-(\\d{2})" },
    ],
    mistakes: [
      "Flags are only g, i, m, s, u, and y, once each.",
      "Without g, the match list still shows later hits, but replace changes only the first hit.",
      "Patterns longer than 256 characters, or text longer than 50,000 characters, are rejected.",
    ],
    faqs: [
      {
        question: "How are long-running patterns stopped?",
        answer:
          "The pattern runs in a background thread and is terminated after 200 milliseconds. The page also refuses oversized patterns and text, and it caps the match list at 200.",
      },
      {
        question: "Which replace syntax is used?",
        answer: "JavaScript's. $& is the whole match and $1 is the first group. Without the g flag, only the first match is replaced.",
      },
      {
        question: "Is the pattern uploaded?",
        answer: "No. The pattern and the test text stay in the browser and are not sent to analytics.",
      },
    ],
    related: ["url-encoder", "json-formatter", "unix-timestamp"],
    privacy: `${PRIVATE} The pattern runs in a short-lived background thread and is stopped if it takes too long.`,
  },
  {
    id: "unix-timestamp",
    name: "Unix Timestamp",
    href: "/developer-tools/unix-timestamp",
    summary: "Convert seconds or milliseconds to a calendar time.",
    metaTitle: "Unix Timestamp Converter — Free Online Tool",
    h1: "Unix Timestamp Converter",
    description:
      "Convert Unix time between seconds and milliseconds, UTC, local time, and ISO-8601. Includes the current time and a relative label.",
    intro:
      "Turn a Unix timestamp into a calendar time, or a calendar time into seconds and milliseconds. Seconds and milliseconds are separate choices so a 10-digit value is not guessed.",
    category: "text",
    howTo: [
      "Choose seconds or milliseconds before you convert a number.",
      "Read UTC, local time, and ISO-8601. Copy either unit.",
      "Use the current time, or convert an ISO-8601 date back to Unix time.",
    ],
    examples: [
      { title: "Seconds", body: "1700000000 seconds → 2023-11-14T22:13:20.000Z" },
      { title: "Milliseconds", body: "1700000000000 milliseconds → the same instant. 1700000000 milliseconds is in January 1970." },
    ],
    mistakes: [
      "The unit is not inferred. A 10-digit number read as milliseconds lands in 1970.",
      "A date without Z is UTC in UTC mode and local in Local mode.",
      "If the text already contains Z or an offset, that zone is the instant.",
    ],
    faqs: [
      {
        question: "What is the difference between seconds and milliseconds?",
        answer:
          "Unix seconds count from 1970-01-01T00:00:00Z. JavaScript's Date uses milliseconds, which is the seconds value times 1,000. The same digits are not the same instant.",
      },
      {
        question: "Which timezone is local?",
        answer: "The timezone of the browser. UTC and the ISO-8601 Zulu value do not depend on that setting.",
      },
      {
        question: "What does the relative label mean?",
        answer: "It compares the converted instant with the current time, such as \"2 minutes ago\".",
      },
    ],
    related: ["json-formatter", "regex-tester", "url-encoder"],
    privacy: PRIVATE,
  },
];

export const DEVELOPER_TOOL_PATHS = ["/developer-tools", ...DEVELOPER_TOOLS.map((tool) => tool.href)];

export const toolsById: Record<string, DevTool> = Object.fromEntries(DEVELOPER_TOOLS.map((tool) => [tool.id, tool]));

export function getTool(id: string): DevTool {
  const tool = toolsById[id];
  if (!tool) throw new Error(`Unknown developer tool: ${id}`);
  return tool;
}
