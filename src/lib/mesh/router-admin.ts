/**
 * Client-side router admin helper.
 * Builds a local page URL after validation. It does not scan the network,
 * store credentials, or contact MySpeedGauge servers.
 */

export type RouterManagement = "app" | "web" | "app-or-web";

export interface RouterModelChoice {
  id: string;
  label: string;
}

export interface RouterManufacturerGuide {
  id: string;
  name: string;
  management: RouterManagement;
  appName: string | null;
  supportUrl: string | null;
  gatewaySuggestions: string[];
  models: RouterModelChoice[];
  steps: string[];
}

/**
 * Reserved for a future official router API.
 * This phase does not implement authorization, discovery, or any method that
 * accepts a password.
 */
export interface RouterIntegrationProvider {
  id: string;
  displayName: string;
  authorization: "none" | "vendor-oauth";
  supportsLocalAdminPage: boolean;
}

export interface LocalAdminPageProvider extends RouterIntegrationProvider {
  authorization: "none";
  supportsLocalAdminPage: true;
  buildAdminUrl: (address: string) => string | null;
}

export const COMMON_GATEWAY_SUGGESTIONS = [
  "192.168.1.1",
  "192.168.0.1",
  "192.168.1.254",
  "10.0.0.1",
  "192.168.50.1",
] as const;

const VENDOR_ADMIN_HOSTS = new Set([
  "routerlogin.net",
  "www.routerlogin.net",
  "orbilogin.com",
  "www.orbilogin.com",
  "router.asus.com",
  "asusrouter.com",
  "www.asusrouter.com",
  "tplinkwifi.net",
  "www.tplinkwifi.net",
  "tplinkmodem.net",
]);

const LOCAL_SUFFIXES = [".local", ".lan", ".home", ".internal", ".home.arpa"];

export const ROUTER_MANUFACTURERS: RouterManufacturerGuide[] = [
  {
    id: "eero",
    name: "Amazon eero",
    management: "app",
    appName: "eero app",
    supportUrl: "https://support.eero.com/",
    gatewaySuggestions: [],
    models: [
      { id: "eero", label: "eero" },
      { id: "eero-pro", label: "eero Pro" },
      { id: "eero-6", label: "eero 6 / 6+ / Pro 6" },
      { id: "eero-max-7", label: "eero 7 / Max 7" },
      { id: "other", label: "Other eero model" },
    ],
    steps: [
      "Consumer eero systems are managed in the eero app, not a browser login page.",
      "Install the eero app, join the eero Wi-Fi, and sign in with the account that set up the network.",
      "Use the official eero support site for the model printed on the node. MySpeedGauge does not ask for the eero password.",
    ],
  },
  {
    id: "google-nest",
    name: "Google Nest Wifi",
    management: "app",
    appName: "Google Home app",
    supportUrl: "https://support.google.com/googlenest/",
    gatewaySuggestions: [],
    models: [
      { id: "nest-wifi", label: "Nest Wifi" },
      { id: "nest-wifi-pro", label: "Nest Wifi Pro" },
      { id: "google-wifi", label: "Google Wifi" },
      { id: "other", label: "Other Google Wifi model" },
    ],
    steps: [
      "Nest Wifi, Nest Wifi Pro, and Google Wifi are managed in the Google Home app.",
      "Open Google Home, select the home that owns the Wi-Fi, then Wifi.",
      "Follow Google’s support steps for that exact product. MySpeedGauge does not ask for the Google account password.",
    ],
  },
  {
    id: "tp-link",
    name: "TP-Link",
    management: "app-or-web",
    appName: "Deco or Tether app",
    supportUrl: "https://www.tp-link.com/support/",
    gatewaySuggestions: ["192.168.0.1", "tplinkwifi.net"],
    models: [
      { id: "deco", label: "Deco" },
      { id: "archer", label: "Archer" },
      { id: "other", label: "Other TP-Link model" },
    ],
    steps: [
      "Deco kits are usually changed in the Deco app. Many Archer routers also open a local admin page.",
      "A commonly used address is 192.168.0.1 or tplinkwifi.net. The label on the router can show a different one.",
      "Type the router password only on TP-Link’s page or in TP-Link’s app.",
    ],
  },
  {
    id: "netgear",
    name: "NETGEAR",
    management: "app-or-web",
    appName: "Nighthawk or Orbi app",
    supportUrl: "https://kb.netgear.com/",
    gatewaySuggestions: ["192.168.1.1", "routerlogin.net"],
    models: [
      { id: "orbi", label: "Orbi" },
      { id: "nighthawk", label: "Nighthawk" },
      { id: "other", label: "Other NETGEAR model" },
    ],
    steps: [
      "Orbi can be managed in the Orbi app. Many NETGEAR routers also open a local admin page.",
      "A commonly used address is 192.168.1.1 or routerlogin.net while you are joined to that Wi-Fi.",
      "Type the router password only on NETGEAR’s page or in NETGEAR’s app.",
    ],
  },
  {
    id: "asus",
    name: "ASUS",
    management: "app-or-web",
    appName: "ASUS Router app",
    supportUrl: "https://www.asus.com/support/",
    gatewaySuggestions: ["192.168.50.1", "192.168.1.1", "router.asus.com"],
    models: [
      { id: "zenwifi", label: "ZenWiFi" },
      { id: "rt", label: "RT series" },
      { id: "other", label: "Other ASUS model" },
    ],
    steps: [
      "ASUS routers can be changed in the ASUS Router app or on the local admin page.",
      "Commonly used addresses include 192.168.50.1, 192.168.1.1, and router.asus.com. Check the card that shipped with the router.",
      "Type the router password only on the ASUS page or in the ASUS Router app.",
    ],
  },
  {
    id: "linksys",
    name: "Linksys",
    management: "app-or-web",
    appName: "Linksys app",
    supportUrl: "https://support.linksys.com/",
    gatewaySuggestions: ["192.168.1.1"],
    models: [
      { id: "velop", label: "Velop" },
      { id: "other", label: "Other Linksys model" },
    ],
    steps: [
      "Velop systems are often changed in the Linksys app. Many Linksys routers also open a local admin page.",
      "A commonly used address is 192.168.1.1. Use the address printed for your model if it differs.",
      "Type the router password only on the Linksys page or in the Linksys app.",
    ],
  },
  {
    id: "other",
    name: "Other router",
    management: "web",
    appName: null,
    supportUrl: null,
    gatewaySuggestions: [...COMMON_GATEWAY_SUGGESTIONS],
    models: [{ id: "other", label: "Not listed" }],
    steps: [
      "Find the admin address on the router label or in the vendor’s quick start.",
      "Enter that address below. MySpeedGauge only opens it in a new tab after you confirm.",
      "Type the router password only on the router’s own page.",
    ],
  },
];

