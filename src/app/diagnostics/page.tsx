import Link from "next/link";
import { DiagnosticsToolGrid } from "@/components/diagnostics/diagnostics-tool-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/metadata";

export const metadata = {
  title: "Internet diagnostics",
  description:
    "AI-assisted troubleshooting, performance history, and tools to understand your connection.",
};

export default function DiagnosticsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Internet diagnostics — MySpeedGauge",
          url: absoluteUrl("/diagnostics"),
          description: metadata.description,
        }}
      />
      <div className="mx-auto max-w-[1100px] px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Diagnostics
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Understand why your connection feels slow or unstable. Start with a{" "}
          <Link href="/#speed-test" className="font-semibold text-primary hover:underline">
            speed test
          </Link>
          , then open AI troubleshooting from the results.
        </p>

        <div className="mt-8">
          <DiagnosticsToolGrid />
        </div>

        <section id="isp" className="mt-12 scroll-mt-20">
          <h2 className="text-xl font-semibold text-foreground">ISP performance report</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 2: enter your advertised plan, compare averages, generate a PDF, and copy a
            neutral message for support. Set{" "}
            <code className="text-xs">NEXT_PUBLIC_FEATURE_ISP_REPORT=true</code> when ready.
          </p>
        </section>

        <section id="gaming" className="mt-8 scroll-mt-20">
          <h2 className="text-xl font-semibold text-foreground">Gaming diagnostics</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 3: dedicated gaming quality view and informational game profiles. Generic speed
            test latency does not equal game-server latency.
          </p>
        </section>

        <section id="wifi" className="mt-8 scroll-mt-20">
          <h2 className="text-xl font-semibold text-foreground">Wi‑Fi vs Ethernet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 2: tag tests as Wi‑Fi or wired on the history page and compare medians. Browsers
            cannot detect bands automatically.
          </p>
        </section>
      </div>
    </>
  );
}
