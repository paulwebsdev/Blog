import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(request:NextRequest){
 let body:{campaignId?:unknown};
 try{body=await request.json();}catch{return NextResponse.json({ok:false},{status:400});}
 const id=typeof body.campaignId==="string"?body.campaignId:"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({ok:false},{status:400});
 const supabase=await createClient();
 const {error}=await supabase.from("monetization_events").insert({event_type:"ad_impression",campaign_id:id});
 if(error)return NextResponse.json({ok:false},{status:204});
 return new NextResponse(null,{status:204});
}
