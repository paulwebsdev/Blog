import { createClient } from "@/lib/supabase/server";
export default async function SiteStructuredData(){
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://paulnova.name.ng";
 let sameAs:string[]=[];
 try{const supabase=await createClient();const {data}=await supabase.from("site_settings").select("social_links").eq("id",1).maybeSingle();const links=(data?.social_links??{}) as Record<string,string>;sameAs=Object.values(links).filter((value)=>typeof value==="string"&&value.startsWith("https://"));}catch{}
 const graph=[
  {"@context":"https://schema.org","@type":"Organization","@id":base+"/#organization","name":"PaulNova","url":base,"description":"An independent global publication covering technology, artificial intelligence, digital business, education and careers.",...(sameAs.length?{sameAs}: {})},
  {"@context":"https://schema.org","@type":"WebSite","@id":base+"/#website","url":base,"name":"PaulNova","publisher":{"@id":base+"/#organization"},"inLanguage":"en"}
 ];
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(graph).replace(/</g,"\\u003c")}}/>;
}