import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArticleEditorForm from "../editor-form";
export const dynamic = "force-dynamic";
export default async function NewArticlePage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const query=await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if (!profile || !["admin","editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  const { data: categories } = await supabase.from("categories").select("id,name").eq("is_active",true).order("name");
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header><section className="container max-w-4xl py-10"><p className="eyebrow">Editorial</p><h1 className="mt-2 text-3xl font-black">Create an article</h1><p className="mb-8 mt-2 text-sm text-slate-500">Write, optimise and publish a new PaulNova story.</p><div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8">{query.error==="image-alt-required"&&<p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Please add descriptive alt text for the featured image, then save again. The image URL has not been saved yet.</p>}<ArticleEditorForm categories={categories ?? []}/></div></section></main>;
}
