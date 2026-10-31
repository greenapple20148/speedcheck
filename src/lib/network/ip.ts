/** Returns true for loopback, RFC1918, and common link-local addresses. */
export function isPrivateOrLoopbackIp(ip: string | null | undefined): boolean {
  if (!ip) return true;
  const trimmed = ip.trim();
  if (trimmed === "::1" || trimmed.startsWith("127.")) return true;
  if (trimmed.startsWith("10.")) return true;
  if (trimmed.startsWith("192.168.")) return true;
  const m = trimmed.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (trimmed.startsWith("fe80:") || trimmed.startsWith("fc") || trimmed.startsWith("fd")) {
    return true;
  }
  return false;
}
