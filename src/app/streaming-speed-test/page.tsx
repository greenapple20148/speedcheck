import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { STREAMING_REFERENCE_MBPS } from "@/lib/calculators/units";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Streaming Speed Test — SD, HD, and 4K",
  description:
    "Measure download throughput and latency under load, then compare it with planning figures for SD, HD, Full HD, and 4K.",
  path: "/streaming-speed-test",
});

const rows = [
  ["SD", STREAMING_REFERENCE_MBPS.sd],
  ["HD", STREAMING_REFERENCE_MBPS.hd],
  ["Full HD", STREAMING_REFERENCE_MBPS.fullHd],
  ["4K", STREAMING_REFERENCE_MBPS.uhd4k],
];

export default function StreamingPage() {
  return (
    <ToolShell
      title="Streaming speed test"
      description="Throughput planning for video streams"
      path="/streaming-speed-test"
      intro="A stream needs sustained download throughput and latency that does not collapse when the line is busy. The table is a planning guide. Actual quality depends on the codec, the device, the provider, and whatever else is using the connection."
      methodology="The speed test measures your link. The table does not certify a streaming service. Compare your measured download with the planning figure, then check latency under load if video still stalls."
      faqs={[
        {
          question: "Is 25 Mbps enough for 4K?",
          answer:
            "25 Mbps is a common planning figure for one 4K stream. A household with other devices, or a provider that asks for more, can still buffer.",
        },
      ]}
      related={[
        { href: "/internet-speed-calculator", label: "Household planner" },
        { href: "/guides/how-fast-is-100-mbps", label: "How fast is 100 Mbps?" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />
      <table className="mt-6 w-full max-w-md text-sm">
        <caption className="mb-2 text-left font-semibold text-foreground">Planning download per stream</caption>
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1">Quality</th>
            <th className="py-1">About</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, mbps]) => (
            <tr key={String(label)} className="border-t border-border">
              <td className="py-2">{label}</td>
              <td className="py-2">{mbps} Mbps</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ToolShell>
  );
}
