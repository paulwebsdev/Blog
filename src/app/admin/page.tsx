import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut, createCategory, toggleCategory, publishArticleNow, unpublishArticle } from "@/app/admin/actions";
export const dynamic = "force-dynamic";
export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ publication?: string; email?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin","editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  const [{ count: total }, { count: published }, { count: drafts }, { data: articles }, { data: categories }, { count: subscriberCount }] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status","published"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status","draft"),
    supabase.from("articles").select("id,title,slug,status,updated_at,image_url").order("updated_at",{ascending:false}).limit(30),
    profile.role === "admin" ? supabase.from("categories").select("id,name,slug,description,is_active").order("name") : supabase.from("categories").select("id,name,slug,description,is_active").eq("is_active",true).order("name"),
    profile.role === "admin" ? supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("status","active") : Promise.resolve({count:0})
  ]);
  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex min-h-[76px] items-center justify-between gap-4"><Link href="/" className="text-2xl font-black tracking-tight">Paul<span className="text-[#635bff]">Nova</span><span className="ml-3 text-xs font-semibold text-slate-400">STUDIO</span></Link><form action={signOut}><button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Sign out</button></form></div></header>
    <section className="container py-10">
      {params.publication === "published" && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Article published.</strong> {params.email === "notifications-sent" ? "New-post emails were accepted by Resend." : params.email === "no-subscribers" ? "No emails were sent because there are no consented active subscribers yet." : params.email === "notifications-partial" ? "Some subscriber emails could not be sent. Check the notification delivery records before retrying." : params.email === "notifications-not-configured" ? "Email notifications could not start. Check the Resend API key and subscriber access." : "Email notification status was not requested for this save."}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Editorial workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Good to see you, {profile.display_name || "Editor"}.</h1><p className="mt-2 text-sm text-slate-500">Manage stories and keep PaulNova up to date.</p></div><Link href="/admin/articles/new" className="rounded-full bg-[#635bff] px-5 py-3 text-sm font-bold text-white hover:bg-[#5148e5]">＋ New article</Link></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat label="All articles" value={total ?? 0}/><Stat label="Published" value={published ?? 0}/><Stat label="Drafts" value={drafts ?? 0}/></div>
      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Site navigation</p><h2 className="mt-1 text-xl font-black text-slate-900">All pages &amp; dashboard tools</h2><p className="mt-1 text-sm text-slate-500">Quick links to every main public page and the management areas available to your account.</p></div>
          <Link href="/" target="_blank" rel="noreferrer" className="text-xs font-bold text-[#635bff]">View live website ↗</Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Public website pages</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Home","/"],["About","/about"],["Advertise & partnerships","/advertise"],["Bookmarks","/bookmarks"],["Contact","/contact"],["Corrections","/corrections"],["Disclaimer","/disclaimer"],["Editorial policy","/editorial-policy"],["FAQ","/faq"],["Privacy policy","/privacy"],["Search","/search"],["Newsletter subscription","/newsletter"],["Terms of use","/terms"]
              ].map(([label,href])=><Link key={href} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-100 px-3 py-3 text-xs font-semibold text-slate-600 transition hover:border-[#635bff]/40 hover:bg-[#635bff]/5 hover:text-[#5148e5]">{label}<span className="float-right text-slate-300">↗</span></Link>)}
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <h4 className="text-xs font-extrabold text-slate-700">Categories</h4>
              <div className="mt-2 flex flex-wrap gap-2">{categories?.filter((category)=>category.is_active).map((category)=><Link key={category.id} href={"/category/"+category.slug} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#635bff]">{category.name} ↗</Link>)}</div>
              {!categories?.some((category)=>category.is_active)&&<p className="mt-2 text-xs text-slate-400">No active categories yet.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Dashboard &amp; management</h3>
            <div className="mt-3 grid gap-2">
              <DashboardLink href="/admin" title="Dashboard overview" description="Your workspace and recent activity"/>
              <DashboardLink href="/admin/articles/new" title="Create a new article" description="Write, edit and schedule stories"/>
              <DashboardLink href="/admin/author" title="Author profile" description="Manage your public author biography and profile image"/>
              {profile.role==="admin"&&<DashboardLink href="/admin/site-settings" title="Site settings & social profiles" description="Add Facebook and other social links; connect Google Search Console"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/newsletter" title="Newsletter studio" description="Manage subscribers, post notifications and newsletter drafts"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/subscribers" title="Subscribers" description="Review subscriber status and consent"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/backup" title="Backup & data export" description="Download a protected snapshot of PaulNova records"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/analytics" title="Analytics studio" description="Visitors, article views, traffic sources and popular pages"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/monetization" title="Monetization studio" description="Ads, advertisers, sponsors, affiliates and revenue"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/adsense" title="Google AdSense readiness" description="Site checklist, verification, publisher ID and ads.txt setup"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/seo" title="SEO & Google Search visibility" description="Sitemap, indexing guidance and article SEO checks"/>}
              {profile.role==="admin"&&<DashboardLink href="/admin/images" title="Automatic featured images" description="Find public-domain images and add URLs to draft articles"/>}
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 p-3">
              <h4 className="text-xs font-extrabold text-slate-700">Article management</h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">Open any article from the Recent articles list below to edit it or preview its private draft.</p>
            </div>
          </div>
        </div>
      </section>
      <div className="mt-9 grid gap-6 lg:grid-cols-[1.5fr_.8fr]"><section className="overflow-hidden rounded-2xl border border-slate-100 bg-white"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="font-extrabold text-slate-900">Recent articles</h2><Link href="/admin/articles/new" className="text-xs font-bold text-[#635bff]">Create article</Link></div><div className="divide-y divide-slate-100">{articles?.length ? articles.map((article) => <div key={article.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2">{article.status === "draft" && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">NEW DRAFT</span>}{article.status === "draft" && !article.image_url && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">⚠ IMAGE NEEDED</span>}<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">{article.status}</span></div><p className="truncate text-sm font-bold text-slate-800">{article.title || "Untitled article"}</p><p className="mt-1 text-xs text-slate-400">{article.slug}</p></div><div className="flex shrink-0 flex-wrap items-center gap-3"><Link href={"/admin/articles/" + article.id} className="text-xs font-bold text-[#635bff]">Edit</Link><Link href={"/admin/articles/" + article.id + "/preview"} className="text-xs font-bold text-slate-500">Preview</Link>{article.status === "published" ? <><form action={unpublishArticle}><input type="hidden" name="id" value={article.id}/><button className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">Unpublish</button></form><Link href={"/articles/" + article.slug} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-500">View ↗</Link></> : article.status === "draft" ? <form action={publishArticleNow}><input type="hidden" name="id" value={article.id}/><button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Publish now</button></form> : <span className="text-xs font-semibold text-slate-400">Scheduled</span>}</div></div>) : <p className="p-6 text-sm text-slate-500">No articles yet. Create your first story.</p>}</div></section>
      <aside className="space-y-6"><section className="rounded-2xl border border-slate-100 bg-white p-5"><h2 className="font-extrabold text-slate-900">Categories</h2><div className="mt-4 space-y-3">{categories?.map((category) => <div key={category.id} className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-700">{category.name}</p><p className="text-[11px] text-slate-400">{category.slug}{category.is_active ? "" : " · hidden"}</p></div>{profile.role === "admin" && <form action={toggleCategory}><input type="hidden" name="id" value={category.id}/><input type="hidden" name="is_active" value={String(category.is_active)}/><button className="text-[11px] font-bold text-[#635bff]">{category.is_active ? "Deactivate" : "Activate"}</button></form>}</div>)}</div>{profile.role === "admin" && <form action={createCategory} className="mt-5 border-t border-slate-100 pt-5"><p className="mb-3 text-xs font-bold text-slate-500">Add a category</p><input required name="name" placeholder="Category name" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/><input name="slug" placeholder="URL slug (optional)" className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/><input name="description" placeholder="Short description" className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/><button className="rounded-full bg-[#635bff] px-4 py-2 text-xs font-bold text-white">Add category</button></form>}</section>
      {profile.role === "admin" && <section className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-extrabold text-slate-900">Newsletter</h2><span className="text-xs text-slate-400">{subscriberCount ?? 0} subscribers</span></div><p className="mt-2 text-sm leading-6 text-slate-500">New article notifications are configured for consented subscribers. Separate newsletter campaigns remain in the newsletter studio.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/admin/newsletter" className="inline-flex rounded-full bg-[#635bff] px-4 py-2.5 text-xs font-bold text-white">Open newsletter studio</Link><Link href="/admin/subscribers" className="inline-flex rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Manage subscribers</Link></div></section>} {profile.role === "admin" && <Link href="/admin/monetization" className="block rounded-2xl bg-[#17143d] p-5 text-sm font-bold text-white hover:bg-[#25205a]">Monetization studio <span className="float-right">→</span><span className="mt-2 block text-xs font-normal text-slate-300">Advertisements, sponsors, affiliate links and revenue</span></Link>}</aside></div>
    </section>
  </main>;
}
function DashboardLink({href,title,description}:{href:string;title:string;description:string}) { return <Link href={href} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 transition hover:border-[#635bff]/40 hover:bg-[#635bff]/5"><span><span className="block text-sm font-bold text-slate-800 group-hover:text-[#5148e5]">{title}</span><span className="mt-1 block text-xs text-slate-400">{description}</span></span><span aria-hidden="true" className="text-slate-300 group-hover:text-[#635bff]">→</span></Link>; }
function Stat({label,value}:{label:string;value:number}) { return <div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div>; }
