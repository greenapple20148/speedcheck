import type { Metadata } from "next";
import { ToolPage } from "@/components/seo/tool-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Jitter Test",
  description:
    "Measure network jitter—the variation in latency that causes choppy calls and unstable gameplay.",
  path: "/jitter-test",
});

export default function JitterTestPage() {
  return (
    <ToolPage
      title="Jitter Test"
      description="Jitter test"
      path="/jitter-test"
      intro="Jitter measures how much latency varies between packets. High jitter causes robotic audio and rubber-banding in games."
      bullets={[
        "Aim for jitter under 10–15 ms for smooth calls",
        "Bufferbloat and congested Wi‑Fi often raise jitter",
        "QoS or SQM on your router can stabilize latency",
      ]}
      defaultMode="lightweight"
      related={[
        { href: "/ping-test", label: "Ping test" },
        { href: "/guides/why-is-my-internet-slow", label: "Why is my internet slow?" },
      ]}
    />
  );
}
