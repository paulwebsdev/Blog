import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
type Props = { params: Promise<{ id: string }> };
function plain(html: string) { return html.replaceAll("<p>", "").replaceAll("</p>", "\n\n").replaceAll("<br>", "\n").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'"); }
export default async function NewsletterPreview({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin?error=admin-required");
  const { data: campaign } = await supabase.from("newsletter_campaigns").select("id,subject,preview_text,content_html,status").eq("id", id).maybeSingle();
  if (!campaign) notFound();
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/admin/newsletter" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> STUDIO</Link><Link href={"/admin/newsletter/" + id} className="text-sm font-semibold text-slate-500">← Edit draft</Link></div></header><section className="container max-w-2xl py-10"><p className="eyebrow">Email preview · {campaign.status}</p><div className="mt-6 rounded-2xl border border-slate-100 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-[#635bff]">PaulNova newsletter</p><h1 className="mt-4 text-2xl font-black text-slate-900">{campaign.subject}</h1>{campaign.preview_text && <p className="mt-2 text-sm text-slate-500">{campaign.preview_text}</p>}<div className="mt-7 whitespace-pre-wrap border-t border-slate-100 pt-6 text-sm leading-7 text-slate-700">{plain(campaign.content_html)}</div><p className="mt-8 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">This is a content preview only. No email has been sent.</p></div><Link href={"/admin/newsletter/" + id} className="mt-6 inline-flex rounded-full bg-[#635bff] px-5 py-3 text-sm font-bold text-white">Back to editor</Link></section></main>;
}
