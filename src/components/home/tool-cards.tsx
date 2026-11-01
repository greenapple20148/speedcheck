import Link from "next/link";
import { Gamepad2, Gauge, Timer, Tv, Video, Wrench, type LucideIcon } from "lucide-react";
import { HOME_TOOL_CARDS } from "@/content/tools";

const ICONS: Record<string, LucideIcon> = {
  "/bufferbloat-test": Gauge,
  "/gaming-speed-test": Gamepad2,
  "/video-call-test": Video,
  "/streaming-speed-test": Tv,
  "/internet-troubleshooter": Wrench,
  "/download-time-calculator": Timer,
};

export function HomeToolCards() {
  return (
    <section className="mx-auto mt-6 w-full max-w-[1280px] px-4" aria-labelledby="tools-heading">
      <h2 id="tools-heading" className="text-lg font-semibold text-foreground">
        More diagnostics
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_TOOL_CARDS.map((tool) => {
          const Icon = ICONS[tool.href] ?? Gauge;
          return (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="panel flex h-full gap-3 p-4 transition-colors hover:border-[var(--accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--accent-text)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{tool.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{tool.summary}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
