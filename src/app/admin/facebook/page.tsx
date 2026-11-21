import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FacebookShareCard from "../facebook-share-card";

export const dynamic = "force-dynamic";

export default async function FacebookPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");

  const { data: articles, error } = await supabase.from("articles")
    .select("id,title,excerpt,slug,image_url,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(500);

  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-[76px] items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header>
    <section className="container max-w-4xl py-10">
      <p className="eyebrow">Social publishing</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Facebook post library</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Every published PaulNova article has a ready-made Facebook caption here. Copy it and share it to your personal profile whenever you like.</p>
      <div className="mt-7 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <span className="text-sm font-semibold text-slate-700">Published articles</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">{articles?.length ?? 0}</span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Could not load published articles. Please refresh the page.</p>}
      {!error && !articles?.length && <p className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No published articles yet. Once an article is published, its Facebook post will appear here.</p>}
      <div className="mt-6 space-y-5">
        {articles?.map((article) => <div key={article.id} className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-semibold text-slate-400">{article.published_at ? new Date(article.published_at).toLocaleDateString("en-NG", {day:"numeric",month:"short",year:"numeric"}) : "Published"}</p><h2 className="mt-1 text-base font-extrabold text-slate-900">{article.title}</h2></div>
            <Link href={"/articles/" + article.slug} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#635bff]">View article ↗</Link>
          </div>
          <FacebookShareCard title={article.title} excerpt={article.excerpt ?? ""} slug={article.slug} imageUrl={article.image_url} />
        </div>)}
      </div>
    </section>
  </main>;
}
