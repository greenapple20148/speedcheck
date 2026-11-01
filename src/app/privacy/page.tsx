import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How MySpeedGauge handles measurement data, cookies, and analytics.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Privacy" }]} />
      <article className="prose prose-neutral max-w-none prose-headings:font-heading">
      <h1>Privacy Policy</h1>
      <p>
        SpeedCheck is designed to measure your connection without unnecessary personal data.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Speed test metrics (download, upload, ping, jitter, mode, server)</li>
        <li>Optional ISP/city hints from edge headers or short-lived lookups</li>
        <li>Anonymous product analytics events when enabled</li>
      </ul>
      <h2>What we do not store by default</h2>
      <ul>
        <li>Raw IP addresses</li>
        <li>Account credentials (anonymous testing requires no account)</li>
      </ul>
      <h2>Sharing</h2>
      <p>Result pages are private unless you explicitly opt in to create a public share link.</p>
      <h2>Ads and affiliates</h2>
      <p>
        Advertising and affiliate features are disabled unless configured. Third-party ad networks
        may set cookies when enabled—see their policies and use consent tooling appropriate for your region.
      </p>
    </article>
    </div>
  );
}
