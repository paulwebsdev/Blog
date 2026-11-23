import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPublicArticle, getPublicArticles } from "@/lib/content";
import { BookmarkButton, ShareArticle } from "@/components/ArticleActions";
import { createClient } from "@/lib/supabase/server";
import AdSlot from "@/components/AdSlot";
import SiteLogo from "@/components/SiteLogo";

type Props = { params: Promise<{ slug: string }> };

function renderLinkedParagraph(paragraph: string) {
  const parts = paragraph.split(/(https?:\/\/[^\s<>"']+)/g);
  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part;
    let href = part;
    let trailing = "";
    while (/[.,;:!?)]$/.test(href)) {
      trailing = href.slice(-1) + trailing;
      href = href.slice(0, -1);
    }
    try {
      const parsed = new URL(href);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return part;
      return <Fragment key={index}><a href={parsed.toString()} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#5148e5] underline decoration-violet-200 underline-offset-4 hover:decoration-[#5148e5]">{href}</a>{trailing}</Fragment>;
    } catch {
      return part;
    }
  });
}
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) return { title: "Article not found" };
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  const articleUrl = new URL(`/articles/${article.slug}`, base).toString();
  const socialImage = article.imageUrl ? new URL(article.imageUrl, base).toString() : undefined;
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: articleUrl },
    openGraph: {
      type: "article",
      url: articleUrl,
      siteName: "PaulNova",
      title: article.seoTitle,
      description: article.seoDescription,
      publishedTime: new Date(article.publishedAt).toISOString(),
      authors: [article.author],
      images: socialImage ? [{ url: socialImage, alt: article.imageAlt || article.title }] : []
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title: article.seoTitle,
      description: article.seoDescription,
      images: socialImage ? [socialImage] : []
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const allArticles = await getPublicArticles();
  const article = allArticles.find((item) => item.slug === slug);
  if (!article) notFound();
  const currentTagSlugs = new Set((article.tags ?? []).map((tag) => tag.slug));
  const related = allArticles
    .filter((item) => item.slug !== article.slug)
    .map((item) => {
      const sharedTags = (item.tags ?? []).filter((tag) => currentTagSlugs.has(tag.slug)).length;
      const sameCategory = item.category === article.category;
      return { item, score: sharedTags * 3 + (sameCategory ? 2 : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.item.publishedAt).getTime() - new Date(a.item.publishedAt).getTime())
    .slice(0, 3)
    .map((entry) => entry.item);
  const supabase = await createClient();
  const { data: articleRow } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
  const { data: sponsorship } = articleRow ? await supabase.from("sponsored_posts").select("sponsor_name,disclosure_text").eq("article_id", articleRow.id).eq("status","active").maybeSingle() : {data:null};
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  const categorySlug = article.category === "Artificial Intelligence" ? "artificial-intelligence" : article.category === "Business & Money" ? "business-money" : article.category === "Education & Careers" ? "education-careers" : "technology";
  const breadcrumbData = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: base },
    { "@type": "ListItem", position: 2, name: article.category, item: `${base}/category/${categorySlug}` },
    { "@type": "ListItem", position: 3, name: article.title, item: `${base}/articles/${article.slug}` }
  ] };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription,
    datePublished: new Date(article.publishedAt).toISOString(),
    dateModified: new Date(article.updatedAt || article.publishedAt).toISOString(),
    author: { "@type": "Organization", name: article.author, url: article.authorSlug ? `${base}/authors/${article.authorSlug}` : base },
    publisher: { "@type": "Organization", name: "PaulNova", url: base },
    inLanguage: "en",
    articleSection: article.category,
    keywords: article.tags?.map((tag) => tag.name),
    wordCount: article.sections.flatMap((section) => section.paragraphs ?? []).join(" ").split(/\s+/).filter(Boolean).length,
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/articles/${article.slug}` },
    image: article.imageUrl ? [article.imageUrl] : undefined,
    citation: article.sources?.map((source) => source.url)
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData).replace(/</g, "\\u003c") }} />
      <header className="border-b border-slate-100">
        <div className="container flex h-[76px] items-center justify-between">
          <SiteLogo/>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Back to home</Link>
        </div>
      </header>
      <article className="container max-w-3xl py-12 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-[#635bff]">Home</Link><span>/</span><Link href={"/category/" + categorySlug} className="hover:text-[#635bff]">{article.category}</Link><span>/</span><span className="max-w-[260px] truncate text-slate-600" aria-current="page">{article.title}</span></nav>
        {sponsorship && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-extrabold">Sponsored content · {sponsorship.sponsor_name}</p><p className="mt-1 leading-6">{sponsorship.disclosure_text}</p></div>}
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[#101828] md:text-6xl">{article.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-500">{article.excerpt}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-8 text-xs text-slate-400">
          {article.authorSlug ? <Link href={`/authors/${article.authorSlug}`} className="font-semibold text-slate-700 hover:text-[#635bff]">{article.author}</Link> : <span className="font-semibold text-slate-700">{article.author}</span>}<span>·</span>
          <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</time>{article.updatedAt && new Date(article.updatedAt).getTime() > new Date(article.publishedAt).getTime() && <><span>·</span><span>Updated <time dateTime={article.updatedAt}>{new Date(article.updatedAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}</time></span></>}<span>·</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={13}/>{article.readTime}</span><div className="flex flex-wrap gap-2 sm:ml-auto"><BookmarkButton slug={article.slug}/><ShareArticle title={article.title}/></div>
        </div>
        {article.imageUrl && <img src={article.imageUrl} alt={article.imageAlt || article.title} className="mt-9 max-h-[440px] w-full rounded-2xl object-cover" loading="eager" />}
        {article.tags?.length ? <div className="mt-5 flex flex-wrap gap-2" aria-label="Article topics">{article.tags.map((tag) => <Link key={tag.slug} href={`/tags/${tag.slug}`} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-[#5148e5] hover:bg-violet-100">#{tag.name}</Link>)}</div> : null}
        <AdSlot placement="in_article"/>
        <div className="article-content mt-10">
          {article.sections.map((section) => <section key={section.heading} className="mb-9">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#101828]">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4 text-base leading-8 text-slate-600">{renderLinkedParagraph(paragraph)}</p>)}
          </section>)}
        </div>
        {article.sources?.length ? <section className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 p-6" aria-labelledby="article-sources-heading">
          <h2 id="article-sources-heading" className="text-lg font-extrabold text-slate-900">Sources and further reading</h2>
          <ul className="mt-4 space-y-3">{article.sources.map((source) => <li key={source.url} className="text-sm leading-6"><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#5148e5] underline decoration-violet-200 underline-offset-4 hover:decoration-[#5148e5]">{source.title}</a><span className="ml-2 text-xs text-slate-400">External resource</span></li>)}</ul>
        </section> : null}
        {article.correctionNote && <aside className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-label="Article correction or update"><h2 className="text-sm font-extrabold text-amber-950">Correction / update</h2><p className="mt-2 text-sm leading-6 text-amber-900">{article.correctionNote}</p></aside>}
        {related.length > 0 && <section className="mt-14"><div><h2 className="text-2xl font-black text-[#101828]">You may also like</h2><p className="mt-2 text-sm text-slate-500">More PaulNova guides selected by topic and category.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{related.map((item) => <Link key={item.slug} href={"/articles/" + item.slug} className="group rounded-2xl border border-slate-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"><span className="text-[10px] font-bold uppercase tracking-widest text-[#635bff]">{item.category}</span><h3 className="mt-2 font-extrabold text-slate-900 group-hover:text-[#5148e5]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{item.excerpt}</p><span className="mt-4 inline-flex text-sm font-bold text-[#5148e5]">Read article <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">→</span></span></Link>)}</div></section>}
      </article>
    </main>
  );
}
