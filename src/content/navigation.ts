import type { LucideIcon } from "lucide-react";
import { Activity, Calculator, MonitorPlay } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavColumn {
  id: string;
  label: string;
  icon: LucideIcon;
  links: NavLink[];
}

export const PRIMARY_LINKS = [
  { href: "/speed-test", label: "Speed Test", match: ["/", "/speed-test", "/internet-speed-test", "/wifi-speed-test", "/upload-speed-test"] },
  { href: "/mesh-wifi", label: "Wi-Fi & Mesh", match: ["/mesh-wifi"] },
  { href: "/network-health", label: "Network Health", match: ["/network-health"] },
  { href: "/guides", label: "Guides", match: ["/guides"] },
] as const;

export const TOOL_COLUMNS: NavColumn[] = [
  {
    id: "diagnostics",
    label: "Diagnostics",
    icon: Activity,
    links: [
      { href: "/ping-test", label: "Ping Test" },
      { href: "/jitter-test", label: "Jitter Test" },
      { href: "/bufferbloat-test", label: "Bufferbloat Test" },
      { href: "/connection-stability-test", label: "Connection Stability" },
      { href: "/packet-loss-test", label: "Request Loss" },
    ],
  },
  {
    id: "use-cases",
    label: "Use Cases",
    icon: MonitorPlay,
    links: [
      { href: "/gaming-speed-test", label: "Gaming Test" },
      { href: "/streaming-speed-test", label: "Streaming Test" },
      { href: "/video-call-test", label: "Video Call Test" },
      { href: "/dns-speed-test", label: "DNS Timing" },
    ],
  },
  {
    id: "calculators",
    label: "Calculators",
    icon: Calculator,
    links: [
      { href: "/download-time-calculator", label: "Download Time" },
      { href: "/upload-time-calculator", label: "Upload Time" },
      { href: "/mbps-to-mbs", label: "Mbps Converter" },
      { href: "/internet-speed-calculator", label: "Speed Planner" },
    ],
  },
];

export const WIFI_HUB_LINKS: NavLink[] = [
  { href: "/mesh-wifi/planner", label: "Mesh Planner" },
  { href: "/mesh-wifi/setup", label: "Mesh Setup Assistant" },
  { href: "/mesh-wifi/placement-optimizer", label: "Node Placement" },
  { href: "/mesh-wifi/dead-zone-test", label: "Room Testing" },
  { href: "/mesh-wifi/planner", label: "Router Login Assistant" },
  { href: "/mesh-wifi/troubleshooter", label: "Wi-Fi Troubleshooting" },
];

export function pathMatches(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
