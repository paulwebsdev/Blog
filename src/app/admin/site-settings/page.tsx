import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveSiteSettings } from "@/app/admin/actions";
export const dynamic = "force-dynamic";
const platforms = [
  ["facebook","Facebook page","https://www.facebook.com/yourpage"],
  ["instagram","Instagram","https://www.instagram.com/yourhandle"],
  ["linkedin","LinkedIn","https://www.linkedin.com/company/yourpage"],
  ["x","X (Twitter)","https://x.com/yourhandle"],
  ["youtube","YouTube","https://www.youtube.com/@yourchannel"],
  ["tiktok","TikTok","https://www.tiktok.com/@yourhandle"],
  ["telegram","Telegram","https://t.me/yourchannel"],
  ["threads","Threads","https://www.threads.net/@yourhandle"],
  ["whatsapp","WhatsApp","https://wa.me/2348000000000"]
] as const;
export default async function SiteSettings({searchParams}:{searchParams:Promise<{saved?:string}>}) {
  const params=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/admin/login");
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin") redirect("/admin?error=admin-required");
  const {data:settings}=await supabase.from("site_settings").select("social_links,google_site_verification").eq("id",1).maybeSingle();
  const links=(settings?.social_links??{}) as Record<string,string>;
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> Studio</Link><Link href="/admin" className="text-sm font-semibold text-slate-500">← Dashboard</Link></div></header>
  <section className="container max-w-3xl py-10"><p className="eyebrow">Website configuration</p><h1 className="mt-2 text-3xl font-black text-slate-900">Site settings</h1><p className="mt-3 text-sm leading-6 text-slate-500">Add official social profile links whenever you create those accounts. Saved links automatically appear in the public “Follow PaulNova” area. Leave a platform blank to hide it.</p>
  {params.saved==="1"&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Your site settings have been saved.</p>}
  <form action={saveSiteSettings} className="mt-7 space-y-6 rounded-2xl border border-slate-100 bg-white p-6 md:p-8">
    <section><h2 className="text-lg font-extrabold text-slate-900">Social media profiles</h2><p className="mt-1 text-xs leading-5 text-slate-500">Paste the full public profile, page or channel URL. Use HTTPS and the matching platform’s official domain.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{platforms.map(([key,label,placeholder])=><label key={key} className="block text-sm font-semibold text-slate-700">{label}<input type="url" name={key} defaultValue={links[key]??""} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal outline-none focus:border-[#635bff]"/></label>)}</div></section>
    <section className="border-t border-slate-100 pt-6"><h2 className="text-lg font-extrabold text-slate-900">Google Search Console</h2><p className="mt-1 text-xs leading-5 text-slate-500">When Google gives you the HTML-tag verification code, paste only the value after <code>content=</code> here. PaulNova will add it to the homepage metadata automatically.</p><label className="mt-4 block text-sm font-semibold text-slate-700">Google site verification code<input name="google_site_verification" defaultValue={settings?.google_site_verification??""} placeholder="Example: a1b2c3..." className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal"/></label><p className="mt-3 text-xs text-slate-500">You still need to add the domain property in Search Console and click Verify. For the domain property, Google may require a DNS TXT record at your domain registrar; the HTML-tag method is easier to add here.</p><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[#635bff]">Open Google Search Console ↗</a></section>
    <button className="rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white">Save site settings</button>
  </form></section></main>;
}