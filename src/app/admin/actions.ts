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
    image_url: imageUrl || null, image_alt: imageAlt || null, seo_title: seoTitle || title,
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


async function waitForBrevoImport(processId: number) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const process = await brevoRequest<{ status?: string }>(`/processes/${processId}`);
    const status = String(process.status ?? "").toLowerCase();
    if (status === "completed") return;
    if (["failed", "error", "cancelled"].includes(status)) {
      throw new Error("Brevo could not finish importing the subscriber list.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Brevo is still importing subscribers. Wait a moment, then try sending again.");
}

export async function sendNewsletterCampaign(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid campaign ID.");

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  const senderEmail = String(process.env.BREVO_SENDER_EMAIL ?? "").trim();
  const senderName = String(process.env.BREVO_SENDER_NAME ?? "PaulNova").trim();
  const replyTo = String(process.env.BREVO_REPLY_TO ?? senderEmail).trim();
  if (!apiKey) throw new Error("Brevo API key is not configured on the server.");
  if (!Number.isInteger(listId) || listId < 1) throw new Error("Set BREVO_LIST_ID to the numeric ID of your PaulNova subscribers list in Brevo.");
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(senderEmail)) throw new Error("Set BREVO_SENDER_EMAIL to a verified sender address in Brevo.");

  const { data: campaign, error: campaignError } = await supabase
    .from("newsletter_campaigns")
    .select("id,subject,preview_text,content_html,status,brevo_campaign_id")
    .eq("id", id)
    .maybeSingle();
  if (campaignError || !campaign) throw new Error("Newsletter campaign not found.");
  if (campaign.status !== "draft") throw new Error("Only newsletter drafts can be sent.");

  const { count: subscriberCount, error: countError } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .not("consent_at", "is", null);
  if (countError) throw new Error("Could not verify the consented subscriber list.");
  if (!subscriberCount) throw new Error("There are no active subscribers with recorded consent to receive this newsletter.");
  if (subscriberCount > 10000) throw new Error("This first release supports up to 10,000 subscribers per campaign. Please contact support before sending a larger list.");

  const { data: claimed } = await supabase
    .from("newsletter_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();
  if (!claimed) throw new Error("This campaign is already being processed or has already been sent.");

  let brevoAccepted = false;
  try {
    for (let offset = 0; offset < subscriberCount; offset += 1000) {
      const { data: subscribers, error: subscriberError } = await supabase
        .from("subscribers")
        .select("email")
        .eq("status", "active")
        .not("consent_at", "is", null)
        .order("created_at", { ascending: true })
        .range(offset, Math.min(offset + 999, subscriberCount - 1));
      if (subscriberError) throw new Error("Could not load the consented subscriber list.");
      const emails = (subscribers ?? []).map((row) => row.email).filter(Boolean);
      if (!emails.length) continue;
      const imported = await brevoRequest<{ processId?: number }>("/contacts/import", {
        method: "POST",
        body: JSON.stringify({
          jsonBody: emails.map((email) => ({ email })),
          listIds: [listId],
          updateExistingContacts: true,
          disableNotification: true
        })
      });
      if (!imported.processId) throw new Error("Brevo did not return a subscriber import process ID.");
      await waitForBrevoImport(imported.processId);
    }

    let brevoCampaignId = campaign.brevo_campaign_id as number | null;
    if (!brevoCampaignId) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://paulnova.name.ng").replace(/\\/$/, "");
      const htmlContent = `<!doctype html><html><body style="margin:0;background:#f5f6fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border-radius:18px;padding:32px"><p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#635bff">PAULNOVA</p><h1 style="font-size:26px;line-height:1.25;margin:18px 0;color:#172033">${escapeHtml(campaign.subject)}</h1>${campaign.content_html}<p style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.7;color:#64748b">Technology. Intelligence. Opportunities.<br/><a href="${siteUrl}" style="color:#635bff">Visit PaulNova</a> · <a href="{{ unsubscribe }}" style="color:#64748b">Unsubscribe</a></p></div></div></body></html>`;
      const created = await brevoRequest<{ id: number }>("/emailCampaigns", {
        method: "POST",
        body: JSON.stringify({
          name: `PaulNova — ${campaign.subject.slice(0, 100)} — ${new Date().toISOString()}`,
          subject: campaign.subject,
          previewText: campaign.preview_text || undefined,
          sender: { name: senderName, email: senderEmail },
          replyTo,
          recipients: { listIds: [listId] },
          htmlContent,
          tag: "PaulNova"
        })
      });
      if (!created.id) throw new Error("Brevo created no campaign ID.");
      brevoCampaignId = created.id;
      const { error: storeError } = await supabase
        .from("newsletter_campaigns")
        .update({ brevo_campaign_id: brevoCampaignId, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (storeError) throw new Error("Brevo campaign was created, but its ID could not be saved. Contact an administrator before retrying.");
    }

    await brevoRequest(`/emailCampaigns/${brevoCampaignId}/sendNow`, { method: "POST" });
    brevoAccepted = true;
    const { error: sentError } = await supabase
      .from("newsletter_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "sending");
    if (sentError) throw new Error("Brevo accepted the campaign, but PaulNova could not update its local status. Check Brevo before attempting another send.");
  } catch (error) {
    if (!brevoAccepted) {
      await supabase.from("newsletter_campaigns").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "sending");
    }
    throw error;
  }
  redirect("/admin/newsletter?sent=1");
}
