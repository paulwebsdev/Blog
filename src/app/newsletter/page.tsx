import type { Metadata } from "next";
import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = { title: "Newsletter", description: "Get practical PaulNova insights on technology, AI, digital business and opportunities in your inbox." };

export default function NewsletterPage() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5 py-14"><section className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10"><Link href="/" className="text-2xl font-black text-slate-900">Paul<span className="text-[#635bff]">Nova</span></Link><p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-[#635bff]">Technology. Intelligence. Opportunities.</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Stay ahead of what’s next.</h1><p className="mt-4 text-sm leading-7 text-slate-600">Get useful ideas, practical guides and selected opportunities from PaulNova delivered to your inbox. Subscribe for occasional updates — only when we have something worth sharing.</p><NewsletterForm/><Link href="/" className="mt-8 inline-block text-sm font-semibold text-slate-500 hover:text-[#635bff]">← Back to PaulNova</Link></section></main>;
}
