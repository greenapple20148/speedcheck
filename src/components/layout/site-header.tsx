"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeaderNav } from "./site-header-nav";

function GaugeLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden fill="none">
      <path
        d="M5 22a11 11 0 1 1 22 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M16 22 L22.5 13.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 16;
      setScrolled((current) => (current === next ? current : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-scrolled={scrolled ? "true" : "false"} className="site-header sticky top-0 z-50">
      <div className="mx-auto flex h-[70px] max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GaugeLogo />
          </span>
          <span className="whitespace-nowrap font-heading text-[22px] font-semibold leading-none tracking-tight text-foreground">
            MySpeedGauge
          </span>
        </Link>
        <SiteHeaderNav />
      </div>
    </header>
  );
}
