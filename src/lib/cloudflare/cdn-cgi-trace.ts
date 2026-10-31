export interface CloudflareTrace {
  colo: string | null;
  loc: string | null;
  ip: string | null;
}

/** Parse `key=value` lines from Cloudflare /cdn-cgi/trace (no GPS). */
export function parseCloudflareTraceBody(text: string): CloudflareTrace {
  const map = new Map<string, string>();
  for (const line of text.split("\n")) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  return {
    colo: map.get("colo") ?? null,
    loc: map.get("loc") ?? null,
    ip: map.get("ip") ?? null,
  };
}

const TRACE_URLS = [
  "https://speed.cloudflare.com/cdn-cgi/trace",
  "https://www.cloudflare.com/cdn-cgi/trace",
] as const;

/** Best-effort edge colo for the visitor (browser → Cloudflare edge). */
export async function fetchCloudflareEdgeTrace(
  signal?: AbortSignal,
): Promise<CloudflareTrace | null> {
  for (const url of TRACE_URLS) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal,
        headers: { Accept: "text/plain" },
      });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseCloudflareTraceBody(text);
      if (parsed.colo) return parsed;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function formatCloudflareColoLocation(trace: CloudflareTrace | null): string {
  if (!trace?.colo) return "Cloudflare edge";
  if (trace.loc) return `${trace.colo} (${trace.loc})`;
  return trace.colo;
}
