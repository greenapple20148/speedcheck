import Link from "next/link";

const columns = [
  {
    title: "Tests",
    links: [
      { href: "/speed-test", label: "Speed test" },
      { href: "/ping-test", label: "Ping test" },
      { href: "/jitter-test", label: "Jitter test" },
      { href: "/bufferbloat-test", label: "Bufferbloat test" },
      { href: "/connection-stability-test", label: "Stability test" },
      { href: "/history", label: "History" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/developer-tools", label: "Developer tools" },
      { href: "/gaming-speed-test", label: "Gaming test" },
      { href: "/streaming-speed-test", label: "Streaming test" },
      { href: "/video-call-test", label: "Video call test" },
      { href: "/download-time-calculator", label: "Download time" },
      { href: "/mbps-to-mbs", label: "Mbps to MB/s" },
      { href: "/internet-troubleshooter", label: "Troubleshooter" },
      { href: "/router-setup", label: "Router setup" },
      { href: "/mesh-wifi", label: "Mesh Wi-Fi" },
      { href: "/network-health", label: "Network health" },
    ],
  },
  {
    title: "Guides",
    links: [
      { href: "/guides", label: "All guides" },
      { href: "/guides/why-is-my-internet-slow", label: "Why is my internet slow?" },
      { href: "/guides/what-is-bufferbloat", label: "What is bufferbloat?" },
      { href: "/methodology", label: "Methodology" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/settings", label: "Settings" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="font-heading text-lg font-semibold text-foreground">MySpeedGauge</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Real transfers and HTTP latency. No account required.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="rounded-sm text-sm text-muted-foreground hover:text-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MySpeedGauge. Measurements vary with network conditions.
      </div>
    </footer>
  );
}
