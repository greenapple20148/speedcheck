import Link from "next/link";
import { SpeedTestWidget } from "@/components/speedtest/speed-test-widget";
import { TroubleshootingSection } from "@/components/speedtest/troubleshooting";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateOffers } from "@/components/ads/affiliate-offers";
import { HOME_FAQS } from "@/content/faqs";
import { AFFILIATE_OFFERS } from "@/content/affiliates";
import { absoluteUrl } from "@/lib/seo/metadata";

const related = [
  { href: "/internet-speed-test", label: "Internet speed test" },
  { href: "/wifi-speed-test", label: "Wi‑Fi speed test" },
  { href: "/upload-speed-test", label: "Upload speed test" },
  { href: "/ping-test", label: "Ping test" },
  { href: "/jitter-test", label: "Jitter test" },
  { href: "/tools/mbps-to-mbs", label: "Mbps to MB/s converter" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "SpeedCheck",
          url: absoluteUrl("/"),
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Free internet speed test measuring download, upload, ping, and jitter.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQS.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 text-center md:pt-16">
        <p className="mb-3 font-heading text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          SpeedCheck
        </p>
        <h1 className="heading-1 text-balance text-foreground">
          Test Your Internet Speed
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Measure real download, upload, ping, and jitter in seconds—no account required.
        </p>
      </section>

      <div id="speed-test" className="px-4">
        <SpeedTestWidget />
      </div>

      <div className="mt-16">
        <TroubleshootingSection />
      </div>

      <section className="mx-auto mt-16 max-w-6xl px-4" aria-labelledby="learn-heading">
        <h2 id="learn-heading" className="heading-2 text-foreground">
          Understand your results
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Learn what good speeds look like and how to fix common connection problems.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {related.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4">
        <AdSlot format="horizontal" slot="home-below-results" />
      </div>

      <div className="mt-8 px-4">
        <AffiliateOffers offers={AFFILIATE_OFFERS} />
      </div>

      <div className="mt-16 px-4 pb-16">
        <FaqSection items={HOME_FAQS} />
      </div>
    </>
  );
}
