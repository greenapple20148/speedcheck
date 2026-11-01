import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHeader } from "@/components/ui/page-header";
import { RelatedActions } from "@/components/ui/related-actions";
import {
  faqPageJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo/structured-data";
import type { TestMode } from "@/types/speedtest";

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
  const structured: Record<string, unknown>[] = [
    webApplicationJsonLd({ name: title, description, path }),
  ];
  const faqLd = faqPageJsonLd(faqs);
  if (faqLd) structured.push(faqLd);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={structured} />
      <Breadcrumbs items={[{ label: title }]} />
      <PageHeader title={title} description={intro}>
        {bullets.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-left text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </PageHeader>
      <SpeedTestWidget defaultMode={defaultMode} />
      <AdSlot className="max-w-3xl" format="horizontal" />
      {faqs.length > 0 && (
        <div className="mt-16">
          <FaqSection items={faqs} />
        </div>
      )}
      <RelatedActions items={related} />
    </div>
  );
}
