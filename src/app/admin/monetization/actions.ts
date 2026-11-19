"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin?error=admin-required");
  return { supabase, user };
}
function textField(form: FormData, name: string, max = 500) { return String(form.get(name) ?? "").trim().slice(0, max); }
function validUrl(value: string, optional = false) {
  if (!value && optional) return null;
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Enter a valid public URL."); }
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are accepted.");
  return url.toString();
}
export async function createAdvertiser(form: FormData) {
  const { supabase, user } = await admin();
  const company_name = textField(form,"company_name",160);
  if (company_name.length < 2) throw new Error("Enter the advertiser's company name.");
  const { error } = await supabase.from("advertisers").insert({
    company_name, contact_name: textField(form,"contact_name",120) || null,
    contact_email: textField(form,"contact_email",254) || null,
    website_url: validUrl(textField(form,"website_url",1000),true),
    notes: textField(form,"notes",2000) || null, created_by:user.id
  });
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=advertiser");
}
export async function createCampaign(form: FormData) {
  const { supabase, user } = await admin();
  const name=textField(form,"name",180), destination_url=validUrl(textField(form,"destination_url",1500))!;
  const creative_image_url=validUrl(textField(form,"creative_image_url",1500),true);
  const placement=textField(form,"placement",40), advertiser_id=textField(form,"advertiser_id",50)||null;
  const starts=textField(form,"starts_at",40), ends=textField(form,"ends_at",40);
  if(name.length<3) throw new Error("Campaign name must contain at least three characters.");
  if(creative_image_url && !textField(form,"creative_alt",250)) throw new Error("Provide descriptive alt text for the ad image.");
  const {error}=await supabase.from("ad_campaigns").insert({
    name,destination_url,creative_image_url,creative_alt:textField(form,"creative_alt",250)||null,
    placement,status:textField(form,"status",20)||"draft", advertiser_id,
    starts_at:starts?new Date(starts).toISOString():null,ends_at:ends?new Date(ends).toISOString():null,
    pricing_model:textField(form,"pricing_model",20)||"flat",
    budget:textField(form,"budget",30)?Number(textField(form,"budget",30)):null,created_by:user.id
  });
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=campaign");
}
export async function setCampaignStatus(form: FormData) {
  const {supabase}=await admin(); const id=textField(form,"id",50), status=textField(form,"status",20);
  if(!["draft","active","paused","completed"].includes(status)) throw new Error("Invalid campaign status.");
  const {error}=await supabase.from("ad_campaigns").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=campaign-status");
}
export async function createAffiliateLink(form: FormData) {
  const {supabase,user}=await admin();
  const partner_name=textField(form,"partner_name",160),label=textField(form,"label",180),destination_url=validUrl(textField(form,"destination_url",1500))!;
  if(partner_name.length<2||label.length<2) throw new Error("Enter a partner and link label.");
  const {error}=await supabase.from("affiliate_links").insert({
    partner_name,label,destination_url,category:textField(form,"category",100)||null,
    disclosure_text:textField(form,"disclosure_text",500)||"This page may contain affiliate links. PaulNova may earn a commission if you make a purchase, at no extra cost to you.",
    status:textField(form,"status",20)||"draft",created_by:user.id
  });
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=affiliate");
}
export async function setAffiliateStatus(form: FormData) {
  const {supabase}=await admin(); const id=textField(form,"id",50),status=textField(form,"status",20);
  if(!["draft","active","paused"].includes(status)) throw new Error("Invalid affiliate link status.");
  const {error}=await supabase.from("affiliate_links").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=affiliate-status");
}
export async function createSponsoredPost(form: FormData) {
  const {supabase,user}=await admin();
  const article_id=textField(form,"article_id",50),sponsor_name=textField(form,"sponsor_name",160);
  if(!article_id||sponsor_name.length<2) throw new Error("Choose an article and enter the sponsor name.");
  const {error}=await supabase.from("sponsored_posts").insert({
    article_id,sponsor_name,advertiser_id:textField(form,"advertiser_id",50)||null,
    disclosure_text:textField(form,"disclosure_text",500)||"This article is sponsored. The sponsor has not controlled our editorial conclusions.",
    status:"draft",created_by:user.id
  });
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=sponsored");
}
export async function setSponsoredStatus(form: FormData) {
  const {supabase}=await admin(); const id=textField(form,"id",50),status=textField(form,"status",20);
  if(!["draft","active","ended"].includes(status)) throw new Error("Invalid sponsored post status.");
  const {error}=await supabase.from("sponsored_posts").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=sponsored-status");
}
export async function addRevenueEntry(form: FormData) {
  const {supabase,user}=await admin();
  const amount=Number(textField(form,"amount",30));
  if(!Number.isFinite(amount)||amount<0) throw new Error("Enter a valid non-negative revenue amount.");
  const {error}=await supabase.from("revenue_entries").insert({
    source:textField(form,"source",30),description:textField(form,"description",240),
    amount,currency:textField(form,"currency",3).toUpperCase()||"USD",
    revenue_date:textField(form,"revenue_date",20)||new Date().toISOString().slice(0,10),
    reference:textField(form,"reference",160)||null,created_by:user.id
  });
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=revenue");
}
export async function updateInquiryStatus(form: FormData) {
  const {supabase}=await admin(); const id=textField(form,"id",50),status=textField(form,"status",20);
  if(!["new","contacted","qualified","closed"].includes(status)) throw new Error("Invalid inquiry status.");
  const {error}=await supabase.from("advertiser_inquiries").update({status}).eq("id",id);
  if(error) throw new Error(error.message);
  redirect("/admin/monetization?saved=inquiry");
}
