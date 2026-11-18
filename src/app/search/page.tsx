import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { getPublicArticles } from "@/lib/content";

export const metadata: Metadata = { title: "Search", description: "Search PaulNova articles on technology, AI, digital business, education and careers.", robots: { index: false, follow: true } };
type Props = { searchParams: Promise<{ q?: string }> };
export const dynamic = "force-dynamic";
export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const articles = await getPublicArticles();
  const results = query ? articles.filter((article) => [article.title, article.excerpt, article.category, ...article.sections.flatMap((section) => [section.heading, ...section.paragraphs])].join(" ").toLowerCase().includes(query.toLowerCase())) : [];
  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Home</Link></div></header>
    <section className="container max-w-4xl py-14 md:py-20"><p className="eyebrow">Discover more</p><h1 className="mt-3 text-4xl font-black tracking-tight text-[#101828] md:text-5xl">Search PaulNova</h1><p className="mt-4 text-sm leading-6 text-slate-500">Find practical insights across technology, artificial intelligence, business, education and careers.</p>
      <form action="/search" method="get" className="mt-8 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><label className="sr-only" htmlFor="q">Search articles</label><input id="q" name="q" defaultValue={query} placeholder="Try “AI tools” or “digital skills”" className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-400"/><button className="inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 text-sm font-bold text-white hover:bg-[#5148e5]"><Search size={16}/> Search</button></form>
      {query ? <div className="mt-10"><p className="mb-5 text-sm text-slate-500">{results.length} result{results.length === 1 ? "" : "s"} for <strong className="text-slate-800">“{query}”</strong></p><div className="grid gap-4">{results.length ? results.map((article) => <Link key={article.slug} href={`/articles/${article.slug}`} className="group rounded-2xl border border-slate-100 bg-white p-6 hover:border-violet-100 hover:shadow-lg"><span className="text-[10px] font-bold uppercase tracking-widest text-[#635bff]">{article.category}</span><h2 className="mt-2 text-xl font-extrabold text-slate-900 group-hover:text-[#635bff]">{article.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#635bff]">Read article <ArrowRight size={14}/></span></Link>) : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">No matching articles yet. Try a broader search term.</div>}</div></div> : <div className="mt-10 rounded-2xl bg-white p-7 text-sm text-slate-500">Enter a keyword to search the current PaulNova article library.</div>}
    </section>
  </main>;
}
