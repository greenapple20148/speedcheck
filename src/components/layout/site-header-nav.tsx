"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Gauge, History, Menu, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  HISTORY_HREF,
  NAV_ITEMS,
  SPEED_TEST_HREF,
  isCurrentPage,
  isNavItemActive,
  showTestSpeedCta,
  type NavItem,
  type NavLinkItem,
} from "@/content/navigation";
import { cn } from "@/lib/utils";

const DESKTOP_NAV_QUERY = "(min-width: 1280px)";
const CLOSE_DELAY_MS = 180;
const CLICK_GUARD_MS = 400;

const triggerClass =
  "site-nav-link inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function TestSpeedLink({ className }: { className?: string }) {
  return (
    <Link
      href={SPEED_TEST_HREF}
      className={cn(
        "site-test-speed inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <Gauge className="h-4 w-4" aria-hidden />
      Test Speed
    </Link>
  );
}

function HistoryLink({ labeled = false }: { labeled?: boolean }) {
  const pathname = usePathname() ?? "/";
  const current = isCurrentPage(pathname, HISTORY_HREF);
  if (labeled) {
    return (
      <Link
        href={HISTORY_HREF}
        aria-current={current ? "page" : undefined}
        className="flex min-h-11 items-center gap-2 rounded-md px-2 text-base font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <History className="h-4 w-4" aria-hidden />
        Test History
      </Link>
    );
  }
  return (
    <Link
      href={HISTORY_HREF}
      aria-label="Test History"
      title="Test History"
      aria-current={current ? "page" : undefined}
      data-active={current ? "true" : undefined}
      className="site-nav-link inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <History className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function MenuLink({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLinkItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const current = isCurrentPage(pathname, link.href);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex gap-2.5 rounded-[10px] px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        current ? "bg-[rgba(0,134,106,0.1)]" : "hover:bg-muted",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm text-foreground",
            current && "font-semibold text-[var(--accent-text)] underline decoration-2 underline-offset-2",
          )}
        >
          {link.label}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground" aria-hidden>
          {link.description}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeaderNav() {
  const pathname = usePathname() ?? "/";
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [section, setSection] = useState("");
  const roots = useRef(new Map<string, HTMLElement>());
  const closeTimer = useRef<number | null>(null);
  const openedAt = useRef(0);
  const showCta = showTestSpeedCta(pathname);

  const clearClose = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const reveal = (id: string) => {
    clearClose();
    openedAt.current = Date.now();
    setOpenId(id);
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = window.setTimeout(() => {
      const active = document.activeElement;
      const panel = document.querySelector<HTMLElement>("[data-nav-panel='open']");
      if (panel?.contains(active)) return;
      setOpenId(null);
    }, CLOSE_DELAY_MS);
  };

  const toggle = (id: string) => {
    setOpenId((current) => {
      if (current !== id) {
        openedAt.current = Date.now();
        return id;
      }
      if (Date.now() - openedAt.current < CLICK_GUARD_MS) return current;
      return null;
    });
  };

  const focusFirstLink = (id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(panelId(baseId, id))?.querySelector("a")?.focus();
    });
  };

  useEffect(() => {
    setOpenId(null);
    setMobileOpen(false);
    setSection("");
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const id = openId;
      setOpenId(null);
      document.getElementById(triggerId(baseId, id))?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, baseId]);

  useEffect(() => {
    if (!openId) return;
    const onPointer = (event: PointerEvent) => {
      const root = roots.current.get(openId);
      if (!root?.contains(event.target as Node)) setOpenId(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [openId]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_QUERY);
    const onChange = () => {
      setOpenId(null);
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <nav aria-label="Primary" className="hidden min-w-0 items-center gap-0.5 xl:flex">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item);
          const menuId = panelId(baseId, item.id);
          const buttonId = triggerId(baseId, item.id);
          const open = openId === item.id;
          if (!item.groups?.length) {
            return (
              <Link
                key={item.id}
                href={item.href ?? SPEED_TEST_HREF}
                aria-current={item.href && isCurrentPage(pathname, item.href, item.activeHrefs ?? []) ? "page" : undefined}
                data-active={active ? "true" : undefined}
                className={triggerClass}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <div
              key={item.id}
              className="relative"
              ref={(node) => {
                if (node) roots.current.set(item.id, node);
                else roots.current.delete(item.id);
              }}
              onMouseEnter={() => reveal(item.id)}
              onMouseLeave={scheduleClose}
            >
              {item.linkTrigger && item.href ? (
                <span className="inline-flex items-center">
                  <Link
                    href={item.href}
                    aria-current={isCurrentPage(pathname, item.href) ? "page" : undefined}
                    data-active={active ? "true" : undefined}
                    className={triggerClass}
                  >
                    {item.label}
                  </Link>
                  <button
                    id={buttonId}
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${item.label} menu`}
                    aria-expanded={open}
                    aria-controls={menuId}
                    aria-haspopup="true"
                    onClick={() => toggle(item.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowDown") return;
                      event.preventDefault();
                      reveal(item.id);
                      focusFirstLink(item.id);
                    }}
                  >
                    <ChevronDown className={cn("h-3.5 w-3.5 motion-safe:transition-transform", open && "rotate-180")} aria-hidden />
                  </button>
                </span>
              ) : (
                <button
                  id={buttonId}
                  type="button"
                  className={triggerClass}
                  data-active={active ? "true" : undefined}
                  aria-expanded={open}
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={() => toggle(item.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowDown") return;
                    event.preventDefault();
                    reveal(item.id);
                    focusFirstLink(item.id);
                  }}
                >
                  {item.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 motion-safe:transition-transform", open && "rotate-180")} aria-hidden />
                </button>
              )}
              <div className="absolute inset-x-0 top-full z-50 h-3" aria-hidden />
              <div
                id={menuId}
                role="region"
                aria-label={item.label}
                hidden={open ? undefined : true}
                data-nav-panel={open ? "open" : "closed"}
                className={cn(
                  "fixed left-1/2 z-50 max-h-[min(70vh,calc(100dvh-var(--site-header-offset)-1rem))] -translate-x-1/2 overflow-y-auto overscroll-contain pt-3",
                  (item.groups?.length ?? 0) > 1
                    ? "w-[min(760px,calc(100vw-2rem))]"
                    : "w-[min(420px,calc(100vw-2rem))]",
                )}
                style={{ top: "calc(var(--site-header-offset) - 0.75rem)" }}
                onMouseEnter={clearClose}
              >
                <NavPanel item={item} pathname={pathname} onNavigate={() => setOpenId(null)} />
              </div>
            </div>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {showCta ? <TestSpeedLink className="hidden xl:inline-flex" /> : null}
        <span className="hidden xl:inline-flex">
          <HistoryLink />
        </span>
        <ThemeToggle />
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              className="fixed inset-x-0 bottom-0 z-40 bg-[#0F172A]/40 xl:hidden"
              style={{ top: "var(--site-header-offset)" }}
            />
            <Dialog.Content
              id={`${baseId}-mobile`}
              aria-describedby={`${baseId}-mobile-description`}
              className="site-nav-drawer fixed inset-x-0 z-40 max-h-[calc(100dvh-var(--site-header-offset))] overflow-y-auto border-b border-border bg-card px-3 py-3 shadow-card outline-none xl:hidden"
              style={{
                top: "var(--site-header-offset)",
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <Dialog.Description id={`${baseId}-mobile-description`} className="sr-only">
                Primary pages and tools.
              </Dialog.Description>
              {showCta ? <TestSpeedLink className="mb-2 h-11 w-full" /> : null}
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href={SPEED_TEST_HREF}
                    aria-current={isCurrentPage(pathname, SPEED_TEST_HREF, NAV_ITEMS[0]?.activeHrefs ?? []) ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center rounded-md px-2 text-base font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Speed Test
                  </Link>
                </li>
              </ul>
              <Accordion type="single" collapsible value={section} onValueChange={setSection} className="mt-1 border-t border-border">
                {NAV_ITEMS.filter((item) => item.groups?.length).map((item) => {
                  const Icon = item.icon;
                  return (
                    <AccordionItem key={item.id} value={item.id} className="border-border">
                      <AccordionTrigger className="min-h-11 py-2 text-base font-semibold hover:no-underline">
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" aria-hidden />
                          {item.label}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        {item.groups?.map((group) => (
                          <div key={group.id}>
                            {group.label ? (
                              <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.label}
                              </p>
                            ) : null}
                            <ul>
                              {group.links.map((link) => {
                                const current = isCurrentPage(pathname, link.href);
                                return (
                                  <li key={link.href}>
                                    <Link
                                      href={link.href}
                                      aria-current={current ? "page" : undefined}
                                      onClick={() => setMobileOpen(false)}
                                      className={cn(
                                        "flex min-h-11 items-center rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        current ? "bg-[rgba(0,134,106,0.1)] font-semibold text-[var(--accent-text)] underline decoration-2 underline-offset-4" : "text-foreground",
                                      )}
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              <div className="mt-1 border-t border-border pt-1">
                <HistoryLink labeled />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}

function NavPanel({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const wide = (item.groups?.length ?? 0) > 1;
  return (
    <div className="site-nav-panel p-3">
      <div className={cn("grid gap-3", wide && "grid-cols-2")}>
        {item.groups?.map((group) => (
          <div key={group.id}>
            {group.label ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            ) : null}
            <ul className={group.label ? "mt-1" : undefined}>
              {group.links.map((link) => (
                <li key={link.href}>
                  <MenuLink link={link} pathname={pathname} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function panelId(baseId: string, id: string) {
  return `${baseId}-panel-${id}`;
}

function triggerId(baseId: string, id: string) {
  return `${baseId}-trigger-${id}`;
}
