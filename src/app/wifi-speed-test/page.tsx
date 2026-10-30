import type { Metadata } from "next";
import { ToolPage } from "@/components/seo/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { WIFI_FAQS } from "@/content/faqs";

export const metadata: Metadata = buildMetadata({
  title: "Wi‑Fi Speed Test",
  description:
    "Test your Wi‑Fi speed and compare it with a wired Ethernet baseline to find wireless bottlenecks.",
  path: "/wifi-speed-test",
});

export default function WifiSpeedTestPage() {
  return (
    <ToolPage
      title="Wi‑Fi Speed Test"
      description="Wi‑Fi speed test"
      path="/wifi-speed-test"
      intro="Measure wireless throughput on your current network. For best diagnosis, run once on Wi‑Fi and once on Ethernet."
      bullets={[
        "Stand near the router for a peak Wi‑Fi reading",
        "Retest in problem rooms to map dead zones",
        "Switch between 2.4 GHz and 5/6 GHz bands",
      ]}
      faqs={WIFI_FAQS}
      related={[
        { href: "/guides/how-to-improve-wifi-speed", label: "How to improve Wi‑Fi speed" },
        { href: "/internet-speed-test", label: "Internet speed test" },
      ]}
    />
  );
}
