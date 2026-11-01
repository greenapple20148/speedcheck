import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Home, ListChecks, Search } from "lucide-react";
import { MeshTroubleshooter } from "@/components/mesh/mesh-troubleshooter";
import { ToolShell } from "@/components/seo/tool-shell";
import { meshCrumbs } from "@/lib/mesh/crumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Is My Mesh Wi-Fi Slow?",
  description: "A rules checklist for offline nodes, weak upstairs coverage, double NAT, and slow wireless hops. Free steps come first.",
  path: "/mesh-wifi/troubleshooter",
});

const BENEFITS = [
  { icon: Search, label: "Identify possible causes" },
  { icon: ListChecks, label: "Actionable next steps" },
  { icon: ClipboardCheck, label: "Saved speed tests" },
  { icon: Home, label: "Any mesh system" },
] as const;

const guideLink = "font-medium text-[#006B53] underline-offset-2 hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]";

export default function MeshTroubleshootPage() {
  return (
    <ToolShell
      title="Why Is My Mesh Wi-Fi Slow?"
      description="Mesh symptom checklist"
      path="/mesh-wifi/troubleshooter"
      crumbs={meshCrumbs("Mesh Wi-Fi Troubleshooter")}
      intro="Find what's slowing down your Wi-Fi with a guided diagnosis and practical next steps."
      hideHeader
      methodologyHeading="How this assistant works"
      methodology="Recommendations come from the symptoms and answers you enter, plus room tests already saved on this device. A speed test runs only after you start it on the speed test page. Planner colors are an estimate, not a measured signal. This site cannot see router settings, node association, firmware, or backhaul quality, and it does not ask for a Wi-Fi or router password."
      faqs={[
        { question: "Can this see my router settings?", answer: "No. Recommendations come from the symptoms you select, the answers you type, and any room tests saved on this device." },
        { question: "Will this page start a speed test?", answer: "No. Open the speed test or the room test and start it there. This page can show a result you already saved." },
        { question: "Does a speed difference prove the link between nodes is faulty?", answer: "No. Two speed tests can differ because of the device, interference, the time of day, or other traffic. That gap is worth checking. It is not a backhaul measurement." },
        { question: "Are the planner colors a signal reading?", answer: "No. Coverage colors in the floor planner are an estimate. A room test is a speed test you start, not a signal-strength reading." },
        { question: "When might another node help?", answer: "After a test beside the primary node is healthy and a test in the slow room stays lower. If the primary node is already slow, another node will not fix the ISP link." },
      ]}
      related={[
        { href: "/speed-test", label: "Speed test" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
        { href: "/mesh-wifi/dead-zone-test", label: "Room test" },
        { href: "/network-health", label: "Network health" },
        { href: "/router-setup", label: "Router setup" },
        { href: "/dns-speed-test", label: "DNS timing" },
        { href: "/ping-test", label: "Latency" },
        { href: "/jitter-test", label: "Jitter" },
        { href: "/internet-troubleshooter", label: "General troubleshooter" },
      ]}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1100px]">
        <header className="mb-4 rounded-[20px] border border-[#E2E8E5] bg-[#EAF8F1] px-4 py-3 sm:px-5 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#10231F] sm:text-[1.75rem] [[data-theme=dark]_&]:text-foreground">
                Mesh Wi-Fi Troubleshooter
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-[#64748B] sm:text-[15px] sm:leading-6 [[data-theme=dark]_&]:text-muted-foreground">
                Find what&apos;s slowing down your Wi-Fi with a guided diagnosis and practical next steps.
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {BENEFITS.map((item) => (
                  <li key={item.label} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-[#006B53] [[data-theme=dark]_&]:text-[var(--accent-text)]">
                    <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <TroubleshooterIllustration />
          </div>
        </header>
        <MeshTroubleshooter />
        <MeshSlowGuide />
      </div>
    </ToolShell>
  );
}

function TroubleshooterIllustration() {
  return (
    <figure className="hidden w-[200px] shrink-0 lg:block">
      <svg viewBox="0 0 200 108" className="h-[96px] w-full" aria-hidden="true">
        <rect x="8" y="62" width="184" height="36" rx="18" className="fill-white [[data-theme=dark]_&]:fill-[#10241C]" />
        <path d="M28 78c8-16 20-24 36-24" className="fill-none stroke-[#009B78] stroke-[3]" strokeLinecap="round" />
        <path d="M34 78c6-10 14-16 24-16" className="fill-none stroke-[#006B53] stroke-[3]" strokeLinecap="round" />
        <circle cx="24" cy="80" r="3" className="fill-[#006B53] [[data-theme=dark]_&]:fill-[var(--accent-text)]" />
        <path d="M78 84V58l22-12 22 12v26H78z" className="fill-[#009B78]" />
        <path d="M100 46 122 58v6H78v-6L100 46z" className="fill-[#006B53]" />
        <rect x="96" y="66" width="8" height="12" rx="1" className="fill-white" />
        <circle cx="148" cy="70" r="10" className="fill-[#006B53]" />
        <circle cx="168" cy="78" r="7" className="fill-[#009B78]" />
        <circle cx="132" cy="80" r="6" className="fill-[#009B78]" />
        <rect x="146" y="78" width="4" height="14" className="fill-[#006B53]" />
        <rect x="166" y="83" width="4" height="9" className="fill-[#006B53]" />
        <rect x="130" y="84" width="4" height="8" className="fill-[#006B53]" />
      </svg>
      <figcaption className="text-center text-[11px] font-medium text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
        Illustration
      </figcaption>
    </figure>
  );
}

function MeshSlowGuide() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground" aria-labelledby="mesh-slow-guide">
      <h2 id="mesh-slow-guide" className="font-heading text-lg font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">
        Why mesh Wi-Fi can be slower than expected
      </h2>
      <p>
        Why is my mesh Wi-Fi slow? A mesh kit spreads Wi-Fi through a home, and each wireless hop shares airtime with phones and laptops unless that model has a radio set aside for the hop. A speed test in a far room is often lower than a test beside the primary node. That gap is a difference in throughput to the test server. It is not a signal-strength reading, and it does not by itself prove the link between nodes is faulty.
      </p>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Wireless versus Ethernet backhaul</h3>
        <p className="mt-1">
          Ethernet or MoCA gives the satellite a wired path back to the primary node. A wireless hop does not. If a cable path already exists, it is the first thing to try before adding another node. The <Link className={guideLink} href="/mesh-wifi/guides/ethernet-vs-wireless-backhaul">Ethernet and wireless backhaul guide</Link> and the <Link className={guideLink} href="/mesh-wifi/backhaul-advisor">backhaul advisor</Link> walk through that choice. This site cannot see how your nodes are linked.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Placement mistakes</h3>
        <p className="mt-1">
          A satellite tucked in the dead spot is often too far from the primary node to help the rooms in between. Place it where it still hears the primary node, around table height and out of a cabinet. The <Link className={guideLink} href="/mesh-wifi/guides/where-to-place-mesh-nodes">placement guide</Link> and the <Link className={guideLink} href="/mesh-wifi/planner">floor planner</Link> are for that experiment. Planner colors are an estimate, not a measured signal map.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Walls and floors</h3>
        <p className="mt-1">
          Brick, concrete, and floor decks block more than an open hallway. A second floor usually needs a node near the stair opening rather than in a far bedroom, unless that bedroom is the only priority. The <Link className={guideLink} href="/mesh-wifi/guides/upstairs-mesh-coverage">upstairs coverage guide</Link> covers that layout. Confirm it with a room test upstairs and downstairs.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Why a device stays on a distant node</h3>
        <p className="mt-1">
          Phones and laptops choose when to roam. A device can stay attached to a farther node after you walk into another room. This page cannot see that association. The vendor app is where the connected node is listed. After it shows a different node, run the room test again.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">Compare the primary node and a satellite</h3>
        <p className="mt-1">
          Start a <Link className={guideLink} href="/speed-test">speed test</Link> beside the primary node, then start the same test near the satellite on the same device, with other large downloads paused. Compare download, upload, latency, and jitter when those results exist. A <Link className={guideLink} href="/mesh-wifi/dead-zone-test">room test</Link> can save the pair. Differences can also come from the device, interference, the time of day, and other traffic.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#10231F] [[data-theme=dark]_&]:text-foreground">When another node may help</h3>
        <p className="mt-1">
          Add a node after the wired or primary-node test looks healthy and the far room stays slower, and after you have already moved the nearest node closer. If the primary node is slow on its own, another satellite will not repair the ISP link. <Link className={guideLink} href="/wifi-vs-ethernet">Wi-Fi versus Ethernet</Link>, <Link className={guideLink} href="/network-health">network health</Link>, <Link className={guideLink} href="/ping-test">latency</Link>, <Link className={guideLink} href="/jitter-test">jitter</Link>, and <Link className={guideLink} href="/dns-speed-test">DNS timing</Link> are separate checks you start yourself. <Link className={guideLink} href="/router-setup">Router setup</Link> does not ask for the router password.
        </p>
      </div>
    </section>
  );
}