export function getRouterManufacturer(id: string): RouterManufacturerGuide | undefined {
  return ROUTER_MANUFACTURERS.find((item) => item.id === id);
}

export function gatewaySuggestionsFor(manufacturerId: string): string[] {
  const brand = getRouterManufacturer(manufacturerId);
  const preferred = brand?.gatewaySuggestions ?? [];
  const merged = [...preferred, ...COMMON_GATEWAY_SUGGESTIONS];
  return merged.filter((value, index) => merged.indexOf(value) === index).slice(0, 6);
}

export interface ParsedGateway {
  ok: true;
  url: string;
  host: string;
  port: string | null;
  scheme: "http" | "https";
  kind: "ipv4" | "ipv6" | "hostname";
  typicalLocalGateway: boolean;
}

export interface GatewayParseError {
  ok: false;
  error: string;
}

export type GatewayParseResult = ParsedGateway | GatewayParseError;

function fail(error: string): GatewayParseError {
  return { ok: false, error };
}

export function parseGatewayAddress(raw: string): GatewayParseResult {
  const input = raw.trim();
  if (!input) return fail("Enter the gateway address.");
  if (/\s/.test(input) || input.includes("\\") || input.includes("@") || input.includes("%")) {
    return fail("That address is not a supported gateway.");
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input) && !/^https?:\/\//i.test(input)) {
    return fail("Use http or https for a local admin page.");
  }

  let scheme: "http" | "https" = "http";
  let hostPort = input;
  if (/^https?:\/\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      return fail("That address is not a supported gateway.");
    }
    if (url.username || url.password) {
      return fail("Leave the password on the router page. Do not put it in the address.");
    }
    if (url.pathname !== "/" && url.pathname !== "") {
      return fail("Use the gateway address only, without a page path.");
    }
    if (url.search || url.hash) {
      return fail("Use the gateway address only, without extra parameters.");
    }
    scheme = url.protocol === "https:" ? "https" : "http";
    hostPort = url.host;
  }

  const split = splitHostPort(hostPort);
  if (!split) return fail("That address is not a supported gateway.");
  const kind = classifyHost(split.host);
  if (!kind) return fail("Use an IPv4 address, an IPv6 address, or a local router hostname.");

  const bracket = kind === "ipv6" ? `[${split.host}]` : split.host;
  const portSuffix = split.port == null ? "" : `:${split.port}`;
  const url = `${scheme}://${bracket}${portSuffix}/`;
  try {
    const check = new URL(url);
    if (check.username || check.password || check.protocol !== `${scheme}:`) {
      return fail("That address is not a supported gateway.");
    }
  } catch {
    return fail("That address is not a supported gateway.");
  }

  return {
    ok: true,
    url,
    host: split.host,
    port: split.port == null ? null : String(split.port),
    scheme,
    kind,
    typicalLocalGateway: kind === "hostname" ? true : isTypicalLocalIp(kind, split.host),
  };
}

