import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { GUIDES } from "@/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";

const existing = [
  { href: "/guides/why-is-my-internet-slow", title: "Why Is My Internet Slow?", description: "A short checklist for Wi-Fi, congestion, and the plan." },
  { href: "/guides/what-is-good-internet-speed", title: "What Is a Good Internet Speed?", description: "How to think about throughput for everyday use." },
  { href: "/guides/how-to-improve-wifi-speed", title: "How to Improve Wi-Fi Speed", description: "Steps that separate the radio from the ISP link." },
];

export const metadata: Metadata = buildMetadata({
  title: "Internet Guides",
  description: "Explainers for speed, latency, bufferbloat, upload, and Wi-Fi, each tied to a test you can run.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Guides" }]} />
      <PageHeader
        title="Guides"
        description="Short explanations with a test to run next. Unpublished topics stay in the editorial backlog instead of going live as thin pages."
      />
      <ul className="grid gap-3">
        {existing.map((guide) => (
          <li key={guide.href}>
            <Link href={guide.href} className="block rounded-[20px] border border-border bg-card p-4 hover:border-[var(--accent-text)]">
              <span className="text-lg font-semibold text-foreground">{guide.title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">{guide.description}</span>
            </Link>
          </li>
        ))}
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link href={`/guides/${guide.slug}`} className="block rounded-[20px] border border-border bg-card p-4 hover:border-[var(--accent-text)]">
              <span className="text-lg font-semibold text-foreground">{guide.title}</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">{guide.description}</span>
              <span className="mt-2 block text-xs text-muted-foreground">Reviewed {guide.reviewed}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
