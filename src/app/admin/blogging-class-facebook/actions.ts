"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "editor"].includes(profile.role)) redirect("/admin/login?error=not-authorised");
  return { supabase, user };
}

function safeUrl(value: string, label: string) {
  if (!value) return null;
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(label + " must be a valid public URL."); }
  if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(label + " must use HTTP or HTTPS.");
  return parsed.toString();
}

export async function saveBloggingClassFacebookPost(formData: FormData) {
  const { supabase, user } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  const lessonNumberValue = String(formData.get("lesson_number") ?? "").trim();
  const lessonNumber = lessonNumberValue ? Number(lessonNumberValue) : null;
  const lessonTitle = String(formData.get("lesson_title") ?? "").trim().slice(0, 180);
  const postType = String(formData.get("post_type") ?? "lesson_announcement");
  const postTitle = String(formData.get("post_title") ?? "").trim().slice(0, 180);
  const postText = String(formData.get("post_text") ?? "").trim().slice(0, 12000);
  const articleUrl = safeUrl(String(formData.get("article_url") ?? "").trim(), "Article link");
  const imageUrl = safeUrl(String(formData.get("image_url") ?? "").trim(), "Image link");
  const status = String(formData.get("status") ?? "draft");
  const allowedTypes = ["lesson_announcement", "blogging_tip", "step_by_step", "engagement", "promotion", "reel_script"];
  if (lessonNumber !== null && (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 82)) throw new Error("Lesson number must be between 1 and 82.");
  if (!lessonTitle || !postTitle || postText.length < 20) throw new Error("Add the lesson title, post title and a useful post caption (at least 20 characters).");
  if (!allowedTypes.includes(postType)) throw new Error("Choose a valid post type.");
  if (!["draft", "ready", "archived"].includes(status)) throw new Error("Choose a valid post status.");
  const payload = {
    lesson_number: lessonNumber,
    lesson_title: lessonTitle,
    post_type: postType,
    post_title: postTitle,
    post_text: postText,
    article_url: articleUrl,
    image_url: imageUrl,
    status,
    updated_at: new Date().toISOString()
  };
  if (id) {
    const { data, error } = await supabase.from("blogging_class_facebook_posts").update(payload).eq("id", id).select("id").maybeSingle();
    if (error || !data) throw new Error(error?.message || "The Facebook post could not be updated.");
  } else {
    const { error } = await supabase.from("blogging_class_facebook_posts").insert({ ...payload, created_by: user.id });
    if (error) throw new Error(error.message || "The Facebook post could not be saved.");
  }
  redirect("/admin/blogging-class-facebook?saved=1");
}

export async function setBloggingClassFacebookPostStatus(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["draft", "ready", "archived"].includes(status)) throw new Error("Invalid post update.");
  const { error } = await supabase.from("blogging_class_facebook_posts")
    .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Could not update the post: " + error.message);
  redirect("/admin/blogging-class-facebook?saved=1");
}

export async function deleteBloggingClassFacebookPost(formData: FormData) {
  const { supabase } = await requireEditor();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid post ID.");
  const { error } = await supabase.from("blogging_class_facebook_posts").delete().eq("id", id);
  if (error) throw new Error("Could not delete the post: " + error.message);
  redirect("/admin/blogging-class-facebook?deleted=1");
}
