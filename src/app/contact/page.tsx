import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact PaulNova",
  description: "Contact PaulNova for reader feedback, corrections, editorial enquiries, partnerships and general questions.",
};

const contactEmail = "contact.paulnova@gmail.com";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <header className="border-b border-slate-100 bg-white">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635bff]"><ArrowLeft size={16}/> Back home</Link>
        </div>
      </header>
      <section className="container max-w-3xl py-16 md:py-24">
        <div className="eyebrow">We'd love to hear from you</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[#101828] md:text-5xl">Contact PaulNova.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500">Have a question, spotted something we should correct, or want to explore working together? Send our team an email. We welcome messages from readers, creators, businesses and partners around the world.</p>
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-7 shadow-sm md:p-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-[#635bff]"><Mail size={25}/></span>
          <h2 className="mt-6 text-xl font-extrabold text-slate-900">Email our team</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">For general questions, feedback, corrections, editorial enquiries and partnership proposals.</p>
          <a href={`mailto:${contactEmail}?subject=Enquiry%20for%20PaulNova`} className="mt-6 inline-flex max-w-full items-center gap-2 break-all rounded-full bg-[#635bff] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#5148e5]"><MessageCircle size={17}/> {contactEmail}</a>
          <p className="mt-5 text-xs leading-5 text-slate-400">When you contact us, please include a clear subject so we can direct your message to the right person.</p>
        </div>
        <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-7">
          <h2 className="text-lg font-extrabold text-slate-900">What to include in your message</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">For a correction, include the article URL, the passage you are concerned about and a reliable source that supports the suggested change. For a partnership or business enquiry, briefly describe your organisation, the opportunity and the best way to reach you. Please do not email passwords, payment-card details or other sensitive account information.</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">PaulNova reviews reader feedback as part of its editorial process. You can also read our <Link href="/editorial-policy" className="font-semibold text-[#5148e5] underline">Editorial Policy</Link> and <Link href="/corrections" className="font-semibold text-[#5148e5] underline">Corrections page</Link> to understand how we handle updates.</p>
        </section>
        <p className="mt-8 text-sm text-slate-500">PaulNova — Technology. Intelligence. Opportunities.</p>
      </section>
    </main>
  );
}
