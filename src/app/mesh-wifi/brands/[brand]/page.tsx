import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolShell } from "@/components/seo/tool-shell";
import { getMeshBrand, MESH_BRANDS } from "@/lib/mesh/catalog";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return MESH_BRANDS.filter((brand) => brand.slug !== "generic").map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = getMeshBrand(slug);
  if (!brand) return {};
  return buildMetadata({
    title: `${brand.name} Mesh Setup`,
    description: brand.summary,
    path: `/mesh-wifi/brands/${brand.slug}`,
  });
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params;
  const brand = getMeshBrand(slug);
  if (!brand || brand.slug === "generic") notFound();
  return (
    <ToolShell
      title={`${brand.name} mesh setup`}
      description={brand.summary}
      path={`/mesh-wifi/brands/${brand.slug}`}
      crumbs={meshCrumbs(`${brand.name} mesh setup`, [{ href: "/mesh-wifi/brands", label: "Brands" }])}
      intro={brand.summary}
      faqs={[
        {
          question: `Do all ${brand.name} models use the same setup?`,
          answer: brand.summary,
        },
      ]}
      methodology={`Steps were reviewed ${brand.reviewed}. They describe the shared part of an install. The official guide for your model wins when they differ.`}
      related={[{ href: "/mesh-wifi/setup", label: "Setup wizard" }, { href: "/mesh-wifi/planner", label: "Planner" }]}
    >
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Find the model on the node label before you open {brand.appName}.</li>
        <li>Connect only the primary unit to the modem or ONT. Leave satellites unplugged until the app asks for them.</li>
        <li>Create the network in {brand.appName}. Do not type the Wi-Fi password into MySpeedGauge.</li>
        <li>Pair one satellite nearby, update firmware, then move it using the floor planner.</li>
        <li>If the ISP gateway still routes, use bridge mode or access-point mode as that model’s guide describes.</li>
      </ol>
      <p className="mt-4 text-sm">
        <a className="font-medium text-primary" href={brand.supportUrl} rel="noopener noreferrer" target="_blank">Official {brand.name} support</a>
      </p>
    </ToolShell>
  );
}
