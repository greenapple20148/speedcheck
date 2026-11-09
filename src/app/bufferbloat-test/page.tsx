import type { Metadata } from "next";
import Link from "next/link";
import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Bufferbloat Test — Measure Latency Under Load & Gaming Lag",
  description:
    "Test your network for bufferbloat and latency under load. Measure ping spikes during active downloads and uploads, and get an instant letter grade rating.",
  path: "/bufferbloat-test",
});

const BUFFERBLOAT_GRADES = [
  { grade: "A+", range: "+0 – 5 ms", color: "text-emerald-500", desc: "Elite buffer management. Imperceptible latency increase under maximum network load." },
  { grade: "A", range: "+5 – 15 ms", color: "text-teal-500", desc: "Excellent line quality. Gaming and voice calls remain smooth during simultaneous downloads." },
  { grade: "B", range: "+15 – 35 ms", color: "text-blue-500", desc: "Acceptable for casual use. Minor occasional micro-stutters during heavy file syncs." },
  { grade: "C", range: "+35 – 80 ms", color: "text-amber-500", desc: "Noticeable lag. In-game ping noticeably increases when family members stream video." },
  { grade: "D / F", range: "> +80 ms", color: "text-rose-500", desc: "Severe bufferbloat. Calls freeze and multiplayer games become unplayable during downloads." },
];

export default function BufferbloatPage() {
  return (
    <ToolShell
      title="Bufferbloat Test"
      description="Benchmark latency spikes and connection stability while your link is saturated"
      path="/bufferbloat-test"
      intro="Bufferbloat is undesirable latency (lag) caused by excessive buffering of packets inside your router or modem when bandwidth is saturated. This test measures how much your ping increases while uploading and downloading data."
      methodologyHeading="How Bufferbloat Is Tested and Graded"
      methodology="The test begins by measuring your idle HTTP round-trip latency. It then progressively saturates your downstream bandwidth while dispatching continuous latency probes every 200 ms. The same process is repeated during the upstream transfer phase. The bufferbloat delta represents your loaded latency minus your idle latency, which is converted into an A+ to F performance grade."
      faqs={[
        {
          question: "Can a fast internet connection still have severe bufferbloat?",
          answer:
            "Yes! You can have a 1,000 Mbps gigabit fiber or cable connection and still receive an 'F' bufferbloat grade. If your router does not actively manage packet queues, large file downloads will fill buffer memory and cause your ping to jump from 15 ms to 250+ ms.",
        },
        {
          question: "Why does bufferbloat ruin online gaming and video calls?",
          answer:
            "When someone in your household starts streaming 4K video or an app download begins, the router queues incoming and outgoing packets. Because gaming and voice packets are placed at the back of this buffer queue, you experience sudden rubberbanding, lag spikes, and robotic audio.",
        },
        {
          question: "How do I fix bufferbloat on my home network?",
          answer:
            "The most effective fix is enabling Smart Queue Management (SQM)—such as the CAKE or fq_codel queueing algorithms—in your router's firmware (available on Asus Merlin, eero, IQrouter, pfSense, OpenWrt, and Ubiquiti routers). SQM automatically prioritizes low-latency packets over bulk file transfers.",
        },
        {
          question: "What is an acceptable bufferbloat latency score?",
          answer:
            "A loaded latency increase of less than 15 ms (Grades A and A+) is optimal for gaming and voice calls. If your latency rises by more than 40 ms under load, you will experience noticeable in-game lag spikes whenever your network is active.",
        },
      ]}
      related={[
        { href: "/gaming-speed-test", label: "Gaming speed test" },
        { href: "/jitter-test", label: "Jitter test" },
        { href: "/high-ping-fix", label: "High ping troubleshooting" },
        { href: "/speed-test", label: "Standard speed test" },
      ]}
    >
      <SpeedTestDashboard defaultMode="standard" showModeToggle={false} />

      {/* Grade Scale Reference */}
      <section className="mt-12" aria-labelledby="grades-heading">
        <h2 id="grades-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Bufferbloat Letter Grade Scale
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          How much extra latency (in milliseconds) your router adds while handling data transfers.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BUFFERBLOAT_GRADES.map((tier) => (
            <div key={tier.grade} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className={`text-xl font-black ${tier.color}`}>{tier.grade}</span>
                <span className="font-mono text-xs font-bold text-foreground">{tier.range}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{tier.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Dive Guide */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            The Queue Analogy: Why Buffering Causes Delay
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Think of a grocery store checkout line. If customers with overflowing carts are served one by one in a single line, a customer holding a single pack of gum must wait 15 minutes to pay.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            In standard home routers, unmanaged FIFO (First-In, First-Out) buffers behave the same way. A 100-byte gaming packet gets trapped behind gigabytes of video buffer data. <strong>Smart Queue Management (SQM)</strong> acts as an express lane, immediately forwarding small, time-critical packets ahead of bulk transfers.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Router SQM Solutions That Eliminate Bufferbloat
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• eero Routers:</span>
              Includes a simple toggle named &ldquo;Optimize for Conferencing &amp; Gaming&rdquo; (eero SQM powered by fq_codel).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Asus Routers:</span>
              Offers Adaptive QoS and fq_codel queue discipline in newer firmware releases.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-foreground">• Open-Source Firmware:</span>
              OpenWrt with the CAKE qdisc is universally recognized as the gold standard for completely curing bufferbloat.
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
