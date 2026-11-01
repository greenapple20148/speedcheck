import Link from "next/link";
import { BarChart3, FileText, Gamepad2, Sparkles, Wifi } from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";

const tools = [
  {
    href: "/#speed-test",
    icon: Sparkles,
    title: "AI troubleshooting",
    description: "Run a test, then use Diagnose my connection on the results.",
    enabled: true,
  },
  {
    href: "/history",
    icon: BarChart3,
    title: "Performance history",
    description: "Trends saved in this browser. Sign in + Supabase for cloud history (Phase 2).",
    enabled: true,
  },
  {
    href: "/diagnostics#isp",
    icon: FileText,
    title: "ISP performance report",
    description: "Compare plan speeds to measurements and export evidence.",
    enabled: featureFlags.ispReport,
  },
  {
    href: "/diagnostics#gaming",
    icon: Gamepad2,
    title: "Gaming diagnostics",
    description: "Latency, jitter, and suitability for competitive play.",
    enabled: featureFlags.gamingDiagnostics,
  },
  {
    href: "/diagnostics#wifi",
    icon: Wifi,
    title: "Wi‑Fi vs Ethernet",
    description: "Label and compare connection types across tests.",
    enabled: featureFlags.wifiCompare,
  },
] as const;

export function DiagnosticsToolGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => {
        const Icon = t.icon;
        const card = (
          <div
            className={
              t.enabled
                ? "flex h-full flex-col rounded-[20px] border border-[var(--card-border)] bg-card p-5 shadow-sm transition-shadow hover:border-[var(--accent-text)]"
                : "flex h-full flex-col rounded-[20px] border border-dashed border-[var(--card-border)] bg-[var(--surface-subtle)] p-5 opacity-80"
            }
          >
            <Icon className="h-6 w-6 text-[var(--accent-text)]" aria-hidden />
            <h3 className="mt-3 text-[15px] font-semibold text-foreground">
              {t.title}
            </h3>
            <p className="mt-1 flex-1 text-[13px] leading-snug text-muted-foreground">
              {t.description}
            </p>
            {!t.enabled && (
              <p className="mt-3 text-[12px] font-medium text-muted-foreground">
                Coming in Phase 2
              </p>
            )}
          </div>
        );

        return t.enabled ? (
          <Link key={t.title} href={t.href} className="block h-full">
            {card}
          </Link>
        ) : (
          <div key={t.title}>{card}</div>
        );
      })}
    </div>
  );
}
