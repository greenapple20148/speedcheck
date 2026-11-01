import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  Cable,
  Calculator,
  CircleHelp,
  Download,
  Gamepad2,
  Gauge,
  GitCompare,
  LayoutGrid,
  Map,
  Router,
  ScanLine,
  Search,
  Tags,
  Timer,
  Tv,
  Unplug,
  Upload,
  Video,
  Waves,
  Wifi,
  Wrench,
} from "lucide-react";

export interface NavLinkItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  links: NavLinkItem[];
}

export interface NavItem {
  id: string;
  label: string;
  /** Hub route used for active matching. Omitted when the item is only a menu of tools. */
  href?: string;
  icon: LucideIcon;
  /** Extra paths that count as this item. "/" matches only the homepage. */
  activeHrefs?: readonly string[];
  /** Top-level control is a link. A separate button opens the menu. */
  linkTrigger?: boolean;
  groups?: NavGroup[];
}

export const SPEED_TEST_HREF = "/speed-test";
export const HISTORY_HREF = "/history";

export const SPEED_TEST_PATHS = [
  "/",
  "/speed-test",
  "/internet-speed-test",
  "/wifi-speed-test",
  "/upload-speed-test",
] as const;

export const NAV_ITEMS: NavItem[] = [
  {
    id: "speed-test",
    label: "Speed Test",
    href: SPEED_TEST_HREF,
    icon: Gauge,
    activeHrefs: SPEED_TEST_PATHS,
  },
  {
    id: "tools",
    label: "Tools",
    icon: Calculator,
    groups: [
      {
        id: "calculators",
        label: "Calculators",
        links: [
          {
            href: "/download-time-calculator",
            label: "Download Time",
            description: "How long a file should take to download.",
            icon: Download,
          },
          {
            href: "/upload-time-calculator",
            label: "Upload Time",
            description: "How long an upload should take.",
            icon: Upload,
          },
          {
            href: "/internet-speed-calculator",
            label: "Internet Speed Calculator",
            description: "Plan bandwidth for a household.",
            icon: Calculator,
          },
          {
            href: "/mbps-to-mbs",
            label: "Mbps Converter",
            description: "Convert megabits per second to megabytes.",
            icon: ArrowLeftRight,
          },
        ],
      },
      {
        id: "utilities",
        label: "Utilities",
        links: [
          {
            href: "/dns-speed-test",
            label: "DNS Timing",
            description: "Resolver time when the browser exposes it.",
            icon: Search,
          },
          {
            href: "/gaming-speed-test",
            label: "Gaming Test",
            description: "Latency and jitter for play.",
            icon: Gamepad2,
          },
          {
            href: "/streaming-speed-test",
            label: "Streaming Test",
            description: "Throughput for SD through 4K.",
            icon: Tv,
          },
          {
            href: "/video-call-test",
            label: "Video Call Test",
            description: "Upload and latency for calls.",
            icon: Video,
          },
        ],
      },
    ],
  },
  {
    id: "wifi",
    label: "Wi-Fi & Mesh",
    href: "/mesh-wifi",
    icon: Wifi,
    groups: [
      {
        id: "plan",
        label: "Plan Your Network",
        links: [
          {
            href: "/mesh-wifi",
            label: "Mesh Overview",
            description: "Setup, placement, and room tests.",
            icon: Wifi,
          },
          {
            href: "/mesh-wifi/planner",
            label: "Mesh Planner",
            description: "Draw rooms and estimate coverage.",
            icon: Map,
          },
          {
            href: "/mesh-wifi/node-calculator",
            label: "Node Calculator",
            description: "A starting node count for the home.",
            icon: Calculator,
          },
          {
            href: "/mesh-wifi/placement-optimizer",
            label: "Node Placement",
            description: "Layouts you can apply and then edit.",
            icon: LayoutGrid,
          },
          {
            href: "/mesh-wifi/setup",
            label: "Mesh Setup",
            description: "A checklist for common mesh kits.",
            icon: Router,
          },
          {
            href: "/router-setup",
            label: "Router Setup",
            description: "Brand, login page, and placement checks.",
            icon: Router,
          },
          {
            href: "/mesh-wifi/backhaul-advisor",
            label: "Backhaul Advisor",
            description: "Ethernet, wireless, coax, and powerline.",
            icon: Cable,
          },
        ],
      },
      {
        id: "fix",
        label: "Fix Problems",
        links: [
          {
            href: "/mesh-wifi/dead-zone-test",
            label: "Room Test",
            description: "Measure a room and keep the result.",
            icon: ScanLine,
          },
          {
            href: "/mesh-wifi/troubleshooter",
            label: "Mesh Troubleshooter",
            description: "Next checks from symptoms and room tests.",
            icon: Wrench,
          },
          {
            href: "/mesh-wifi/wifi-6-vs-wifi-7",
            label: "Wi-Fi 6 vs Wi-Fi 7",
            description: "What the newer standards change in a house.",
            icon: ArrowLeftRight,
          },
          {
            href: "/mesh-wifi/brands",
            label: "Mesh Brands",
            description: "Setup notes for common mesh kits.",
            icon: Tags,
          },
        ],
      },
    ],
  },
  {
    id: "health",
    label: "Network Health",
    href: "/network-health",
    icon: Activity,
    groups: [
      {
        id: "dashboard",
        label: "Dashboard",
        links: [
          {
            href: "/network-health",
            label: "Health Dashboard",
            description: "Saved speed and room measurements.",
            icon: Activity,
          },
          {
            href: "/network-health/compare",
            label: "Before and After",
            description: "Compare a change on this device.",
            icon: GitCompare,
          },
        ],
      },
      {
        id: "diagnostics",
        label: "Connection Diagnostics",
        links: [
          {
            href: "/ping-test",
            label: "Ping Test",
            description: "HTTP latency, not ICMP.",
            icon: Activity,
          },
          {
            href: "/jitter-test",
            label: "Jitter Test",
            description: "How much latency swings.",
            icon: Waves,
          },
          {
            href: "/bufferbloat-test",
            label: "Bufferbloat Test",
            description: "Latency while the line is busy.",
            icon: Gauge,
          },
          {
            href: "/packet-loss-test",
            label: "Request Loss",
            description: "Failed HTTP checks during the run.",
            icon: Unplug,
          },
          {
            href: "/connection-stability-test",
            label: "Connection Stability",
            description: "Latency across a longer window.",
            icon: Timer,
          },
        ],
      },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    href: "/guides",
    icon: BookOpen,
    linkTrigger: true,
    groups: [
      {
        id: "guides",
        label: "",
        links: [
          {
            href: "/guides",
            label: "All Guides",
            description: "Every published explainer.",
            icon: BookOpen,
          },
          {
            href: "/guides/why-is-my-internet-slow",
            label: "Why Is My Internet Slow?",
            description: "Wi-Fi, congestion, and the plan.",
            icon: CircleHelp,
          },
          {
            href: "/guides/what-is-good-internet-speed",
            label: "What Is a Good Speed?",
            description: "Throughput for everyday use.",
            icon: Gauge,
          },
          {
            href: "/guides/how-to-improve-wifi-speed",
            label: "Improve Wi-Fi Speed",
            description: "Separate the radio from the ISP link.",
            icon: Wifi,
          },
          {
            href: "/guides/what-is-bufferbloat",
            label: "What Is Bufferbloat?",
            description: "Delay that shows up when a link is full.",
            icon: Gauge,
          },
          {
            href: "/guides/what-is-latency",
            label: "What Is Latency?",
            description: "Delay versus throughput.",
            icon: Timer,
          },
          {
            href: "/guides/how-fast-is-100-mbps",
            label: "How Fast Is 100 Mbps?",
            description: "What that plan can carry.",
            icon: Calculator,
          },
          {
            href: "/guides/why-upload-is-slower-than-download",
            label: "Why Upload Is Slower",
            description: "Why the uplink is the smaller number.",
            icon: Upload,
          },
          {
            href: "/guides/how-to-reduce-ping-while-gaming",
            label: "Reduce Ping for Gaming",
            description: "What to change, then retest.",
            icon: Gamepad2,
          },
        ],
      },
    ],
  },
];

export function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

/** Exact route, or a nested path under it. "/" matches only the homepage. */
export function matchesHref(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const target = normalizePath(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(`${target}/`);
}

/** aria-current="page" is exact, plus explicit aliases such as the speed-test family. */
export function isCurrentPage(pathname: string, href: string, aliases: readonly string[] = []): boolean {
  const path = normalizePath(pathname);
  if (path === normalizePath(href)) return true;
  return aliases.some((alias) => path === normalizePath(alias));
}

export function navItemLinks(item: NavItem): NavLinkItem[] {
  return item.groups?.flatMap((group) => group.links) ?? [];
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.activeHrefs?.some((href) => matchesHref(pathname, href))) return true;
  if (item.href && matchesHref(pathname, item.href)) return true;
  return navItemLinks(item).some((link) => matchesHref(pathname, link.href));
}

export function showTestSpeedCta(pathname: string): boolean {
  const path = normalizePath(pathname);
  return !SPEED_TEST_PATHS.some((href) => path === href);
}
