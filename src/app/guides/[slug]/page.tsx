import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
import { PageHeader } from "@/components/ui/page-header";
import { RelatedActions } from "@/components/ui/related-actions";
import { JsonLd } from "@/components/seo/json-ld";
import { GuideViewed } from "@/components/seo/guide-viewed";
import { GUIDES, getGuide } from "@/content/guides";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          dateModified: guide.reviewed,
          url: absoluteUrl(`/guides/${guide.slug}`),
        }}
      />
      <GuideViewed slug={guide.slug} />
      <Breadcrumbs items={[{ href: "/guides", label: "Guides" }, { label: guide.title }]} />
      <PageHeader title={guide.title} description={guide.description}>
        <p className="mt-2 text-sm text-muted-foreground">Last reviewed {guide.reviewed}</p>
      </PageHeader>
      <p className="mt-4">
        <Link href={guide.toolHref} className="font-semibold text-primary hover:underline">
          {guide.toolLabel}
        </Link>
      </p>
      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-base leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <div className="mt-10">
        <FaqSection items={guide.faqs} />
      </div>
      <RelatedActions items={guide.related} />
    </article>
  );
}
