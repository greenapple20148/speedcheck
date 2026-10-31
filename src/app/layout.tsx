import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsScripts } from "@/components/ads/analytics-scripts";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { buildMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
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
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
