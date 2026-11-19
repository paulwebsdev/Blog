import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteArticle } from "@/app/admin/actions";
import ArticleEditorForm from "../editor-form";
type Props = { params: Promise<{id:string}> };
export const dynamic = "force-dynamic";
export default async function EditArticlePage({params}:Props) {
  const {id}=await params; const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/admin/login");
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(!profile || !["admin","editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  const [{data:article},{data:categories}]=await Promise.all([
    supabase.from("articles").select("*").eq("id",id).maybeSingle(),
    supabase.from("categories").select("id,name").eq("is_active",true).order("name")
  ]);
  if(!article) notFound();
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header><section className="container max-w-4xl py-10"><p className="eyebrow">Editorial</p><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="mt-2 text-3xl font-black">Edit article</h1><Link href={"/admin/articles/" + article.id + "/preview"} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700">Preview article</Link></div><div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 md:p-8"><ArticleEditorForm categories={categories ?? []} values={{id:article.id,title:article.title,slug:article.slug,excerpt:article.excerpt,category_id:article.category_id ?? "",image_url:article.image_url ?? "",image_alt:article.image_alt ?? "",seo_title:article.seo_title ?? "",seo_description:article.seo_description ?? "",status:article.status,content:article.content}}/><form action={deleteArticle} className="mt-8 border-t border-slate-100 pt-6"><input type="hidden" name="id" value={article.id}/><button className="text-sm font-bold text-rose-600" formAction={deleteArticle}>Delete this article</button></form></div></section></main>;
}
