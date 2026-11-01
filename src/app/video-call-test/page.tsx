import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { CALL_REFERENCE_MBPS } from "@/lib/calculators/units";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Video Call Test — Upload, Latency & Stability",
  description:
    "Measure upload, download, jitter, and latency under load, then compare with planning figures for Zoom, Teams, and Meet.",
  path: "/video-call-test",
});

export default function VideoCallPage() {
  const rows = Object.values(CALL_REFERENCE_MBPS);
  return (
    <ToolShell
      title="Video call test"
      description="Call readiness from measured throughput and latency"
      path="/video-call-test"
      intro="Calls fail more often from a full upload or latency under load than from a low download number. The figures below are planning references, not official certification from Zoom, Microsoft, or Google."
      methodology="Run the standard test and read upload, idle HTTP latency, jitter, and latency under load. Suitability text elsewhere on the site is an estimate from those measurements."
      faqs={[
        {
          question: "Why does upload matter more than download?",
          answer:
            "Your camera has to leave the house. A plan with fast downloads and a small upload can still freeze a call.",
        },
      ]}
      related={[
        { href: "/slow-upload-speed", label: "Slow upload" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />
      <table className="mt-6 w-full max-w-lg text-sm">
        <caption className="mb-2 text-left font-semibold text-foreground">Planning figures, per call</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <td className="py-2 pr-4">{row.label}</td>
              <td className="py-2">
                {row.down} Mbps down · {row.up} Mbps up
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ToolShell>
  );
}
