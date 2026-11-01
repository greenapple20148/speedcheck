import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Slow Upload Speed — Measure and Check the Uplink",
  description:
    "Measure upload throughput and see whether video calls or backups are limited by an asymmetric plan or a busy line.",
  path: "/slow-upload-speed",
});

export default function SlowUploadPage() {
  return (
    <ToolShell
      title="Slow upload speed"
      description="Upload throughput and what it affects"
      path="/slow-upload-speed"
      intro="Many home plans advertise the download number and leave upload much smaller. That is often by design. This test measures the uplink you actually get, using bytes the server says it received."
      methodology="Upload time includes connection setup. The payload is zero-filled because generating random bytes on the device was slowing the test, and the server does not compress the body."
      faqs={[
        {
          question: "Is a low upload a fault?",
          answer:
            "Not by itself. Compare it with the upload speed on your plan. If it is far below that on Ethernet, then it is worth asking the ISP, with the numbers saved.",
        },
      ]}
      related={[
        { href: "/video-call-test", label: "Video call test" },
        { href: "/guides/why-upload-is-slower-than-download", label: "Why upload is slower" },
      ]}
    >
      <SpeedTestDashboard />
    </ToolShell>
  );
}
