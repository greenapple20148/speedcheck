import type { Metadata } from "next";
import Link from "next/link";
import { ToolShell } from "@/components/seo/tool-shell";
import { MESH_BRANDS } from "@/lib/mesh/catalog";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mesh Wi-Fi Setup by Brand",
  description: "Setup notes for eero, Google Nest Wifi, TP-Link Deco, NETGEAR Orbi, ASUS ZenWiFi, and Linksys Velop. Confirm the exact model.",
  path: "/mesh-wifi/brands",
});

export default function BrandsPage() {
  return (
    <ToolShell
      title="Mesh Wi-Fi setup by brand"
      description="Brand setup notes with official support links"
      path="/mesh-wifi/brands"
      crumbs={meshCrumbs("Mesh Wi-Fi setup by brand")}
      intro="Each page links to the manufacturer’s support site and lists the shared install steps. It does not invent port counts, prices, or coverage claims."
      related={[{ href: "/mesh-wifi/setup", label: "Setup wizard" }]}
    >
      <ul className="space-y-3">
        {MESH_BRANDS.filter((brand) => brand.slug !== "generic").map((brand) => (
          <li key={brand.slug} className="rounded-2xl border border-border p-4">
            <h2 className="text-base font-semibold"><Link href={`/mesh-wifi/brands/${brand.slug}`} className="hover:text-primary">{brand.name}</Link></h2>
            <p className="mt-1 text-sm text-muted-foreground">{brand.summary}</p>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
