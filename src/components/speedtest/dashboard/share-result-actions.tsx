"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ShareResultActionsProps {
  shareUrl: string | null;
}

export function ShareResultActions({ shareUrl }: ShareResultActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!shareUrl) return null;

  const absolute =
    typeof window !== "undefined"
      ? `${window.location.origin}${shareUrl}`
      : shareUrl;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] lg:justify-start">
      <Link
        href={shareUrl}
        className="inline-flex items-center gap-1.5 rounded-sm font-medium text-[#218C77] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#218C77]"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Share results
      </Link>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#218C77]"
      >
        <Copy className="h-4 w-4" aria-hidden />
        {copied ? "Copied" : "Copy result link"}
      </button>
    </div>
  );
}
