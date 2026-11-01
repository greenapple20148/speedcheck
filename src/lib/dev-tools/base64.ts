import { sizeError } from "@/lib/dev-tools/limits";

export type Base64Variant = "standard" | "url";

export function encodeBytes(bytes: Uint8Array, variant: Base64Variant): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const standard = btoa(binary);
  if (variant === "standard") return standard;
  return standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function encodeUtf8(text: string, variant: Base64Variant): { ok: true; encoded: string } | { ok: false; error: string } {
  const tooBig = sizeError(text, "Text");
  if (tooBig) return { ok: false, error: tooBig };
  return { ok: true, encoded: encodeBytes(new TextEncoder().encode(text), variant) };
}

export function decodeToBytes(
  input: string,
  variant: Base64Variant,
): { ok: true; bytes: Uint8Array } | { ok: false; error: string } {
  const tooBig = sizeError(input, "Base64");
  if (tooBig) return { ok: false, error: tooBig };
  const compact = input.replace(/\s+/g, "");
  if (compact === "") return { ok: true, bytes: new Uint8Array() };
  const normalized = normalize(compact, variant);
  if (!normalized) {
    return {
      ok: false,
      error:
        variant === "url"
          ? "That is not URL-safe Base64. Use A–Z, a–z, 0–9, -, and _."
          : "That is not standard Base64. Use A–Z, a–z, 0–9, +, /, and = padding.",
    };
  }
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { ok: true, bytes };
  } catch {
    return { ok: false, error: "That Base64 input could not be decoded." };
  }
}

export function decodeUtf8(
  input: string,
  variant: Base64Variant,
): { ok: true; text: string; bytes: Uint8Array } | { ok: false; error: string; bytes?: Uint8Array } {
  const decoded = decodeToBytes(input, variant);
  if (!decoded.ok) return decoded;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(decoded.bytes);
    return { ok: true, text, bytes: decoded.bytes };
  } catch {
    return {
      ok: false,
      bytes: decoded.bytes,
      error: "Those bytes are not valid UTF-8 text. You can still download them as a file.",
    };
  }
}

function normalize(compact: string, variant: Base64Variant): string | null {
  if (variant === "url") {
    if (!/^[A-Za-z0-9\-_]*$/.test(compact)) return null;
    const standard = compact.replace(/-/g, "+").replace(/_/g, "/");
    const pad = standard.length % 4 === 0 ? "" : "=".repeat(4 - (standard.length % 4));
    if (pad.length > 2) return null;
    return standard + pad;
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 !== 0) return null;
  return compact;
}
