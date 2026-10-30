"use client";

import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function MbpsToMbsPage() {
  const [mbps, setMbps] = useState("100");
  const value = Number(mbps);
  const mbs = Number.isFinite(value) ? value / 8 : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        items={[
          { href: "/tools/mbps-to-mbs", label: "Tools" },
          { label: "Mbps to MB/s" },
        ]}
      />
      <h1 className="heading-1 text-foreground">Mbps to MB/s Converter</h1>
      <p className="mt-3 text-muted-foreground">
        Internet plans are advertised in megabits per second (Mbps). File downloads are often shown in megabytes per second (MB/s). Divide by 8 to convert.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <Label htmlFor="mbps">Speed (Mbps)</Label>
        <Input
          id="mbps"
          type="number"
          min={0}
          step="any"
          value={mbps}
          onChange={(e) => setMbps(e.target.value)}
          className="mt-2 max-w-xs"
        />
        <p className="mt-6 font-heading text-3xl font-bold text-primary">
          {mbs.toFixed(2)} <span className="text-lg font-medium text-muted-foreground">MB/s</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Formula: MB/s = Mbps ÷ 8. Example: 100 Mbps ≈ 12.5 MB/s.
        </p>
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Want a live measurement?{" "}
        <Link href="/internet-speed-test" className="text-primary hover:underline">
          Run an internet speed test
        </Link>
        .
      </p>
    </div>
  );
}
