import { deepEqual } from "@/lib/dev-tools/json";

export interface SchemaError {
  path: string;
  message: string;
}

const ANNOTATIONS = new Set([
  "title",
  "description",
  "default",
  "examples",
  "$schema",
  "$id",
  "$comment",
  "deprecated",
  "readOnly",
  "writeOnly",
]);

const SUPPORTED = new Set([
  "type",
  "enum",
  "const",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minProperties",
  "maxProperties",
  "pattern",
  "format",
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  "if",
  "then",
  "else",
  "$ref",
  "$defs",
  "definitions",
]);

const MAX_ERRORS = 40;
const MAX_DEPTH = 32;
const FORMATS = new Set(["email", "date-time", "uri", "uuid"]);

/**
 * A practical subset of JSON Schema draft 2020-12.
 * Unknown keywords fail the check instead of being ignored.
 * Formats are light checks, not a full validator.
 * Patterns are length-capped and rejected when they look nested-quantifier expensive.
 */
export function validateSchema(
  data: unknown,
  schema: unknown,
): { valid: boolean; errors: SchemaError[] } {
  const errors: SchemaError[] = [];
  if (typeof schema === "boolean") {
    if (!schema) errors.push({ path: "$", message: "Schema false rejects every value." });
    return { valid: errors.length === 0, errors };
  }
  if (!isSchemaObject(schema)) {
    return { valid: false, errors: [{ path: "$", message: "The schema must be a JSON object or a boolean." }] };
  }
  for (const node of collectSchemas(schema)) {
    for (const key of Object.keys(node)) {
      if (!SUPPORTED.has(key) && !ANNOTATIONS.has(key)) {
        errors.push({ path: "$schema", message: `Unsupported keyword "${key}". It was not applied.` });
      }
    }
    if (errors.length >= MAX_ERRORS) break;
  }
  applySchema(data, schema, "$", { root: schema, refs: [], errors, depth: 0 });
  return { valid: errors.length === 0, errors: errors.slice(0, MAX_ERRORS) };
}

function applySchema(
  data: unknown,
  schema: unknown,
  path: string,
  ctx: { root: unknown; refs: string[]; errors: SchemaError[]; depth: number },
) {
  if (ctx.errors.length >= MAX_ERRORS) return;
  if (ctx.depth > MAX_DEPTH) {
    ctx.errors.push({ path, message: "Schema nesting is deeper than this tool allows." });
    return;
  }
  if (schema === true) return;
  if (schema === false) {
    ctx.errors.push({ path, message: "Schema false rejects this value." });
    return;
  }
  if (!isSchemaObject(schema)) {
    ctx.errors.push({ path, message: "A schema branch must be an object or a boolean." });
    return;
  }
  if (typeof schema.$ref === "string") {
    const siblings = Object.keys(schema).filter((key) => key !== "$ref" && !ANNOTATIONS.has(key));
    if (siblings.length > 0) {
      ctx.errors.push({ path, message: "Keywords beside $ref are not applied in this tool." });
    }
    if (ctx.refs.includes(schema.$ref)) {
      ctx.errors.push({ path, message: `Schema reference cycle at ${schema.$ref}.` });
      return;
    }
    const target = resolveRef(ctx.root, schema.$ref);
    if (target === undefined) {
      ctx.errors.push({
        path,
        message: `Could not resolve ${schema.$ref}. Only #/$defs/name and #/definitions/name are supported.`,
      });
      return;
    }
    ctx.refs.push(schema.$ref);
    applySchema(data, target, path, { ...ctx, depth: ctx.depth + 1 });
    ctx.refs.pop();
    return;
  }

  if ("type" in schema) checkType(data, schema.type, path, ctx);
  if ("const" in schema && !deepEqual(data, schema.const)) {
    ctx.errors.push({ path, message: `Expected ${JSON.stringify(schema.const)}.` });
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => deepEqual(item, data))) {
    ctx.errors.push({ path, message: `Expected one of ${JSON.stringify(schema.enum)}.` });
  }
  if (typeof data === "string") checkString(data, schema, path, ctx);
  if (typeof data === "number") checkNumber(data, schema, path, ctx);
  if (isPlainObject(data)) checkObject(data, schema, path, ctx);
  if (Array.isArray(data)) checkArray(data, schema, path, ctx);
  checkCombinators(data, schema, path, ctx);
}

function checkType(data: unknown, type: unknown, path: string, ctx: { errors: SchemaError[] }) {
  const types = Array.isArray(type) ? type : [type];
  if (types.some((item) => typeof item !== "string" || !matchesType(data, item))) {
    if (!types.every((item) => typeof item === "string")) {
      ctx.errors.push({ path, message: "Schema type must be a string or an array of strings." });
      return;
    }
  }
  if (!types.some((item) => typeof item === "string" && matchesType(data, item))) {
    ctx.errors.push({ path, message: `Expected type ${types.join(" or ")}, got ${jsonType(data)}.` });
  }
}

