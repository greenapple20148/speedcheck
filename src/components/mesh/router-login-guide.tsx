"use client";

const GUIDES = [
  {
    id: "windows",
    title: "Windows",
    steps: [
      "Open Settings, then Network & internet, then the Wi-Fi or Ethernet connection you are using.",
      "Open the hardware properties for that connection, or open Command Prompt and run ipconfig.",
      "Copy the Default Gateway value into the address field.",
    ],
  },
  {
    id: "macos",
    title: "macOS",
    steps: [
      "Open System Settings, then Network, then the active Wi-Fi or Ethernet service.",
      "Open Details, then TCP/IP.",
      "Copy the Router value into the address field.",
    ],
  },
  {
    id: "ios",
    title: "iOS",
    steps: [
      "Open Settings, then Wi-Fi.",
      "Tap the info button beside the connected network.",
      "Copy the Router value into the address field.",
    ],
  },
  {
    id: "android",
    title: "Android",
    steps: [
      "Open Settings, then Network & internet, then Internet. The names differ by phone.",
      "Tap the gear beside the connected Wi-Fi network.",
      "Look for Gateway or Router. If it is missing, use the address printed on the router or the vendor’s app.",
    ],
  },
] as const;

export function RouterLoginGuide() {
  return (
    <section className="space-y-2" aria-label="Find the default gateway">
      <h3 className="text-sm font-semibold text-foreground">Find the default gateway</h3>
      <div className="space-y-2">
        {GUIDES.map((guide) => (
          <details key={guide.id} className="rounded-xl border border-border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">{guide.title}</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
              {guide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  );
}
