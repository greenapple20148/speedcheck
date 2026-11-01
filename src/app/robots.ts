import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/history"],
        disallow: ["/api/", "/admin/", "/results/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
