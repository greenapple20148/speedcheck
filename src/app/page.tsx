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

      <section className="mx-auto max-w-[960px] px-4 pb-0 pt-2 text-center">
        <h1 className="mx-auto max-w-xl font-heading text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          Test Your Internet. Understand Your Connection.
        </h1>
        <p className="mx-auto mt-1 max-w-md text-[13px] leading-snug text-muted-foreground">
          Measure download, upload, latency, and jitter. Nothing runs until you start the test.
        </p>
      </section>

      <div id="speed-test" className="pt-1">
        <SpeedTestDashboard />
      </div>

      <HomeToolCards />

      <section className="mx-auto mt-8 w-full max-w-[960px] px-4" aria-labelledby="read-results">
        <h2 id="read-results" className="text-lg font-semibold text-foreground">
          How to read a result
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Download and upload", "Megabits per second from bytes actually transferred and the timed window."],
            ["Idle ping", "Median HTTP round trip to the measurement endpoint. This is not ICMP."],
            ["Jitter", "Average change between successive latency samples."],
            ["Loaded latency", "Median HTTP round trip while a download or upload is in progress."],
          ].map(([title, body]) => (
            <li key={title} className="panel p-4 text-sm">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-8 w-full max-w-[960px] px-4">
        <h2 className="text-lg font-semibold text-foreground">Checks worth trying first</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Pause cloud backups and downloads, then run the test again.</li>
          <li>Repeat once on Ethernet if you can, and compare it with Wi-Fi.</li>
          <li>If speed is fine but latency jumps under load, open the bufferbloat test.</li>
          <li>Save the result before you change more than one thing.</li>
        </ol>
        <p className="mt-3 text-sm">
          <Link href="/internet-troubleshooter" className="font-medium text-primary hover:underline">
            Open the troubleshooter
          </Link>{" "}
          for a checklist tied to your symptoms.
        </p>
      </section>

      <section className="mx-auto mt-8 w-full max-w-[960px] px-4" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="text-lg font-semibold text-foreground">
          Popular guides
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {guides.map((guide) => (
            <li key={guide.href}>
              <Link href={guide.href} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:border-primary">
                {guide.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto mt-8 w-full max-w-[960px] px-4 pb-12">
        <FaqSection items={HOME_FAQS} />
        <AdSlot format="horizontal" slot="home-after-faq" />
      </div>
    </>
  );
}
