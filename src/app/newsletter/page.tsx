import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
export const metadata: Metadata = {
  title: "PaulNova Newsletter",
  description: "Subscribe to PaulNova for practical insights on technology, artificial intelligence, digital business, education and career opportunities."
};
export default function NewsletterPage() {
  return <main className="min-h-screen bg-[#f7f8fc]"><header className="border-b border-slate-100 bg-white"><div className="container flex h-20 items-center justify-between"><Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Home</Link></div></header>
    <section className="container grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-12 py-16 md:grid-cols-[1fr_.9fr] md:py-24"><div><div className="eyebrow">Stay curious</div><h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#101828] md:text-6xl">Good ideas.<br/><span className="text-[#635bff]">Delivered thoughtfully.</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-slate-500">Get occasional PaulNova updates on technology, AI, digital business, education and careers. Practical insights and opportunities, selected for curious minds around the world.</p><ul className="mt-8 space-y-3 text-sm font-medium text-slate-600"><li>✓ Useful explainers, not empty hype</li><li>✓ Tools and ideas worth exploring</li><li>✓ Learning and career opportunities</li></ul></div>
    <div className="rounded-[30px] bg-white p-7 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 md:p-10"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-[#635bff]"><Sparkles size={25}/></span><h2 className="mt-7 text-2xl font-black tracking-tight text-slate-900">Join the PaulNova newsletter</h2><p className="mt-3 text-sm leading-6 text-slate-500">Enter your email address to join the reader list. Every marketing email will include a working unsubscribe link.</p><NewsletterForm/><p className="mt-5 text-[11px] leading-5 text-slate-400">By subscribing, you agree to our <Link href="/privacy" className="font-semibold text-[#635bff]">Privacy Policy</Link>. Your email is used to manage your subscription and send PaulNova updates. You can unsubscribe at any time.</p></div></section></main>;
}
