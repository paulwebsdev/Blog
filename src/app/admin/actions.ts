"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

async function notifySubscribersOfPublishedArticle(supabase: Awaited<ReturnType<typeof createClient>>, articleId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: 0, reason: "missing-resend-key" };
  const [{ data: article, error: articleError }, { data: subscribers, error: subscriberError }] = await Promise.all([
    supabase.from("articles").select("title,slug,excerpt").eq("id", articleId).single(),
    supabase.from("subscribers").select("id,email,unsubscribe_token").eq("status", "active").not("consent_at", "is", null).is("unsubscribed_at", null)
  ]);
  if (articleError || !article) return { sent: 0, failed: 0, reason: "article-unavailable" };
  if (subscriberError) return { sent: 0, failed: 0, reason: "subscriber-list-unavailable" };
  if (!subscribers?.length) return { sent: 0, failed: 0, reason: "no-consented-subscribers" };

  const rows = subscribers.map((subscriber) => ({ article_id: articleId, subscriber_id: subscriber.id, status: "pending" }));
  const { error: queueError } = await supabase.from("article_notification_deliveries")
    .upsert(rows, { onConflict: "article_id,subscriber_id", ignoreDuplicates: true });
  if (queueError) return { sent: 0, failed: subscribers.length, reason: "queue-failed" };

  const { data: pending, error: pendingError } = await supabase.from("article_notification_deliveries")
    .select("id,subscriber_id").eq("article_id", articleId).eq("status", "pending");
  if (pendingError) return { sent: 0, failed: subscribers.length, reason: "queue-read-failed" };

  let sent = 0;
  let failed = 0;
  const byId = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]));
  const escapeEmail = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  for (const delivery of pending ?? []) {
    const subscriber = byId.get(delivery.subscriber_id);
    if (!subscriber) continue;
    const { data: claimed, error: claimError } = await supabase.from("article_notification_deliveries")
      .update({ status: "sending", error_message: null }).eq("id", delivery.id).eq("status", "pending").select("id").maybeSingle();
    if (claimError || !claimed) continue;
    const articleUrl = "https://paulnova.name.ng/articles/" + encodeURIComponent(article.slug);
    const unsubscribeUrl = "https://paulnova.name.ng/newsletter/unsubscribe?token=" + encodeURIComponent(subscriber.unsubscribe_token);
    const subject = "New on PaulNova: " + article.title;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmail(subject)}</title></head><body style="margin:0;background:#f7f8fc;font-family:Arial,Helvetica,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:18px;padding:32px"><tr><td><p style="font-size:24px;font-weight:800;margin:0 0 24px">Paul<span style="color:#635bff">Nova</span></p><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#635bff;text-transform:uppercase">Technology. Intelligence. Opportunities.</p><h1 style="font-size:26px;line-height:1.25;margin:12px 0 16px">${escapeEmail(article.title)}</h1><p style="font-size:16px;line-height:1.7;color:#526078">${escapeEmail(article.excerpt)}</p><p style="margin:28px 0"><a href="${articleUrl}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">Read article</a></p><hr style="border:0;border-top:1px solid #e8ebf2;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#7b8496">You received this email because you subscribed to PaulNova updates. <a href="${unsubscribeUrl}" style="color:#635bff">Unsubscribe</a>.</p><p style="font-size:12px;color:#9aa2b1">PaulNova · Technology. Intelligence. Opportunities.</p></td></tr></table></td></tr></table></body></html>`;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "paulnova-article-" + articleId + "-subscriber-" + subscriber.id },
        body: JSON.stringify({
          from: "PaulNova <newsletter@paulnova.name.ng>",
          to: [subscriber.email],
          reply_to: "contact.paulnova@gmail.com",
          subject,
          html,
          headers: { "List-Unsubscribe": "<" + unsubscribeUrl + ">" }
        }),
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
      if (!response.ok || !result.id) throw new Error(result.message || "Resend rejected the message.");
      const { error: updateError } = await supabase.from("article_notification_deliveries")
        .update({ status: "sent", resend_email_id: result.id, sent_at: new Date().toISOString(), error_message: null }).eq("id", delivery.id);
      if (updateError) throw new Error("Email accepted but delivery status could not be saved.");
      sent++;
    } catch (error) {
      failed++;
      await supabase.from("article_notification_deliveries")
        .update({ status: "failed", error_message: String(error).slice(0, 500) }).eq("id", delivery.id);
    }
  }
  return { sent, failed, reason: failed ? "some-failed" : "complete" };
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
    if (!imageAlt) redirect(id ? "/admin/articles/" + id + "?error=image-alt-required" : "/admin/articles/new?error=image-alt-required");
  }
  let existing: { published_at: string | null; author_id: string | null; status: string } | null = null;
  if (id) {
    const { data, error } = await supabase.from("articles").select("published_at,author_id,status").eq("id", id).maybeSingle();
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
  let notificationSummary = "";
  if (status === "published" && (!existing || existing.status !== "published")) {
    const result = await notifySubscribersOfPublishedArticle(supabase, saved.id);
    notificationSummary = result.reason === "complete" ? "notifications-sent" :
      result.reason === "no-consented-subscribers" ? "no-subscribers" :
      result.failed ? "notifications-partial" : "notifications-not-configured";
  }
  redirect("/admin?publication=" + (status === "published" ? "published" : status) + (status === "published" ? "&articleId=" + encodeURIComponent(saved.id) : "") + (notificationSummary ? "&email=" + notificationSummary : ""));
}
export async function publishArticleNow(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid article ID.");
  const { data: article, error: readError } = await supabase.from("articles")
    .select("id,status,published_at").eq("id", id).maybeSingle();
  if (readError || !article) throw new Error("Article could not be found.");
  if (article.status === "published") redirect("/admin");
  const { error } = await supabase.from("articles").update({
    status: "published",
    published_at: article.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) throw new Error("Could not publish article: " + error.message);
  const result = await notifySubscribersOfPublishedArticle(supabase, id);
  const email = result.reason === "complete" ? "notifications-sent" :
    result.reason === "no-consented-subscribers" ? "no-subscribers" :
    result.failed ? "notifications-partial" : "notifications-not-configured";
  redirect("/admin?publication=published&articleId=" + encodeURIComponent(id) + "&email=" + email);
}

export async function unpublishArticle(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid article ID.");
  const { data: article, error: readError } = await supabase.from("articles")
    .select("id,status").eq("id", id).maybeSingle();
  if (readError || !article) throw new Error("Article could not be found.");
  if (article.status !== "published") redirect("/admin");
  const { error } = await supabase.from("articles").update({
    status: "draft", published_at: null, updated_at: new Date().toISOString()
  }).eq("id", id);
  if (error) throw new Error("Could not unpublish article: " + error.message);
  redirect("/admin?publication=unpublished");
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
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  if (logoUrl) {
    let parsedLogo: URL;
    try { parsedLogo = new URL(logoUrl); } catch { throw new Error("Logo must be a valid public image URL."); }
    if (parsedLogo.protocol !== "https:") throw new Error("Logo image URL must use HTTPS.");
  }
  const faviconUrl = String(formData.get("favicon_url") ?? "").trim();
  if (faviconUrl) {
    let parsedFavicon: URL;
    try { parsedFavicon = new URL(faviconUrl); } catch { throw new Error("Favicon must be a valid public image URL."); }
    if (parsedFavicon.protocol !== "https:") throw new Error("Favicon image URL must use HTTPS.");
  }
  const rawGoogleCode = String(formData.get("google_site_verification") ?? "").trim().slice(0,1000);
  // Accept either Google's bare content token or the complete HTML meta tag.
  const metaContent = rawGoogleCode.match(/content\\s*=\\s*["']([^"']+)["']/i)?.[1];
  const googleCode = (metaContent ?? rawGoogleCode).trim().replace(/^["']|["']$/g, "");
  if (googleCode && !/^[A-Za-z0-9_-]+$/.test(googleCode)) {
    throw new Error("Enter only the Google verification value (the text inside content=\"...\"). Do not paste the full HTML tag or the words content=.");
  }
  const { error } = await supabase.from("site_settings").upsert({
    id: 1, social_links: socialLinks, logo_url: logoUrl || null, favicon_url: faviconUrl || null, google_site_verification: googleCode || null, updated_at: new Date().toISOString()
  }, { onConflict: "id" });
  if (error) throw new Error("Could not save site settings: " + error.message);
  redirect("/admin/site-settings?saved=1");
}


export async function checkResendConnection() {
  await requireAdmin();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) redirect("/admin/newsletter?resend=missing-key");

  const response = await fetch("https://api.resend.com/domains", {
    method: "GET",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({})) as {
    data?: Array<{ id: string; name: string; status: string }>;
    message?: string;
  };
  if (!response.ok) {
    throw new Error("Resend connection failed (" + response.status + "): " + (payload.message || "The API rejected the request."));
  }
  const domains = Array.isArray(payload.data) ? payload.data : [];
  const verified = domains.some((domain) => String(domain.status).toLowerCase() === "verified");
  const result = verified ? "verified" : domains.length ? "domain-pending" : "no-domain";
  redirect("/admin/newsletter?resend=" + result);
}

export async function sendNewsletterCampaign(_formData: FormData) {
  await requireAdmin();
  throw new Error("Newsletter sending is not enabled yet. First verify the sending domain and complete the consent-safe Resend audience sync.");
}
