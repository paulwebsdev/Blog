"use server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
export type NewsletterState = { status: "idle" | "success" | "error"; message: string };
const initialMessage: NewsletterState = { status: "idle", message: "" };
export async function subscribeToNewsletter(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  if (String(formData.get("website") ?? "").trim()) return { status: "success", message: "Thanks — you're on the list." };
  if (String(formData.get("consent") ?? "") !== "yes") return { status: "error", message: "Please confirm that you agree to receive PaulNova newsletter emails." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { status: "error", message: "Please enter a valid email address." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("subscribers").insert({
      email,
      status: "active",
      unsubscribe_token: randomUUID(),
      consent_at: new Date().toISOString(),
      unsubscribed_at: null
    });
    if (error?.code === "23505") return { status: "success", message: "This address is already registered. If it was previously unsubscribed, it will remain unsubscribed unless you explicitly resubscribe." };
    if (error) {
      console.error("PaulNova newsletter subscription failed:", error.code);
      return { status: "error", message: "We couldn't complete your subscription right now. Please try again shortly." };
    }
    return { status: "success", message: "You're subscribed! Look out for PaulNova updates in your inbox." };
  } catch {
    return { status: "error", message: "We couldn't complete your subscription right now. Please try again shortly." };
  }
}
export const newsletterInitialState = initialMessage;
