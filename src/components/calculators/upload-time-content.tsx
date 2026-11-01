import Link from "next/link";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import {
  computeUploadEstimate,
  formatUploadDuration,
  type UploadSizeUnit,
} from "@/lib/calculators/upload-time";

export const uploadTimeFaqs: FaqItem[] = [
  {
    question: "Which rate should I type?",
    answer:
      "Use a measured upload Mbps from a speed test, or the upload speed written on your plan. The calculator uses the upload figure you enter.",
  },
  {
    question: "Why is the estimate longer than the ideal time?",
    answer:
      "Ideal time assumes the entered rate stays constant and that every bit is file data. Transfer efficiency divides that time by a fraction from 0.50 to 1. At 90% efficiency the estimate is the ideal time divided by 0.90. The percentage is an allowance you set, not a measurement of your connection.",
  },
  {
    question: "What is the difference between GB and GiB?",
    answer:
      "GB, MB, KB, and TB are decimal units that step by 1,000. GiB, MiB, KiB, and TiB are binary units that step by 1,024. One GiB is 1,073,741,824 bytes, so it takes longer to upload than one GB at the same rate. Mbps stays a decimal megabit, 1,000,000 bits per second, either way.",
  },
  {
    question: "Does this page upload my file or test my connection?",
    answer:
      "It only calculates from the numbers you enter. To measure the connection, run the upload speed test. A saved upload measurement can fill the speed field when this browser has one.",
  },
  {
    question: "Why might a real upload take longer than the estimate?",
    answer:
      "The rate can change while the file is moving. Wi-Fi, other devices, the service receiving the file, and protocol overhead all add time. The estimate assumes the upload speed you entered stays constant.",
  },
];

const EXAMPLES: Array<{ label: string; size: number; unit: UploadSizeUnit; speed: number }> = [
  { label: "500 MB of photos", size: 500, unit: "MB", speed: 25 },
  { label: "1 GB file", size: 1, unit: "GB", speed: 100 },
  { label: "2 GB HD video", size: 2, unit: "GB", speed: 50 },
  { label: "20 GB 4K video", size: 20, unit: "GB", speed: 100 },
  { label: "1 GiB file", size: 1, unit: "GiB", speed: 100 },
];

export function UploadTimeDetails() {
  return (
    <details className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">How calculations work</summary>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        <p>Ideal seconds = (file size in bytes × 8) ÷ (upload Mbps × 1,000,000).</p>
        <p>Estimated seconds = ideal seconds ÷ efficiency. Efficiency is the slider percent divided by 100, from 50% to 100%.</p>
        <p>Effective upload speed = upload Mbps × efficiency.</p>
        <p>
          KB, MB, GB, and TB are powers of 1,000. KiB, MiB, GiB, and TiB are powers of 1,024. A megabit per second is
          1,000,000 bits per second in both cases.
        </p>
        <p>The result is an estimate for a steady rate. It is not a live upload.</p>
      </div>
    </details>
  );
}

export function UploadTimeGuide() {
  return (
    <div className="mt-8 space-y-8">
      <section className="max-w-3xl" aria-labelledby="how-upload-time-heading">
        <h2 id="how-upload-time-heading" className="text-lg font-semibold text-foreground">
          How upload time is calculated
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The calculator converts the file size you enter into bytes, multiplies by 8 to get bits, and divides by the
          upload rate in bits per second. One Mbps is 1,000,000 bits per second. That quotient is the ideal time. The
          estimated time divides the ideal time by transfer efficiency, so a 90% efficiency makes the estimate longer
          than the ideal. The{" "}
          <Link href="/mbps-to-mbs" className="font-medium text-primary hover:underline">
            Mbps to MB/s converter
          </Link>{" "}
          uses the same decimal megabit.
        </p>
      </section>

      <section className="max-w-3xl" aria-labelledby="upload-vs-download-heading">
        <h2 id="upload-vs-download-heading" className="text-lg font-semibold text-foreground">
          Upload and download are different rates
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Home plans often list a higher download rate than upload. A file that arrives quickly can take much longer to
          send on the same plan. Type an upload measurement or the upload speed written on the plan. This calculator
          leaves download speed out of the math. Measure the uplink with the{" "}
          <Link href="/upload-speed-test" className="font-medium text-primary hover:underline">
            upload speed test
          </Link>{" "}
          or the{" "}
          <Link href="/speed-test" className="font-medium text-primary hover:underline">
            speed test
          </Link>
          , and compare the other direction with the{" "}
          <Link href="/download-time-calculator" className="font-medium text-primary hover:underline">
            download time calculator
          </Link>
          .
        </p>
      </section>

      <section className="max-w-3xl" aria-labelledby="why-longer-heading">
        <h2 id="why-longer-heading" className="text-lg font-semibold text-foreground">
          Why a real upload takes longer
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The ideal time assumes the rate never dips and that the line carries only file data. Acknowledgments, Wi-Fi,
          other devices, and a slow destination all add time. Transfer efficiency is a simple allowance for that, from
          50% to 100%. It starts at 90% so you can see a longer estimate immediately. That starting point is not a
          reading from your network. If uploads feel slow on the line itself, the{" "}
          <Link href="/slow-upload-speed" className="font-medium text-primary hover:underline">
            slow upload speed
          </Link>{" "}
          check measures throughput instead of estimating it.
        </p>
      </section>

      <section className="max-w-3xl" aria-labelledby="units-heading">
        <h2 id="units-heading" className="text-lg font-semibold text-foreground">
          Decimal and binary file sizes
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Disk tools sometimes count in GiB while stores and operating systems label the same control GB. One GB is
          1,000,000,000 bytes. One GiB is 1,073,741,824 bytes. The same gap applies to KB and KiB, MB and MiB, and TB
          and TiB. Pick the unit that matches the size you were given. The rate stays in decimal megabits either way.
        </p>
      </section>

      <section aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="text-lg font-semibold text-foreground">
          Examples for common file sizes
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          These rows use the same formula as the calculator at 90% efficiency. They are examples, not measurements, and
          the preset buttons above use the same sizes only as starting points.
        </p>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {EXAMPLES.map((example) => {
            const estimate = computeUploadEstimate({
              size: example.size,
              unit: example.unit,
              speedMbps: example.speed,
              efficiencyPercent: 90,
            });
            return (
              <li key={example.label} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <span className="font-medium text-foreground">
                  {example.label} at {example.speed} Mbps
                </span>
                <span className="text-muted-foreground">
                  Ideal {estimate ? formatUploadDuration(estimate.idealSeconds) : "—"}
                </span>
                <span className="text-muted-foreground">
                  Estimated {estimate ? formatUploadDuration(estimate.realisticSeconds) : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <FaqSection items={uploadTimeFaqs} />

      <nav aria-label="Related tools">
        <h2 className="text-lg font-semibold text-foreground">Related tools</h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {RELATED.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const RELATED = [
  { href: "/upload-speed-test", label: "Upload speed test" },
  { href: "/slow-upload-speed", label: "Slow upload speed" },
  { href: "/speed-test", label: "Speed test" },
  { href: "/download-time-calculator", label: "Download time" },
  { href: "/mbps-to-mbs", label: "Mbps to MB/s" },
  { href: "/internet-speed-calculator", label: "Household speed planner" },
];
