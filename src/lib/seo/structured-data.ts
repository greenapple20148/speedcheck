import type { FaqItem } from "@/components/seo/faq-section";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/globe.svg"),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Free internet speed test measuring download, upload, ping, and jitter with real network transfers.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function breadcrumbListJsonLd(
  items: Array<{ label: string; href?: string }>,
) {
  const elements = [
    {
      "@type": "ListItem" as const,
      position: 1,
      name: "Home",
      item: absoluteUrl("/"),
    },
    ...items.map((item, index) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
      };
      if (item.href) entry.item = absoluteUrl(item.href);
      return entry;
    }),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
}

export function faqPageJsonLd(faqs: FaqItem[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
  dateModified,
}: {
  headline: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    dateModified,
    url: absoluteUrl(path),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function webApplicationJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
