"use client";

import { useActionState } from "react";
import Link from "next/link";
import { newsletterInitialState, subscribeToNewsletter } from "@/app/newsletter/actions";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, newsletterInitialState);
  return <form action={action} className="mt-8 space-y-5">
    <div><label htmlFor="newsletter-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><input id="newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-violet-100"/></div>
    <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="newsletter-website">Leave this field empty</label><input id="newsletter-website" name="website" tabIndex={-1} autoComplete="off"/></div>
    <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" name="consent" value="yes" required className="mt-1 h-4 w-4 shrink-0 accent-[#635bff]"/><span>I agree to receive occasional PaulNova emails about technology, AI, digital business and opportunities. I understand I can unsubscribe at any time. See our <Link href="/privacy" className="font-semibold text-[#635bff] underline">Privacy Policy</Link>.</span></label>
    <button type="submit" disabled={pending} className="w-full rounded-full bg-[#635bff] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#5148e5] disabled:cursor-wait disabled:opacity-60">{pending ? "Subscribing…" : "Subscribe to PaulNova"}</button>
    <p aria-live="polite" role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{state.message}</p>
    <p className="text-center text-xs text-slate-400">No spam. Unsubscribe whenever you want.</p>
  </form>;
}
