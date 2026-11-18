import { articles as sampleArticles, type Article } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";

type ArticleRow = {
  id: string; slug: string; title: string; excerpt: string; content: Article["sections"];
  image_url: string | null; image_alt: string | null; seo_title: string | null; seo_description: string | null;
  published_at: string | null; created_at: string; category: { name: string } | { name: string }[] | null;
  author: { display_name: string | null } | { display_name: string | null }[] | null;
};

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function mapRow(row: ArticleRow): Article {
  const category = one(row.category);
  const author = one(row.author);
  const sections = Array.isArray(row.content) ? row.content : [];
  const words = sections.flatMap((section) => section.paragraphs ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  return {
    slug: row.slug, title: row.title, excerpt: row.excerpt, category: category?.name ?? "Technology",
    author: author?.display_name || "PaulNova Editorial",
    publishedAt: row.published_at ?? row.created_at,
    readTime: `${Math.max(1, Math.ceil(words / 220))} min read`,
    imageUrl: row.image_url ?? undefined, imageAlt: row.image_alt ?? undefined,
    seoTitle: row.seo_title || row.title, seoDescription: row.seo_description || row.excerpt, sections
  };
}

export async function getPublicArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("articles")
      .select("id,slug,title,excerpt,content,image_url,image_alt,seo_title,seo_description,published_at,created_at,category:categories(name),author:profiles(display_name)")
      .eq("status", "published").not("published_at", "is", null).lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as ArticleRow[]).map(mapRow);
  } catch (error) {
    console.error("PaulNova public article query failed; using starter articles.", error);
    return sampleArticles;
  }
}

export async function getPublicArticle(slug: string): Promise<Article | undefined> {
  const articles = await getPublicArticles();
  return articles.find((article) => article.slug === slug);
}
