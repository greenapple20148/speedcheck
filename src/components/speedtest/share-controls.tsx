"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";

export function ShareControls({
  resultId,
  isPublic,
  shareId,
}: {
  resultId: string;
  isPublic: boolean;
  shareId: string | null;
}) {
  const [publicState, setPublic] = useState(isPublic);
  const [link, setLink] = useState(shareId ? `/results/${shareId}` : "");
  const [copied, setCopied] = useState(false);

  const makePublic = async () => {
    const res = await fetch(`/api/results/${resultId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makePublic: true }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setPublic(true);
    const url = `${window.location.origin}/results/${data.shareId || data.id}`;
    setLink(url);
    trackEvent("speed_test_shared", { resultId });
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    trackEvent("speed_test_shared", { resultId, method: "copy" });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
      <h2 className="font-heading font-semibold text-foreground">Share</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Results are private by default. Opt in to create a shareable link.
      </p>
      {!publicState ? (
        <Button onClick={makePublic} className="mt-3 rounded-full bg-primary hover:bg-primary-hover">
          Make result public
        </Button>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={link}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <Button variant="outline" onClick={copy} className="rounded-full">
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      )}
    </div>
  );
}
