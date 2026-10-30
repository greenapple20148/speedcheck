"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const KEY = "speedcheck_consent_v1";

/**
 * Lightweight consent scaffolding for analytics/ads.
 * Replace with a CMP (e.g. IAB TCF) before enabling AdSense in regulated regions.
 */
export function ConsentBanner() {
  const adsOn = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";
  const analyticsOn = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!adsOn && !analyticsOn) return;
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [adsOn, analyticsOn]);

  if (!visible) return null;

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
    window.dispatchEvent(
      new CustomEvent("speedcheck:consent", { detail: { value } }),
    );
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie and advertising consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-soft backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          We use privacy-conscious analytics and optional advertising cookies when enabled. See our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => decide("rejected")} className="rounded-full">
            Reject
          </Button>
          <Button
            onClick={() => decide("accepted")}
            className="rounded-full bg-primary hover:bg-primary-hover"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
