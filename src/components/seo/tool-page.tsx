import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { AdSlot } from "@/components/ads/ad-slot";
import { absoluteUrl } from "@/lib/seo/metadata";
import type { TestMode } from "@/types/speedtest";
import Link from "next/link";

interface ToolPageProps {
  title: string;
  description: string;
  path: string;
  intro: string;
  bullets?: string[];
  faqs?: FaqItem[];
  defaultMode?: TestMode;
  related?: Array<{ href: string; label: string }>;
}

export function ToolPage({
  title,
  description,
  path,
  intro,
  bullets = [],
  faqs = [],
  defaultMode = "standard",
  related = [],
}: ToolPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: absoluteUrl(path),
        }}
      />
      <Breadcrumbs items={[{ label: title }]} />
      <header className="mb-8 max-w-3xl">
        <h1 className="heading-1 text-foreground">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>
        {bullets.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </header>
      <SpeedTestWidget defaultMode={defaultMode} />
      <AdSlot className="max-w-3xl" format="horizontal" />
      {faqs.length > 0 && (
        <div className="mt-16">
          <FaqSection items={faqs} />
        </div>
      )}
      {related.length > 0 && (
        <nav className="mt-12" aria-label="Related pages">
          <h2 className="mb-3 font-heading text-lg font-semibold">Related</h2>
          <ul className="flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="text-sm text-primary hover:underline">
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
