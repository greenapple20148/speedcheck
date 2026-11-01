"use client";

import { UnitConverter } from "@/components/calculators/calculators";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import Link from "next/link";

export default function MbpsToMbsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        items={[
          { href: "/mbps-to-mbs", label: "Tools" },
          { label: "Mbps to MB/s" },
        ]}
      />
      <h1 className="heading-1 text-foreground">Mbps to MB/s Converter</h1>
      <p className="mt-3 text-muted-foreground">
        Internet plans are advertised in megabits per second (Mbps). File downloads are often shown in megabytes per second (MB/s). Divide by 8 to convert.
      </p>
      <div className="mt-8">
        <UnitConverter />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/mbps-to-mbs" className="text-primary hover:underline">
          Open the full converter page
        </Link>
        .
      </p>
    </div>
  );
}
