import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  return [{ url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
}
