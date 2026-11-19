import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsRefresh from "@/components/AnalyticsRefresh";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ range?: string }> };
const ranges = [{ value: "today", label: "Today", days: 1 }, { value: "7", label: "7 days", days: 7 }, { value: "30", label: "30 days", days: 30 }, { value: "90", label: "90 days", days: 90 }];

export default async function AnalyticsStudio({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin?error=admin-required");
  const params = await searchParams;
  const selected = ranges.find((r) => r.value === params.range) || ranges[2];
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  if (selected.value !== "today") since.setDate(since.getDate() - selected.days + 1);
  const sinceIso = since.toISOString();

  const [{ data: publishedArticles }] = await Promise.all([supabase.from("articles").select("slug,title,category:categories(name)").eq("status", "published").order("published_at", { ascending: false })]);

  const allRows: Array<{ page_path: string; page_title: string | null; article_slug: string | null; traffic_source: string; session_id: string; created_at: string; utm_campaign: string | null; event_type: string; event_value: string | null; duration_seconds: number | null }> = [];
  const batchSize = 1000;
  for (let offset = 0; offset < 10000; offset += batchSize) {
    const { data, error } = await supabase.from("page_views")
      .select("page_path,page_title,article_slug,traffic_source,session_id,created_at,utm_campaign,event_type,event_value,duration_seconds")
      .gte("created_at", sinceIso).order("created_at", { ascending: false }).range(offset, offset + batchSize - 1);
    if (error || !data?.length) break;
    allRows.push(...data);
    if (data.length < batchSize) break;
  }

  const rows = allRows.filter((r) => r.event_type === "page_view");
  const engagementRows = allRows.filter((r) => r.event_type !== "page_view");
  const uniqueVisitors = new Set(rows.map((r) => r.session_id)).size;
  const articleRows = rows.filter((r) => r.article_slug);
  const aggregate = (key: (r: typeof rows[number]) => string) => {
    const counts = new Map<string, number>();
    rows.forEach((row) => { const value = key(row) || "Other"; counts.set(value, (counts.get(value) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };
  const sources = aggregate((r) => r.traffic_source);
  const pages = aggregate((r) => r.page_path);
  const articles = aggregate((r) => r.article_slug || "");
  const dayCount = selected.days === 1 ? 1 : Math.min(selected.days, 14);
  const days = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (dayCount - 1 - i));
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString("en", { month: "short", day: "numeric" }), count: rows.filter((r) => r.created_at.slice(0, 10) === key).length };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const maxSource = Math.max(1, ...sources.map((s) => s[1]));
  const maxArticle = Math.max(1, ...articles.map((a) => a[1]));
  const titleFor = (slug: string) => publishedArticles?.find((a) => a.slug === slug)?.title || articleRows.find((r) => r.article_slug === slug)?.page_title || slug;
  const articlePerformance = (publishedArticles ?? []).map((article) => {
    const views = articleRows.filter((r) => r.article_slug === article.slug);
    const sessions = new Set(views.map((r) => r.session_id)).size;
    const articleEvents = engagementRows.filter((r) => r.article_slug === article.slug);
    const articleShares = articleEvents.filter((r) => r.event_type === "share_click").length;
    const articleBookmarks = articleEvents.filter((r) => r.event_type === "bookmark_add").length;
    const articleOutbound = articleEvents.filter((r) => r.event_type === "outbound_click").length;
    const articleReading = articleEvents.filter((r) => r.event_type === "reading_time" && (r.duration_seconds || 0) > 0);
    const avgReading = articleReading.length ? Math.round(articleReading.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / articleReading.length) : 0;
    const sourceCounts = new Map<string, number>();
    views.forEach((r) => sourceCounts.set(r.traffic_source || "Other", (sourceCounts.get(r.traffic_source || "Other") || 0) + 1));
    const topSource = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const lastViewed = views.reduce<string | null>((latest, r) => !latest || r.created_at > latest ? r.created_at : latest, null);
    const categoryValue = article.category as unknown as { name: string } | { name: string }[] | null;
    const categoryName = Array.isArray(categoryValue) ? categoryValue[0]?.name : categoryValue?.name;
    return { slug: article.slug, title: article.title, category: categoryName || "Uncategorised", views: views.length, sessions, topSource, lastViewed, shares: articleShares, bookmarks: articleBookmarks, outbound: articleOutbound, avgReading };
  }).sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));
  const categoryPerformance = new Map<string, number>();
  articlePerformance.forEach((article) => categoryPerformance.set(article.category, (categoryPerformance.get(article.category) || 0) + article.views));
  const categoryRows = [...categoryPerformance.entries()].sort((a, b) => b[1] - a[1]);
  const nonArticleViews = rows.length - articleRows.length;
  const campaignRows = aggregate((r) => r.utm_campaign || "").filter(([name]) => name !== "Other");
  const shares = engagementRows.filter((r) => r.event_type === "share_click");
  const outboundClicks = engagementRows.filter((r) => r.event_type === "outbound_click");
  const bookmarkAdds = engagementRows.filter((r) => r.event_type === "bookmark_add");
  const readingRows = engagementRows.filter((r) => r.event_type === "reading_time" && (r.duration_seconds || 0) > 0);
  const averageReadingSeconds = readingRows.length ? Math.round(readingRows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / readingRows.length) : 0;
  const deepReads = engagementRows.filter((r) => r.event_type === "scroll_depth" && r.event_value === "90").length;

  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> <span className="ml-2 text-xs text-slate-400">STUDIO</span></Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header>
    <section className="container max-w-7xl py-9">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Audience intelligence</p><h1 className="mt-2 text-3xl font-black text-slate-900">Analytics studio</h1><p className="mt-2 text-sm text-slate-500">Consented first-party page views, article readership and traffic sources.</p></div>
        <div className="flex flex-col items-end gap-3"><AnalyticsRefresh/><nav aria-label="Analytics date range" className="flex flex-wrap gap-2">{ranges.map((r) => <Link key={r.value} href={"/admin/analytics?range=" + r.value} className={"rounded-full px-4 py-2 text-xs font-bold " + (selected.value === r.value ? "bg-[#635bff] text-white" : "border border-slate-200 bg-white text-slate-600")}>{r.label}</Link>)}</nav></div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Page views" value={rows.length.toLocaleString()}/><Metric label="Sessions (estimated)" value={uniqueVisitors.toLocaleString()}/><Metric label="Article views" value={articleRows.length.toLocaleString()}/><Metric label="Pages viewed" value={new Set(rows.map((r) => r.page_path)).size.toLocaleString()}/></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Article shares" value={shares.length.toLocaleString()}/><Metric label="Bookmarks added" value={bookmarkAdds.length.toLocaleString()}/><Metric label="Outbound clicks" value={outboundClicks.length.toLocaleString()}/><Metric label="Avg. engaged reading time" value={averageReadingSeconds ? Math.floor(averageReadingSeconds / 60) + "m " + (averageReadingSeconds % 60) + "s" : "—"}/><Metric label="90% article reads" value={deepReads.toLocaleString()}/></div>
      {rows.length >= 10000 && <p className="mt-3 text-xs text-amber-700">Showing the latest 10,000 records in this date range. Narrow the date range for a more complete breakdown.</p>}
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Traffic over time</h2><p className="mt-1 text-xs text-slate-400">Daily page views · most recent {days.length} days</p><div className="mt-6 flex h-52 items-end gap-2">{days.map((d) => <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-slate-500">{d.count || ""}</span><div title={d.count + " views"} className="w-full rounded-t-md bg-[#635bff]" style={{ height: Math.max(3, d.count / maxDay * 150) + "px" }}/><span className="text-[9px] text-slate-400">{d.label}</span></div>)}</div></section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Where visitors come from</h2><p className="mt-1 text-xs text-slate-400">Classified from referrers and campaign tags</p><div className="mt-5 space-y-4">{sources.slice(0, 8).map(([name, count]) => <div key={name}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">{name}</span><span className="text-slate-500">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#635bff]" style={{ width: (count / maxSource * 100) + "%" }}/></div></div>)}{!sources.length && <Empty/>}</div></section>
      </div>
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-extrabold text-slate-900">Every published article</h2><p className="mt-1 text-xs text-slate-400">Individual performance for the selected period, including articles with zero recorded views.</p></div><span className="text-xs font-semibold text-slate-400">{articlePerformance.length} published articles</span></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400"><th className="px-3 py-3 font-semibold">Article</th><th className="px-3 py-3 font-semibold">Category</th><th className="px-3 py-3 font-semibold">Views</th><th className="px-3 py-3 font-semibold">Est. sessions</th><th className="px-3 py-3 font-semibold">Top source</th><th className="px-3 py-3 font-semibold">Last viewed</th><th className="px-3 py-3 font-semibold">Shares</th><th className="px-3 py-3 font-semibold">Bookmarks</th><th className="px-3 py-3 font-semibold">Outbound</th><th className="px-3 py-3 font-semibold">Avg. read</th></tr></thead><tbody>{articlePerformance.map((article) => <tr key={article.slug} className="border-b border-slate-50"><td className="px-3 py-3"><Link href={"/articles/" + article.slug} target="_blank" className="font-bold text-slate-800 hover:text-[#635bff]">{article.title}</Link><p className="mt-1 text-[10px] text-slate-400">/{article.slug}</p></td><td className="px-3 py-3 text-slate-500">{article.category}</td><td className="px-3 py-3 font-extrabold text-slate-800">{article.views.toLocaleString()}</td><td className="px-3 py-3 text-slate-600">{article.sessions.toLocaleString()}</td><td className="px-3 py-3 text-slate-600">{article.topSource}</td><td className="px-3 py-3 text-slate-500">{article.lastViewed ? new Date(article.lastViewed).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }) : "No views yet"}</td><td className="px-3 py-3 text-slate-600">{article.shares}</td><td className="px-3 py-3 text-slate-600">{article.bookmarks}</td><td className="px-3 py-3 text-slate-600">{article.outbound}</td><td className="px-3 py-3 text-slate-600">{article.avgReading ? Math.floor(article.avgReading / 60) + "m " + (article.avgReading % 60) + "s" : "—"}</td></tr>)}{!articlePerformance.length && <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">No published articles to analyse yet.</td></tr>}</tbody></table></div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Most-read articles</h2><div className="mt-4 space-y-4">{articles.slice(0, 10).map(([slug, count]) => <div key={slug}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{titleFor(slug)}</p><Link href={"/articles/" + slug} target="_blank" className="text-xs text-[#635bff]">/{slug} ↗</Link></div><span className="shrink-0 text-sm font-extrabold text-slate-700">{count} views</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#635bff]" style={{ width: (count / maxArticle * 100) + "%" }}/></div></div>)}{!articles.length && <Empty/>}</div></section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Top pages</h2><div className="mt-4 space-y-3">{pages.slice(0, 10).map(([path, count]) => <div key={path} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3"><Link href={path} target="_blank" className="truncate text-sm font-semibold text-slate-700 hover:text-[#635bff]">{path}</Link><span className="shrink-0 text-xs font-bold text-slate-500">{count}</span></div>)}{!pages.length && <Empty/>}</div></section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Category readership</h2><p className="mt-1 text-xs text-slate-400">Article views grouped by the article's category.</p><div className="mt-5 space-y-3">{categoryRows.map(([name, count]) => <div key={name} className="flex items-center justify-between border-b border-slate-50 pb-3"><span className="text-sm font-semibold text-slate-700">{name}</span><span className="text-sm font-extrabold text-slate-800">{count.toLocaleString()} views</span></div>)}{!categoryRows.length && <Empty/>}</div></section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 md:p-6"><h2 className="font-extrabold text-slate-900">Website overview</h2><p className="mt-1 text-xs text-slate-400">Additional breakdowns for the selected period.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Non-article page views</p><p className="mt-1 text-2xl font-black text-slate-900">{nonArticleViews.toLocaleString()}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Campaign-tagged views</p><p className="mt-1 text-2xl font-black text-slate-900">{campaignRows.reduce((sum, row) => sum + row[1], 0).toLocaleString()}</p></div></div><div className="mt-4 space-y-2">{campaignRows.slice(0, 5).map(([name, count]) => <div key={name} className="flex items-center justify-between text-xs"><span className="truncate text-slate-600">{name}</span><strong className="text-slate-800">{count}</strong></div>)}{!campaignRows.length && <p className="text-xs text-slate-400">No UTM campaign tags recorded in this period.</p>}</div></section>
      </div>
      <p className="mt-6 text-xs leading-5 text-slate-400">Visitor counts are estimates based on a first-party random session identifier. Analytics runs only after a visitor accepts optional analytics cookies. Reading time is measured only while the article tab is visible. Bookmarks are stored on the visitor’s device; the dashboard counts consented bookmark actions, not a cross-device saved list. Ad blockers, cleared browser storage and declined consent can reduce counts. No IP addresses or raw personal identifiers are stored. For cross-site attribution and deeper acquisition reports, connect a Google Analytics 4 Measurement ID.</p>
    </section>
  </main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div>; }
function Empty() { return <p className="py-5 text-sm text-slate-400">No analytics recorded in this period yet. Accept analytics on the public website to begin collecting visits.</p>; }
