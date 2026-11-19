import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublicArticles } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name,bio").eq("author_slug", slug).maybeSingle();
  return data ? { title: data.display_name || "Author", description: data.bio || `Articles and insights by ${data.display_name || "the PaulNova editorial team"}.` } : { title: "Author not found" };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: author } = await supabase.from("profiles").select("display_name,bio,avatar_url,website_url").eq("author_slug", slug).maybeSingle();
  if (!author) notFound();
  const articles = (await getPublicArticles()).filter((item) => item.authorSlug === slug);
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/" className="text-2xl font-black">Paul<span className="text-[#635bff]">Nova</span></Link><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Home</Link></div></header><section className="container max-w-4xl py-14"><div className="rounded-3xl border border-slate-100 bg-white p-8"><div className="flex items-center gap-5">{author.avatar_url ? <img src={author.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover"/> : <div className="grid h-20 w-20 place-items-center rounded-full bg-violet-100 text-2xl font-black text-[#635bff]">{(author.display_name || "P").slice(0,1).toUpperCase()}</div>}<div><p className="eyebrow">PaulNova author</p><h1 className="mt-2 text-3xl font-black text-slate-900">{author.display_name || "PaulNova Editorial"}</h1></div></div><p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600">{author.bio || "Sharing practical perspectives on technology, artificial intelligence, digital business, education and career opportunities."}</p>{author.website_url && <a href={author.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-[#635bff]">Author website ↗</a>}</div><h2 className="mt-12 text-2xl font-black text-slate-900">Articles by {author.display_name || "this author"}</h2><div className="mt-5 grid gap-4">{articles.length ? articles.map((article)=><Link key={article.slug} href={`/articles/${article.slug}`} className="rounded-2xl border border-slate-100 bg-white p-6 hover:border-violet-200"><span className="text-xs font-bold text-[#635bff]">{article.category}</span><h3 className="mt-2 text-xl font-extrabold text-slate-900">{article.title}</h3><p className="mt-2 text-sm text-slate-500">{article.excerpt}</p></Link>) : <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">No published articles are available for this author yet.</p>}</div></section></main>;
}
