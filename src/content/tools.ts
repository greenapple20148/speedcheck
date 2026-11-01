export interface ToolLink {
  href: string;
  label: string;
  summary: string;
}

export interface ToolGroup {
  id: string;
  label: string;
  tools: ToolLink[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "core",
    label: "Measure",
    tools: [
      { href: "/speed-test", label: "Speed test", summary: "Download, upload, and latency." },
      { href: "/ping-test", label: "Ping test", summary: "HTTP round-trip time, not ICMP." },
      { href: "/jitter-test", label: "Jitter test", summary: "How much latency swings." },
      { href: "/bufferbloat-test", label: "Bufferbloat test", summary: "Latency while the line is busy." },
      { href: "/packet-loss-test", label: "Request loss", summary: "Failed HTTP checks, not packet loss." },
      {
        href: "/connection-stability-test",
        label: "Stability test",
        summary: "Latency over 30 seconds to 5 minutes.",
      },
    ],
  },
  {
    id: "usecase",
    label: "Use cases",
    tools: [
      { href: "/gaming-speed-test", label: "Gaming test", summary: "Latency and jitter for play." },
      { href: "/streaming-speed-test", label: "Streaming test", summary: "Throughput for SD through 4K." },
      { href: "/video-call-test", label: "Video call test", summary: "Upload, latency, and stability." },
      { href: "/dns-speed-test", label: "DNS timing", summary: "Only when the browser exposes it." },
    ],
  },
  {
    id: "troubleshoot",
    label: "Troubleshoot",
    tools: [
      { href: "/internet-troubleshooter", label: "Troubleshooter", summary: "Symptom checklist with measurements." },
      { href: "/why-is-my-internet-slow", label: "Why is it slow?", summary: "Separate Wi-Fi, load, and the ISP." },
      { href: "/wifi-vs-ethernet", label: "Wi-Fi vs Ethernet", summary: "Compare the wireless hop." },
      { href: "/slow-upload-speed", label: "Slow upload", summary: "Why the uplink feels stuck." },
      { href: "/high-ping-fix", label: "High latency", summary: "What to change and how to retest." },
      { href: "/mesh-wifi", label: "Mesh Wi-Fi planner", summary: "Place nodes and measure each room." },
      { href: "/network-health", label: "Network health", summary: "Measured speed, latency, and before/after comparisons." },
    ],
  },
  {
    id: "calculators",
    label: "Calculators",
    tools: [
      { href: "/download-time-calculator", label: "Download time", summary: "File size and Mbps to duration." },
      { href: "/upload-time-calculator", label: "Upload time", summary: "Same math for the uplink." },
      { href: "/mbps-to-mbs", label: "Mbps to MB/s", summary: "Decimal and binary units." },
      { href: "/internet-speed-calculator", label: "Speed planner", summary: "Household and streaming estimates." },
    ],
  },
];

export const HOME_TOOL_CARDS: ToolLink[] = [
  TOOL_GROUPS[0].tools[3],
  { href: "/gaming-speed-test", label: "Gaming Ping Test", summary: "Idle latency, jitter, and load." },
  { href: "/video-call-test", label: "Video Call Test", summary: "Upload and latency for calls." },
  { href: "/streaming-speed-test", label: "Streaming Test", summary: "Planning speeds for SD to 4K." },
  {
    href: "/internet-troubleshooter",
    label: "Connection Troubleshooter",
    summary: "Match symptoms to the next check.",
  },
  {
    href: "/download-time-calculator",
    label: "Download Time Calculator",
    summary: "How long a file should take.",
  },
];
