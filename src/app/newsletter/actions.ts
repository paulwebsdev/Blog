"use server";

import { createClient } from "@/lib/supabase/server";

export type NewsletterState = { status: "idle" | "success" | "error"; message: string };

const initialMessage: NewsletterState = { status: "idle", message: "" };

export async function subscribeToNewsletter(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot field: normal visitors never see or fill this.
  if (String(formData.get("website") ?? "").trim()) return { status: "success", message: "Thanks — you're on the list." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("subscribers").insert({ email, status: "active" });
    if (error?.code === "23505") return { status: "success", message: "This email is already subscribed. Thanks for reading PaulNova!" };
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
