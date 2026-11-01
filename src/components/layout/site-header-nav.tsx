"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { TOOL_GROUPS } from "@/content/tools";

const primary = [
  { href: "/speed-test", label: "Speed Test", match: ["/speed-test", "/"] },
  { href: "/internet-troubleshooter", label: "Troubleshoot", match: ["/internet-troubleshooter"] },
  { href: "/guides", label: "Guides", match: ["/guides"] },
  { href: "/history", label: "History", match: ["/history"] },
] as const;

function isMatch(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SiteHeaderNav() {
  const pathname = usePathname() ?? "/";
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toolsId = useId();
  const mobileId = useId();

  useEffect(() => {
    setToolsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!toolsOpen && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setToolsOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen, mobileOpen]);

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-5 text-sm font-medium md:flex">
        <Link
          href="/speed-test"
          aria-current={isMatch(pathname, ["/speed-test", "/"]) ? "page" : undefined}
          className={
            isMatch(pathname, ["/speed-test", "/"])
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          Speed Test
        </Link>
        <div className="relative">
          <button
            type="button"
            aria-expanded={toolsOpen}
            aria-controls={toolsId}
            onClick={() => setToolsOpen((open) => !open)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tools
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          {toolsOpen && (
            <div
              id={toolsId}
              className="absolute right-0 z-50 mt-3 w-[28rem] max-w-[70vw] rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="grid grid-cols-2 gap-4">
                {TOOL_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {group.tools.map((tool) => (
                        <li key={tool.href}>
                          <Link
                            href={tool.href}
                            className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {tool.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {primary.slice(1).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isMatch(pathname, link.match) ? "page" : undefined}
            className={
              isMatch(pathname, link.match)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
        aria-expanded={mobileOpen}
        aria-controls={mobileId}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
      </button>

      {mobileOpen && (
        <div
          id={mobileId}
          className="absolute inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-card px-4 py-4 shadow-card md:hidden"
        >
          <ul className="space-y-1">
            {primary.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block rounded-lg px-2 py-3 text-base font-medium">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {TOOL_GROUPS.map((group) => (
            <div key={group.id} className="mt-4">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <ul className="mt-1">
                {group.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link href={tool.href} className="block rounded-lg px-2 py-2.5 text-sm">
                      {tool.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