function checkString(
  data: string,
  schema: Record<string, unknown>,
  path: string,
  ctx: { errors: SchemaError[] },
) {
  if (typeof schema.minLength === "number" && data.length < schema.minLength) {
    ctx.errors.push({ path, message: `Shorter than minLength ${schema.minLength}.` });
  }
  if (typeof schema.maxLength === "number" && data.length > schema.maxLength) {
    ctx.errors.push({ path, message: `Longer than maxLength ${schema.maxLength}.` });
  }
  if (typeof schema.pattern === "string") {
    const result = testPattern(data, schema.pattern);
    if (!result.ok) ctx.errors.push({ path, message: result.error });
    else if (!result.match) ctx.errors.push({ path, message: `Does not match pattern ${schema.pattern}.` });
  }
  if (typeof schema.format === "string") {
    if (!FORMATS.has(schema.format)) {
      ctx.errors.push({ path, message: `Format "${schema.format}" is not supported in this tool.` });
    } else if (!checkFormat(data, schema.format)) {
      ctx.errors.push({ path, message: `Does not look like format ${schema.format}.` });
    }
  }
}

function checkNumber(
  data: number,
  schema: Record<string, unknown>,
  path: string,
  ctx: { errors: SchemaError[] },
) {
  if (typeof schema.minimum === "number" && data < schema.minimum) {
    ctx.errors.push({ path, message: `Below minimum ${schema.minimum}.` });
  }
  if (typeof schema.maximum === "number" && data > schema.maximum) {
    ctx.errors.push({ path, message: `Above maximum ${schema.maximum}.` });
  }
  if (typeof schema.exclusiveMinimum === "number" && data <= schema.exclusiveMinimum) {
    ctx.errors.push({ path, message: `Not above exclusiveMinimum ${schema.exclusiveMinimum}.` });
  }
  if (typeof schema.exclusiveMaximum === "number" && data >= schema.exclusiveMaximum) {
    ctx.errors.push({ path, message: `Not below exclusiveMaximum ${schema.exclusiveMaximum}.` });
  }
  if (typeof schema.multipleOf === "number" && schema.multipleOf > 0) {
    const quotient = data / schema.multipleOf;
    if (Math.abs(quotient - Math.round(quotient)) > 1e-9) {
      ctx.errors.push({ path, message: `Not a multiple of ${schema.multipleOf}.` });
    }
  }
}

function checkObject(
  data: Record<string, unknown>,
  schema: Record<string, unknown>,
  path: string,
  ctx: { root: unknown; refs: string[]; errors: SchemaError[]; depth: number },
) {
  const keys = Object.keys(data);
  if (typeof schema.minProperties === "number" && keys.length < schema.minProperties) {
    ctx.errors.push({ path, message: `Fewer than minProperties ${schema.minProperties}.` });
  }
  if (typeof schema.maxProperties === "number" && keys.length > schema.maxProperties) {
    ctx.errors.push({ path, message: `More than maxProperties ${schema.maxProperties}.` });
  }
  const properties = isPlainObject(schema.properties) ? schema.properties : {};
  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (typeof key === "string" && !Object.prototype.hasOwnProperty.call(data, key)) {
        ctx.errors.push({ path: child(path, key), message: "Missing required property." });
      }
    }
  }
  for (const key of keys) {
    const childPath = child(path, key);
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      applySchema(data[key], properties[key], childPath, { ...ctx, depth: ctx.depth + 1 });
    } else if (schema.additionalProperties === false) {
      ctx.errors.push({ path: childPath, message: "Additional property is not allowed." });
    } else if (isSchemaObject(schema.additionalProperties) || typeof schema.additionalProperties === "boolean") {
      if (schema.additionalProperties !== true) {
        applySchema(data[key], schema.additionalProperties, childPath, { ...ctx, depth: ctx.depth + 1 });
      }
    }
  }
}

function checkArray(
  data: unknown[],
  schema: Record<string, unknown>,
  path: string,
  ctx: { root: unknown; refs: string[]; errors: SchemaError[]; depth: number },
) {
  if (typeof schema.minItems === "number" && data.length < schema.minItems) {
    ctx.errors.push({ path, message: `Fewer than minItems ${schema.minItems}.` });
  }
  if (typeof schema.maxItems === "number" && data.length > schema.maxItems) {
    ctx.errors.push({ path, message: `More than maxItems ${schema.maxItems}.` });
  }
  if (schema.uniqueItems === true) {
    if (data.length > 1000) {
      ctx.errors.push({ path, message: "uniqueItems is only checked for arrays up to 1,000 items." });
    } else {
      for (let i = 0; i < data.length; i += 1) {
        for (let j = i + 1; j < data.length; j += 1) {
          if (deepEqual(data[i], data[j])) {
            ctx.errors.push({ path, message: `Items ${i} and ${j} are equal.` });
            i = data.length;
            break;
          }
        }
      }
    }
  }
  if ("items" in schema) {
    if (Array.isArray(schema.items)) {
      ctx.errors.push({ path, message: "Tuple items arrays are not supported. Use one schema for every item." });
    } else {
      data.forEach((item, index) => {
        applySchema(item, schema.items, `${path}[${index}]`, { ...ctx, depth: ctx.depth + 1 });
      });
    }
  }
}

