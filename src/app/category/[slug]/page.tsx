import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { articles } from "@/lib/articles";
import { getPublicArticles } from "@/lib/content";

const categories = [
  { slug: "technology", name: "Technology", description: "Clear guides to useful apps, software, devices and the digital tools shaping everyday life." },
  { slug: "artificial-intelligence", name: "Artificial Intelligence", description: "Understand AI, explore practical tools and learn how intelligent systems are changing work and life." },
  { slug: "business-money", name: "Business & Money", description: "Ideas for digital business, independent work, money and building opportunities in a connected world." },
  { slug: "education-careers", name: "Education & Careers", description: "Build relevant skills, discover learning paths and prepare for a changing world of work." }
];
const matches: Record<string, string[]> = {
  technology: ["Technology"],
  "artificial-intelligence": ["Artificial Intelligence"],
  "business-money": ["Business & Money"],
  "education-careers": ["Education & Careers"]
};

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
export function generateStaticParams() { return categories.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return category ? { title: category.name, description: category.description, alternates: { canonical: `/category/${slug}` } } : { title: "Category not found" };
}
export const dynamic = "force-dynamic";
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const articles = await getPublicArticles();
  const items = articles.filter((article) => matches[slug]?.includes(article.category));\n  const pageSize = 12;\n  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));\n  const currentPage = Math.min(page, pageCount);\n  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Home</Link></div></header>
    <section className="container py-14 md:py-20"><p className="eyebrow">Explore a topic</p><h1 className="mt-3 text-4xl font-black tracking-tight text-[#101828] md:text-6xl">{category.name}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">{category.description}</p>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.length ? visibleItems.map((article) => <Link key={article.slug} href={`/articles/${article.slug}`} className="group rounded-2xl border border-slate-100 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"><span className="text-[10px] font-bold uppercase tracking-widest text-[#635bff]">{category.name}</span><h2 className="mt-4 text-xl font-extrabold leading-snug text-slate-900 group-hover:text-[#635bff]">{article.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{article.excerpt}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#635bff]">Read article <ArrowRight size={14}/></span></Link>) : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500 md:col-span-2 lg:col-span-3">New stories for this topic are on the way. Explore the latest articles in the meantime.</div>}</div>
    </section>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} PaulNova · Technology. Intelligence. Opportunities.</footer>
  </main>;
}
