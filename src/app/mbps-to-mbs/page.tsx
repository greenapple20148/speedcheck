import type { Metadata } from "next";
import { UnitConverter } from "@/components/calculators/calculators";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mbps to MB/s Converter",
  description:
    "Convert megabits per second to decimal megabytes per second and to mebibytes per second, and back.",
  path: "/mbps-to-mbs",
});

export default function MbpsPage() {
  return (
    <ToolShell
      title="Mbps to MB/s"
      description="Megabits and megabytes"
      path="/mbps-to-mbs"
      intro="Plans are sold in megabits per second. File copies are often shown in megabytes per second. Divide by 8 for decimal megabytes. Binary mebibytes are a little smaller per second at the same megabit rate."
      faqs={[
        {
          question: "Is 100 Mbps the same as 100 MB/s?",
          answer: "No. 100 Mbps is 12.5 MB/s using decimal megabytes, or about 11.92 MiB/s.",
        },
      ]}
      related={[{ href: "/tools/mbps-to-mbs", label: "Same converter, older URL" }]}
    >
      <UnitConverter />
    </ToolShell>
  );
}
