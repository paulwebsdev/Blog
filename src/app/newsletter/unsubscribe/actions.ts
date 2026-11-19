"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function confirmNewsletterUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/newsletter/unsubscribe?invalid=1");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unsubscribe_newsletter", { p_token: token });
  if (error || data !== true) {
    console.error("PaulNova unsubscribe failed:", error?.code ?? "invalid-token");
    redirect("/newsletter/unsubscribe?error=1");
  }
  redirect("/newsletter/unsubscribe?done=1");
}
