import type { MetadataRoute } from "next";
import { getPublicArticles } from "@/lib/content";

export const dynamic = "force-dynamic";
const categorySlugs = ["technology", "artificial-intelligence", "business-money", "education-careers"];
const staticPages = ["about", "contact", "privacy", "terms", "editorial-policy", "advertise", "faq", "disclaimer", "newsletter"];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  const articles = await getPublicArticles();
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...staticPages.map((slug) => ({ url: `${base}/${slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...categorySlugs.map((slug) => ({ url: `${base}/category/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((article) => ({ url: `${base}/articles/${article.slug}`, lastModified: new Date(article.updatedAt || article.publishedAt), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...[...new Set(articles.map((article) => article.authorSlug).filter((slug): slug is string => Boolean(slug)))].map((slug) => ({ url: `${base}/authors/${slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...[...new Set(articles.flatMap((article) => (article.tags ?? []).map((tag) => tag.slug)))].map((slug) => ({ url: `${base}/tags/${slug}`, changeFrequency: "weekly" as const, priority: 0.5 }))
  ];
}
