import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Check = { label: string; ready: boolean; detail: string };

export default async function AdSenseReadinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");

  const [{ data: settings }, { data: articles, error: articleError }] = await Promise.all([
    supabase.from("site_settings").select("google_site_verification").eq("id", 1).maybeSingle(),
    supabase.from("articles").select("id,title,image_url,status").eq("status", "published")
  ]);

  const publisherId = process.env.ADSENSE_PUBLISHER_ID?.trim() ?? "";
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
  const adsEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLE === "true";
  const verification = settings?.google_site_verification || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const validPublisher = /^pub-\\d{16}$/.test(publisherId);
  const validClient = /^ca-pub-\\d{16}$/.test(clientId);
  const publishedCount = articles?.length ?? 0;
  const imageCount = articles?.filter((item) => Boolean(item.image_url)).length ?? 0;

  const checks: Check[] = [
    { label: "About page", ready: true, detail: "Published at /about." },
    { label: "Contact page", ready: true, detail: "Published at /contact with the PaulNova contact email." },
    { label: "Privacy policy", ready: true, detail: "Published at /privacy; review it again when AdSense is activated." },
    { label: "Terms, disclaimer and editorial policy", ready: true, detail: "Public policy pages are present." },
    { label: "Sitemap and crawler rules", ready: true, detail: "Generated sitemap.xml and robots.txt routes are present." },
    { label: "Google Search Console verification", ready: Boolean(verification), detail: verification ? "A Google verification token is configured." : "Add the Search Console HTML verification token in Site settings or NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION." },
    { label: "Published original content", ready: !articleError && publishedCount > 0, detail: articleError ? "Could not read published article records." : `${publishedCount} published article(s) currently found. Google evaluates content quality and originality, not a fixed article count.` },
    { label: "Article images", ready: publishedCount > 0 && imageCount === publishedCount, detail: `${imageCount} of ${publishedCount} published articles have a featured image URL. Use relevant, permitted images and descriptive alt text.` },
    { label: "AdSense publisher ID", ready: validPublisher, detail: validPublisher ? "Publisher ID format is configured for ads.txt." : "Set ADSENSE_PUBLISHER_ID to your Google-issued pub- followed by 16 digits." },
    { label: "AdSense client ID", ready: validClient, detail: validClient ? "Client ID format is configured." : "Set NEXT_PUBLIC_ADSENSE_CLIENT to your Google-issued ca-pub- ID." },
    { label: "AdSense script switch", ready: adsEnabled && validClient, detail: adsEnabled && validClient ? "AdSense script is enabled." : "Keep disabled until your account, site verification and consent messaging are ready; then set NEXT_PUBLIC_ADSENSE_ENABLE=true." },
    { label: "ads.txt endpoint", ready: validPublisher, detail: validPublisher ? "The /ads.txt route will publish your authorized seller record." : "The route is prepared and will become available after the publisher ID is configured." },
    { label: "Google consent messaging", ready: false, detail: "Still requires setup in AdSense using Google's certified consent management platform for users in regions where Google requires it. Do not enable ad serving before this is completed." }
  ];

  const completed = checks.filter((check) => check.ready).length;
  const percentage = Math.round((completed / checks.length) * 100);

  return <main className="min-h-screen bg-[#f7f8fc]">
    <header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/admin" className="text-2xl font-black tracking-tight text-slate-900">Paul<span className="text-[#635bff]">Nova</span><span className="ml-3 text-xs font-semibold text-slate-400">STUDIO</span></Link><Link href="/admin" className="text-sm font-bold text-[#635bff]">← Dashboard</Link></div></header>
    <section className="container max-w-5xl py-10">
      <p className="eyebrow">Monetization setup</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Google AdSense readiness</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">A live technical checklist for the PaulNova website. This score tracks configuration only; it is not a Google approval score and cannot predict acceptance. Google reviews the whole site and makes the final decision.</p>
      <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Technical checklist</p><p className="mt-2 text-4xl font-black text-slate-900">{percentage}%</p><p className="mt-1 text-xs text-slate-500">{completed} of {checks.length} checks currently ready</p></div><span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-800">Google approval pending</span></div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#635bff]" style={{width: percentage + "%"}}/></div>
        <div className="mt-6 divide-y divide-slate-100">{checks.map((check) => <div key={check.label} className="flex gap-3 py-4"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${check.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{check.ready ? "✓" : "!"}</span><div><p className="text-sm font-bold text-slate-800">{check.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{check.detail}</p></div></div>)}</div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6"><h2 className="text-lg font-extrabold text-slate-900">Finish the Google account steps</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600"><li>Create or sign in to your one Google AdSense account and add <strong>paulnova.name.ng</strong>.</li><li>Copy your exact AdSense client ID and publisher ID from Google. Never guess or reuse another publisher's ID.</li><li>Add the IDs to Render environment variables: <code> NEXT_PUBLIC_ADSENSE_CLIENT</code> and <code>ADSENSE_PUBLISHER_ID</code>. Keep <code>NEXT_PUBLIC_ADSENSE_ENABLE</code> set to <code>false</code> until consent messaging is configured.</li><li>Configure Google's certified consent management platform in AdSense for regions where Google requires it. Review the Privacy Policy and test the consent experience.</li><li>Only after those steps, set <code>NEXT_PUBLIC_ADSENSE_ENABLE=true</code>, deploy, verify <code>/ads.txt</code>, then request Google's site review in AdSense.</li></ol><p className="mt-5 text-xs leading-5 text-slate-400">Do not paste publisher IDs, verification codes or account credentials into public articles. The publisher ID is not a password, but it should still be configured through Render environment variables.</p></section>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/sitemap.xml" target="_blank" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Open sitemap ↗</Link><Link href="/robots.txt" target="_blank" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Open robots.txt ↗</Link><Link href="/ads.txt" target="_blank" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Check ads.txt ↗</Link><Link href="/privacy" target="_blank" className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Review privacy policy ↗</Link></div>
    </section>
  </main>;
}
