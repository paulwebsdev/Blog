import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNewsletterDraft } from "@/app/admin/actions";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
function toPlainText(html: string) { return html.replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
export default async function EditNewsletterDraft({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin?error=admin-required");
  const { data: campaign } = await supabase.from("newsletter_campaigns").select("id,subject,preview_text,content_html,status").eq("id", id).maybeSingle();
  if (!campaign) notFound();
  if (campaign.status !== "draft") redirect("/admin/newsletter");
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/admin" className="text-xl font-black">Paul<span className="text-[#635bff]">Nova</span> STUDIO</Link><Link href="/admin/newsletter" className="text-sm font-semibold text-slate-500">← Newsletter studio</Link></div></header><section className="container max-w-3xl py-10"><p className="eyebrow">Campaign draft</p><h1 className="mt-2 text-3xl font-black text-slate-900">Edit newsletter</h1><p className="mt-2 text-sm text-slate-500">Changes are saved as a draft. Resend is being connected; bulk sending remains locked until domain authentication and unsubscribe safeguards are verified.</p><div className="mt-8 flex justify-end"><Link href={"/admin/newsletter/" + campaign.id + "/preview"} className="text-sm font-bold text-[#635bff]">Preview campaign →</Link></div><form action={updateNewsletterDraft} className="mt-3 space-y-5 rounded-2xl border border-slate-100 bg-white p-6"><input type="hidden" name="id" value={campaign.id}/><label className="block text-xs font-bold text-slate-600">Email subject<input name="subject" required minLength={3} maxLength={180} defaultValue={campaign.subject} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="block text-xs font-bold text-slate-600">Preview text<input name="preview_text" maxLength={250} defaultValue={campaign.preview_text ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="block text-xs font-bold text-slate-600">Newsletter content<textarea name="body" required minLength={10} maxLength={30000} rows={16} defaultValue={toPlainText(campaign.content_html)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal leading-6"/></label><button className="rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white">Save changes</button></form></section></main>;
}
