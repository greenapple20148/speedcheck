import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";
import { ISPS } from "@/content/isps";
import { LOCATIONS } from "@/content/locations";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/speed-test",
    "/internet-speed-test",
    "/wifi-speed-test",
    "/upload-speed-test",
    "/ping-test",
    "/jitter-test",
    "/bufferbloat-test",
    "/packet-loss-test",
    "/connection-stability-test",
    "/gaming-speed-test",
    "/streaming-speed-test",
    "/video-call-test",
    "/dns-speed-test",
    "/internet-troubleshooter",
    "/why-is-my-internet-slow",
    "/wifi-vs-ethernet",
    "/slow-upload-speed",
    "/high-ping-fix",
    "/download-time-calculator",
    "/upload-time-calculator",
    "/mbps-to-mbs",
    "/internet-speed-calculator",
    "/history",
    "/diagnostics",
    "/guides",
    "/guides/why-is-my-internet-slow",
    "/guides/what-is-good-internet-speed",
    "/guides/how-to-improve-wifi-speed",
    "/guides/what-is-bufferbloat",
    "/guides/what-is-latency",
    "/guides/why-upload-is-slower-than-download",
    "/guides/how-to-reduce-ping-while-gaming",
    "/guides/how-fast-is-100-mbps",
    "/methodology",
    "/about",
    "/contact",
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
