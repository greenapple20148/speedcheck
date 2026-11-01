import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsScripts } from "@/components/ads/analytics-scripts";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeBootScript } from "@/components/layout/theme-boot-script";
import { ThemeProvider } from "@/context/theme-context";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = buildMetadata({
  title: "Internet Speed Test — Check Download, Upload & Ping | MySpeedGauge",
  description:
    "Measure download, upload, latency, jitter, and latency under load with real transfers. Free, no account required.",
  path: "/",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1020" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
          <SiteHeader />
          <main className="min-h-[70vh]">{children}</main>
          <SiteFooter />
          <ConsentBanner />
          <AnalyticsScripts />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
