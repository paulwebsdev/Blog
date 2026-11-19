import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const tables = ["profiles","categories","articles","subscribers","newsletter_campaigns","advertisers","ad_campaigns","sponsored_posts","affiliate_links","advertiser_inquiries","monetization_events","revenue_entries","page_views","tags","article_tags","site_settings"] as const;
export async function GET(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return new Response("Unauthorised",{status:401});
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return new Response("Forbidden",{status:403});
  const snapshot:Record<string,unknown[]>={};
  try{
    for(const table of tables){
      const rows:unknown[]=[];
      for(let offset=0;offset<100000;offset+=1000){
        const {data,error}=await supabase.from(table).select("*").range(offset,offset+999);
        if(error)throw new Error("Could not export "+table+": "+error.message);
        rows.push(...(data??[]));
        if((data??[]).length<1000)break;
      }
      snapshot[table]=rows;
    }
  }catch(error){
    return Response.json({error:error instanceof Error?error.message:"Backup export failed."},{status:500,headers:{"Cache-Control":"no-store"}});
  }
  const payload={product:"PaulNova application data snapshot",created_at:new Date().toISOString(),format_version:1,notice:"This JSON export contains application table data only. It does not include Supabase Auth credentials, project secrets, storage objects, database roles, or a restorable SQL schema.",tables:snapshot};
  const date=new Date().toISOString().slice(0,10);
  return new Response(JSON.stringify(payload,null,2),{status:200,headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="paulnova-data-backup-'+date+'.json"',"Cache-Control":"private, no-store, max-age=0"}});
}