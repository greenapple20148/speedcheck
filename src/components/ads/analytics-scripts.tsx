"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { adsActive } from "@/lib/ads/config";
import { CONSENT_STORAGE_KEY } from "@/components/ads/consent-banner";

function consentAccepted(): boolean {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adsEnabled = adsActive();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const read = () => setAllowed(consentAccepted());
    read();
    window.addEventListener("speedcheck:consent", read);
    return () => window.removeEventListener("speedcheck:consent", read);
  }, []);

  if (!allowed) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
      {adsEnabled && adsClient ? (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      ) : null}
    </>
  );
}
