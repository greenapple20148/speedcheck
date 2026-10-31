import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:43123";
const SITE_NAME = "MySpeedGauge";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function buildMetadata({
  title,
  description,
  path = "/",
  index = true,
  ogImage,
}: {
  title: string;
  description: string;
  path?: string;
  index?: boolean;
  ogImage?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = ogImage ?? absoluteUrl("/opengraph-image");
  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}

export { SITE_URL, SITE_NAME };
