import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsScripts } from "@/components/ads/analytics-scripts";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = buildMetadata({
  title: "MySpeedGauge — How Fast Is Your Internet?",
  description:
    "Test download, upload, ping, and jitter in seconds with real network transfers. Free, privacy-conscious speed testing.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <AnalyticsScripts />
        <Analytics />
      </body>
    </html>
  );
}
