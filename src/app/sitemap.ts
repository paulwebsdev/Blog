import type { MetadataRoute } from "next";
import { getPublicArticles } from "@/lib/content";

export const dynamic = "force-dynamic";
const categorySlugs = ["technology", "artificial-intelligence", "business-money", "education-careers"];
const staticPages = ["about", "contact", "privacy", "terms", "editorial-policy", "advertise", "faq", "write-for-us", "disclaimer", "newsletter"];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  const articles = await getPublicArticles();
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...staticPages.map((slug) => ({ url: `${base}/${slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...categorySlugs.map((slug) => ({ url: `${base}/category/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((article) => ({ url: `${base}/articles/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "monthly" as const, priority: 0.7 }))
  ];
}
