import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPublicArticle } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.seoDescription,
      publishedTime: new Date(article.publishedAt).toISOString(),
      authors: [article.author],
      images: article.imageUrl ? [{ url: article.imageUrl, alt: article.imageAlt || article.title }] : []
    },
    twitter: {
      card: article.imageUrl ? "summary_large_image" : "summary",
      title: article.seoTitle,
      description: article.seoDescription,
      images: article.imageUrl ? [article.imageUrl] : []
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublicArticle(slug);
  if (!article) notFound();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription,
    datePublished: new Date(article.publishedAt).toISOString(),
    dateModified: new Date(article.publishedAt).toISOString(),
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "PaulNova", url: base },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/articles/${article.slug}` },
    image: article.imageUrl ? [article.imageUrl] : undefined
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="border-b border-slate-100">
        <div className="container flex h-[76px] items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Back to home</Link>
        </div>
      </header>
      <article className="container max-w-3xl py-12 md:py-20">
        <Link href="/#topics" className="text-xs font-bold uppercase tracking-widest text-[#635bff]">{article.category}</Link>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[#101828] md:text-6xl">{article.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-500">{article.excerpt}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-8 text-xs text-slate-400">
          <span className="font-semibold text-slate-700">{article.author}</span><span>·</span>
          <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</time><span>·</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={13}/>{article.readTime}</span>
        </div>
        {article.imageUrl && <img src={article.imageUrl} alt={article.imageAlt || article.title} className="mt-9 max-h-[440px] w-full rounded-2xl object-cover" loading="eager" />}
        <div className="article-content mt-10">
          {article.sections.map((section) => <section key={section.heading} className="mb-9">
            <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#101828]">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4 text-base leading-8 text-slate-600">{paragraph}</p>)}
          </section>)}
        </div>
        <div className="mt-12 rounded-2xl bg-[#f7f8fc] p-7">
          <p className="text-sm font-bold text-[#635bff]">More from PaulNova</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Practical perspectives on technology, AI, digital business and opportunities.</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-bold text-[#635bff]">Explore more stories →</Link>
        </div>
      </article>
    </main>
  );
}
