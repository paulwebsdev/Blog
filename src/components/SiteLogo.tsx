import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteLogo() {
  let logoUrl: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("logo_url").eq("id", 1).maybeSingle();
    logoUrl = data?.logo_url || null;
  } catch { /* Keep the text logo available if settings cannot be loaded. */ }
  return <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="PaulNova home">
    {logoUrl ? <img src={logoUrl} alt="PaulNova" className="max-h-12 max-w-[190px] object-contain" /> : <><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#635bff] text-lg font-black text-white">P<span className="text-[#c9c5ff]">.</span></span><span className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></span></>}
  </Link>;
}
