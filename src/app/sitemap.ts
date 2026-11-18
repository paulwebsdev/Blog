import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...articles.map((article) => ({
      url: `${base}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
