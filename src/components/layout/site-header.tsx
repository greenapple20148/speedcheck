import Link from "next/link";
import { SiteHeaderNav } from "./site-header-nav";
import { ThemeToggle } from "./theme-toggle";

function GaugeLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden fill="none">
      <path
        d="M5 22a11 11 0 1 1 22 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16 22 L22.5 13.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="22" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "var(--header-bg)" }}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full font-heading text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GaugeLogo />
          </span>
          MySpeedGauge
        </Link>
        <div className="flex items-center gap-2">
          <SiteHeaderNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
