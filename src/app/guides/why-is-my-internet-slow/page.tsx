import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateOffers } from "@/components/ads/affiliate-offers";
import { JsonLd } from "@/components/seo/json-ld";
import { AFFILIATE_OFFERS } from "@/content/affiliates";
import { buildMetadata, absoluteUrl } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Internet Slow?",
  description:
    "Diagnose slow internet: Wi‑Fi interference, ISP congestion, outdated gear, and how to confirm the real bottleneck with a speed test.",
  path: "/guides/why-is-my-internet-slow",
});

export default function WhySlowGuide() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Why Is My Internet Slow?",
          description:
            "Diagnose slow internet: Wi‑Fi interference, ISP congestion, outdated gear, and how to confirm the real bottleneck with a speed test.",
          url: absoluteUrl("/guides/why-is-my-internet-slow"),
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/guides/what-is-good-internet-speed", label: "Guides" },
          { label: "Why is my internet slow?" },
        ]}
      />
      <h1 className="heading-1 text-foreground">Why Is My Internet Slow?</h1>
      <p className="mt-4 text-muted-foreground">
        Slow internet usually comes from Wi‑Fi, local congestion, or your ISP plan—not a mysterious
        &quot;broken internet.&quot; Use this checklist to isolate the cause.
      </p>

      <h2 className="heading-2 mt-10 text-foreground">1. Separate Wi‑Fi from ISP speed</h2>
      <p className="mt-3 text-muted-foreground">
        Run a{" "}
        <Link href="/internet-speed-test" className="text-primary hover:underline">
          MySpeedGauge test
        </Link>{" "}
        on Ethernet (or with Wi‑Fi as close to the router as possible). If wired is fast but wireless
        is not, the bottleneck is local Wi‑Fi.
      </p>

      <h2 className="heading-2 mt-10 text-foreground">2. Check for local competition</h2>
      <p className="mt-3 text-muted-foreground">
        Cloud backups, OS updates, smart TVs, and other household devices share your pipe. Pause
        heavy transfers and retest. Also reboot the modem and router—stuck NAT sessions and overheating
        radios are common.
      </p>

      <h2 className="heading-2 mt-10 text-foreground">3. Watch for bufferbloat and jitter</h2>
      <p className="mt-3 text-muted-foreground">
        If Mbps looks fine but video calls stutter, check{" "}
        <Link href="/jitter-test" className="text-primary hover:underline">
          jitter
        </Link>{" "}
        and ping under load. Enabling SQM/QoS on a capable router often restores snappy latency.
      </p>

      <h2 className="heading-2 mt-10 text-foreground">4. Confirm plan limits</h2>
      <p className="mt-3 text-muted-foreground">
        Cable plans advertise download far more than upload. Evening neighborhood congestion can also
        reduce effective speed. Compare results at different times of day before escalating to support.
      </p>

      <AdSlot format="rectangle" className="max-w-md" />
      <AffiliateOffers offers={AFFILIATE_OFFERS} heading="If you need a faster plan" />
    </article>
  );
}
