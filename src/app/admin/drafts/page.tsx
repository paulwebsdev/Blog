import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publishArticleNow } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
const BLOGGING_CLASS_ID = "b67a8a34-d9be-41bf-aadf-acdfd07e9565";

type Props = { searchParams: Promise<{ q?: string; section?: string }> };

export default async function DraftsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const section = params.section === "blogging-class" ? "blogging-class" : params.section === "other" ? "other" : "all";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");

  let query = supabase.from("articles")
    .select("id,title,slug,excerpt,status,updated_at,category_id,image_url")
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (section === "blogging-class") query = query.eq("category_id", BLOGGING_CLASS_ID);
  if (section === "other") query = query.neq("category_id", BLOGGING_CLASS_ID);
  if (q) query = query.or(`title.ilike.%${q.replace(/[,%()]/g, " ")}%,slug.ilike.%${q.replace(/[,%()]/g, " ")}%,excerpt.ilike.%${q.replace(/[,%()]/g, " ")}%`);
  const [{ data: articles }, { count: allDrafts }, { count: classDrafts }, { count: otherDrafts }, { data: categories }] = await Promise.all([
    query,
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft").eq("category_id", BLOGGING_CLASS_ID),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft").neq("category_id", BLOGGING_CLASS_ID),
    supabase.from("categories").select("id,name")
  ]);
  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const tab = (key: string, label: string, count: number | null) => (
    <Link href={`/admin/drafts?section=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
      className={`rounded-full px-4 py-2.5 text-sm font-bold ${section === key || (key === "all" && section === "all") ? "bg-[#635bff] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#635bff]"}`}>
      {label} <span className="ml-1 opacity-75">({count ?? 0})</span>
    </Link>
  );
  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex min-h-[72px] items-center justify-between gap-3"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> <span className="ml-2 text-xs font-semibold text-slate-400">STUDIO</span></Link><Link href="/admin" className="text-sm font-bold text-[#635bff]">← Dashboard</Link></div></header>
    <section className="container py-9">
      <p className="eyebrow">Editorial workspace</p><h1 className="mt-2 text-3xl font-black text-slate-900">Draft articles</h1>
      <p className="mt-2 text-sm text-slate-500">Find drafts quickly and keep Blogging Class lessons separate from the rest of PaulNova.</p>
      <div className="mt-6 flex flex-wrap gap-2">{tab("all","All drafts",allDrafts)}{tab("blogging-class","Blogging Class",classDrafts)}{tab("other","Other articles",otherDrafts)}</div>
      <form method="get" action="/admin/drafts" className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="section" value={section}/>
        <input name="q" defaultValue={q} placeholder="Search by article title, slug or excerpt..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#635bff]"/>
        <button className="rounded-xl bg-[#635bff] px-5 py-3 text-sm font-bold text-white">Search drafts</button>
        {q && <Link href={`/admin/drafts?section=${section}`} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-600">Clear</Link>}
      </form>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5"><h2 className="font-extrabold text-slate-900">{section === "blogging-class" ? "Blogging Class drafts" : section === "other" ? "Other article drafts" : "All draft articles"}</h2><span className="text-xs text-slate-400">Showing {articles?.length ?? 0} {q ? "matching " : ""}drafts</span></div>
        <div className="divide-y divide-slate-100">
          {articles?.length ? articles.map((article) => <article key={article.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">Draft</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{categoryNames.get(article.category_id) ?? "Uncategorised"}</span>{!article.image_url && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">Image needed</span>}</div><h3 className="truncate text-sm font-bold text-slate-800">{article.title || "Untitled article"}</h3><p className="mt-1 truncate text-xs text-slate-400">{article.slug}</p><p className="mt-1 text-[11px] text-slate-400">Updated {new Date(article.updated_at).toLocaleDateString("en-GB")}</p></div>
            <div className="flex shrink-0 flex-wrap items-center gap-3"><Link href={`/admin/articles/${article.id}`} className="text-xs font-bold text-[#635bff]">Edit</Link><Link href={`/admin/articles/${article.id}/preview`} className="text-xs font-bold text-slate-500">Preview</Link><form action={publishArticleNow}><input type="hidden" name="id" value={article.id}/><button className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Publish now</button></form></div>
          </article>) : <div className="p-10 text-center"><p className="font-bold text-slate-700">No drafts found</p><p className="mt-1 text-sm text-slate-500">{q ? "Try a different search term or clear the search." : "There are no drafts in this section."}</p></div>}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">This is a viewing and management filter only. It does not move, publish, schedule or delete any articles. Blogging Class remains excluded from automatic publishing.</p>
    </section>
  </main>;
}
