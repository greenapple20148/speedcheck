"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function GuideViewed({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent("guide_viewed", { slug });
  }, [slug]);
  return null;
}
