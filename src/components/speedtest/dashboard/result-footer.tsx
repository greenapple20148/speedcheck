"use client";

import Link from "next/link";
import { useState } from "react";
import { formatServerDisplay } from "@/lib/network/display-fields";
import type { ClientNetworkInfo, ServerInfo } from "@/types/speedtest";

interface ResultFooterProps {
  shareUrl: string | null;
  network: ClientNetworkInfo | null;
  server: ServerInfo | null;
  visible: boolean;
}

export function ResultFooter({ shareUrl, network, server, visible }: ResultFooterProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const city = network?.city;
  const isp = network?.isp;
  const serverLabel = formatServerDisplay(server);
  const metaParts: string[] = [];
  if (city && city !== "Unavailable") metaParts.push(city);
  else if (server?.location && !/unavailable/i.test(server.location)) {
    metaParts.push(server.location);
  }
  if (isp && isp !== "Unavailable") metaParts.push(isp);
  else if (serverLabel && !/unavailable/i.test(serverLabel)) {
    metaParts.push(serverLabel);
  }
  const metaLine =
    metaParts.length > 0 ? `Tested against ${metaParts.join(" · ")}` : null;

  const copy = async () => {
    if (!shareUrl) return;
    const absolute = `${window.location.origin}${shareUrl}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-[var(--card-border)] pt-3">
      {metaLine && (
        <p className="text-[13px] text-muted-foreground">{metaLine}</p>
      )}
      {shareUrl && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={shareUrl}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-[var(--accent-teal)] px-5 text-sm font-semibold text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2"
          >
            Share results
          </Link>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--card-border)] bg-card px-5 text-sm font-semibold text-foreground hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
