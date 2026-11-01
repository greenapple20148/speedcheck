import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { HomeToolCards } from "@/components/home/tool-cards";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { AdSlot } from "@/components/ads/ad-slot";
import { HOME_FAQS } from "@/content/faqs";
import { absoluteUrl, buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Test Your Internet Speed & Connection Quality | MySpeedGauge",
  description:
    "Measure speed, latency, stability, and connection quality. See what is slowing you down and how to check the next fix.",
  path: "/",
});

const guides = [
  { href: "/guides/why-is-my-internet-slow", label: "Why is my internet slow?" },
  { href: "/guides/what-is-bufferbloat", label: "What is bufferbloat?" },
  { href: "/guides/what-is-latency", label: "What is latency?" },
  { href: "/guides/how-fast-is-100-mbps", label: "How fast is 100 Mbps?" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "MySpeedGauge",
          url: absoluteUrl("/"),
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "Free internet diagnostics for download, upload, HTTP latency, jitter, and latency under load.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
      />

      <section className="mx-auto max-w-[1280px] px-4 pb-1 pt-2 text-center">
        <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
          Test Your Internet Speed
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-[13px] leading-snug text-muted-foreground">
          Measure your download speed, upload speed, and connection responsiveness in seconds.
        </p>
      </section>

      <div id="speed-test" className="pt-1">
        <SpeedTestDashboard showHistory />
      </div>

      <HomeToolCards />

      <article className="mx-auto mt-8 w-full max-w-3xl px-4 text-base leading-7 text-muted-foreground">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">Free Internet Speed Test</h1>
        <p className="mt-3">
          A speed test measures the path between this browser and a measurement server. Nothing starts until you press the button. The numbers on the page come from that run.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">How a speed test works</h2>
        <p className="mt-2">
          The test checks responsiveness first, then moves data down and up for a short time. Download and upload speeds are throughput: bytes transferred during the timed window, expressed in megabits per second. The page does not invent a result when a phase has not run.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Download speed</h2>
        <p className="mt-2">
          Download is how fast data arrives. Streaming, software updates, and web pages depend on it. A single short test is one sample of the path, not a guarantee of the speed your plan advertises.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Upload speed</h2>
        <p className="mt-2">
          Upload is how fast data leaves. Video calls, backups, and sending large files need it. Many home plans are asymmetric, so upload is often lower than download. You can estimate a transfer with the{" "}
          <Link href="/upload-time-calculator" className="font-medium text-primary hover:underline">upload time calculator</Link>{" "}
          or the{" "}
          <Link href="/download-time-calculator" className="font-medium text-primary hover:underline">download time calculator</Link>.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Latency and jitter</h2>
        <p className="mt-2">
          Latency is the round trip before a response, in milliseconds. Jitter is how much that delay changes between samples. Calls and games feel worse when either one is high, even if throughput looks fine. Standard mode can also measure latency while data is moving. Lightweight mode does not.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Why results vary</h2>
        <p className="mt-2">
          Wi-Fi, other devices, the server, the time of day, and the test length all change the result. Pause backups and compare two runs before you treat one number as the connection. The{" "}
          <Link href="/dns-speed-test" className="font-medium text-primary hover:underline">DNS timing</Link>{" "}
          check is separate, and only runs when the browser exposes it.
        </p>
        <h2 className="mt-6 text-lg font-semibold text-foreground">Wi-Fi versus Ethernet</h2>
        <p className="mt-2">
          Ethernet removes the wireless hop, so it is the cleaner comparison when a cable is available. Wi-Fi adds distance, walls, and shared airtime. A slow room is not automatically a weak signal. The{" "}
          <Link href="/network-health" className="font-medium text-primary hover:underline">network health</Link>{" "}
          page keeps a measured snapshot, and the{" "}
          <Link href="/mesh-wifi/planner" className="font-medium text-primary hover:underline">mesh planner</Link>{" "}
          is where you place nodes and record room tests.
        </p>
      </article>

      <section className="mx-auto mt-8 w-full max-w-[1280px] px-4" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="text-lg font-semibold text-foreground">
          Popular guides
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {guides.map((guide) => (
            <li key={guide.href}>
              <Link href={guide.href} className="flex min-h-11 items-center rounded-[20px] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-[var(--accent-text)]">
                {guide.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto mt-8 w-full max-w-[1280px] px-4 pb-12">
        <FaqSection items={HOME_FAQS} />
        <AdSlot format="horizontal" slot="home-after-faq" />
      </div>
    </>
  );
}
