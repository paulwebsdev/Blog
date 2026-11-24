import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CopyBloggingClassPost from "./copy-post-button";
import ConfirmDeletePostForm from "./confirm-delete-form";
import { saveBloggingClassFacebookPost, setBloggingClassFacebookPostStatus } from "./actions";

export const dynamic = "force-dynamic";

const types = [
  ["lesson_announcement", "Lesson announcement"],
  ["blogging_tip", "Blogging tip"],
  ["step_by_step", "Step-by-step tutorial"],
  ["engagement", "Engagement / discussion"],
  ["promotion", "Class promotion"],
  ["reel_script", "Reels / video script"]
];

export default async function BloggingClassFacebookLibrary({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");

  const { data: posts, error } = await supabase.from("blogging_class_facebook_posts")
    .select("id,lesson_number,lesson_title,post_type,post_title,post_text,article_url,image_url,status,created_at,updated_at")
    .order("lesson_number", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const readyCount = posts?.filter((post) => post.status === "ready").length ?? 0;
  const draftCount = posts?.filter((post) => post.status === "draft").length ?? 0;
  const archivedCount = posts?.filter((post) => post.status === "archived").length ?? 0;

  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex min-h-[76px] items-center justify-between gap-4"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><div className="flex items-center gap-4"><Link href="/admin/facebook" className="text-xs font-semibold text-blue-700">Main Facebook library</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></div></header>
    <section className="container max-w-5xl py-10">
      <p className="eyebrow">Separate social content workspace</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Blogging Class Facebook library</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">This library is separate from the main PaulNova Facebook library. Keep lesson announcements, practical blogging tips, tutorials, discussion prompts, promotions and short-video scripts organised here. Posts are saved as drafts until you mark them ready.</p>
      {params.saved === "1" && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Your Blogging Class Facebook post has been saved.</p>}
      {params.deleted === "1" && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">The post has been deleted.</p>}
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><Stat label="Ready to share" value={readyCount}/><Stat label="Drafts" value={draftCount}/><Stat label="Archived" value={archivedCount}/></div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Could not load the Blogging Class Facebook library. Please refresh.</p>}
      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 md:p-7">
        <p className="eyebrow">Create a post</p><h2 className="mt-1 text-xl font-black text-slate-900">Add a Facebook post</h2>
        <form action={saveBloggingClassFacebookPost} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">Lesson number (optional, 1–82)<input name="lesson_number" type="number" min="1" max="82" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" placeholder="e.g. 01"/></label>
          <label className="text-xs font-bold text-slate-600">Lesson title<input required name="lesson_title" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" placeholder="e.g. What Is Blogging?"/></label>
          <label className="text-xs font-bold text-slate-600">Post type<select name="post_type" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal">{types.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600">Post title<input required name="post_title" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" placeholder="A clear title for this Facebook post"/></label>
          <label className="text-xs font-bold text-slate-600 md:col-span-2">Facebook caption / post text<textarea required name="post_text" rows={7} minLength={20} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal leading-6" placeholder="Write a useful, friendly post in simple language. Add a practical tip or a question to encourage discussion."/></label>
          <label className="text-xs font-bold text-slate-600">Lesson article URL (optional)<input name="article_url" type="url" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" placeholder="https://paulnova.name.ng/articles/..."/></label>
          <label className="text-xs font-bold text-slate-600">Image URL (optional)<input name="image_url" type="url" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal" placeholder="https://... (Blogger-hosted image URL)"/></label>
          <label className="text-xs font-bold text-slate-600">Initial status<select name="status" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal"><option value="draft">Draft</option><option value="ready">Ready to share</option></select></label>
          <div className="flex items-end"><button className="rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white hover:bg-[#5148e5]">Save Facebook post</button></div>
        </form>
      </section>
      <section className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Your saved content</p><h2 className="mt-1 text-xl font-black text-slate-900">Blogging Class posts</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">{posts?.length ?? 0} posts</span></div>
        {!error && !posts?.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-sm leading-6 text-slate-500">Your new library is ready. Add the first lesson announcement or blogging tip above. Nothing from the main Facebook library has been moved or changed.</div>}
        <div className="space-y-4">
          {posts?.map((post) => <article key={post.id} className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-wider text-[#635bff]">{post.lesson_number ? "Lesson " + String(post.lesson_number).padStart(2,"0") : "General Blogging Class"} · {types.find(([value]) => value === post.post_type)?.[1] ?? post.post_type}</p><h3 className="mt-1 text-lg font-black text-slate-900">{post.post_title}</h3><p className="mt-1 text-xs text-slate-400">{post.lesson_title}</p></div><span className={"rounded-full px-3 py-1 text-[10px] font-extrabold uppercase " + (post.status === "ready" ? "bg-emerald-50 text-emerald-700" : post.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700")}>{post.status === "ready" ? "Ready to share" : post.status}</span></div>
            {post.image_url && <img src={post.image_url} alt="" className="mt-4 max-h-64 w-full rounded-xl object-cover"/>}
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{post.post_text}</p>
            {post.article_url && <Link href={post.article_url} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-xs font-semibold text-[#635bff]">Open linked lesson ↗</Link>}
            <div className="mt-4 flex flex-wrap items-center gap-2"><CopyBloggingClassPost text={post.post_text} articleUrl={post.article_url}/><details className="group"><summary className="cursor-pointer rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Edit post</summary><form action={saveBloggingClassFacebookPost} className="mt-3 grid min-w-[min(80vw,600px)] gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2"><input type="hidden" name="id" value={post.id}/><label className="text-xs font-bold text-slate-600">Lesson number<input name="lesson_number" type="number" min="1" max="82" defaultValue={post.lesson_number ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-bold text-slate-600">Lesson title<input required name="lesson_title" defaultValue={post.lesson_title} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-bold text-slate-600">Post type<select name="post_type" defaultValue={post.post_type} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal">{types.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Post title<input required name="post_title" defaultValue={post.post_title} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-bold text-slate-600 md:col-span-2">Post text<textarea required name="post_text" rows={6} defaultValue={post.post_text} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-6"/></label><label className="text-xs font-bold text-slate-600">Article URL<input name="article_url" type="url" defaultValue={post.article_url ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-bold text-slate-600">Image URL<input name="image_url" type="url" defaultValue={post.image_url ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-bold text-slate-600">Status<select name="status" defaultValue={post.status} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"><option value="draft">Draft</option><option value="ready">Ready to share</option><option value="archived">Archived</option></select></label><div className="flex items-end"><button className="rounded-full bg-[#635bff] px-5 py-2.5 text-xs font-bold text-white">Save changes</button></div></form></details>
              <form action={setBloggingClassFacebookPostStatus}><input type="hidden" name="id" value={post.id}/><input type="hidden" name="status" value={post.status === "ready" ? "draft" : "ready"}/><button className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">{post.status === "ready" ? "Move to drafts" : "Mark ready"}</button></form>
              <ConfirmDeletePostForm id={post.id}/>
            </div>
          </article>)}
        </div>
      </section>
    </section>
  </main>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div>;
}
