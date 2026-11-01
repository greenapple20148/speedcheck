"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, History, Menu, X } from "lucide-react";
import { PRIMARY_LINKS, TOOL_COLUMNS, pathMatches } from "@/content/navigation";
import { cn } from "@/lib/utils";

const linkClass = (active: boolean) =>
  cn(
    "rounded-md px-2.5 py-1.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function SiteHeaderNav() {
  const pathname = usePathname() ?? "/";
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toolsId = useId();
  const mobileId = useId();
  const toolsRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const toolsPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openedAt = useRef(0);

  const toolActive = TOOL_COLUMNS.some((column) =>
    column.links.some((link) => pathMatches(pathname, [link.href])),
  );

  const clearClose = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = window.setTimeout(() => {
      const root = toolsRef.current;
      if (root?.contains(document.activeElement)) return;
      setToolsOpen(false);
    }, 180);
  };

  useEffect(() => {
    setToolsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!toolsOpen && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (toolsOpen) {
        setToolsOpen(false);
        toolsButtonRef.current?.focus();
      }
      if (mobileOpen) {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen, mobileOpen]);

  useEffect(() => {
    if (!toolsOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [toolsOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const root = mobileRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = root?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    items?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root?.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      root?.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
        <Link
          href="/speed-test"
          aria-current={pathMatches(pathname, PRIMARY_LINKS[0].match) ? "page" : undefined}
          className={linkClass(pathMatches(pathname, PRIMARY_LINKS[0].match))}
        >
          Speed Test
        </Link>
        <div
          ref={toolsRef}
          className="relative"
          onMouseEnter={() => {
            clearClose();
            openedAt.current = Date.now();
            setToolsOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <button
            ref={toolsButtonRef}
            type="button"
            aria-expanded={toolsOpen}
            aria-controls={toolsId}
            aria-haspopup="true"
            className={cn(linkClass(toolActive), "inline-flex items-center gap-1")}
            onClick={() => {
              setToolsOpen((open) => {
                if (!open) return true;
                if (Date.now() - openedAt.current < 400) return true;
                return false;
              });
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return;
              event.preventDefault();
              setToolsOpen(true);
              window.requestAnimationFrame(() => {
                toolsPanelRef.current?.querySelector("a")?.focus();
              });
            }}
          >
            Tools
            <ChevronDown className={cn("h-3.5 w-3.5", toolsOpen && "rotate-180")} aria-hidden />
          </button>
          {toolsOpen && (
            <>
            <div className="absolute left-0 right-0 top-full z-50 h-4" aria-hidden />
            <div
              className="fixed left-1/2 top-16 z-50 w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 pt-2"
              onMouseEnter={clearClose}
              onMouseLeave={scheduleClose}
            >
              <div
                ref={toolsPanelRef}
                id={toolsId}
                role="region"
                aria-label="Tools"
                className="rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div className="grid grid-cols-3 gap-3">
                  {TOOL_COLUMNS.map((column) => {
                    const Icon = column.icon;
                    return (
                      <div key={column.id}>
                        <p className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                          {column.label}
                        </p>
                        <ul className="mt-1">
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                aria-current={pathMatches(pathname, [link.href]) ? "page" : undefined}
                                className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </>
          )}
        </div>
        {PRIMARY_LINKS.slice(1).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathMatches(pathname, link.match) ? "page" : undefined}
            className={linkClass(pathMatches(pathname, link.match))}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/history"
          aria-label="History"
          aria-current={pathMatches(pathname, ["/history"]) ? "page" : undefined}
          className={cn(
            "ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pathMatches(pathname, ["/history"])
              ? "text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <History className="h-4 w-4" aria-hidden />
        </Link>
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls={mobileId}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
      </button>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={mobileRef}
            id={mobileId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-card px-3 py-3 shadow-card lg:hidden"
          >
            <ul className="space-y-0.5">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block min-h-11 rounded-md px-2 py-2.5 text-base font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/history" className="block min-h-11 rounded-md px-2 py-2.5 text-base font-medium">
                  History
                </Link>
              </li>
            </ul>
            <div className="mt-2 space-y-1 border-t border-border pt-2">
              {TOOL_COLUMNS.map((column) => {
                const open = openGroups[column.id] === true;
                const panelId = `${mobileId}-${column.id}`;
                const Icon = column.icon;
                return (
                  <div key={column.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex min-h-11 w-full items-center justify-between rounded-md px-2 text-left text-sm font-semibold"
                      onClick={() => setOpenGroups((current) => ({ ...current, [column.id]: !open }))}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" aria-hidden />
                        {column.label}
                      </span>
                      <ChevronDown className={cn("h-4 w-4", open && "rotate-180")} aria-hidden />
                    </button>
                    {open && (
                      <ul id={panelId} className="pb-1">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="block min-h-11 rounded-md px-8 py-2.5 text-sm">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
