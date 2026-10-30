import Link from "next/link";
import { Gauge } from "lucide-react";

const links = [
  { href: "/internet-speed-test", label: "Speed Test" },
  { href: "/guides/what-is-good-internet-speed", label: "Guides" },
  { href: "/tools/mbps-to-mbs", label: "Tools" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Gauge className="h-5 w-5" aria-hidden />
          </span>
          SpeedCheck
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#speed-test"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Start test
        </Link>
      </div>
    </header>
  );
}
