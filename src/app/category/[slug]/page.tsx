import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPublicArticles } from "@/lib/content";
import AdSlot from "@/components/AdSlot";
import SiteLogo from "@/components/SiteLogo";

const categories = [
  { slug: "technology", name: "Technology", description: "Clear guides to useful apps, software, devices and the digital tools shaping everyday life." },
  { slug: "artificial-intelligence", name: "Artificial Intelligence", description: "Understand AI, explore practical tools and learn how intelligent systems are changing work and life." },
  { slug: "business-money", name: "Business & Money", description: "Ideas for digital business, independent work, money and building opportunities in a connected world." },
  { slug: "education-careers", name: "Education & Careers", description: "Build relevant skills, discover learning paths and prepare for a changing world of work." },
  { slug: "blogging-class", name: "Blogging Class", description: "Practical lessons on starting a blog, writing useful articles, SEO, audience growth, monetisation and building a sustainable online publication." }
];
const matches: Record<string, string[]> = { technology: ["Technology"], "artificial-intelligence": ["Artificial Intelligence"], "business-money": ["Business & Money"], "education-careers": ["Education & Careers"], "blogging-class": ["Blogging Class"] };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export function generateStaticParams() {
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Category not found" };

  // Keep an empty course hub out of search results until at least one lesson is public.
  const publicArticles = await getPublicArticles();
  const hasPublishedArticles = publicArticles.some((article) => matches[slug]?.includes(article.category));

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/category/${slug}` },
    ...(!hasPublishedArticles && slug === "blogging-class" ? { robots: { index: false, follow: true } } : {})
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageValue = "1" } = await searchParams;
  const parsedPage = Number.parseInt(pageValue, 10);
  const requestedPage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const articles = await getPublicArticles();
  const items = articles.filter((article) => matches[slug]?.includes(article.category))
    .sort((a, b) => slug === "blogging-class" ? new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime() : 0);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(requestedPage, pageCount);
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white">
      <div className="container flex h-[76px] items-center justify-between">
        <SiteLogo />
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16} /> Home</Link>
      </div>
    </header>
    <div className="container"><AdSlot placement="category_banner" /></div>
    <section className="container py-14 md:py-20">
      <p className="eyebrow">Explore a topic</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-[#101828] md:text-6xl">{category.name}</h1>
      <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{category.description}</p>

      {slug === "technology" && <div className="mt-7 max-w-3xl space-y-4 text-sm leading-7 text-slate-600">
        <p>Technology choices affect cost, privacy, security and everyday productivity. Before installing an app or buying a device, check who makes it, what permissions it requests, whether it receives security updates and how you can export your data. Compare the features you will actually use instead of choosing a tool only because it is popular.</p>
        <p>PaulNova's technology coverage focuses on practical decisions: setting up devices, choosing useful software, protecting personal information and solving common digital problems. We aim to explain trade-offs in plain language and point readers to official product documentation when settings or requirements change.</p>
        <p>If you are troubleshooting a device, start with the manufacturer's support guidance and avoid downloads from unfamiliar websites. For software, review privacy settings, renewal costs and account-recovery options before relying on it for important work.</p>
        <p>For readers using phones and limited data plans, practical technology choices also include file size, offline access, battery use, storage requirements and whether a service works reliably on a slower connection. Test important tools on the device you actually use before paying for a subscription or moving essential work into a new platform.</p>
        <p>When learning a new tool, start with one task and use the provider's official documentation. Test unfamiliar features with sample information rather than private customer records, and keep a copy of important files before changing platforms. If you are preparing for clients or employers, a <Link href="/articles/build-professional-portfolio-website-without-coding" className="font-semibold text-[#5148e5] underline underline-offset-4">professional portfolio website</Link> can help demonstrate the practical work you can do.</p>
      </div>}

      {slug === "blogging-class" && <div className="mt-7 max-w-3xl space-y-4 rounded-2xl border border-violet-100 bg-white p-6 text-sm leading-7 text-slate-600 md:p-8">
        <h2 className="text-xl font-extrabold text-slate-900">Learn to build a blog step by step</h2>
        <p>Blogging involves much more than publishing posts. A useful blog starts with a clear audience and subject, answers real questions, makes information easy to navigate and gives readers a reason to return. This learning section is being organised as a practical path for beginners who want to understand the process from the foundations onward.</p>
        <p>Topics include choosing a niche and domain, understanding hosting and publishing platforms, planning and writing helpful articles, using images responsibly, learning keyword research and search engine optimisation, and improving a site's structure and reader experience.</p>
        <p>The wider learning path also explores content planning, promotion, analytics, audience development, monetisation options, website security and long-term publishing strategy. The emphasis is on practical decisions, trustworthy information and sustainable growth—not quick traffic or guaranteed income claims.</p>
        <p>Lessons will appear here as they are made available. Until then, you can explore our published beginner guide to <Link href="/articles/how-to-start-a-blog-in-nigeria-step-by-step" className="font-semibold text-[#5148e5] underline underline-offset-4">starting a blog in Nigeria</Link>.</p>
      </div>}

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.length ? visibleItems.map((article) => <Link key={article.slug} href={`/articles/${article.slug}`} className="group rounded-2xl border border-slate-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#635bff]">{category.name}</span>
          <h2 className="mt-4 text-xl font-extrabold leading-snug text-slate-900 group-hover:text-[#635bff]">{article.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{article.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#635bff]">Read article <ArrowRight size={14} /></span>
        </Link>) : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500 md:col-span-2 lg:col-span-3">New lessons for this topic are being prepared. Explore the published beginner guide linked above in the meantime.</div>}
      </div>

      {items.length > pageSize && <nav aria-label="Category pages" className="mt-8 flex items-center justify-between">
        <Link aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none text-sm text-slate-300" : "text-sm font-bold text-[#635bff]"} href={`/category/${slug}?page=${currentPage - 1}`}>← Previous</Link>
        <span className="text-xs text-slate-400">Page {currentPage} of {pageCount}</span>
        <Link aria-disabled={currentPage === pageCount} className={currentPage === pageCount ? "pointer-events-none text-sm text-slate-300" : "text-sm font-bold text-[#635bff]"} href={`/category/${slug}?page=${currentPage + 1}`}>Next →</Link>
      </nav>}
    </section>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-600">© {new Date().getFullYear()} PaulNova · Technology. Intelligence. Opportunities.</footer>
  </main>;
}
