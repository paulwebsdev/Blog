import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
type Placement="homepage_banner"|"in_article"|"sidebar"|"category_banner";
export default async function AdSlot({placement}:{placement:Placement}){
 const supabase=await createClient();
 const {data}=await supabase.from("ad_campaigns").select("id,name,creative_image_url,creative_alt,destination_url").eq("placement",placement).eq("status","active").or("starts_at.is.null,starts_at.lte."+new Date().toISOString()).or("ends_at.is.null,ends_at.gt."+new Date().toISOString()).limit(1).maybeSingle();
 if(!data)return null;
 return <aside aria-label="Advertisement" className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><div className="flex items-center justify-between px-4 pt-3"><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Advertisement</span><span className="text-[10px] text-slate-400">Sponsored placement</span></div><Link href={"/go/ad/"+data.id} rel="sponsored nofollow noopener" className="block p-4">{data.creative_image_url&&<img src={data.creative_image_url} alt={data.creative_alt||data.name} className="max-h-48 w-full rounded-xl object-cover"/>}<p className="mt-3 font-bold text-slate-800">{data.name}</p><span className="mt-2 inline-block text-xs font-bold text-[#635bff]">Learn more ↗</span></Link></aside>;
}
