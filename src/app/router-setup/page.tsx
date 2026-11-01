import type { Metadata } from "next";
import Link from "next/link";
import { RouterSetupWizard } from "@/components/mesh/router-setup-wizard";
import { ToolShell } from "@/components/seo/tool-shell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Router and Mesh Setup",
  description: "Set up Deco, Orbi, ZenWiFi, eero, Nest Wifi, Velop, or another router. The admin password stays on the vendor page.",
  path: "/router-setup",
});

export default function RouterSetupPage() {
  return (
    <ToolShell
      title="Router & Mesh Setup Assistant"
      description="Guided setup without collecting the router password"
      path="/router-setup"
      intro="Pick the brand, follow that vendor’s guide, and check the connection with a speed test you start yourself. Opening a login page does not connect this site to the router."
      hideHeader
      methodologyHeading="How this setup assistant works"
      methodology="This is a setup guide, not a measurement. Checklist marks are user-confirmed. A speed test runs only on the speed test page after you start it. Opening a router address in a new tab does not connect MySpeedGauge to the router, and this site never asks for the router password."
      faqs={[
        { question: "Where do I type the router password?", answer: "On the vendor’s app or on the router’s own page after you open it. This site has no password field." },
        { question: "Does a finished speed test mean the router is configured?", answer: "No. A saved speed test is a measurement from this device. Checklist marks are user-confirmed. Router mode, backhaul, and firmware are confirmed in the vendor app." },
        { question: "Did this site connect to my router if a tab opened?", answer: "No. The button only requests a new browser tab after you choose an address. MySpeedGauge does not sign in." },
      ]}
      related={[
        { href: "/speed-test", label: "Speed test" },
        { href: "/mesh-wifi/setup", label: "Mesh setup checklist" },
        { href: "/mesh-wifi/planner", label: "Floor planner" },
        { href: "/mesh-wifi/dead-zone-test", label: "Room testing" },
        { href: "/network-health", label: "Network health" },
      ]}
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <header className="mx-auto mb-4 max-w-[960px]">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0F172A] sm:text-3xl">Router & Mesh Setup Assistant</h1>
          <p className="mt-1 text-sm text-[#64748B]">Set up your router, connect mesh nodes, and verify your Wi-Fi network.</p>
          <p className="mt-2 text-sm text-[#0F172A]">Your router credentials stay with your router or its official app. MySpeedGauge does not request them.</p>
        </header>
        <RouterSetupWizard />
        <RouterSetupGuide />
      </div>
    </ToolShell>
  );
}

function RouterSetupGuide() {
  return (
    <section className="mx-auto mt-8 max-w-[1100px] space-y-4 text-sm leading-6 text-[#64748B]" aria-labelledby="router-mesh-guide">
      <h2 id="router-mesh-guide" className="font-heading text-lg font-semibold text-[#0F172A]">Router & Mesh Setup Guide</h2>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">How to set up a router</h3>
        <p className="mt-1">
          Choose the brand on the hardware, then the closest product family. The exact model number is on the label underneath the router. Follow that vendor’s app, or the local admin page when the setup guide lists one. Type the router password only on the vendor’s own page or in the official app.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">How to install mesh</h3>
        <p className="mt-1">
          Set up the primary unit first. Pair one satellite at a time near the primary, then move it. Place a satellite where it still receives a reliable connection from the primary router, rather than directly inside the weakest coverage area. Confirm each node in the vendor app. The <Link className="font-medium text-[#00866A]" href="/mesh-wifi/setup">mesh setup checklist</Link> covers the shared install steps.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Router mode and access-point mode</h3>
        <p className="mt-1">
          Router mode is the usual choice when this device replaces the ISP gateway. Access-point mode is the usual choice when another router already provides the internet. If both the ISP gateway and this system route, devices sit behind two routers. Bridge the ISP gateway or put this system in access-point mode. Change one of those, using the model guide, and leave the other as it is. Either change turns routing off on one of the two devices. This site does not switch the mode.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">How to find a default gateway</h3>
        <p className="mt-1">
          Use the address on the router label, or the gateway your operating system shows. Windows lists Default Gateway. macOS and iPhone/iPad list Router. Android may list Gateway or Router, and the menu names differ by phone. The assistant shows a brand address only when that address is already in the setup guide. It does not detect your gateway.
        </p>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">How to improve mesh coverage</h3>
        <p className="mt-1">
          Move a satellite before you add another node, and keep nodes in the open at about table height. The floor planner’s colors are an estimate, not a measured signal map. After you move a node, measure the room.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <li><Link className="font-medium text-[#00866A]" href="/mesh-wifi/planner">Floor planner</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/mesh-wifi/guides/where-to-place-mesh-nodes">Placement guide</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/mesh-wifi/dead-zone-test">Room test</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/guides/how-to-improve-wifi-speed">How to improve Wi-Fi</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/mesh-wifi/backhaul-advisor">Backhaul advisor</Link></li>
        </ul>
      </div>
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A]">Common problems</h3>
        <p className="mt-1">
          If a login page will not open, join that router’s Wi-Fi, compare the address with the label, and allow the browser’s local-network prompt. eero and Google Nest Wifi are set up in their apps. If a mesh node will not connect, pair it beside the primary, then move it to a spot that still hears the primary. If Wi-Fi is slow, run a speed test and a room test. If a computer wired to the primary node is already slow, another node will not fix the ISP link. For double NAT, change either the ISP gateway or this system, not both, using the model guide.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <li><Link className="font-medium text-[#00866A]" href="/speed-test">Speed test</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/network-health">Network health</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/dns-speed-test">DNS timing</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/ping-test">Latency</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/jitter-test">Jitter</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/packet-loss-test">Request loss</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/wifi-speed-test">Wi-Fi speed test</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/internet-troubleshooter">Internet troubleshooter</Link></li>
          <li><Link className="font-medium text-[#00866A]" href="/mesh-wifi/troubleshooter">Mesh troubleshooter</Link></li>
        </ul>
      </div>
    </section>
  );
}
