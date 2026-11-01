import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About MySpeedGauge",
  description: "MySpeedGauge is a free internet diagnostics site. Tests run without an account.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "About" }]} />
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">About</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        MySpeedGauge measures download, upload, and HTTP latency against a measurement service you configure. The pages, guides, and calculators are meant to be usable without signing in or paying.
      </p>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Quality comments are estimates from published thresholds on this site. They are not an industry certification, and they are not a promise about a particular game, call, or stream.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/methodology" className="font-medium text-primary hover:underline">
          Read the methodology
        </Link>
      </p>
    </article>
  );
}
