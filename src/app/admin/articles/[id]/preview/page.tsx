import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
type Props = { params: Promise<{ id: string }> };
export default async function ArticlePreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  const { data: article } = await supabase.from("articles").select("*,category:categories(name),author:profiles(display_name)").eq("id", id).maybeSingle();
  if (!article) notFound();
  return <main className="min-h-screen bg-white"><div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-900">Private preview · Not visible to the public <Link href={"/admin/articles/" + id} className="ml-3 underline">Back to editor</Link></div><article className="container max-w-3xl py-12 md:py-20"><p className="text-xs font-bold uppercase tracking-widest text-[#635bff]">{article.category?.name ?? "PaulNova"}</p><h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">{article.title}</h1><p className="mt-6 text-lg leading-8 text-slate-500">{article.excerpt}</p><p className="mt-6 border-b border-slate-100 pb-6 text-xs text-slate-400">{article.author?.display_name || "PaulNova Editorial"} · {article.status}</p>{article.image_url && <img src={article.image_url} alt={article.image_alt || article.title} className="mt-8 max-h-[440px] w-full rounded-2xl object-cover"/>}<div className="mt-10 space-y-9">{(Array.isArray(article.content) ? article.content : []).map((section: {heading:string;paragraphs:string[]}, index:number) => <section key={index}><h2 className="mb-4 text-2xl font-extrabold text-slate-900">{section.heading}</h2>{section.paragraphs.map((paragraph:string,i:number)=><p key={i} className="mb-4 text-base leading-8 text-slate-600">{paragraph}</p>)}</section>)}</div><Link href={"/admin/articles/" + id} className="mt-12 inline-flex rounded-full bg-[#635bff] px-5 py-3 text-sm font-bold text-white">Return to editor</Link></article></main>;
}
