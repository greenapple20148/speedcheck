import type { Metadata } from "next";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Gaming Speed Test — Latency, Jitter & Load",
  description:
    "Check idle HTTP latency, jitter, and latency under load before you play. This does not measure Fortnite, Valorant, or other game servers.",
  path: "/gaming-speed-test",
});

export default function GamingPage() {
  return (
    <ToolShell
      title="Gaming speed test"
      description="Latency and stability for online play"
      path="/gaming-speed-test"
      intro="Online games care more about steady latency than a huge download number. This test measures the path to MySpeedGauge's endpoint. It is not the ping inside a game, and it is not a measurement of a publisher's servers."
      methodology="A standard test records idle HTTP round-trip time, jitter, and latency while download and upload are running. Regional game selection is unavailable until more than one authorized endpoint is configured."
      faqs={[
        {
          question: "Why is in-game ping different?",
          answer:
            "The game client talks to a different server, often over UDP. Use the in-game number for that title, and use this test to see whether your home network adds delay.",
        },
      ]}
      related={[
        { href: "/guides/how-to-reduce-ping-while-gaming", label: "How to reduce ping while gaming" },
        { href: "/ping-test", label: "Ping test" },
        { href: "/bufferbloat-test", label: "Bufferbloat test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" />
    </ToolShell>
  );
}
