"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { brevoRequest } from "@/lib/brevo";

async function requireEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  return { supabase, user, role: profile.role as string };
}
function safeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}
function parseContent(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(parsed) || parsed.some((section) => typeof section.heading !== "string" || !Array.isArray(section.paragraphs) || section.paragraphs.some((p: unknown) => typeof p !== "string"))) throw new Error();
    return parsed;
  } catch { throw new Error("Article content must be valid JSON: an array of sections with a heading and paragraphs."); }
}
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/admin/login?error=missing");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?error=invalid");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-authorised");
  }
  redirect("/admin");
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
export async function saveArticle(formData: FormData) {
  const { supabase, user } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const imageAlt = String(formData.get("image_alt") ?? "").trim();
  const seoTitle = String(formData.get("seo_title") ?? "").trim();
  const seoDescription = String(formData.get("seo_description") ?? "").trim();
  const correctionNote = String(formData.get("correction_note") ?? "").trim().slice(0, 1200);
  const sourceLines = String(formData.get("sources") ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 20);
  const sources = sourceLines.map((line) => {
    const separator = line.indexOf("|");
    if (separator < 2) throw new Error("Each source must be entered as: Source title | https://source-url");
    const title = line.slice(0, separator).trim().slice(0, 180);
    let url: URL;
    try { url = new URL(line.slice(separator + 1).trim()); } catch { throw new Error("Every source needs a valid public URL."); }
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Source URLs must use HTTPS or HTTP.");
    return { title, url: url.toString() };
  });
  const status = String(formData.get("status") ?? "draft");
  const scheduledAt = String(formData.get("scheduled_at") ?? "").trim();
  const slug = safeSlug(String(formData.get("slug") ?? title));
  if (title.length < 5 || excerpt.length < 15 || !slug || !categoryId) throw new Error("Please complete the title, slug, excerpt and category.");
  if (!["draft", "published", "scheduled"].includes(status)) throw new Error("Invalid publishing status.");
  if (imageUrl) {
    let parsed: URL;
    try { parsed = new URL(imageUrl); } catch { throw new Error("Image URL must be a valid public URL."); }
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Image URL must use HTTPS or HTTP.");
    if (!imageAlt) throw new Error("Add descriptive alt text for the article image.");
  }
  let existing: { published_at: string | null; author_id: string | null } | null = null;
  if (id) {
    const { data, error } = await supabase.from("articles").select("published_at,author_id").eq("id", id).maybeSingle();
    if (error || !data) throw new Error("The article could not be found or accessed.");
    existing = data;
  }
  const publishedAt = status === "published"
    ? (existing?.published_at || new Date().toISOString())
    : status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null;
  if (status === "scheduled" && (!publishedAt || new Date(publishedAt) <= new Date())) throw new Error("Choose a future publication date and time.");
  const payload = {
    title, slug, excerpt, category_id: categoryId, content: parseContent(formData.get("content")),
    image_url: imageUrl || null, image_alt: imageAlt || null, sources, correction_note: correctionNote || null, seo_title: seoTitle || title,
    seo_description: seoDescription || excerpt, status, published_at: publishedAt,
    author_id: existing?.author_id || user.id, updated_at: new Date().toISOString()
  };
  const query = id
    ? supabase.from("articles").update(payload).eq("id", id).select("id").single()
    : supabase.from("articles").insert(payload).select("id").single();
  const { data: saved, error } = await query;
  if (error || !saved) throw new Error(error?.message || "Article could not be saved.");

  const tagNames = [...new Set(String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8))];
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const tagSlug = safeSlug(name);
    if (!tagSlug) continue;
    const { data: tag, error: tagError } = await supabase.from("tags")
      .upsert({ name: name.slice(0, 60), slug: tagSlug }, { onConflict: "slug" }).select("id").single();
    if (tagError || !tag) throw new Error(tagError?.message || "Could not save article topic tags.");
    tagIds.push(tag.id);
  }
  const { error: clearTagsError } = await supabase.from("article_tags").delete().eq("article_id", saved.id);
  if (clearTagsError) throw new Error(clearTagsError.message);
  if (tagIds.length) {
    const { error: linkError } = await supabase.from("article_tags").insert(tagIds.map((tag_id) => ({ article_id: saved.id, tag_id })));
    if (linkError) throw new Error(linkError.message);
  }
  redirect("/admin");
}
export async function deleteArticle(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Article ID is missing.");
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/admin");
}
async function requireAdmin() {
  const { supabase, user } = await requireEditor();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/admin?error=admin-required");
  return { supabase, user };
}
export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = safeSlug(String(formData.get("slug") ?? name));
  if (name.length < 2 || !slug) throw new Error("Enter a category name and valid slug.");
  const { error } = await supabase.from("categories").insert({ name, slug, description: description || null });
  if (error) throw new Error(error.message);
  redirect("/admin");
}
export async function toggleCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!id) throw new Error("Category ID is missing.");
  const { error } = await supabase.from("categories").update({ is_active: !isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/admin");
}
function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export async function saveNewsletterDraft(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const subject = String(formData.get("subject") ?? "").trim();
  const preview = String(formData.get("preview_text") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (subject.length < 3 || subject.length > 180) throw new Error("Subject must be between 3 and 180 characters.");
  if (preview.length > 250) throw new Error("Preview text must be 250 characters or fewer.");
  if (body.length < 10 || body.length > 30000) throw new Error("Newsletter content must be between 10 and 30,000 characters.");
  const contentHtml = body.split(/\r?\n\s*\r?\n/).map((paragraph) => "<p>" + escapeHtml(paragraph).replace(/\r?\n/g, "<br>") + "</p>").join("\n");
  const { error } = await supabase.from("newsletter_campaigns").insert({
    subject, preview_text: preview || null, content_html: contentHtml, status: "draft", created_by: user.id
  });
  if (error) throw new Error("Could not save newsletter draft: " + error.message);
  redirect("/admin/newsletter?saved=1");
}
export async function deleteNewsletterDraft(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid campaign ID.");
  const { error } = await supabase.from("newsletter_campaigns").delete().eq("id", id).eq("status", "draft");
  if (error) throw new Error("Could not delete this draft: " + error.message);
  redirect("/admin/newsletter?deleted=1");
}

export async function updateNewsletterDraft(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const preview = String(formData.get("preview_text") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid campaign ID.");
  if (subject.length < 3 || subject.length > 180) throw new Error("Subject must be between 3 and 180 characters.");
  if (preview.length > 250) throw new Error("Preview text must be 250 characters or fewer.");
  if (body.length < 10 || body.length > 30000) throw new Error("Newsletter content must be between 10 and 30,000 characters.");
  const contentHtml = body.split(/\r?\n\s*\r?\n/).map((paragraph) => "<p>" + escapeHtml(paragraph).replace(/\r?\n/g, "<br>") + "</p>").join("\n");
  const { error } = await supabase.from("newsletter_campaigns").update({ subject, preview_text: preview || null, content_html: contentHtml, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "draft");
  if (error) throw new Error("Could not update newsletter draft: " + error.message);
  redirect("/admin/newsletter?saved=1");
}

export async function saveAuthorProfile(formData: FormData) {
  const { supabase, user } = await requireEditor();
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 100);
  const authorSlug = safeSlug(String(formData.get("author_slug") ?? displayName));
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 1000);
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  if (displayName.length < 2 || !authorSlug) throw new Error("Enter a display name and valid author URL slug.");
  for (const value of [avatarUrl, websiteUrl]) {
    if (!value) continue;
    try { const parsed = new URL(value); if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(); }
    catch { throw new Error("Profile image and website must be valid public URLs."); }
  }
  const { error } = await supabase.rpc("update_author_profile", {
    p_display_name: displayName, p_author_slug: authorSlug, p_bio: bio,
    p_avatar_url: avatarUrl, p_website_url: websiteUrl
  });
  if (error) throw new Error(error.message);
  redirect("/admin/author?saved=1");
}




export async function saveSiteSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const platforms = ["facebook","instagram","linkedin","x","youtube","tiktok","telegram","threads","whatsapp"] as const;
  const allowedHosts: Record<string,string[]> = {
    facebook:["facebook.com","www.facebook.com","m.facebook.com"],
    instagram:["instagram.com","www.instagram.com"],
    linkedin:["linkedin.com","www.linkedin.com"],
    x:["x.com","www.x.com","twitter.com","www.twitter.com"],
    youtube:["youtube.com","www.youtube.com","youtu.be"],
    tiktok:["tiktok.com","www.tiktok.com"],
    telegram:["t.me","telegram.me","www.telegram.me"],
    threads:["threads.net","www.threads.net"],
    whatsapp:["wa.me","api.whatsapp.com","www.whatsapp.com"]
  };
  const socialLinks: Record<string,string> = {};
  for (const platform of platforms) {
    const value = String(formData.get(platform) ?? "").trim();
    if (!value) continue;
    let parsed: URL;
    try { parsed = new URL(value); } catch { throw new Error("Enter a valid full URL for " + platform + "."); }
    if (parsed.protocol !== "https:" || !allowedHosts[platform].includes(parsed.hostname.toLowerCase())) {
      throw new Error("Use an official HTTPS " + platform + " profile URL.");
    }
    socialLinks[platform] = parsed.toString();
  }
  const googleCode = String(formData.get("google_site_verification") ?? "").trim().slice(0,200);
  if (googleCode && !/^[A-Za-z0-9_-]+$/.test(googleCode)) throw new Error("Google verification code should contain only letters, numbers, underscores or hyphens.");
  const { error } = await supabase.from("site_settings").upsert({
    id: 1, social_links: socialLinks, google_site_verification: googleCode || null, updated_at: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw new Error("Could not save site settings: " + error.message);
  redirect("/admin/site-settings?saved=1");
}


async function ensurePaulNovaBrevoList(): Promise<number> {
  const configured = Number(process.env.BREVO_LIST_ID);
  if (Number.isInteger(configured) && configured > 0) return configured;
  const existing = await brevoRequest<{ lists?: Array<{ id: number; name: string }> }>("/contacts/lists?limit=50&offset=0&sort=desc");
  const match = (existing.lists ?? []).find((list) => list.name.trim().toLowerCase() === "paulnova newsletter");
  if (match) return match.id;
  const created = await brevoRequest<{ id: number }>("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: "PaulNova Newsletter", folderId: 1 })
  });
  if (!created.id) throw new Error("Brevo did not return the new PaulNova Newsletter list ID.");
  return created.id;
}

export async function sendNewsletterTest(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid campaign ID.");
  if (!user.email) throw new Error("Your admin account has no email address for the test.");
  if (!process.env.BREVO_API_KEY) throw new Error("Brevo API key is not configured on the server.");
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL ?? "").trim();
  const senderName = String(process.env.BREVO_SENDER_NAME ?? "PaulNova").trim();
  const replyTo = String(process.env.BREVO_REPLY_TO ?? senderEmail).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) throw new Error("Set BREVO_SENDER_EMAIL to an active, verified Brevo sender.");
  const listId = await ensurePaulNovaBrevoList();
  const { data: campaign, error } = await supabase.from("newsletter_campaigns")
    .select("id,subject,preview_text,content_html,status,brevo_campaign_id").eq("id", id).maybeSingle();
  if (error || !campaign) throw new Error("Newsletter campaign not found.");
  if (campaign.status !== "draft") throw new Error("Only draft campaigns can be test-sent.");
  let brevoCampaignId = campaign.brevo_campaign_id as number | null;
  if (!brevoCampaignId) {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng").replace(/\/$/, "");
    const htmlContent = `<!doctype html><html><body style="margin:0;background:#f5f6fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:18px;padding:32px"><p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#635bff">PAULNOVA</p><h1 style="font-size:26px;line-height:1.25;margin:18px 0;color:#172033">${escapeHtml(campaign.subject)}</h1>${campaign.content_html}<p style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.7;color:#64748b">Technology. Intelligence. Opportunities.<br/><a href="${siteUrl}" style="color:#635bff">Visit PaulNova</a> · <a href="{{ unsubscribe }}" style="color:#64748b">Unsubscribe</a></p></div></div></body></html>`;
    const created = await brevoRequest<{ id: number }>("/emailCampaigns", { method: "POST", body: JSON.stringify({
      name: `PaulNova TEST — ${campaign.subject.slice(0, 90)} — ${new Date().toISOString()}`,
      subject: campaign.subject, previewText: campaign.preview_text || undefined,
      sender: { name: senderName, email: senderEmail }, replyTo,
      recipients: { listIds: [listId] }, htmlContent, tag: "PaulNova-Test"
    })});
    if (!created.id) throw new Error("Brevo did not create the test campaign.");
    brevoCampaignId = created.id;
    const { error: saveError } = await supabase.from("newsletter_campaigns")
      .update({ brevo_campaign_id: brevoCampaignId, updated_at: new Date().toISOString() }).eq("id", id);
    if (saveError) throw new Error("Test campaign was created in Brevo but its ID could not be saved.");
  }
  await brevoRequest(`/emailCampaigns/${brevoCampaignId}/sendTest`, {
    method: "POST", body: JSON.stringify({ emailTo: [user.email] })
  });
  redirect("/admin/newsletter?tested=1");
}

export async function sendNewsletterCampaign(_formData: FormData) {
  await requireAdmin();
  throw new Error("Bulk newsletter sending is temporarily disabled until Brevo unsubscribe suppression and consent synchronization are fully verified.");
}
