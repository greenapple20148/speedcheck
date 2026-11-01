import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/ad-slot";
import { ToolShell } from "@/components/seo/tool-shell";
import { getMeshGuide, MESH_GUIDES } from "@/lib/mesh/catalog";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return MESH_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getMeshGuide(slug);
  if (!guide) return {};
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/mesh-wifi/guides/${guide.slug}`,
    ogType: "article",
  });
}

export default async function MeshGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getMeshGuide(slug);
  if (!guide) notFound();
  const others = MESH_GUIDES.filter((item) => item.slug !== guide.slug);
  return (
    <ToolShell
      title={guide.title}
      description={guide.description}
      path={`/mesh-wifi/guides/${guide.slug}`}
      crumbs={meshCrumbs(guide.title)}
      schema="article"
      dateModified={guide.reviewed}
      intro={guide.description}
      faqs={guide.faqs}
      related={[
        { href: guide.toolHref, label: guide.toolLabel },
        ...others.map((item) => ({ href: `/mesh-wifi/guides/${item.slug}`, label: item.title })),
      ]}
    >
      {guide.sections.map((section) => (
        <section key={section.heading} className="mb-6">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <p className="text-sm text-muted-foreground">Last reviewed {guide.reviewed}.</p>
      <p className="mt-3 text-sm">
        <Link href={guide.toolHref} className="font-medium text-primary">{guide.toolLabel}</Link>
      </p>
      <AdSlot slot="mesh-guide" />
    </ToolShell>
  );
}
