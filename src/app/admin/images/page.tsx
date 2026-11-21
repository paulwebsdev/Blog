import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImageLibraryRunner from "./image-library-runner";

export const dynamic = "force-dynamic";

export default async function AdminImagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  const [{ count: missing }, { count: existing }] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft").or("image_url.is.null,image_url.eq."),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft").not("image_url", "is", null).neq("image_url", "")
  ]);
  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header>
    <section className="container max-w-3xl py-10">
      <p className="eyebrow">Image management</p>
      <div className="mt-3 mb-6 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-xs text-slate-400">Drafts missing images</p><p className="mt-2 text-3xl font-black">{missing ?? 0}</p></div><div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-xs text-slate-400">Drafts with images</p><p className="mt-2 text-3xl font-black">{existing ?? 0}</p></div></div>
      <ImageLibraryRunner />
    </section>
  </main>;
}
