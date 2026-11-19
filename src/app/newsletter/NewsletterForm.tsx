"use client";
import { useActionState } from "react";
import { Mail, Send } from "lucide-react";
import { newsletterInitialState, subscribeToNewsletter } from "./actions";
export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, newsletterInitialState);
  return <form action={formAction} className={compact ? "mx-auto mt-7 w-full max-w-xl" : "mt-8 w-full max-w-xl"}>
    <label htmlFor={compact ? "newsletter-email-compact" : "newsletter-email"} className="sr-only">Email address</label>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id={compact ? "newsletter-email-compact" : "newsletter-email"} name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required placeholder="Enter your email address" className="h-14 w-full rounded-full border border-slate-200 bg-white pl-11 pr-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#635bff] focus:ring-4 focus:ring-violet-100"/></div><button disabled={pending} className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#635bff] px-7 text-sm font-bold text-white transition hover:bg-[#5148e5] disabled:cursor-wait disabled:opacity-60">{pending ? "Subscribing..." : "Subscribe"} <Send size={15}/></button></div>
    <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><input type="checkbox" name="consent" value="yes" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#635bff]"/><span>I agree to receive occasional PaulNova newsletter emails. I can unsubscribe at any time.</span></label>
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p aria-live="polite" role={state.status === "error" ? "alert" : "status"} className={"mt-3 min-h-5 text-xs " + (state.status === "error" ? "text-red-600" : state.status === "success" ? "text-emerald-700" : "text-slate-400")}>{state.message || "No spam. Just useful ideas and opportunities. Unsubscribe links will be included in every newsletter email."}</p>
  </form>;
}
