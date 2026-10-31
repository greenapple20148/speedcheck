import Link from "next/link";

const columns = [
  {
    title: "Tests",
    links: [
      { href: "/internet-speed-test", label: "Internet speed test" },
      { href: "/wifi-speed-test", label: "Wi‑Fi speed test" },
      { href: "/upload-speed-test", label: "Upload speed test" },
      { href: "/ping-test", label: "Ping test" },
      { href: "/jitter-test", label: "Jitter test" },
    ],
  },
  {
    title: "Guides",
    links: [
      { href: "/guides/why-is-my-internet-slow", label: "Why is my internet slow?" },
      { href: "/guides/what-is-good-internet-speed", label: "What is a good speed?" },
      { href: "/guides/how-to-improve-wifi-speed", label: "Improve Wi‑Fi speed" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-lg font-bold text-foreground">MySpeedGauge</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Fast, privacy-conscious internet speed testing with real measurements—not estimates.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
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
