import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";

const categorySlugs = ["technology", "artificial-intelligence", "business-money", "education-careers"];
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...categorySlugs.map((slug) => ({ url: `${base}/category/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((article) => ({ url: `${base}/articles/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "monthly" as const, priority: 0.7 }))
  ];
}
