import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/bookmarks", "/search", "/newsletter/unsubscribe"] }],
    sitemap: `${base}/sitemap.xml`
  };
}
