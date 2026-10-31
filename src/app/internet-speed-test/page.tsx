import type { Metadata } from "next";
import { ToolPage } from "@/components/seo/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { HOME_FAQS } from "@/content/faqs";

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Test",
  description:
    "Run a free internet speed test for download, upload, ping, and jitter using real data transfers.",
  path: "/internet-speed-test",
});

export default function InternetSpeedTestPage() {
  return (
    <ToolPage
      title="Internet Speed Test"
      description="Free internet speed test"
      path="/internet-speed-test"
      intro="Check your connection with a real multi-connection download and upload against MySpeedGauge measurement servers."
      bullets={[
        "Download and upload in Mbps",
        "Ping and jitter latency metrics",
        "Lightweight mode to save bandwidth",
      ]}
      faqs={HOME_FAQS}
      related={[
        { href: "/wifi-speed-test", label: "Wi‑Fi speed test" },
        { href: "/upload-speed-test", label: "Upload speed test" },
        { href: "/guides/what-is-good-internet-speed", label: "What is a good internet speed?" },
      ]}
    />
  );
}
