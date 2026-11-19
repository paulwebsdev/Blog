import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
const labels:Record<string,string>={facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",x:"X",youtube:"YouTube",tiktok:"TikTok",telegram:"Telegram",threads:"Threads",whatsapp:"WhatsApp"};
export default async function SocialLinks(){
  try{
    const supabase=await createClient();
    const {data}=await supabase.from("site_settings").select("social_links").eq("id",1).maybeSingle();
    const links=(data?.social_links??{}) as Record<string,string>;
    const active=Object.entries(links).filter(([key,value])=>Boolean(labels[key])&&typeof value==="string"&&value.startsWith("https://"));
    if(!active.length)return null;
    return <section aria-label="Follow PaulNova" className="border-t border-slate-100 bg-white"><div className="container flex flex-wrap items-center justify-between gap-4 py-7"><div><h2 className="text-sm font-extrabold text-slate-900">Follow PaulNova</h2><p className="mt-1 text-xs text-slate-500">Follow our official channels for new stories and updates.</p></div><nav aria-label="PaulNova social media" className="flex flex-wrap gap-2">{active.map(([key,url])=><Link key={key} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-[#635bff] hover:text-[#635bff]">{labels[key]} ↗</Link>)}</nav></div></section>;
  }catch{return null;}
}