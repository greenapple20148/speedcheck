import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnalyticsScripts } from "@/components/ads/analytics-scripts";
import { ConsentBanner } from "@/components/ads/consent-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/context/theme-context";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "optional",
});

export const metadata: Metadata = buildMetadata({
  title: "MySpeedGauge — How Fast Is Your Internet?",
  description:
    "Test download, upload, ping, and jitter in seconds with real network transfers. Free, privacy-conscious speed testing.",
  path: "/",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
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
      className={`${dmSans.variable} ${playfair.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cm-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`,
          }}
        />
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