export const localAdminPageProvider: LocalAdminPageProvider = {
  id: "local-admin-page",
  displayName: "Open the local admin page",
  authorization: "none",
  supportsLocalAdminPage: true,
  buildAdminUrl(address) {
    const parsed = parseGatewayAddress(address);
    return parsed.ok ? parsed.url : null;
  },
};

function splitHostPort(value: string): { host: string; port: number | null } | null {
  if (value.startsWith("[")) {
    const match = /^\[([^\]]+)\](?::(\d{1,5}))?$/.exec(value);
    if (!match) return null;
    const port = match[2] == null ? null : Number(match[2]);
    if (port != null && (port < 1 || port > 65535)) return null;
    return { host: match[1] ?? "", port };
  }
  const colonCount = value.split(":").length - 1;
  if (colonCount > 1) return { host: value, port: null };
  if (colonCount === 1) {
    const [host, portText] = value.split(":");
    if (!host || !portText || !/^\d{1,5}$/.test(portText)) return null;
    const port = Number(portText);
    if (port < 1 || port > 65535) return null;
    return { host, port };
  }
  return { host: value, port: null };
}

function classifyHost(host: string): ParsedGateway["kind"] | null {
  if (isIpv4(host)) return "ipv4";
  if (isIpv6(host)) return "ipv6";
  if (isSupportedHostname(host)) return "hostname";
  return null;
}

function isIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith("0")) return false;
    const value = Number(part);
    return value >= 0 && value <= 255;
  });
}

function isIpv6(host: string): boolean {
  if (!host.includes(":") || host.includes("%")) return false;
  try {
    const url = new URL(`http://[${host}]/`);
    return url.hostname.startsWith("[") && url.hostname.endsWith("]");
  } catch {
    return false;
  }
}

function isSupportedHostname(host: string): boolean {
  if (!/^[a-z0-9.-]+$/i.test(host)) return false;
  if (host.length > 253 || host.startsWith(".") || host.endsWith(".") || host.includes("..")) return false;
  const lower = host.toLowerCase();
  const labels = lower.split(".");
  if (labels.some((label) => label.length === 0 || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }
  if (VENDOR_ADMIN_HOSTS.has(lower)) return true;
  if (labels.length === 1) return true;
  return LOCAL_SUFFIXES.some((suffix) => lower.endsWith(suffix) && lower.length > suffix.length);
}

function isTypicalLocalIp(kind: "ipv4" | "ipv6", host: string): boolean {
  if (kind === "ipv4") {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
    return false;
  }
  const groups = expandIpv6(host);
  if (!groups) return false;
  const first = groups[0] ?? 0;
  if (groups.every((group) => group === 0) || (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1)) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  if ((first & 0xfe00) === 0xfc00) return true;
  return false;
}

function expandIpv6(host: string): number[] | null {
  const halves = host.toLowerCase().split("::");
  if (halves.length > 2) return null;
  const parseSide = (side: string) => (side ? side.split(":") : []);
  const left = parseSide(halves[0] ?? "");
  const right = halves.length === 2 ? parseSide(halves[1] ?? "") : [];
  if (halves.length === 1 && left.length !== 8) return null;
  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;
  const groups = [...left, ...Array.from({ length: missing }, () => "0"), ...right];
  if (groups.length !== 8) return null;
  const numbers = groups.map((group) => (/^[0-9a-f]{1,4}$/.test(group) ? Number.parseInt(group, 16) : Number.NaN));
  if (numbers.some((value) => Number.isNaN(value))) return null;
  return numbers;
}
