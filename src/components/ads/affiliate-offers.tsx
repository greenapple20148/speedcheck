"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";
import type { AffiliateOffer } from "@/content/affiliates";

export function AffiliateOffers({
  offers,
  heading = "Internet plans worth comparing",
}: {
  offers: AffiliateOffer[];
  heading?: string;
}) {
  if (process.env.NEXT_PUBLIC_ENABLE_AFFILIATES === "false") return null;
  if (!offers.length) return null;

  return (
    <section className="w-full" aria-labelledby="affiliate-heading">
      <h2 id="affiliate-heading" className="heading-2 mb-2 text-foreground">
        {heading}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Sponsored offers. We may earn a commission if you sign up.{" "}
        <Link href="/affiliate-disclosure" className="text-primary underline-offset-2 hover:underline">
          See disclosure
        </Link>
        .
      </p>
      <ul className="space-y-3">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                Sponsored
              </div>
              <div className="font-heading text-lg font-semibold text-foreground">
                {offer.provider} — {offer.title}
              </div>
              <p className="text-sm text-muted-foreground">{offer.description}</p>
            </div>
            <a
              href={offer.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() =>
                trackEvent("affiliate_clicked", {
                  offerId: offer.id,
                  provider: offer.provider,
                })
              }
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {offer.cta}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
