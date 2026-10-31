import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
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
          name: "MySpeedGauge",
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

      <section className="mx-auto max-w-[1100px] px-3 pb-0 pt-2 text-center sm:px-4 sm:pt-3">
        <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
          How fast is your internet?
        </h1>
        <p className="mx-auto mt-1 max-w-lg text-[13px] text-muted-foreground sm:text-[14px]">
          Measure your connection speed and stability in seconds.
        </p>
      </section>

      <div id="speed-test" className="pb-1 pt-2">
        <SpeedTestDashboard />
      </div>

      <div className="mx-auto mt-8 max-w-[960px] border-t border-border bg-muted px-4 py-8 sm:py-10">
        <TroubleshootingSection />
      </div>

      <section className="mx-auto mt-12 w-full max-w-[960px] px-4" aria-labelledby="learn-heading">
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

      <div className="mx-auto w-full max-w-[960px] px-4">
        <AdSlot format="horizontal" slot="home-below-results" className="my-6" />
      </div>

      <div className="mx-auto mt-8 w-full max-w-[960px] px-4">
        <AffiliateOffers offers={AFFILIATE_OFFERS} />
      </div>

      <div className="mx-auto mt-12 w-full max-w-[960px] px-4 pb-12">
        <FaqSection items={HOME_FAQS} />
      </div>
    </>
  );
}
