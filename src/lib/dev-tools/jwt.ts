import { decodeUtf8, encodeUtf8 } from "@/lib/dev-tools/base64";

export interface JwtClaimTime {
  seconds: number;
  iso: string;
}

export interface JwtDecoded {
  ok: true;
  headerText: string;
  payloadText: string;
  header: unknown;
  payload: unknown;
  signature: string;
  /** Always false. This tool never checks the signature. */
  signatureChecked: false;
  algorithm: string | null;
  expired: boolean | null;
  exp: JwtClaimTime | null;
  iat: JwtClaimTime | null;
  aud: unknown;
  iss: unknown;
  notice: string;
}

const NOTICE =
  "The signature was not checked. Verification needs the issuer's key and the algorithm named in the header. A decoded payload is not proof that the token is genuine.";

export function decodeJwt(token: string, nowMs: number): JwtDecoded | { ok: false; error: string } {
  const compact = token.trim();
  if (compact.length > 20_000) return { ok: false, error: "That token is longer than 20,000 characters." };
  if (!compact) return { ok: false, error: "Paste a JWT to decode it." };
  const parts = compact.split(".");
  if (parts.length !== 3) {
    return { ok: false, error: "A JWT has three Base64URL segments separated by dots." };
  }
  const headerResult = decodeJsonSegment(parts[0], "header");
  if (!headerResult.ok) return headerResult;
  const payloadResult = decodeJsonSegment(parts[1], "payload");
  if (!payloadResult.ok) return payloadResult;

  const payload = payloadResult.value;
  const record = isRecord(payload) ? payload : null;
  const exp = readTime(record?.exp);
  const iat = readTime(record?.iat);
  const expired = exp ? exp.seconds * 1000 <= nowMs : null;
  const algorithm = isRecord(headerResult.value) && typeof headerResult.value.alg === "string" ? headerResult.value.alg : null;

  return {
    ok: true,
    headerText: JSON.stringify(headerResult.value, null, 2),
    payloadText: JSON.stringify(payloadResult.value, null, 2),
    header: headerResult.value,
    payload: payloadResult.value,
    signature: parts[2],
    signatureChecked: false,
    algorithm,
    expired,
    exp,
    iat,
    aud: record && "aud" in record ? record.aud : null,
    iss: record && typeof record.iss === "string" ? record.iss : record && "iss" in record ? record.iss : null,
    notice: NOTICE,
  };
}

/** Test helper for building a token fixture. Not a signer. */
export function unsignedJwt(header: unknown, payload: unknown, signature = "signature"): string {
  const head = encodeUtf8(JSON.stringify(header), "url");
  const body = encodeUtf8(JSON.stringify(payload), "url");
  if (!head.ok || !body.ok) throw new Error("Could not encode JWT fixture.");
  return `${head.encoded}.${body.encoded}.${signature}`;
}

function decodeJsonSegment(segment: string, label: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const decoded = decodeUtf8(segment, "url");
  if (!decoded.ok) return { ok: false, error: `The ${label} is not valid Base64URL.` };
  try {
    return { ok: true, value: JSON.parse(decoded.text) as unknown };
  } catch {
    return { ok: false, error: `The ${label} is not valid JSON.` };
  }
}

function readTime(value: unknown): JwtClaimTime | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const ms = value * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return { seconds: value, iso: date.toISOString() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
