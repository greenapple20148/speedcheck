"use client";

export function RouterConnectionHelp({
  opened,
  appOnly,
}: {
  opened: boolean;
  appOnly: boolean;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-border bg-[var(--surface-subtle)] px-3 py-3" aria-label="If the router page does not open">
      <h3 className="text-sm font-semibold text-foreground">If the admin page does not open</h3>
      {opened && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          A new tab was requested. That does not connect MySpeedGauge to the router. If the tab did not appear, allow pop-ups for this site and choose Open admin page again.
        </p>
      )}
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>Join the Wi-Fi or Ethernet network that this router provides, then try the address again. The browser may ask before it allows a page to open a device on your local network.</li>
        <li>Compare the address with the sticker on the router. A nearby network can use a different gateway.</li>
        <li>If the browser says the connection is not private or cannot be reached, try the same address with https://.</li>
        {appOnly && <li>This product family is managed in its official app. A browser page is not the normal way to sign in.</li>}
        <li>Type the router password only on the router page or in the official app. MySpeedGauge does not have a password field.</li>
      </ul>
    </section>
  );
}
