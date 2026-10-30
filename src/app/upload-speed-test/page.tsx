import type { Metadata } from "next";
import { ToolPage } from "@/components/seo/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Upload Speed Test",
  description:
    "Measure your upload speed for video calls, cloud backups, livestreaming, and file sharing.",
  path: "/upload-speed-test",
});

export default function UploadSpeedTestPage() {
  return (
    <ToolPage
      title="Upload Speed Test"
      description="Upload speed test"
      path="/upload-speed-test"
      intro="Upload speed determines how quickly you can send data—critical for Zoom, FaceTime, Twitch, and cloud backups."
      bullets={[
        "Cable plans often have much lower upload than download",
        "Fiber plans are typically symmetrical",
        "Close backups before testing for a cleaner reading",
      ]}
      related={[
        { href: "/internet-speed-test", label: "Full speed test" },
        { href: "/guides/what-is-good-internet-speed", label: "What is a good speed?" },
      ]}
    />
  );
}
