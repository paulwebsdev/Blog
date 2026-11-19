"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function submitAdvertiserInquiry(form:FormData){
 const company=String(form.get("company_name")??"").trim();
 const name=String(form.get("contact_name")??"").trim();
 const email=String(form.get("email")??"").trim().toLowerCase();
 const interest=String(form.get("interest")??"other");
 const message=String(form.get("message")??"").trim();
 const website=String(form.get("website")??"").trim();
 if(website) redirect("/advertise?sent=1");
 if(company.length<2||name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<20||message.length>5000) redirect("/advertise?error=invalid");
 if(!["display_ads","sponsored_content","affiliate_partnership","other"].includes(interest)) redirect("/advertise?error=invalid");
 const supabase=await createClient();
 const {error}=await supabase.from("advertiser_inquiries").insert({
  company_name:company.slice(0,160),contact_name:name.slice(0,120),email:email.slice(0,254),
  website_url:String(form.get("company_website")??"").trim().slice(0,1000)||null,
  interest,budget_range:String(form.get("budget_range")??"").trim().slice(0,100)||null,message
 });
 if(error) redirect("/advertise?error=failed");
 redirect("/advertise?sent=1");
}
