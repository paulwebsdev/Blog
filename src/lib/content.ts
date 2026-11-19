import { articles as sampleArticles, type Article } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";

type TagRow = { name: string; slug: string };
type ArticleRow = {
  id: string; slug: string; title: string; excerpt: string; content: Article["sections"];
  image_url: string | null; image_alt: string | null; seo_title: string | null; seo_description: string | null;
  published_at: string | null; created_at: string; updated_at: string; view_count: number | null;
  category: { name: string } | { name: string }[] | null;
  author: { display_name: string | null; author_slug: string | null } | { display_name: string | null; author_slug: string | null }[] | null;
  article_tags?: { tag: TagRow | TagRow[] | null }[];
};

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function mapRow(row: ArticleRow): Article {
  const category = one(row.category);
  const author = one(row.author);
  const sections = Array.isArray(row.content) ? row.content : [];
  const words = sections.flatMap((section) => section.paragraphs ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  const tags = (row.article_tags ?? []).map((item) => one(item.tag)).filter((tag): tag is TagRow => Boolean(tag));
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt, category: category?.name ?? "Technology",
    author: author?.display_name || "PaulNova Editorial", authorSlug: author?.author_slug ?? undefined,
    tags, views: Number(row.view_count ?? 0),
    publishedAt: row.published_at ?? row.created_at, updatedAt: row.updated_at,
    readTime: `${Math.max(1, Math.ceil(words / 220))} min read`,
    imageUrl: row.image_url ?? undefined, imageAlt: row.image_alt ?? undefined,
    seoTitle: row.seo_title || row.title, seoDescription: row.seo_description || row.excerpt, sections
  };
}

const articleSelect = "id,slug,title,excerpt,content,image_url,image_alt,seo_title,seo_description,published_at,created_at,updated_at,view_count,category:categories(name),author:profiles(display_name,author_slug),article_tags(tag:tags(name,slug))";
function publicQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("articles").select(articleSelect)
    .in("status", ["published", "scheduled"]).not("published_at", "is", null).lte("published_at", new Date().toISOString());
}

export async function getPublicArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await publicQuery(supabase).order("published_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as ArticleRow[]).map(mapRow);
  } catch (error) {
    console.error("PaulNova public article query failed; using starter articles.", error);
    return sampleArticles;
  }
}

export async function searchPublicArticles(query: string): Promise<Article[]> {
  const term = query.trim().slice(0, 120);
  if (!term) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await publicQuery(supabase)
      .textSearch("search_document", term, { type: "websearch", config: "english" })
      .order("published_at", { ascending: false }).limit(100);
    if (error) throw error;
    return ((data ?? []) as unknown as ArticleRow[]).map(mapRow);
  } catch (error) {
    console.error("PaulNova full-text search failed; using local fallback.", error);
    const local = await getPublicArticles();
    const needle = term.toLowerCase();
    return local.filter((article) => [article.title, article.excerpt, article.category, ...(article.tags ?? []).map((tag) => tag.name), ...article.sections.flatMap((section) => [section.heading, ...section.paragraphs])].join(" ").toLowerCase().includes(needle));
  }
}

export async function getPublicArticle(slug: string): Promise<Article | undefined> {
  const articles = await getPublicArticles();
  return articles.find((article) => article.slug === slug);
}
