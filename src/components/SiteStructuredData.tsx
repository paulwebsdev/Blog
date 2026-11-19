import { createClient } from "@/lib/supabase/server";

export default async function SiteStructuredData() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  let sameAs: string[] = [];
  let logoUrl: string | undefined;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("social_links,logo_url").eq("id", 1).maybeSingle();
    const links = (data?.social_links ?? {}) as Record<string, string>;
    sameAs = Object.values(links).filter((value) => typeof value === "string" && value.startsWith("https://"));
    logoUrl = data?.logo_url || undefined;
  } catch { /* Structured data can still describe the site if settings are unavailable. */ }

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": base + "/#organization",
    "name": "PaulNova",
    "url": base,
    "description": "An independent global publication covering technology, artificial intelligence, digital business, education and careers.",
    ...(logoUrl ? { "logo": { "@type": "ImageObject", "url": logoUrl }, "image": logoUrl } : {}),
    ...(sameAs.length ? { "sameAs": sameAs } : {})
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": base + "/#website",
    "url": base,
    "name": "PaulNova",
    "alternateName": "PaulNova — Technology. Intelligence. Opportunities.",
    "publisher": { "@id": base + "/#organization" },
    "inLanguage": "en"
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website]).replace(/</g, "\\u003c") }} />;
}
