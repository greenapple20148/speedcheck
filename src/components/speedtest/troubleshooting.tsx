import Link from "next/link";
import { Wifi, Router, Cable, RefreshCw } from "lucide-react";

const tips = [
  {
    icon: Cable,
    title: "Prefer a wired test first",
    body: "Ethernet bypasses Wi‑Fi interference and shows your true ISP throughput.",
  },
  {
    icon: Wifi,
    title: "Move closer or switch bands",
    body: "Use 5 GHz/6 GHz near the router. 2.4 GHz reaches farther but is often congested.",
  },
  {
    icon: Router,
    title: "Restart modem and router",
    body: "Power-cycle the modem, wait two minutes, then restart the router and retest.",
  },
  {
    icon: RefreshCw,
    title: "Pause heavy downloads",
    body: "Cloud backups, updates, and other devices can steal bandwidth during a test.",
  },
];

export function TroubleshootingSection() {
  return (
    <section className="mx-auto max-w-[960px]" aria-labelledby="troubleshoot-heading">
      <h2 id="troubleshoot-heading" className="heading-2 text-foreground">
        Connection troubleshooting
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Slow results? Work through these steps before contacting your ISP.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <tip.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h3 className="font-heading font-semibold text-foreground">{tip.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Dig deeper in our guides:{" "}
        <Link href="/guides/why-is-my-internet-slow" className="text-primary hover:underline">
          Why is my internet slow?
        </Link>{" "}
        ·{" "}
        <Link href="/guides/how-to-improve-wifi-speed" className="text-primary hover:underline">
          How to improve Wi‑Fi speed
        </Link>
      </p>
    </section>
  );
}
