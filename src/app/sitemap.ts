import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";
import { ISPS } from "@/content/isps";
import { LOCATIONS } from "@/content/locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/internet-speed-test",
    "/wifi-speed-test",
    "/upload-speed-test",
    "/ping-test",
    "/jitter-test",
    "/results/history",
    "/tools/mbps-to-mbs",
    "/guides/why-is-my-internet-slow",
    "/guides/what-is-good-internet-speed",
    "/guides/how-to-improve-wifi-speed",
    "/privacy",
    "/terms",
    "/affiliate-disclosure",
  ];

  const ispPaths = ISPS.filter((i) => i.indexed).map((i) => `/isp/${i.slug}`);
  const locationPaths = LOCATIONS.filter((l) => l.indexed).map(
    (l) => `/locations/${l.stateSlug}/${l.citySlug}`,
  );

  return [...staticPaths, ...ispPaths, ...locationPaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
