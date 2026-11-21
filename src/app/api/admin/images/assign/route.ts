import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CommonsPage = {
  title: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    mime?: string;
    extmetadata?: Record<string, { value?: string }>;
  }>;
};

function cleanQuery(title: string, excerpt: string) {
  const combined = (title + " " + excerpt).replace(/[^\p{L}\p{N}\s-]/gu, " ");
  const stop = new Set(["how","to","the","a","an","and","or","for","with","without","from","your","their","into","using","use","guide","complete","simple","best","what","why","when","where","can","will","should"]);
  const words = combined.toLowerCase().split(/\s+/).filter((word) => word.length > 2 && !stop.has(word));
  return [...new Set(words)].slice(0, 7).join(" ");
}

function isReusablePublicDomain(meta: Record<string, { value?: string }> | undefined) {
  const license = (meta?.LicenseShortName?.value || "").toLowerCase();
  const usage = (meta?.UsageTerms?.value || "").toLowerCase();
  return license.includes("cc0") || license.includes("public domain") || usage.includes("public domain");
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const { data: articles, error } = await supabase.from("articles")
    .select("id,title,excerpt,sources").eq("status", "draft")
    .or("image_url.is.null,image_url.eq.")
    .order("created_at", { ascending: true }).limit(8);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles?.length) return NextResponse.json({ done: true, assigned: 0, skipped: 0, remaining: 0 });

  let assigned = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const query = cleanQuery(article.title, article.excerpt || "");
      const api = new URL("https://commons.wikimedia.org/w/api.php");
      api.searchParams.set("action", "query");
      api.searchParams.set("generator", "search");
      api.searchParams.set("gsrsearch", "filetype:bitmap " + query);
      api.searchParams.set("gsrnamespace", "6");
      api.searchParams.set("gsrlimit", "10");
      api.searchParams.set("prop", "imageinfo");
      api.searchParams.set("iiprop", "url|extmetadata");
      api.searchParams.set("iiurlwidth", "1200");
      api.searchParams.set("format", "json");
      const response = await fetch(api.toString(), {
        headers: { "User-Agent": "PaulNovaEditorialBot/1.0 (https://paulnova.name.ng; contact.paulnova@gmail.com)" },
        cache: "no-store",
        signal: AbortSignal.timeout(18000)
      });
      if (!response.ok) throw new Error("Wikimedia search returned " + response.status);
      const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } };
      const pages = Object.values(payload.query?.pages || {});
      const candidate = pages.find((page) => {
        const info = page.imageinfo?.[0];
        return Boolean(info?.url && info.mime && ["image/jpeg", "image/png", "image/webp"].includes(info.mime) && isReusablePublicDomain(info.extmetadata));
      });
      const info = candidate?.imageinfo?.[0];
      if (!candidate || !info?.url) { skipped++; continue; }

      const fileTitle = candidate.title.replace(/^File:/, "");
      const filePage = "https://commons.wikimedia.org/wiki/" + encodeURIComponent(candidate.title.replace(/ /g, "_"));
      const license = info.extmetadata?.LicenseShortName?.value || "Public domain";
      const existingSources = Array.isArray(article.sources) ? article.sources : [];
      const sources = [...existingSources, { title: "Featured image: " + fileTitle + " (" + license + ")", url: filePage }];

      const { data: saved, error: saveError } = await supabase.from("articles").update({
        image_url: info.thumburl || info.url,
        image_alt: article.title + " — illustrative featured image",
        sources,
        updated_at: new Date().toISOString()
      }).eq("id", article.id).eq("status", "draft").or("image_url.is.null,image_url.eq.").select("id").maybeSingle();
      if (saveError) throw saveError;
      if (saved) assigned++; else skipped++;
    } catch (err) {
      errors.push(article.title + ": " + String(err).slice(0, 180));
      skipped++;
    }
  }

  const { count: remaining } = await supabase.from("articles").select("id", { count: "exact", head: true })
    .eq("status", "draft").or("image_url.is.null,image_url.eq.");
  return NextResponse.json({ done: !remaining, assigned, skipped, remaining: remaining ?? 0, errors });
}
