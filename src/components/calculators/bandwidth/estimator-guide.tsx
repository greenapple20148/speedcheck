import Link from "next/link";
import { BANDWIDTH_ACTIVITIES, HEADROOM_FACTOR, formatEstimateMbps, headroomPercentLabel } from "@/lib/calculators/bandwidth";

export function EstimatorGuide() {
  const headroom = headroomPercentLabel(HEADROOM_FACTOR);
  return (
    <div className="mt-8 space-y-8 text-sm leading-6 text-muted-foreground">
      <section id="common-activity-bandwidth" aria-labelledby="common-activity-bandwidth-heading" className="scroll-mt-24">
        <h2 id="common-activity-bandwidth-heading" className="text-lg font-semibold text-foreground">
          Common activity bandwidth
        </h2>
        <p className="mt-2">
          Each row uses a reference rate, then multiplies it by how many of that activity you say are running. The rates are planning assumptions, not a measurement of a particular app or device.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {BANDWIDTH_ACTIVITIES.map((activity) => (
            <li key={activity.id} className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="font-medium text-foreground">{activity.name}</p>
              <p>
                {formatEstimateMbps(activity.downloadMbps)} Mbps down · {formatEstimateMbps(activity.uploadMbps)} Mbps up each
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="download-vs-upload" aria-labelledby="download-vs-upload-heading" className="scroll-mt-24">
        <h2 id="download-vs-upload-heading" className="text-lg font-semibold text-foreground">
          Download and upload
        </h2>
        <p className="mt-2">
          Download is the traffic coming in: video streams, web pages, and app updates. Upload is the traffic going out: video calls, cloud backup, and photos leaving the house. A plan can have plenty of download and still feel stuck when a backup or a call fills the smaller upload. This estimator scores the two directions separately. The{" "}
          <Link href="/upload-speed-test" className="font-medium text-primary hover:underline">
            upload speed test
          </Link>{" "}
          measures the line you have.
        </p>
      </section>

      <section id="simultaneous-usage" aria-labelledby="simultaneous-usage-heading" className="scroll-mt-24">
        <h2 id="simultaneous-usage-heading" className="text-lg font-semibold text-foreground">
          Simultaneous usage
        </h2>
        <p className="mt-2">
          The totals assume the selected activities happen at the same time. Two 4K streams plus a video call is a larger load than those activities spread across the evening. Quantity zero means that activity is idle. Presets are starting points; the steppers stay editable afterward.
        </p>
      </section>

      <section id="wifi-and-overhead" aria-labelledby="wifi-and-overhead-heading" className="scroll-mt-24">
        <h2 id="wifi-and-overhead-heading" className="text-lg font-semibold text-foreground">
          Wi-Fi and overhead
        </h2>
        <p className="mt-2">
          The recommended capacity adds {headroom}% headroom, then rounds up to a common plan size. That cushion is a planning choice. Wi-Fi, distance from the router, and other devices can use more than the activity list. Protocol overhead means a file transfer rarely holds the full advertised rate. A{" "}
          <Link href="/wifi-speed-test" className="font-medium text-primary hover:underline">
            Wi-Fi speed test
          </Link>{" "}
          and the guide on{" "}
          <Link href="/guides/how-to-improve-wifi-speed" className="font-medium text-primary hover:underline">
            improving Wi-Fi
          </Link>{" "}
          describe the path from the modem to the device.{" "}
          <Link href="/guides/what-is-good-internet-speed" className="font-medium text-primary hover:underline">
            What is a good internet speed?
          </Link>{" "}
          puts these planning ranges in context.
        </p>
      </section>

      <section id="estimate-vs-speed-test" aria-labelledby="estimate-vs-speed-test-heading" className="scroll-mt-24">
        <h2 id="estimate-vs-speed-test-heading" className="text-lg font-semibold text-foreground">
          An estimate is not a speed test
        </h2>
        <p className="mt-2">
          Nothing on this page reads your modem, router, or provider account. If you have saved a plan in this browser, those subscribed speeds are the starting download and upload fields. A recent speed test is offered only through “Use my latest speed test,” because a measurement is not the same thing as the plan you pay for. Run a{" "}
          <Link href="/speed-test" className="font-medium text-primary hover:underline">
            speed test
          </Link>
          , a{" "}
          <Link href="/streaming-speed-test" className="font-medium text-primary hover:underline">
            streaming check
          </Link>
          , or a{" "}
          <Link href="/video-call-test" className="font-medium text-primary hover:underline">
            video-call check
          </Link>{" "}
          when you want a reading from the connection.
        </p>
      </section>
    </div>
  );
}
