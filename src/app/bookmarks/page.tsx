import Link from "next/link";
import { getPublicArticles } from "@/lib/content";
import { BookmarksList } from "@/components/ArticleActions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Saved articles", description: "Your saved PaulNova reading list.", robots: { index: false, follow: true } };
export default async function BookmarksPage() {
  const articles = await getPublicArticles();
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/" className="text-2xl font-black text-slate-900">Paul<span className="text-[#635bff]">Nova</span></Link><Link href="/" className="text-sm font-semibold text-slate-500">← Home</Link></div></header><section className="container max-w-5xl py-14"><p className="eyebrow">Your reading list</p><h1 className="mt-3 text-4xl font-black text-slate-900">Saved articles</h1><p className="mt-3 text-sm text-slate-500">Bookmarks are stored on this device in this browser.</p><BookmarksList articles={articles.map(({slug,title,excerpt,category})=>({slug,title,excerpt,category}))}/></section></main>;
}
