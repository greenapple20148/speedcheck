import type { Crumb } from "@/components/layout/breadcrumbs";

/** Home is added by the breadcrumb component. Mesh pages sit under the hub. */
export function meshCrumbs(current: string, parents: Crumb[] = []): Crumb[] {
  return [{ href: "/mesh-wifi", label: "Mesh Wi-Fi" }, ...parents, { label: current }];
}
