import Link from "next/link";
import { SiteHeaderNav } from "./site-header-nav";
import { ThemeToggle } from "./theme-toggle";

function GaugeLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-5 w-5"
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 24a14 14 0 1 1 20 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M16 24V12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "var(--header-bg)" }}
    >
      <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GaugeLogo />
          </span>
          MySpeedGauge
        </Link>
        <div className="flex items-center gap-2">
          <SiteHeaderNav />
          <ThemeToggle />
        </div>
        <Link
          href="/#speed-test"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-primary-hover md:hidden"
        >
          Test
        </Link>
      </div>
    </header>
  );
}
