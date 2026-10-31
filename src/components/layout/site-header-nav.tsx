"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#speed-test", label: "Speed Test", matchHome: true },
  { href: "/results/history", label: "History", matchHome: false },
  { href: "/diagnostics", label: "Diagnostics", matchHome: false },
  { href: "/tools/mbps-to-mbs", label: "Tools", matchHome: false },
] as const;

function isActive(pathname: string, link: (typeof links)[number]): boolean {
  if (link.matchHome) return pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function SiteHeaderNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-6 text-sm font-medium md:flex"
    >
      {links.map((l) => {
        const active = isActive(pathname, l);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "font-bold text-[var(--accent-teal)]"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
