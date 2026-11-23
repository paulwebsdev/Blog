import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicArticles } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articles = await getPublicArticles();
  const tag = articles.flatMap((article) => article.tags ?? []).find((item) => item.slug === slug);
  return tag ? {
    title: `#${tag.name}`,
    description: `Explore PaulNova guides about ${tag.name}, with practical explainers, useful tools, safety tips and ideas you can apply.`,
    robots: { index: false, follow: true }
  } : { title: "Topic not found", robots: { index: false, follow: true } };
}
export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const articles = await getPublicArticles();
  const tag = articles.flatMap((article) => article.tags ?? []).find((item) => item.slug === slug);
  if (!tag) notFound();
  const matches = articles.filter((article) => article.tags?.some((item) => item.slug === slug));
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center"><Link href="/" className="text-2xl font-black">Paul<span className="text-[#635bff]">Nova</span></Link></div></header><section className="container max-w-4xl py-14"><p className="eyebrow">Explore a topic</p><h1 className="mt-3 text-4xl font-black text-slate-900">#{tag.name}</h1><p className="mt-3 text-sm text-slate-500">Articles, explainers and useful guides related to {tag.name}.</p><div className="mt-9 grid gap-4">{matches.map((article)=><Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-2xl border border-slate-100 bg-white p-6 hover:border-violet-200"><span className="text-xs font-bold text-[#635bff]">{article.category}</span><h2 className="mt-2 text-xl font-extrabold text-slate-900">{article.title}</h2><p className="mt-2 text-sm text-slate-500">{article.excerpt}</p></Link>)}</div></section></main>;
}
