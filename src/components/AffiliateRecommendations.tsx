import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
export default async function AffiliateRecommendations(){
 const supabase=await createClient();
 const {data}=await supabase.from("affiliate_links").select("id,partner_name,label,disclosure_text,category").eq("status","active").order("created_at",{ascending:false}).limit(3);
 if(!data?.length)return null;
 return <aside className="mt-12 rounded-2xl border border-amber-100 bg-amber-50/60 p-6"><p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">Partner recommendations</p><p className="mt-2 text-xs leading-5 text-slate-600">Some links may be affiliate links. PaulNova may earn a commission at no extra cost to you.</p><div className="mt-4 space-y-3">{data.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4"><div><p className="text-sm font-bold text-slate-900">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.partner_name}{item.category?" · "+item.category:""}</p><p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-400">{item.disclosure_text}</p></div><Link href={"/go/affiliate/"+item.id} rel="sponsored nofollow noopener" className="text-xs font-bold text-[#635bff]">View offer ↗</Link></div>)}</div></aside>;
}
