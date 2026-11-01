import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Guides" }]} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Guides</h1>
      <p className="mt-3 text-muted-foreground">
        Short explanations with a test to run next. Unpublished topics stay in the editorial backlog instead of going live as thin pages.
      </p>
      <ul className="mt-8 space-y-4">
        {existing.map((guide) => (
          <li key={guide.href} className="rounded-xl border border-border bg-card p-4">
            <Link href={guide.href} className="text-lg font-semibold text-foreground hover:text-primary">
              {guide.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
          </li>
        ))}
        {GUIDES.map((guide) => (
          <li key={guide.slug} className="rounded-xl border border-border bg-card p-4">
            <Link href={`/guides/${guide.slug}`} className="text-lg font-semibold text-foreground hover:text-primary">
              {guide.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{guide.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Reviewed {guide.reviewed}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
