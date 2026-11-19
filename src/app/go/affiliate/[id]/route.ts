import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const supabase=await createClient();
 const {data,error}=await supabase.from("affiliate_links").select("id,destination_url").eq("id",id).eq("status","active").maybeSingle();
 if(error||!data)return NextResponse.redirect(new URL("/",request.url));
 await supabase.from("monetization_events").insert({event_type:"affiliate_click",affiliate_link_id:id});
 return NextResponse.redirect(data.destination_url,302);
}
