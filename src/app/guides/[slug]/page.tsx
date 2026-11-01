import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
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
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{guide.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last reviewed {guide.reviewed}</p>
      <p className="mt-4 text-muted-foreground">{guide.description}</p>
      <p className="mt-4">
        <Link href={guide.toolHref} className="font-semibold text-primary hover:underline">
          {guide.toolLabel}
        </Link>
      </p>
      {guide.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-6 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <div className="mt-10">
        <FaqSection items={guide.faqs} />
      </div>
      <nav className="mt-8" aria-label="Related">
        <ul className="flex flex-wrap gap-3">
          {guide.related.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