function checkCombinators(
  data: unknown,
  schema: Record<string, unknown>,
  path: string,
  ctx: { root: unknown; refs: string[]; errors: SchemaError[]; depth: number },
) {
  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((branch, index) => {
      applySchema(data, branch, `${path}/allOf/${index}`, { ...ctx, depth: ctx.depth + 1 });
    });
  }
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((branch) => branchValid(data, branch, ctx))) {
    ctx.errors.push({ path, message: "Did not match any anyOf schema." });
  }
  if (Array.isArray(schema.oneOf)) {
    const matched = schema.oneOf.filter((branch) => branchValid(data, branch, ctx)).length;
    if (matched !== 1) ctx.errors.push({ path, message: `Expected exactly one oneOf match, found ${matched}.` });
  }
  if ("not" in schema && branchValid(data, schema.not, ctx)) {
    ctx.errors.push({ path, message: "Matched a not schema." });
  }
  if ("if" in schema) {
    const branch = branchValid(data, schema.if, ctx);
    if (branch && "then" in schema) applySchema(data, schema.then, path, { ...ctx, depth: ctx.depth + 1 });
    if (!branch && "else" in schema) applySchema(data, schema.else, path, { ...ctx, depth: ctx.depth + 1 });
  }
}

function branchValid(
  data: unknown,
  schema: unknown,
  ctx: { root: unknown; refs: string[]; depth: number },
): boolean {
  const errors: SchemaError[] = [];
  applySchema(data, schema, "$", { root: ctx.root, refs: [...ctx.refs], errors, depth: ctx.depth + 1 });
  return errors.length === 0;
}

function matchesType(value: unknown, type: string): boolean {
  switch (type) {
    case "object":
      return isPlainObject(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return false;
  }
}

function testPattern(value: string, pattern: string): { ok: true; match: boolean } | { ok: false; error: string } {
  if (pattern.length > 80) return { ok: false, error: "Patterns longer than 80 characters are not run in this tool." };
  if (/(\+|\*|\{[^}]+\})\s*\)\s*(\+|\*|\{)/.test(pattern)) {
    return { ok: false, error: "That pattern is too expensive to run in the browser." };
  }
  if (value.length > 5_000) return { ok: false, error: "Strings longer than 5,000 characters are not tested against patterns here." };
  try {
    return { ok: true, match: new RegExp(pattern).test(value) };
  } catch {
    return { ok: false, error: "The schema pattern is not a valid regular expression." };
  }
}

function checkFormat(value: string, format: string): boolean {
  if (format === "email") return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (format === "uuid") return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  if (format === "date-time") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
    return !Number.isNaN(Date.parse(value));
  }
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.protocol !== ":");
  } catch {
    return false;
  }
}

function resolveRef(root: unknown, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (parts.length !== 2 || (parts[0] !== "$defs" && parts[0] !== "definitions")) return undefined;
  if (!isPlainObject(root)) return undefined;
  const bucket = root[parts[0]];
  if (!isPlainObject(bucket) || !Object.prototype.hasOwnProperty.call(bucket, parts[1])) return undefined;
  return bucket[parts[1]];
}

function collectSchemas(schema: unknown, depth = 0, out: Record<string, unknown>[] = []) {
  if (depth > MAX_DEPTH || !isSchemaObject(schema)) return out;
  out.push(schema);
  for (const key of ["properties", "$defs", "definitions"] as const) {
    const value = schema[key];
    if (isPlainObject(value)) {
      for (const child of Object.values(value)) collectSchemas(child, depth + 1, out);
    }
  }
  for (const key of ["items", "additionalProperties", "not", "if", "then", "else"] as const) {
    collectSchemas(schema[key], depth + 1, out);
  }
  for (const key of ["anyOf", "oneOf", "allOf"] as const) {
    const value = schema[key];
    if (Array.isArray(value)) for (const child of value) collectSchemas(child, depth + 1, out);
  }
  return out;
}

function child(parent: string, key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return `${parent}.${key}`;
  return `${parent}[${JSON.stringify(key)}]`;
}

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchemaObject(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}
